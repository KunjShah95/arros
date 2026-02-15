import { v4 as uuid } from 'uuid';
import { prisma } from '../services/prisma';
import { PlannerAgent } from './planner';
import { ResearchAgent } from './research';
import { CriticAgent } from './critic';
import { SynthesizerAgent } from './synthesizer';
import { MemoryAgent } from './memory';
import { ActionAgent } from './action';
import { MetaEvaluatorAgent } from './meta';
import type { 
  TaskPlan, 
  ResearchResult, 
  CritiqueResult, 
  SynthesisResult,
  SessionContext 
} from '../types';

export interface ResearchResponse {
  sessionId: string;
  query: string;
  plan: TaskPlan;
  synthesis: SynthesisResult;
  evaluations: Array<{ type: string; score: number; passed: boolean }>;
  totalCost: number;
  totalTime: number;
}

export class AgentOrchestrator {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async research(query: string): Promise<ResearchResponse> {
    const startTime = Date.now();
    const session = await prisma.session.create({
      data: {
        userId: this.userId,
        query,
        title: query.substring(0, 100),
        status: 'active',
      },
    });

    const planner = new PlannerAgent(session.id);
    const plan = await planner.plan(query);

    let totalCost = plan.estimatedCost;

    const researchResults: ResearchResult[] = [];
    const researchSubtasks = plan.subtasks.filter(t => t.type === 'research');
    
    for (const subtask of researchSubtasks) {
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
      const result = await agent.research(subtask, query);
      researchResults.push(result);
    }

    const criticSubtask = plan.subtasks.find(t => t.type === 'critic');
    let critiqueResult: CritiqueResult | null = null;
    
    if (criticSubtask) {
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
