/**
 * Planning Specialist Agent - Human-Like Strategic Planning
 *
 * This agent simulates human planning behavior:
 *  - Considers both short-term and long-term goals
 *  - Balances ambition with feasibility
 *  - Adaptively adjusts plans based on new information
 *  - Manages cognitive load and decision fatigue
 *  - Considers emotional and motivational factors
 *
 * Inspired by:
 *  - Temporal Goal Theory (Zimbardo)
 *  - Implementation Intentions (Gollwitzer)
 *  - Ego depletion and decision fatigue
 */

import { llmService } from '../../services/llm';
import { prisma } from '../../services/prisma';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';

// ─── Planning Types ─────────────────────────────────────────────────────────────

export type PlanningMode = 'exploratory' | 'strategic' | 'tactical' | 'emergency' | 'routine';

export interface PlanningState {
  mode: PlanningMode;
  goalClarity: number;        // 0-1 how clear is the goal?
  timeHorizon: 'short' | 'medium' | 'long';
  confidence: number;
  cognitiveLoad: number;      // current mental effort
  motivation: number;         // 0-1 drive to execute
  riskTolerance: number;      // 0-1 willingness to take risks
}

export interface PlanStep {
  id: string;
  description: string;
  dependencies: string[];
  estimatedDuration: number;  // hours
  estimatedDifficulty: number; // 0-1
  priority: 1 | 2 | 3;        // 1 = highest
  fallback?: string;
}

export interface PlanResult {
  plan: {
    strategy: string;
    goals: string[];
    steps: PlanStep[];
    milestones: string[];
  };
  state: PlanningState;
  risks: string[];
  recommendations: string[];
}

// ─── PlanningSpecialist Class ──────────────────────────────────────────────────

export class PlanningSpecialist {
  private userId: string;
  private sessionId: string;
  private taskId: string;

  constructor(userId: string, sessionId: string, taskId: string) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  /**
   * Main planning function - simulates human planning behavior
   */
  async plan(query: string, context?: string): Promise<PlanResult> {
    console.log(`[PlanningSpecialist] 🗺️ Starting strategic planning for: "${query.substring(0, 60)}..."`);

    // Determine planning mode
    const initialMode = this.determinePlanningMode(query);
    const initialState: PlanningState = {
      mode: initialMode,
      goalClarity: 0.5,
      timeHorizon: initialMode === 'emergency' ? 'short' : initialMode === 'routine' ? 'short' : 'medium',
      confidence: 0.5,
      cognitiveLoad: 0.2,
      motivation: 0.6,
      riskTolerance: 0.5,
    };

    // Phase 1: Goal clarification
    console.log('[PlanningSpecialist] Phase 1: Clarifying goals...');
    const goalAnalysis = await this.analyzeGoals(query, context);
    const updatedState = this.updatePlanningState(initialState, goalAnalysis);

    // Phase 2: Strategy formulation
    console.log('[PlanningSpecialist] Phase 2: Formulating strategy...');
    const strategies = await this.generateStrategies(goalAnalysis, updatedState);
    const selectedStrategy = this.selectStrategy(strategies, updatedState);

    // Phase 3: Action planning
    console.log('[PlanningSpecialist] Phase 3: Breaking down into actions...');
    const planSteps = await this.createActionPlan(selectedStrategy, goalAnalysis, updatedState);

    // Phase 4: Risk assessment
    console.log('[PlanningSpecialist] Phase 4: Assessing risks...');
    const risks = await this.assessRisks(planSteps, selectedStrategy);

    // Phase 5: Recommendation generation
    console.log('[PlanningSpecialist] Phase 5: Generating recommendations...');
    const recommendations = this.generateRecommendations(planSteps, risks, updatedState);

    // Store plan in memory
    await this.storePlanMemory(planSteps, selectedStrategy, query);

    return {
      plan: {
        strategy: selectedStrategy,
        goals: goalAnalysis.goals,
        steps: planSteps,
        milestones: this.identifyMilestones(planSteps),
      },
      state: updatedState,
      risks,
      recommendations,
    };
  }

  /**
   * Determine the appropriate planning mode
   */
  private determinePlanningMode(query: string): PlanningMode {
    const lower = query.toLowerCase();

    if (lower.includes('emergency') || lower.includes('urgent') || lower.includes('crisis')) {
      return 'emergency';
    }
    if (lower.includes('routine') || lower.includes('habit') || lower.includes('daily')) {
      return 'routine';
    }
    if (lower.includes('today') || lower.includes('now') || lower.includes('immediately')) {
      return 'tactical';
    }
    if (lower.includes('year') || lower.includes('lifetime') || lower.includes('dream') || lower.includes('vision')) {
      return 'strategic';
    }
    if (lower.includes('explore') || lower.includes('idea') || lower.includes(' possibilities')) {
      return 'exploratory';
    }

    return 'tactical';
  }

  /**
   * Analyze and clarify goals
   */
  private async analyzeGoals(query: string, context?: string): Promise<{
    goals: string[];
    priorities: Record<string, number>;
    constraints: string[];
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a goal analysis assistant. Given a query, identify:
1. Primary goals (what the user wants to achieve)
2. Implicit goals (what might be underlying the request)
3. Constraints (time, resources, limitations)

Return JSON with goals (array of strings), priorities (goal -> 1-3), and constraints (array).`,
      },
      {
        role: 'user' as const,
        content: `Query: "${query}"

${context ? `Context: ${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 500,
        temperature: 0.3,
        model: 'gpt-4o-mini',
      });
      return JSON.parse(response.content);
    } catch {
      return {
        goals: [query.substring(0, 50)],
        priorities: { [query.substring(0, 50)]: 1 },
        constraints: [],
      };
    }
  }

  /**
   * Update planning state based on analysis
   */
  private updatePlanningState(state: PlanningState, analysis: any): PlanningState {
    let updated = { ...state };

    // Goal clarity increases with better analysis
    if (analysis.goals && analysis.goals.length > 0) {
      updated.goalClarity = Math.min(1, updated.goalClarity + analysis.goals.length * 0.15);
    }

    // Time horizon based on goal clarity
    if (updated.goalClarity > 0.7) {
      updated.timeHorizon = 'medium';
    }

    // Risk tolerance based on mode
    if (state.mode === 'emergency') {
      updated.riskTolerance = Math.min(1, updated.riskTolerance + 0.3);
      updated.cognitiveLoad = Math.min(1, state.cognitiveLoad + 0.4);
    }

    return updated;
  }

  /**
   * Generate alternative strategies
   */
  private async generateStrategies(goalAnalysis: any, state: PlanningState): Promise<string[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Given the goals and constraints, generate 3-5 different strategic approaches.

For each strategy, consider:
- Speed of execution
- Resource requirements
- Risk level
- Long-term impact
- Flexibility

Return as JSON array of strategy descriptions.`,
      },
      {
        role: 'user' as const,
        content: `Goals: ${goalAnalysis.goals.join(', ')}
Constraints: ${goalAnalysis.constraints?.join(', ') || 'none'}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 800,
        temperature: 0.7,
        model: 'gpt-4o-mini',
      });
      return JSON.parse(response.content);
    } catch {
      return ['Standard approach', 'Aggressive approach', 'Conservative approach'];
    }
  }

  /**
   * Select best strategy based on planning state
   */
  private selectStrategy(strategies: string[], state: PlanningState): string {
    // Different modes prefer different strategies
    if (state.mode === 'emergency') {
      // Emergency: prioritize speed over everything
      return strategies.find(s => s.toLowerCase().includes('rapid') || s.toLowerCase().includes('immediate')) || strategies[0];
    }

    if (state.mode === 'routine') {
      // Routine: prioritize simplicity and consistency
      return strategies.find(s => s.toLowerCase().includes('standard') || s.toLowerCase().includes('routine')) || strategies[1];
    }

    if (state.mode === 'strategic') {
      // Strategic: prioritize long-term impact
      return strategies.find(s => s.toLowerCase().includes('long') || s.toLowerCase().includes('vision')) || strategies[2];
    }

    // Default: balance approach
    return strategies[strategies.length > 1 ? 1 : 0];
  }

  /**
   * Create detailed action plan
   */
  private async createActionPlan(strategy: string, goalAnalysis: any, state: PlanningState): Promise<PlanStep[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Create a detailed action plan with steps to execute the strategy.

For each step, specify:
- Clear description
- Dependencies (what must be done first)
- Estimated duration in hours
- Difficulty (0-1)
- Priority (1, 2, or 3)
- Optional fallback if this step fails

Structure steps to flow logically from start to finish.`,
      },
      {
        role: 'user' as const,
        content: `Strategy: ${strategy}
Goals: ${goalAnalysis.goals.join(', ')}
Time horizon: ${state.timeHorizon}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 2000,
        temperature: 0.4,
        model: 'gpt-4o-mini',
        responseFormat: z.object({
          steps: z.array(z.object({
            id: z.string(),
            description: z.string(),
            dependencies: z.array(z.string()),
            estimatedDuration: z.number(),
            estimatedDifficulty: z.number().min(0).max(1),
            priority: z.enum(['1', '2', '3']) as any,
            fallback: z.string().optional(),
          })),
        }),
      });
      const result = JSON.parse(response.content);
      return result.steps.map((s: any) => ({
        ...s,
        priority: Number(s.priority) as 1 | 2 | 3,
      }));
    } catch {
      return this.fallbackPlan(goalAnalysis.goals);
    }
  }

  /**
   * Assess risks for the plan
   */
  private async assessRisks(steps: PlanStep[], strategy: string): Promise<string[]> {
    const difficultSteps = steps.filter(s => s.estimatedDifficulty > 0.7);

    if (difficultSteps.length === 0) return [];

    const messages = [
      {
        role: 'system' as const,
        content: 'Identify potential risks for the given plan steps. Return as JSON array of risk descriptions.',
      },
      {
        role: 'user' as const,
        content: `Strategy: ${strategy}

Difficult steps:
${difficultSteps.map(s => `- ${s.description} (difficulty: ${s.estimatedDifficulty})`).join('\n')}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 500,
        temperature: 0.4,
        model: 'gpt-4o-mini',
      });
      return JSON.parse(response.content);
    } catch {
      return difficultSteps.map(s => `Risk in: ${s.description.substring(0, 40)}...`);
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(steps: PlanStep[], risks: string[], state: PlanningState): string[] {
    const recommendations: string[] = [];

    // Recommendation based on cognitive load
    if (state.cognitiveLoad > 0.6) {
      recommendations.push('Consider breaking large steps into smaller subtasks to reduce cognitive load');
    }

    // Recommendation based on risks
    if (risks.length > 0) {
      recommendations.push(`Address key risks: ${risks.slice(0, 2).join(', ')}`);
      recommendations.push('Prepare fallback plans for high-risk steps');
    }

    // Recommendation based on mode
    if (state.mode === 'strategic') {
      recommendations.push('Set up regular review points to assess strategic alignment');
    }
    if (state.mode === 'emergency') {
      recommendations.push('Focus on rapid execution over perfection');
    }
    if (state.mode === 'routine') {
      recommendations.push('Establish clear triggers to maintain routine consistency');
    }

    // Default recommendation
    if (recommendations.length === 0) {
      recommendations.push('Start with the highest priority step first');
    }

    return recommendations;
  }

  /**
   * Identify milestones from the plan
   */
  private identifyMilestones(steps: PlanStep[]): string[] {
    // Milestones are major转折 points
    const sortedSteps = [...steps].sort((a, b) => b.priority - a.priority);
    return sortedSteps.slice(0, 3).map(s => `Complete: ${s.description.substring(0, 40)}`);
  }

  /**
   * Store plan in memory
   */
  private async storePlanMemory(steps: PlanStep[], strategy: string, query: string): Promise<void> {
    try {
      const planId = uuid();

      await prisma.agentTask.create({
        data: {
          sessionId: this.sessionId,
          type: 'planner',
          agentName: 'PlanningSpecialist',
          status: 'completed',
          input: { query, strategy } as any,
          output: { stepCount: steps.length } as any,
          cost: 0.0002,
        },
      });

      // Store key steps as knowledge nodes
      for (let i = 0; i < Math.min(3, steps.length); i++) {
        const step = steps[i];
        await prisma.knowledgeNode.upsert({
          where: { id: `plan_${this.userId}_${step.id}` },
          update: {},
          create: {
            id: `plan_${this.userId}_${step.id}`,
            type: 'action',
            name: step.description.substring(0, 50),
            description: `Step ${i + 1}: ${step.description}`,
            properties: { estimatedDuration: step.estimatedDuration, priority: step.priority } as any,
          },
        });
      }
    } catch (err) {
      console.warn('[PlanningSpecialist] Could not store memory:', err);
    }
  }

  /**
   * Fallback plan when LLM fails
   */
  private fallbackPlan(goals: string[]): PlanStep[] {
    return goals.slice(0, 3).map((goal, idx) => ({
      id: `step_${idx}`,
      description: goal.substring(0, 50),
      dependencies: idx === 0 ? [] : [`step_${idx - 1}`],
      estimatedDuration: 1,
      estimatedDifficulty: 0.5,
      priority: (3 - idx) as 1 | 2 | 3,
    }));
  }

  /**
   * Get current planning state
   */
  getState(): PlanningState {
    return {
      mode: 'tactical',
      goalClarity: 0.5,
      timeHorizon: 'medium',
      confidence: 0.5,
      cognitiveLoad: 0.2,
      motivation: 0.6,
      riskTolerance: 0.5,
    };
  }
}
