import { prisma } from '../services/prisma';
import { llmService } from '../services/llm';
import { tavilyClient } from '../services/tavily';
import { z } from 'zod';

export interface FactCheckResult {
  claim: string;
  status: 'verified' | 'false' | 'misleading' | 'unverified' | 'partially_true';
  confidence: number;
  explanation: string;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  sources: Array<{ url: string; title: string; relevance: number }>;
}

export interface FactCheckReport {
  taskId: string;
  totalClaims: number;
  verified: number;
  false: number;
  misleading: number;
  unverified: number;
  partiallyTrue: number;
  results: FactCheckResult[];
  overallAccuracy: number;
}

const FactCheckResultSchema = z.object({
  claim: z.string(),
  status: z.enum(['verified', 'false', 'misleading', 'unverified', 'partially_true']),
  confidence: z.number(),
  explanation: z.string(),
  supportingEvidence: z.array(z.string()),
  contradictingEvidence: z.array(z.string()),
  sources: z.array(z.object({
    url: z.string(),
    title: z.string(),
    relevance: z.number(),
  })),
});

const FactCheckReportSchema = z.object({
  totalClaims: z.number(),
  verified: z.number(),
  false: z.number(),
  misleading: z.number(),
  unverified: z.number(),
  partiallyTrue: z.number(),
  results: z.array(FactCheckResultSchema),
  overallAccuracy: z.number(),
});

export class FactCheckerAgent {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  async checkFacts(claims: string[]): Promise<FactCheckReport> {
    if (claims.length === 0) {
      return this.emptyReport();
    }

    const claimsText = claims.map((c, i) => `${i + 1}. ${c}`).join('\n');

    const messages = [
      {
        role: 'system' as const,
        content: `You are a fact-checking agent for ARROS (Academic Research OS). Your role is to verify factual claims against authoritative sources.

For each claim, determine:
- verified: Claim is confirmed by multiple reliable sources
- false: Claim contradicts reliable sources
- misleading: Claim is technically true but misrepresents context
- partially_true: Claim has some truth but is incomplete or overstated
- unverified: Cannot find sufficient evidence to verify

For verification:
1. Search for authoritative sources (academic papers, official sources, reputable publications)
2. Look for consensus among sources
3. Check for recent updates or new findings
4. Note any conflicting information

Return JSON with:
- totalClaims: Total number of claims checked
- verified: Number of verified claims
- false: Number of false claims
- misleading: Number of misleading claims
- unverified: Number of unverified claims
- partiallyTrue: Number of partially true claims
- results: Array of fact check results for each claim
- overallAccuracy: Percentage of claims that are verified or partially true`,
      },
      {
        role: 'user' as const,
        content: `Fact-check these claims:

${claimsText}

For each claim:
1. Verify against reliable sources
2. Check for consensus or disagreement
3. Note any contradictions or missing context
4. Provide supporting/contradicting evidence with sources
5. Assign confidence score (0-1) based on evidence quality`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 4000,
        temperature: 0.3,
        model: 'gpt-4o-mini',
        responseFormat: FactCheckReportSchema,
      });

      const report = FactCheckReportSchema.parse(JSON.parse(response.content));

      await prisma.agentTask.update({
        where: { id: this.taskId },
        data: {
          status: 'completed',
          output: report as unknown as object,
          tokens: response.usage.totalTokens,
          cost: llmService.calculateCost(response.usage, 'gpt-4o-mini'),
        },
      });

      return {
        ...report,
        taskId: this.taskId,
      };
    } catch (error) {
      console.error('Fact-checking failed, using fallback:', error);
      return this.fallbackCheck(claims);
    }
  }

  async checkSingleClaim(claim: string): Promise<FactCheckResult> {
    try {
      const searchResults = await tavilyClient.search(claim, 5);
      
      const sources = searchResults.map((r: any) => ({
        url: r.url,
        title: r.title,
        relevance: r.score,
      }));

      const messages = [
        {
          role: 'system' as const,
          content: `You are a fact-checking agent. Verify this claim and explain your reasoning.
            
Determine status: verified, false, misleading, unverified, or partially_true
Provide confidence score 0-1 based on evidence quality.`,
        },
        {
          role: 'user' as const,
          content: `Fact-check this claim: "${claim}"

Search results:
${searchResults.map((r: any) => `- ${r.title}: ${r.content?.substring(0, 200)}`).join('\n')}`,
        },
      ];

      const response = await llmService.chat(messages, {
        maxTokens: 1000,
        temperature: 0.3,
        model: 'gpt-4o-mini',
      });

      return {
        claim,
        status: this.extractStatus(response.content),
        confidence: this.extractConfidence(response.content),
        explanation: response.content,
        supportingEvidence: [],
        contradictingEvidence: [],
        sources,
      };
    } catch (error) {
      return {
        claim,
        status: 'unverified',
        confidence: 0,
        explanation: 'Could not verify claim due to error',
        supportingEvidence: [],
        contradictingEvidence: [],
        sources: [],
      };
    }
  }

  private fallbackCheck(claims: string[]): FactCheckReport {
    const results: FactCheckResult[] = claims.map(claim => ({
      claim,
      status: 'unverified' as const,
      confidence: 0,
      explanation: 'Could not verify claim - service unavailable',
      supportingEvidence: [],
      contradictingEvidence: [],
      sources: [],
    }));

    return {
      taskId: this.taskId,
      totalClaims: claims.length,
      verified: 0,
      false: 0,
      misleading: 0,
      unverified: claims.length,
      partiallyTrue: 0,
      results,
      overallAccuracy: 0,
    };
  }

  private extractStatus(content: string): FactCheckResult['status'] {
    const lower = content.toLowerCase();
    if (lower.includes('"verified"') || lower.includes('verified:')) return 'verified';
    if (lower.includes('"false"') || lower.includes('false:')) return 'false';
    if (lower.includes('"misleading"') || lower.includes('misleading:')) return 'misleading';
    if (lower.includes('"partially_true"') || lower.includes('partially true:')) return 'partially_true';
    return 'unverified';
  }

  private extractConfidence(content: string): number {
    const match = content.match(/confidence[:\s]*(\d+\.?\d*)/i);
    if (match) {
      const num = parseFloat(match[1]);
      return num > 1 ? num / 100 : num;
    }
    return 0.5;
  }

  private emptyReport(): FactCheckReport {
    return {
      taskId: this.taskId,
      totalClaims: 0,
      verified: 0,
      false: 0,
      misleading: 0,
      unverified: 0,
      partiallyTrue: 0,
      results: [],
      overallAccuracy: 0,
    };
  }
}
