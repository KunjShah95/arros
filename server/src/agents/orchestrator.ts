import { v4 as uuid } from 'uuid';
import { prisma } from '../services/prisma';
import { PlannerAgent } from './planner';
import { ResearchAgent } from './research';
import { CriticAgent } from './critic';
import { SynthesizerAgent } from './synthesizer';
import { MemoryAgent } from './memory';
import { ActionAgent } from './action';
import { MetaEvaluatorAgent } from './meta';
import { DebateAgent } from './debate';
import {
  ResearchAgentFleet,
  CriticFleet,
  MemoryFleet,
  ActionFleet,
  SynthesizerFleet
} from './subagents';
import type {
  TaskPlan,
  ResearchResult,
  CritiqueResult,
  SynthesisResult,
  SourceResult,
  Claim
} from '../types';

export interface ResearchResponse {
  sessionId: string;
  query: string;
  plan: TaskPlan;
  synthesis: SynthesisResult;
  evaluations: Array<{ type: string; score: number; passed: boolean }>;
  totalCost: number;
  totalTime: number;
  agentBreakdown?: AgentBreakdown;
}

export interface AgentBreakdown {
  research: {
    web: number;
    academic: number;
    code: number;
    news: number;
  };
  critic: {
    verified: number;
    biases: number;
    contradictions: number;
  };
  memory: {
    shortTerm: number;
    longTerm: number;
    graphNodes: number;
  };
  actions: {
    prds: number;
    tickets: number;
    code: number;
    decisions: number;
  };
}

export class AgentOrchestrator {
  private userId: string;
  private useSubagents: boolean;

  constructor(userId: string, useSubagents: boolean = true) {
    this.userId = userId;
    this.useSubagents = useSubagents;
  }

  async research(query: string, attempt: number = 1): Promise<ResearchResponse> {
    const startTime = Date.now();
    
    const session = await prisma.session.upsert({
      where: { id: attempt === 1 ? uuid() : 'non-existent' },
      update: { status: 'active' },
      create: {
        userId: this.userId,
        query,
        title: query.substring(0, 100),
        status: 'active',
      },
    });

    const planner = new PlannerAgent(session.id);
    const plan = await planner.plan(query);
    let totalCost = plan.estimatedCost;

    let agentBreakdown: AgentBreakdown | undefined;
    if (this.useSubagents) {
      return this.runWithSubagents(session, query, plan, startTime, attempt);
    }

    const researchSubtasks = plan.subtasks.filter(t => t.type === 'research');

    const researchPromises = researchSubtasks.map(async (subtask) => {
      const task = await prisma.agentTask.create({
        data: {
          sessionId: session.id,
          type: 'research',
          agentName: 'ResearchAgent',
          status: 'running',
          startedAt: new Date(),
        },
      });

      const agent = new ResearchAgent(session.id, task.id);
      return agent.research(subtask, query);
    });

    const researchResults = await Promise.all(researchPromises);

    const critiqueSubtask = plan.subtasks.find(t => t.type === 'critic');
    let critiqueResult: CritiqueResult | null = null;

    if (critiqueSubtask) {
      const criticTask = await prisma.agentTask.create({
        data: {
          sessionId: session.id,
          type: 'critic',
          agentName: 'CriticAgent',
          status: 'running',
          startedAt: new Date(),
        },
      });

      const critic = new CriticAgent(session.id, criticTask.id);
      critiqueResult = await critic.critique(researchResults);
    }

    const debateSubtask = plan.subtasks.find(t => t.type === 'debate');
    if (debateSubtask && critiqueResult) {
      const debateTask = await prisma.agentTask.create({
        data: {
          sessionId: session.id,
          type: 'debate',
          agentName: 'DebateAgent',
          status: 'running',
          startedAt: new Date(),
        },
      });

      const debateAgent = new DebateAgent(session.id, debateTask.id);
      await debateAgent.deliberate(researchResults.flatMap(r => r.claims), critiqueResult);
    }

    const synthesizerSubtask = plan.subtasks.find(t => t.type === 'synthesizer');
    let synthesisResult: SynthesisResult | null = null;

    if (synthesizerSubtask && critiqueResult) {
      const synthTask = await prisma.agentTask.create({
        data: {
          sessionId: session.id,
          type: 'synthesizer',
          agentName: 'SynthesizerAgent',
          status: 'running',
          startedAt: new Date(),
        },
      });

      const synthesizer = new SynthesizerAgent(session.id, synthTask.id);
      const hasActionSubtask = plan.subtasks.some(t => t.type === 'action');
      synthesisResult = await synthesizer.synthesize(
        critiqueResult,
        researchResults.map(r => r.rawContent).join('\n'),
        query,
        hasActionSubtask
      );
    }

    const memorySubtask = plan.subtasks.find(t => t.type === 'memory');
    if (memorySubtask && synthesisResult) {
      const memoryTask = await prisma.agentTask.create({
        data: {
          sessionId: session.id,
          type: 'memory',
          agentName: 'MemoryAgent',
          status: 'running',
          startedAt: new Date(),
        },
      });

      const memoryAgent = new MemoryAgent(session.id, this.userId, memoryTask.id);
      await memoryAgent.storeResults(synthesisResult, query);
    }

    const actionSubtask = plan.subtasks.find(t => t.type === 'action');
    if (actionSubtask && synthesisResult) {
      const actionTask = await prisma.agentTask.create({
        data: {
          sessionId: session.id,
          type: 'action',
          agentName: 'ActionAgent',
          status: 'running',
          startedAt: new Date(),
        },
      });

      const actionAgent = new ActionAgent(session.id, actionTask.id);
      await actionAgent.generateActions(synthesisResult, query);
    }

    const metaSubtask = plan.subtasks.find(t => t.type === 'meta');
    let evaluations: Array<{ type: string; score: number; passed: boolean }> = [];

    if (metaSubtask && synthesisResult && critiqueResult) {
      const metaTask = await prisma.agentTask.create({
        data: {
          sessionId: session.id,
          type: 'meta',
          agentName: 'MetaEvaluatorAgent',
          status: 'running',
          startedAt: new Date(),
        },
      });

      const metaEvaluator = new MetaEvaluatorAgent(session.id, metaTask.id);
      const evaluation = await metaEvaluator.evaluate(synthesisResult, critiqueResult, query);
      evaluations = [{ type: evaluation.type, score: evaluation.score, passed: evaluation.passed }];

      if (!evaluation.passed && attempt < 3) {
        console.log(`Research quality below threshold (score: ${evaluation.score}). Retrying attempt ${attempt + 1}...`);

        await prisma.agentTask.create({
          data: {
            sessionId: session.id,
            type: 'meta',
            agentName: 'Orchestrator',
            status: 'failed',
            input: { attempt, score: evaluation.score } as any,
            output: { error: 'Quality threshold not met, triggering retry' } as any,
          }
        });

        const refinedQuery = `${query} (Focus on: ${evaluation.recommendations?.join(', ') || 'accuracy and depth'})`;
        return this.research(refinedQuery, attempt + 1);
      }
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { status: 'completed' },
    });

    return {
      sessionId: session.id,
      query,
      plan,
      synthesis: synthesisResult!,
      evaluations,
      totalCost,
      totalTime: Date.now() - startTime,
    };
  }

  private async runWithSubagents(
    session: any,
    query: string,
    plan: TaskPlan,
    startTime: number,
    attempt: number
  ): Promise<ResearchResponse> {
    const agentBreakdown: AgentBreakdown = {
      research: { web: 0, academic: 0, code: 0, news: 0 },
      critic: { verified: 0, biases: 0, contradictions: 0 },
      memory: { shortTerm: 0, longTerm: 0, graphNodes: 0 },
      actions: { prds: 0, tickets: 0, code: 0, decisions: 0 },
    };

    const memoryFleet = new MemoryFleet(this.userId, session.id);
    memoryFleet.storeContext(`Research query: ${query}`);

    const { sources, claims } = await this.runResearchFleet(session.id, query, plan, agentBreakdown);

    const critiqueResult = await this.runCriticFleet(session.id, claims, sources, agentBreakdown);

    const debateSubtask = plan.subtasks.find(t => t.type === 'debate');
    if (debateSubtask) {
      const debateTask = await prisma.agentTask.create({
        data: {
          sessionId: session.id,
          type: 'debate',
          agentName: 'DebateAgent',
          status: 'running',
          startedAt: new Date(),
        },
      });

      const debateAgent = new DebateAgent(session.id, debateTask.id);
      await debateAgent.deliberate(claims, critiqueResult);
    }

    const synthesisResult = await this.runSynthesizerFleet(session.id, critiqueResult, sources, query);

    await this.runMemoryFleet(session.id, memoryFleet, synthesisResult, query, agentBreakdown);

    const actionSubtask = plan.subtasks.find(t => t.type === 'action');
    if (actionSubtask) {
      await this.runActionFleet(session.id, synthesisResult, query, agentBreakdown);
    }

    const metaSubtask = plan.subtasks.find(t => t.type === 'meta');
    let evaluations: Array<{ type: string; score: number; passed: boolean }> = [];

    if (metaSubtask) {
      const metaTask = await prisma.agentTask.create({
        data: {
          sessionId: session.id,
          type: 'meta',
          agentName: 'MetaEvaluatorAgent',
          status: 'running',
          startedAt: new Date(),
        },
      });

      const metaEvaluator = new MetaEvaluatorAgent(session.id, metaTask.id);
      const evaluation = await metaEvaluator.evaluate(synthesisResult, critiqueResult, query);
      evaluations = [{ type: evaluation.type, score: evaluation.score, passed: evaluation.passed }];

      if (!evaluation.passed && attempt < 3) {
        console.log(`Research quality below threshold (score: ${evaluation.score}). Retrying attempt ${attempt + 1}...`);

        await prisma.agentTask.create({
          data: {
            sessionId: session.id,
            type: 'meta',
            agentName: 'Orchestrator',
            status: 'failed',
            input: { attempt, score: evaluation.score } as any,
            output: { error: 'Quality threshold not met, triggering retry' } as any,
          }
        });

        const refinedQuery = `${query} (Focus on: ${evaluation.recommendations?.join(', ') || 'accuracy and depth'})`;
        return this.research(refinedQuery, attempt + 1);
      }
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { status: 'completed' },
    });

    return {
      sessionId: session.id,
      query,
      plan,
      synthesis: synthesisResult,
      evaluations,
      totalCost: plan.estimatedCost,
      totalTime: Date.now() - startTime,
      agentBreakdown,
    };
  }

  private async runResearchFleet(
    sessionId: string,
    query: string,
    plan: TaskPlan,
    breakdown: AgentBreakdown
  ): Promise<{ sources: SourceResult[]; claims: Claim[] }> {
    const researchFleet = new ResearchAgentFleet(sessionId, `${sessionId}_fleet`);
    
    const task = await prisma.agentTask.create({
      data: {
        sessionId,
        type: 'research',
        agentName: 'ResearchAgentFleet',
        status: 'running',
        startedAt: new Date(),
      },
    });

    const result = await researchFleet.runAll(query);
    
    breakdown.research = {
      web: result.sources.filter(s => s.type === 'web').length,
      academic: result.sources.filter(s => s.type === 'paper').length,
      code: result.sources.filter(s => s.type === 'github').length,
      news: 0,
    };

    await prisma.agentTask.update({
      where: { id: task.id },
      data: {
        status: 'completed',
        output: { sourcesFound: result.sources.length } as any,
      },
    });

    return result;
  }

  private async runCriticFleet(
    sessionId: string,
    claims: Claim[],
    sources: SourceResult[],
    breakdown: AgentBreakdown
  ): Promise<CritiqueResult> {
    const criticFleet = new CriticFleet(sessionId);
    
    const task = await prisma.agentTask.create({
      data: {
        sessionId,
        type: 'critic',
        agentName: 'CriticFleet',
        status: 'running',
        startedAt: new Date(),
      },
    });

    const result = await criticFleet.critique(claims, sources);

    breakdown.critic = {
      verified: result.verified.filter(v => v.verified).length,
      biases: result.biases.length,
      contradictions: result.contradictions.length,
    };

    const critiqueResult: CritiqueResult = {
      taskId: task.id,
      acceptedClaims: result.verified.filter(v => v.verified).map(v => ({
        id: v.claimId,
        statement: v.statement,
        evidence: v.evidence,
        confidence: v.confidence,
      })),
      rejectedClaims: result.verified.filter(v => !v.verified).map(v => ({
        id: v.claimId,
        statement: v.statement,
        evidence: v.evidence,
        confidence: v.confidence,
      })),
      contradictions: result.contradictions.map(c => ({
        claimA: c.statementA,
        claimB: c.statementB,
        severity: c.severity,
      })),
      biasIndicators: result.biases.map(b => ({
        claim: b.statement,
        biasType: b.biasType,
        severity: b.severity,
      })),
      overallConfidence: result.overallConfidence,
    };

    await prisma.agentTask.update({
      where: { id: task.id },
      data: {
        status: 'completed',
        output: {
          verified: breakdown.critic.verified,
          contradictions: breakdown.critic.contradictions,
        } as any,
      },
    });

    return critiqueResult;
  }

  private async runSynthesizerFleet(
    sessionId: string,
    critiqueResult: CritiqueResult,
    sources: SourceResult[],
    query: string
  ): Promise<SynthesisResult> {
    const synthesizerFleet = new SynthesizerFleet(sessionId, `${sessionId}_synth`);
    
    const task = await prisma.agentTask.create({
      data: {
        sessionId,
        type: 'synthesizer',
        agentName: 'SynthesizerFleet',
        status: 'running',
        startedAt: new Date(),
      },
    });

    const researchContent = sources.map(s => s.content).join('\n');
    const synthesis = await synthesizerFleet.synthesize(critiqueResult, researchContent, query);

    await prisma.agentTask.update({
      where: { id: task.id },
      data: {
        status: 'completed',
        output: { keyFindings: synthesis.keyFindings.length } as any,
      },
    });

    return synthesis;
  }

  private async runMemoryFleet(
    sessionId: string,
    memoryFleet: MemoryFleet,
    synthesis: SynthesisResult,
    query: string,
    breakdown: AgentBreakdown
  ): Promise<void> {
    const memoryTask = await prisma.agentTask.create({
      data: {
        sessionId,
        type: 'memory',
        agentName: 'MemoryFleet',
        status: 'running',
        startedAt: new Date(),
      },
    });

    memoryFleet.storeContext(`Synthesis completed with ${synthesis.keyFindings.length} key findings`);

    for (const finding of synthesis.keyFindings.slice(0, 3)) {
      await memoryFleet.persistToLongTerm('fact', finding);
      breakdown.memory.longTerm++;
    }

    const topic = query.split(' ').slice(0, 3).join(' ');
    await memoryFleet.updateInterest(topic);
    await memoryFleet.buildKnowledgeGraph(topic, synthesis.keyFindings);
    breakdown.memory.graphNodes = synthesis.keyFindings.length;

    await prisma.agentTask.update({
      where: { id: memoryTask.id },
      data: {
        status: 'completed',
        output: {
          shortTerm: breakdown.memory.shortTerm,
          longTerm: breakdown.memory.longTerm,
          graphNodes: breakdown.memory.graphNodes,
        } as any,
      },
    });
  }

  private async runActionFleet(
    sessionId: string,
    synthesis: SynthesisResult,
    query: string,
    breakdown: AgentBreakdown
  ): Promise<void> {
    const actionTask = await prisma.agentTask.create({
      data: {
        sessionId,
        type: 'action',
        agentName: 'ActionFleet',
        status: 'running',
        startedAt: new Date(),
      },
    });

    const actionFleet = new ActionFleet(sessionId, actionTask.id);
    const actions = await actionFleet.generateAll(query, synthesis);

    breakdown.actions = {
      prds: actions.filter(a => a.type === 'prd').length,
      tickets: actions.filter(a => a.type === 'ticket').length,
      code: actions.filter(a => a.type === 'code').length,
      decisions: actions.filter(a => a.type === 'decision').length,
    };

    await prisma.agentTask.update({
      where: { id: actionTask.id },
      data: {
        status: 'completed',
        output: {
          actionsGenerated: actions.length,
          breakdown: breakdown.actions,
        } as any,
      },
    });
  }

  async getSession(sessionId: string) {
    return prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        tasks: true,
        sources: true,
        citations: true,
        outputs: true,
        evaluations: true,
      },
    });
  }

  async getUserSessions() {
    return prisma.session.findMany({
      where: { userId: this.userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
  }
}
