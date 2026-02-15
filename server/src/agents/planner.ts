import type { TaskPlan, SubTask, ToolStrategy } from '../types';
import { prisma } from '../services/prisma';
import { llmService } from '../services/llm';
import { z } from 'zod';

const SubTaskSchema = z.object({
  id: z.string(),
  type: z.enum(['research', 'critic', 'synthesizer', 'memory', 'action', 'meta']),
  description: z.string(),
  dependencies: z.array(z.string()),
  toolStrategy: z.object({
    primary: z.array(z.string()),
    fallback: z.array(z.string()),
    maxSources: z.number(),
  }),
});

const TaskPlanSchema = z.object({
  strategy: z.string(),
  estimatedCost: z.number(),
  estimatedTime: z.number(),
  subtasks: z.array(SubTaskSchema),
});

export class PlannerAgent {
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async plan(query: string): Promise<TaskPlan> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a research planning agent. Create a detailed plan for researching the given query.

Available task types:
- research: Search for sources and information
- critic: Verify claims and detect contradictions/bias
- synthesizer: Combine findings into coherent answer
- memory: Store important information
- action: Generate actionable outputs
- meta: Evaluate the research quality

Tool strategies:
- web_search: General web search
- paper_search: Academic papers
- github_search: Code repositories
- blog_search: Blog posts
- web_fetch: Fetch specific URLs
- vector_store: Store embeddings
- knowledge_graph: Query knowledge graph

Return a JSON object with:
- strategy: One of "comparative", "actionable", "explanatory", "comprehensive"
- estimatedCost: Estimated cost in USD
- estimatedTime: Estimated time in seconds
- subtasks: Array of tasks with dependencies`,
      },
      {
        role: 'user' as const,
        content: `Create a research plan for: "${query}"

Consider:
- What type of information is needed?
- Are there multiple viewpoints to consider?
- Should we generate actionable outputs?
- How many sources are needed?`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 2000,
        temperature: 0.3,
        model: 'gpt-4o-mini',
        responseFormat: TaskPlanSchema,
      });

      const plan = TaskPlanSchema.parse(JSON.parse(response.content));
      
      await prisma.agentTask.create({
        data: {
          sessionId: this.sessionId,
          type: 'planner',
          agentName: 'PlannerAgent',
          status: 'completed',
          input: { query } as unknown as object,
          output: plan as unknown as object,
          tokens: response.usage.totalTokens,
          cost: llmService.calculateCost(response.usage, 'gpt-4o-mini'),
        },
      });

      return plan;
    } catch (error) {
      console.error('LLM planning failed, using fallback:', error);
      return this.fallbackPlan(query);
    }
  }

  private fallbackPlan(query: string): TaskPlan {
    const subtasks: SubTask[] = [
      {
        id: 'task_0',
        type: 'research',
        description: 'Search for relevant sources and information',
        dependencies: [],
        toolStrategy: {
          primary: ['web_search', 'paper_search'],
          fallback: ['web_fetch'],
          maxSources: 10,
        },
      },
      {
        id: 'task_1',
        type: 'research',
        description: 'Search for alternative viewpoints',
        dependencies: [],
        toolStrategy: {
          primary: ['web_search', 'blog_search'],
          fallback: ['web_fetch'],
          maxSources: 8,
        },
      },
      {
        id: 'task_2',
        type: 'critic',
        description: 'Verify claims and detect contradictions',
        dependencies: ['task_0', 'task_1'],
        toolStrategy: { primary: [], fallback: [], maxSources: 0 },
      },
      {
        id: 'task_3',
        type: 'synthesizer',
        description: 'Synthesize findings',
        dependencies: ['task_2'],
        toolStrategy: { primary: [], fallback: [], maxSources: 0 },
      },
      {
        id: 'task_4',
        type: 'memory',
        description: 'Store in knowledge graph',
        dependencies: ['task_3'],
        toolStrategy: {
          primary: ['vector_store', 'knowledge_graph'],
          fallback: [],
          maxSources: 0,
        },
      },
      {
        id: 'task_5',
        type: 'action',
        description: 'Generate actionable outputs',
        dependencies: ['task_3'],
        toolStrategy: { primary: [], fallback: [], maxSources: 0 },
      },
    ];

    return {
      subtasks,
      strategy: this.determineStrategy(query),
      estimatedCost: 0.05,
      estimatedTime: 180,
    };
  }

  private determineStrategy(query: string): string {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('compare') || lowerQuery.includes('vs')) return 'comparative';
    if (lowerQuery.includes('how to') || lowerQuery.includes('build')) return 'actionable';
    if (lowerQuery.includes('why') || lowerQuery.includes('explain')) return 'explanatory';
    return 'comprehensive';
  }
}
