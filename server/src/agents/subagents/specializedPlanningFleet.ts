/**
 * Specialized Planning Fleet - Multiple Planning Agents for Different Domains
 *
 * This module provides planning capabilities with specialized agents:
 *
 * - StrategyAgent: High-level strategic planning and decision-making
 * - TimelineAgent: Project scheduling and timeline management
 * - ResourceAgent: Resource allocation and capacity planning
 * - RiskAgent: Risk assessment and mitigation planning
 * - ResearchAgent: Research-specific planning with literature review strategy
 */

import type { TaskPlan, SubTask, ToolStrategy } from '../../types';
import { prisma } from '../../services/prisma';
import { llmService } from '../../services/llm';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';

// ─── Planning Result Interfaces ───────────────────────────────────────────────

export interface StrategyResult {
  strategy: string;
  objectives: string[];
  keyDecisions: string[];
  rationale: string;
  confidence: number;
}

export interface TimelineResult {
  phases: Array<{
    name: string;
    durationDays: number;
    milestones: string[];
    dependencies: string[];
  }>;
  criticalPath: string[];
  estimatedTotalDays: number;
  riskFactors: string[];
}

export interface ResourceResult {
  requiredSkills: string[];
  teamSize: number;
  budgetEstimate: number;
  toolRequirements: string[];
  dependencies: string[];
}

export interface RiskResult {
  risks: Array<{
    id: string;
    description: string;
    probability: number; // 0-1
    impact: number; // 0-1
    mitigation: string;
  }>;
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  mitigationStrategies: string[];
}

// ─── Abstract Base Class ──────────────────────────────────────────────────────

export abstract class BasePlanningAgent {
  protected sessionId: string;
  protected taskId: string;
  protected agentName: string;

  constructor(sessionId: string, taskId: string, agentName: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
    this.agentName = agentName;
  }

  abstract plan(query: string, context?: any): Promise<any>;

  protected async logPlanningTask(input: any, output: any) {
    try {
      await prisma.agentTask.create({
        data: {
          sessionId: this.sessionId,
          type: 'planner',
          agentName: this.agentName,
          status: 'completed',
          input: input as any,
          output: output as any,
          cost: 0.0001,
        },
      });
    } catch {
      // Non-critical logging
    }
  }
}

// ─── Strategy Agent ───────────────────────────────────────────────────────────

export class StrategyAgent extends BasePlanningAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'StrategyAgent');
  }

  async plan(query: string, context?: any): Promise<StrategyResult> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a strategic planning agent. Your job is to develop high-level strategies for complex problems.

Analyze the query and develop:
1. Clear strategic objectives
2. Key decisions that need to be made
3. Rationale for each decision
4. Confidence assessment

Think like an experienced strategist. Consider:
- Long-term vs short-term goals
- Resource constraints
- Competitive landscape (if applicable)
- Risk tolerance
- Success metrics

Return JSON with strategy, objectives (array), keyDecisions (array), rationale, and confidence (0-1).`,
      },
      {
        role: 'user' as const,
        content: `Develop a strategy for: "${query}"
${context ? `\n\nAdditional context:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 1500,
        temperature: 0.5,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logPlanningTask(
        { query, context },
        { strategy: result.strategy, confidence: result.confidence }
      );

      return {
        strategy: result.strategy || 'comprehensive',
        objectives: result.objectives || [],
        keyDecisions: result.keyDecisions || [],
        rationale: result.rationale || 'Based on strategic analysis',
        confidence: result.confidence || 0.7,
      };
    } catch {
      return this.fallbackStrategy(query);
    }
  }

  private fallbackStrategy(query: string): StrategyResult {
    return {
      strategy: 'comprehensive',
      objectives: [`Understand "${query.substring(0, 50)}..."`, 'Identify key components', 'Develop actionable plan'],
      keyDecisions: ['Break down into manageable subtasks', 'Prioritize based on impact', 'Iterate based on feedback'],
      rationale: 'Standard strategic approach for complex queries requiring thorough analysis',
      confidence: 0.75,
    };
  }
}

// ─── Timeline Agent ───────────────────────────────────────────────────────────

export class TimelineAgent extends BasePlanningAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'TimelineAgent');
  }

  async plan(query: string, context?: any): Promise<TimelineResult> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a project timeline planning agent. Create realistic project schedules.

For the given query, define:
1. Project phases with durations
2. Key milestones for each phase
3. Dependencies between phases
4. Critical path identification
5. Potential risk factors

Assume standard working hours and typical team efficiency.
Return JSON with phases (array), criticalPath (array), estimatedTotalDays, and riskFactors (array).`,
      },
      {
        role: 'user' as const,
        content: `Create a timeline for: "${query}"
${context ? `\n\nAdditional context:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 1000,
        temperature: 0.4,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logPlanningTask(
        { query, context },
        { phases: result.phases?.length || 0, totalDays: result.estimatedTotalDays }
      );

      return {
        phases: result.phases || [],
        criticalPath: result.criticalPath || [],
        estimatedTotalDays: result.estimatedTotalDays || 30,
        riskFactors: result.riskFactors || [],
      };
    } catch {
      return this.fallbackTimeline(query);
    }
  }

  private fallbackTimeline(query: string): TimelineResult {
    return {
      phases: [
        { name: 'Analysis', durationDays: 5, milestones: ['Requirements', 'Scope Definition'], dependencies: [] },
        { name: 'Execution', durationDays: 15, milestones: ['Draft Complete', 'Review'], dependencies: ['Analysis'] },
        { name: 'Review', durationDays: 5, milestones: ['Final Edits', 'Approval'], dependencies: ['Execution'] },
      ],
      criticalPath: ['Analysis', 'Execution', 'Review'],
      estimatedTotalDays: 25,
      riskFactors: ['Scope creep', 'Resource availability', 'Timeline compression'],
    };
  }
}

// ─── Resource Agent ───────────────────────────────────────────────────────────

export class ResourceAgent extends BasePlanningAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'ResourceAgent');
  }

  async plan(query: string, context?: any): Promise<ResourceResult> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a resource planning agent. Determine what resources are needed for a project.

Analyze the query and identify:
1. Required skills and expertise
2. Team size requirements
3. Budget estimate (in USD)
4. Tools and software needed
5. External dependencies

Consider:
- Complexity of the task
- Timeline constraints
- Quality requirements
- Available alternatives

Return JSON with requiredSkills (array), teamSize (number), budgetEstimate (number), toolRequirements (array), and dependencies (array).`,
      },
      {
        role: 'user' as const,
        content: `Plan resources for: "${query}"
${context ? `\n\nAdditional context:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 800,
        temperature: 0.3,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logPlanningTask(
        { query, context },
        { requiredSkills: result.requiredSkills?.length || 0, teamSize: result.teamSize }
      );

      return {
        requiredSkills: result.requiredSkills || [],
        teamSize: result.teamSize || 1,
        budgetEstimate: result.budgetEstimate || 0,
        toolRequirements: result.toolRequirements || [],
        dependencies: result.dependencies || [],
      };
    } catch {
      return this.fallbackResourcePlan(query);
    }
  }

  private fallbackResourcePlan(query: string): ResourceResult {
    return {
      requiredSkills: ['Research', 'Analysis', 'Writing'],
      teamSize: 1,
      budgetEstimate: 100,
      toolRequirements: ['Web browser', 'Documentation software', 'Citation manager'],
      dependencies: [],
    };
  }
}

// ─── Risk Agent ───────────────────────────────────────────────────────────────

export class RiskAgent extends BasePlanningAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'RiskAgent');
  }

  async plan(query: string, context?: any): Promise<RiskResult> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a risk assessment agent. Identify and evaluate potential risks.

For the given query, identify:
1. Potential risks to success
2. Probability of each risk occurring (0-1)
3. Impact if the risk occurs (0-1)
4. Mitigation strategies

Consider:
- Technical challenges
- Resource constraints
- Timeline risks
- External factors
- Quality risks

Return JSON with risks (array), overallRiskLevel ('low'|'medium'|'high'|'critical'), and mitigationStrategies (array).`,
      },
      {
        role: 'user' as const,
        content: `Assess risks for: "${query}"
${context ? `\n\nAdditional context:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 800,
        temperature: 0.4,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logPlanningTask(
        { query, context },
        { riskCount: result.risks?.length || 0, riskLevel: result.overallRiskLevel }
      );

      return {
        risks: result.risks || [],
        overallRiskLevel: result.overallRiskLevel || 'medium',
        mitigationStrategies: result.mitigationStrategies || [],
      };
    } catch {
      return this.fallbackRiskAssessment(query);
    }
  }

  private fallbackRiskAssessment(query: string): RiskResult {
    return {
      risks: [
        { id: 'risk_1', description: 'Scope may be too broad', probability: 0.4, impact: 0.5, mitigation: 'Define clear boundaries' },
        { id: 'risk_2', description: 'Information gaps', probability: 0.3, impact: 0.4, mitigation: 'Multiple source verification' },
      ],
      overallRiskLevel: 'low',
      mitigationStrategies: ['Define clear scope', 'Verify multiple sources', 'Set realistic expectations'],
    };
  }
}

// ─── Research Planning Agent ──────────────────────────────────────────────────

export class ResearchPlanningAgent extends BasePlanningAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'ResearchPlanningAgent');
  }

  async plan(query: string, context?: any): Promise<TaskPlan> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are an academic research planning agent. Create detailed research plans.

For the given query, create a research plan with:
1. Research strategy type
2. Estimated cost and time
3. Subtasks with specific tools

Available task types:
- research: Information gathering
- critic: Verification and quality assessment
- synthesizer: Final output production
- memory: Knowledge storage
- action: Actionable outputs

Return a complete research plan as JSON.`,
      },
      {
        role: 'user' as const,
        content: `Create a research plan for: "${query}"
${context ? `\n\nAdditional context:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 1500,
        temperature: 0.3,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logPlanningTask(
        { query, context },
        { strategy: result.strategy, subtaskCount: result.subtasks?.length || 0 }
      );

      return result as TaskPlan;
    } catch {
      return this.fallbackResearchPlan(query);
    }
  }

  private fallbackResearchPlan(query: string): TaskPlan {
    return {
      strategy: 'comprehensive',
      estimatedCost: 0.05,
      estimatedTime: 180,
      subtasks: [
        {
          id: 'task_0',
          type: 'research' as const,
          description: 'Search for foundational information and context',
          dependencies: [],
          toolStrategy: {
            primary: ['web_search', 'blog_search'],
            fallback: ['web_fetch'],
            maxSources: 5,
          },
        },
        {
          id: 'task_1',
          type: 'research' as const,
          description: 'Search for academic papers and research',
          dependencies: [],
          toolStrategy: {
            primary: ['paper_search', 'arxiv_search'],
            fallback: ['web_search'],
            maxSources: 8,
          },
        },
        {
          id: 'task_2',
          type: 'critic' as const,
          description: 'Verify claims and assess source reliability',
          dependencies: ['task_0', 'task_1'],
          toolStrategy: { primary: [], fallback: [], maxSources: 0 },
        },
        {
          id: 'task_3',
          type: 'synthesizer' as const,
          description: 'Produce structured final output',
          dependencies: ['task_2'],
          toolStrategy: { primary: [], fallback: [], maxSources: 0 },
        },
        {
          id: 'task_4',
          type: 'memory' as const,
          description: 'Store research for future reference',
          dependencies: ['task_3'],
          toolStrategy: {
            primary: ['vector_store'],
            fallback: [],
            maxSources: 0,
          },
        },
      ],
    };
  }
}

// ─── PlanningAgentFleet - Main Coordinator ────────────────────────────────────

export class PlanningAgentFleet {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  /**
   * Run all planning agents and aggregate results
   */
  async runAll(query: string, context?: any): Promise<{
    strategy: StrategyResult;
    timeline: TimelineResult;
    resources: ResourceResult;
    risks: RiskResult;
  }> {
    const strategyAgent = new StrategyAgent(this.sessionId, `${this.taskId}_strategy`);
    const timelineAgent = new TimelineAgent(this.sessionId, `${this.taskId}_timeline`);
    const resourceAgent = new ResourceAgent(this.sessionId, `${this.taskId}_resource`);
    const riskAgent = new RiskAgent(this.sessionId, `${this.taskId}_risk`);

    const strategy = await strategyAgent.plan(query, context);
    const timeline = await timelineAgent.plan(query, context);
    const resources = await resourceAgent.plan(query, context);
    const risks = await riskAgent.plan(query, context);

    return { strategy, timeline, resources, risks };
  }

  /**
   * Generate a complete task plan from planning results
   */
  async generateTaskPlan(query: string, context?: any): Promise<TaskPlan> {
    const planning = await this.runAll(query, context);
    const { strategy, timeline, resources, risks } = planning;

    const subtasks: SubTask[] = [];

    // Add research subtasks based on strategy
    if (strategy.objectives.length > 0) {
      subtasks.push({
        id: 'task_0',
        type: 'research',
        description: strategy.objectives[0] || `Research "${query.substring(0, 50)}..."`,
        dependencies: [],
        toolStrategy: {
          primary: ['web_search', 'paper_search'],
          fallback: ['web_fetch'],
          maxSources: 10,
        },
      });
    }

    // Add verification task
    subtasks.push({
      id: 'task_1',
      type: 'critic',
      description: 'Verify findings and assess reliability',
      dependencies: ['task_0'],
      toolStrategy: { primary: [], fallback: [], maxSources: 0 },
    });

    // Add synthesis task
    subtasks.push({
      id: 'task_2',
      type: 'synthesizer',
      description: 'Produce final output based on strategy',
      dependencies: ['task_1'],
      toolStrategy: { primary: [], fallback: [], maxSources: 0 },
    });

    return {
      strategy: strategy.strategy,
      estimatedCost: resources.budgetEstimate * 0.1, // Convert budget to cost estimate
      estimatedTime: timeline.estimatedTotalDays * 3600, // Days to seconds
      subtasks,
    };
  }

  /**
   * Run a specific planning agent by type
   */
  async runSpecific(query: string, type: string, context?: any): Promise<any> {
    const agentMap: Record<string, BasePlanningAgent> = {
      strategy: new StrategyAgent(this.sessionId, `${this.taskId}_strategy`),
      timeline: new TimelineAgent(this.sessionId, `${this.taskId}_timeline`),
      resources: new ResourceAgent(this.sessionId, `${this.taskId}_resource`),
      risks: new RiskAgent(this.sessionId, `${this.taskId}_risk`),
      research: new ResearchPlanningAgent(this.sessionId, `${this.taskId}_research`),
    };

    const agent = agentMap[type];
    if (!agent) {
      return { error: `Unknown planning agent type: ${type}` };
    }

    return agent.plan(query, context);
  }
}