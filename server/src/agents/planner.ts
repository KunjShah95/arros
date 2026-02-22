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
        content: `You are an academic research planning agent for ARROS (Academic Research OS). Your job is to create structured research plans for students and researchers.

You specialize in academic research that produces:
- Literature reviews and structured academic reports
- Citation-backed summaries with verified sources
- Key findings, definitions, applications, challenges, and future directions
- Structured outputs suitable for academic use

Available task types:
- research: Search for sources and information (web + academic papers)
- critic: Verify claims, check source reliability, detect contradictions
- synthesizer: Produce structured academic output with citations
- memory: Store topics/papers for continuity across sessions
- action: Generate actionable academic outputs (study notes, further reading)
- meta: Evaluate overall research quality
- debate: Deliberate on controversial claims or contradictions between sources. Use when contradictions are likely.

Tool strategies:
- web_search: General web search (Wikipedia, blogs, context)
- paper_search: Semantic Scholar academic papers with real citations
- arxiv_search: arXiv preprints and open-access papers
- blog_search: Educational blogs for context
- web_fetch: Fetch full content from specific URLs
- vector_store: Store embeddings for memory
- knowledge_graph: Build topic knowledge graph

For academic queries, ALWAYS include:
1. At least one paper_search or arxiv_search task for academic papers
2. A web_search task for foundational/contextual information
3. A critic task to verify claims and score source reliability
4. A synthesizer task to produce structured academic output
5. A memory task to store research for future continuity

Return a JSON with strategy (one of: literature_review, explanatory, comparative, comprehensive), estimatedCost, estimatedTime, and subtasks array.`,
      },
      {
        role: 'user' as const,
        content: `Create an academic research plan for: "${query}"

Consider:
- Is this a definition/concept question? (Include foundational web sources)
- Does it require recent research papers? (Use paper_search + arxiv_search)
- Are there multiple schools of thought? (Use critic for contradictions)
- What academic subtopics should be covered: definitions, key concepts, applications, challenges, future scope?
- How many sources are needed for a credible academic report?`,
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
      console.error('LLM planning failed, using academic fallback:', error);
      return this.academicFallbackPlan(query);
    }
  }

  private academicFallbackPlan(query: string): TaskPlan {
    const subtasks: SubTask[] = [
      {
        id: 'task_0',
        type: 'research',
        description: 'Search for foundational information, definitions, and context',
        dependencies: [],
        toolStrategy: {
          primary: ['web_search', 'blog_search'],
          fallback: ['web_fetch'],
          maxSources: 6,
        },
      },
      {
        id: 'task_1',
        type: 'research',
        description: 'Search for peer-reviewed academic papers and published research',
        dependencies: [],
        toolStrategy: {
          primary: ['paper_search', 'arxiv_search'],
          fallback: ['web_search'],
          maxSources: 8,
        },
      },
      {
        id: 'task_2',
        type: 'critic',
        description: 'Verify source reliability, check for contradictions, score confidence',
        dependencies: ['task_0', 'task_1'],
        toolStrategy: { primary: [], fallback: [], maxSources: 0 },
      },
      {
        id: 'task_3',
        type: 'synthesizer',
        description: 'Produce structured academic report with citations, key findings, and conclusion',
        dependencies: ['task_2'],
        toolStrategy: { primary: [], fallback: [], maxSources: 0 },
      },
      {
        id: 'task_4',
        type: 'memory',
        description: 'Store topic, key papers, and concepts for future continuity',
        dependencies: ['task_3'],
        toolStrategy: {
          primary: ['vector_store', 'knowledge_graph'],
          fallback: [],
          maxSources: 0,
        },
      },
    ];

    return {
      subtasks,
      strategy: this.determineAcademicStrategy(query),
      estimatedCost: 0.05,
      estimatedTime: 180,
    };
  }

  private determineAcademicStrategy(query: string): string {
    const lower = query.toLowerCase();
    if (lower.includes('literature review') || lower.includes('survey') || lower.includes('systematic review')) {
      return 'literature_review';
    }
    if (lower.includes('compare') || lower.includes('vs') || lower.includes('difference between')) {
      return 'comparative';
    }
    if (lower.includes('explain') || lower.includes('what is') || lower.includes('define') || lower.includes('how does')) {
      return 'explanatory';
    }
    return 'comprehensive';
  }
}
