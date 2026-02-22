import { prisma } from '../services/prisma';
import { llmService } from '../services/llm';
import { z } from 'zod';

export interface QueryRefinement {
  originalQuery: string;
  refinedQuery: string;
  expandedTerms: string[];
  keywords: string[];
  intent: 'informational' | 'comparative' | 'definitional' | 'how-to' | 'research';
  domain?: string;
  suggestions: string[];
}

const QueryRefinementSchema = z.object({
  originalQuery: z.string(),
  refinedQuery: z.string(),
  expandedTerms: z.array(z.string()),
  keywords: z.array(z.string()),
  intent: z.enum(['informational', 'comparative', 'definitional', 'how-to', 'research']),
  domain: z.string().optional(),
  suggestions: z.array(z.string()),
});

export class QueryRefinerAgent {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  async refine(query: string): Promise<QueryRefinement> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a query refinement agent for ARROS (Academic Research OS). Your role is to optimize user queries for better research results.

Analyze and refine queries to:
1. Extract key concepts and terms
2. Identify the user's intent
3. Expand abbreviations and acronyms
4. Add relevant domain-specific keywords
5. Suggest alternative phrasings
6. Identify the academic domain if applicable

Return a JSON with:
- originalQuery: The user's original query
- refinedQuery: An optimized version of the query
- expandedTerms: Array of expanded terms/abbreviations
- keywords: Array of key concepts
- intent: One of informational, comparative, definitional, how-to, research
- domain: Academic domain if identifiable (e.g., "computer science", "medicine", "physics")
- suggestions: Array of alternative query suggestions`,
      },
      {
        role: 'user' as const,
        content: `Refine this query for academic research: "${query}"

Consider:
- What is the user really asking for?
- What academic terminology should be used?
- Are there any acronyms or jargon that need expansion?
- What domain does this query relate to?
- What keywords would yield the best academic sources?`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 1500,
        temperature: 0.3,
        model: 'gpt-4o-mini',
        responseFormat: QueryRefinementSchema,
      });

      const refinement = QueryRefinementSchema.parse(JSON.parse(response.content));

      await prisma.agentTask.update({
        where: { id: this.taskId },
        data: {
          status: 'completed',
          output: refinement as unknown as object,
          tokens: response.usage.totalTokens,
          cost: llmService.calculateCost(response.usage, 'gpt-4o-mini'),
        },
      });

      return refinement;
    } catch (error) {
      console.error('Query refinement failed, using fallback:', error);
      return this.fallbackRefine(query);
    }
  }

  private fallbackRefine(query: string): QueryRefinement {
    const words = query.toLowerCase().split(/\s+/);
    const intent: QueryRefinement['intent'] = 
      query.toLowerCase().includes('compare') || query.toLowerCase().includes('vs') 
        ? 'comparative' 
        : query.toLowerCase().includes('what is') || query.toLowerCase().includes('define')
        ? 'definitional'
        : query.toLowerCase().includes('how to') || query.toLowerCase().includes('how do')
        ? 'how-to'
        : query.toLowerCase().includes('research') || query.toLowerCase().includes('study')
        ? 'research'
        : 'informational';

    return {
      originalQuery: query,
      refinedQuery: query,
      expandedTerms: [],
      keywords: words.filter(w => w.length > 3),
      intent,
      domain: this.detectDomain(query),
      suggestions: [query],
    };
  }

  private detectDomain(query: string): string | undefined {
    const domains: Record<string, string[]> = {
      'computer science': ['ai', 'ml', 'machine learning', 'neural', 'algorithm', 'software', 'programming', 'deep learning'],
      'medicine': ['disease', 'treatment', 'patient', 'clinical', 'therapy', 'drug', 'health'],
      'physics': ['quantum', 'particle', 'energy', 'force', 'mass', 'relativity'],
      'chemistry': ['molecule', 'reaction', 'compound', 'bond', 'element', 'catalyst'],
      'biology': ['gene', 'cell', 'protein', 'dna', 'rna', 'organism', 'evolution'],
      'economics': ['market', 'price', 'gdp', 'inflation', 'trade', 'economy'],
      'psychology': ['behavior', 'cognition', 'mental', 'brain', 'memory', 'emotion'],
    };

    const lower = query.toLowerCase();
    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(k => lower.includes(k))) {
        return domain;
      }
    }
    return undefined;
  }
}
