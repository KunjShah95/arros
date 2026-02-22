import { prisma } from '../services/prisma';
import { llmService } from '../services/llm';
import { z } from 'zod';

export interface ComparisonDimension {
  name: string;
  itemA: string;
  itemB: string;
  winner?: 'A' | 'B' | 'tie';
  notes?: string;
}

export interface ComparisonResult {
  taskId: string;
  itemA: string;
  itemB: string;
  summary: string;
  dimensions: ComparisonDimension[];
  pros: Record<string, string[]>;
  cons: Record<string, string[]>;
  recommendation: string;
  useCases: Record<string, string[]>;
  sources: Array<{ url: string; title: string }>;
}

const ComparisonResultSchema = z.object({
  itemA: z.string(),
  itemB: z.string(),
  summary: z.string(),
  dimensions: z.array(z.object({
    name: z.string(),
    itemA: z.string(),
    itemB: z.string(),
    winner: z.enum(['A', 'B', 'tie']).optional(),
    notes: z.string().optional(),
  })),
  pros: z.record(z.string(), z.array(z.string())),
  cons: z.record(z.string(), z.array(z.string())),
  recommendation: z.string(),
  useCases: z.record(z.string(), z.array(z.string())),
  sources: z.array(z.object({
    url: z.string(),
    title: z.string(),
  })),
});

export class ComparerAgent {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  async compare(
    itemA: string,
    itemB: string,
    context?: string
  ): Promise<ComparisonResult> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a comparison agent for ARROS (Academic Research OS). Your role is to compare two concepts, technologies, approaches, or items comprehensively.

Create structured comparisons covering:
1. Overview of each item
2. Key dimensions for comparison (e.g., performance, cost, ease of use, scalability)
3. Pros and cons of each
4. Use cases where each excels
5. Recommendations based on different scenarios
6. Relevant sources

For academic research, also consider:
- Research backing and evidence
- Peer-reviewed studies
- Real-world implementations
- Trade-offs and limitations

Return JSON with:
- itemA: Name of first item
- itemB: Name of second item
- summary: Brief comparison summary
- dimensions: Array of comparison dimensions with winner
- pros: Object with arrays of pros for each item
- cons: Object with arrays of cons for each item
- recommendation: When to choose each option
- useCases: Object with use cases for each
- sources: Array of sources used`,
      },
      {
        role: 'user' as const,
        content: `Compare "${itemA}" vs "${itemB}"${context ? ` for: ${context}` : ''}

Provide a comprehensive comparison covering:
- What each is/does
- Key differences and similarities
- Strengths and weaknesses
- Best use cases
- Which to choose in different scenarios`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 3000,
        temperature: 0.3,
        model: 'gpt-4o-mini',
        responseFormat: ComparisonResultSchema,
      });

      const result = ComparisonResultSchema.parse(JSON.parse(response.content));

      await prisma.agentTask.update({
        where: { id: this.taskId },
        data: {
          status: 'completed',
          output: result as unknown as object,
          tokens: response.usage.totalTokens,
          cost: llmService.calculateCost(response.usage, 'gpt-4o-mini'),
        },
      });

      return {
        ...result,
        taskId: this.taskId,
      };
    } catch (error) {
      console.error('Comparison failed, using fallback:', error);
      return this.fallbackCompare(itemA, itemB, context);
    }
  }

  private fallbackCompare(
    itemA: string,
    itemB: string,
    context?: string
  ): ComparisonResult {
    const dimensions: ComparisonDimension[] = [
      { name: 'Overview', itemA: `Information about ${itemA}`, itemB: `Information about ${itemB}` },
      { name: 'Performance', itemA: 'TBD', itemB: 'TBD' },
      { name: 'Ease of Use', itemA: 'TBD', itemB: 'TBD' },
      { name: 'Cost', itemA: 'TBD', itemB: 'TBD' },
      { name: 'Scalability', itemA: 'TBD', itemB: 'TBD' },
    ];

    return {
      taskId: this.taskId,
      itemA,
      itemB,
      summary: `Comparison between ${itemA} and ${itemB}${context ? ` for ${context}` : ''}. Full analysis required.`,
      dimensions,
      pros: {
        [itemA]: [],
        [itemB]: [],
      },
      cons: {
        [itemA]: [],
        [itemB]: [],
      },
      recommendation: 'Further research needed to provide recommendation.',
      useCases: {
        [itemA]: [],
        [itemB]: [],
      },
      sources: [],
    };
  }

  async createComparisonTable(
    items: string[],
    criteria: string[]
  ): Promise<string> {
    const itemsText = items.join(', ');
    const criteriaText = criteria.join(', ');

    const messages = [
      {
        role: 'system' as const,
        content: 'Create a markdown comparison table for the given items and criteria.',
      },
      {
        role: 'user' as const,
        content: `Create a comparison table for: ${itemsText}
        
Criteria to compare: ${criteriaText}

Use markdown table format with | separators.`,
      },
    ];

    const response = await llmService.chat(messages, {
      maxTokens: 1500,
      temperature: 0.3,
      model: 'gpt-4o-mini',
    });

    return response.content;
  }
}
