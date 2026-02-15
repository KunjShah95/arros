import type { ResearchResult, CritiqueResult, Claim, Contradiction, BiasIndicator } from '../types';
import { prisma } from '../services/prisma';
import { llmService } from '../services/llm';
import { wsService } from '../services/websocket';
import { z } from 'zod';

const ClaimSchema = z.object({
  id: z.string(),
  statement: z.string(),
  evidence: z.array(z.string()),
  confidence: z.number(),
  contradictedBy: z.array(z.string()).optional(),
});

const ContradictionSchema = z.object({
  claimA: z.string(),
  claimB: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
});

const BiasIndicatorSchema = z.object({
  claim: z.string(),
  biasType: z.string(),
  severity: z.number(),
});

const CritiqueResultSchema = z.object({
  acceptedClaims: z.array(ClaimSchema),
  rejectedClaims: z.array(ClaimSchema),
  contradictions: z.array(ContradictionSchema),
  biasIndicators: z.array(BiasIndicatorSchema),
  overallConfidence: z.number(),
});

export class CriticAgent {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  async critique(researchResults: ResearchResult[]): Promise<CritiqueResult> {
    const allClaims: Claim[] = researchResults.flatMap((r) => r.claims);
    const allSources = researchResults.flatMap((r) => r.sources);

    if (allClaims.length === 0) {
      return this.emptyCritique();
    }

    const claimsText = allClaims
      .map((c, i) => `${i + 1}. "${c.statement}" (confidence: ${c.confidence}, source: ${c.evidence[0]})`)
      .join('\n');

    const sourcesText = allSources
      .map((s, i) => `${i + 1}. ${s.title} - ${s.url} (reliability: ${s.reliability}, bias: ${s.bias})`)
      .join('\n');

    const messages = [
      {
        role: 'system' as const,
        content: `You are a research critic agent. Verify claims, detect contradictions, and assess bias.

Evaluate each claim based on:
- Source reliability (0-1)
- Internal consistency
- Corroboration from multiple sources
- Potential bias

For each claim, decide:
- Accept if reliability >= 0.6 and confidence >= 0.5
- Reject otherwise

For contradictions:
- Find claims that contradict each other
- Rate severity as low/medium/high

For bias:
- Identify potential bias in sources
- Rate severity 0-1`,
      },
      {
        role: 'user' as const,
        content: `Evaluate these claims and sources:

CLAIMS:
${claimsText}

SOURCES:
${sourcesText}

Return JSON with:
- acceptedClaims: Array of verified claims
- rejectedClaims: Array of rejected claims  
- contradictions: Array of contradictions found
- biasIndicators: Array of potential biases
- overallConfidence: Overall confidence score 0-1`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 2000,
        temperature: 0.3,
        model: 'gpt-4o-mini',
        responseFormat: CritiqueResultSchema,
      });

      const critique: CritiqueResult = {
        ...CritiqueResultSchema.parse(JSON.parse(response.content)),
        taskId: this.taskId,
      };

      await prisma.agentTask.update({
        where: { id: this.taskId },
        data: {
          status: 'completed',
          output: critique as unknown as object,
          tokens: response.usage.totalTokens,
          cost: llmService.calculateCost(response.usage, 'gpt-4o-mini'),
        },
      });

      await prisma.evaluation.create({
        data: {
          sessionId: this.sessionId,
          type: 'hallucination',
          score: critique.overallConfidence,
          details: {
            acceptedClaims: critique.acceptedClaims.length,
            rejectedClaims: critique.rejectedClaims.length,
            contradictions: critique.contradictions.length,
          } as object,
          passed: critique.overallConfidence >= 0.7,
        },
      });

      wsService.emitTaskCompleted(this.sessionId, this.taskId, critique);

      return critique;
    } catch (error) {
      console.error('LLM critique failed, using fallback:', error);
      return this.fallbackCritique(allClaims, allSources);
    }
  }

  private fallbackCritique(claims: Claim[], sources: ResearchResult['sources']): CritiqueResult {
    const acceptedClaims: Claim[] = [];
    const rejectedClaims: Claim[] = [];
    const contradictions: Contradiction[] = [];
    const biasIndicators: BiasIndicator[] = [];

    for (const claim of claims) {
      const source = sources.find((s) => s.id === claim.evidence[0]);
      const reliability = source?.reliability ?? 0.5;

      if (reliability >= 0.6 && claim.confidence >= 0.5) {
        acceptedClaims.push(claim);
      } else {
        rejectedClaims.push(claim);
      }
    }

    for (let i = 0; i < acceptedClaims.length; i++) {
      for (let j = i + 1; j < acceptedClaims.length; j++) {
        const contra = this.detectContradiction(acceptedClaims[i], acceptedClaims[j]);
        if (contra) contradictions.push(contra);
      }
    }

    for (const source of sources) {
      if (source.bias !== 0 && Math.abs(source.bias) > 0.3) {
        const claimsFromSource = claims.filter((c) => c.evidence.includes(source.id));
        for (const claim of claimsFromSource) {
          biasIndicators.push({
            claim: claim.statement,
            biasType: source.bias > 0 ? 'positive' : 'negative',
            severity: Math.abs(source.bias),
          });
        }
      }
    }

    const overallConfidence = this.calculateOverallConfidence(acceptedClaims, contradictions, biasIndicators);

    return {
      taskId: this.taskId,
      acceptedClaims,
      rejectedClaims,
      contradictions,
      biasIndicators,
      overallConfidence,
    };
  }

  private detectContradiction(claimA: Claim, claimB: Claim): Contradiction | null {
    const negationWords = ['not', 'no', 'never', 'cannot', 'impossible', 'false'];
    const statementA = claimA.statement.toLowerCase();
    const statementB = claimB.statement.toLowerCase();

    const hasNegation = (s: string) => negationWords.some((w) => s.includes(w));
    const similar = this.calculateSimilarity(statementA, statementB);

    if (similar > 0.7 && hasNegation(statementA) !== hasNegation(statementB)) {
      return {
        claimA: claimA.id,
        claimB: claimB.id,
        severity: similar > 0.9 ? 'high' : 'medium',
      };
    }
    return null;
  }

  private calculateSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));
    const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    return intersection.size / union.size;
  }

  private calculateOverallConfidence(
    acceptedClaims: Claim[],
    contradictions: Contradiction[],
    biasIndicators: BiasIndicator[]
  ): number {
    if (acceptedClaims.length === 0) return 0;

    const baseConfidence =
      acceptedClaims.reduce((sum, c) => sum + c.confidence, 0) / acceptedClaims.length;
    const contradictionPenalty = contradictions.length * 0.1;
    const biasPenalty =
      (biasIndicators.reduce((sum, b) => sum + b.severity, 0) /
        (biasIndicators.length || 1)) *
      0.1;

    return Math.max(0, Math.min(1, baseConfidence - contradictionPenalty - biasPenalty));
  }

  private emptyCritique(): CritiqueResult {
    return {
      taskId: this.taskId,
      acceptedClaims: [],
      rejectedClaims: [],
      contradictions: [],
      biasIndicators: [],
      overallConfidence: 0,
    };
  }
}
