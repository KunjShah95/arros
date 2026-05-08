import type { ResearchResult, CritiqueResult, Claim, Contradiction, BiasIndicator } from '../types';
import { prisma } from '../services/prisma';
import { llmService } from '../services/llm';
import { wsService } from '../services/websocket';
import { z } from 'zod';

export type EpistemicLabel = 'supported' | 'inconsistent' | 'suggestive' | 'speculative' | 'unknown';

const ClaimSchema = z.object({
  id: z.string(),
  statement: z.string(),
  evidence: z.array(z.string()),
  confidence: z.number(),
  contradictedBy: z.array(z.string()).optional(),
  epistemicLabel: z.enum(['supported', 'inconsistent', 'suggestive', 'speculative', 'unknown']).optional(),
  supportingSources: z.array(z.string()).optional(),
  contradictingSources: z.array(z.string()).optional(),
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
      .map((c, i) => `${i + 1}. "${c.statement}" (confidence: ${c.confidence}, sources: ${c.evidence.join(', ')})`)
      .join('\n');

    const sourcesText = allSources
      .map((s, i) => `${i + 1}. ${s.title} - ${s.url} (reliability: ${s.reliability}, bias: ${s.bias})`)
      .join('\n');

    const messages = [
      {
        role: 'system' as const,
        content: `You are a research critic agent for ARROS (Academic Research OS). Your role is to verify claims, detect contradictions, and assess evidence quality.

EVIDENCE GRADING:
Label each claim with an epistemic label:
- supported: Multiple consistent sources confirm the claim (reliability >= 0.7 from 2+ sources)
- inconsistent: Sources show conflicting results or contradictions
- suggestive: Single weak source (reliability < 0.7) or preliminary evidence
- speculative: Inferred from indirect evidence, not directly stated in sources
- unknown: No corroborating evidence found, claim appears unsupported

For each claim, provide:
- epistemicLabel: The evidence quality label
- supportingSources: Array of source IDs that support this claim
- contradictingSources: Array of source IDs that contradict this claim

CLAIM ACCEPTANCE:
- Accept if epistemicLabel is 'supported' or 'suggestive' with reliability >= 0.6
- Reject if epistemicLabel is 'unknown' or 'speculative' with low confidence

CONTRADICTION DETECTION:
- Find claims that contradict each other across different sources
- Rate severity as low/medium/high based on number of conflicting sources

BIAS DETECTION:
- Identify potential bias in sources
- Rate severity 0-1 based on bias score and source reliability

Return JSON with:
- acceptedClaims: Array of verified claims with epistemic labels
- rejectedClaims: Array of rejected claims
- contradictions: Array of contradictions found
- biasIndicators: Array of potential biases
- overallConfidence: Overall confidence score 0-1`,
      },
      {
        role: 'user' as const,
        content: `Evaluate these claims and sources:

CLAIMS:
${claimsText}

SOURCES:
${sourcesText}

For each claim, assign:
1. epistemicLabel (supported/inconsistent/suggestive/speculative/unknown)
2. supportingSources (source IDs that confirm the claim)
3. contradictingSources (source IDs that refute the claim)

Return JSON with all fields.`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 3000,
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
            epistemicBreakdown: {
              supported: critique.acceptedClaims.filter(c => c.epistemicLabel === 'supported').length,
              inconsistent: critique.acceptedClaims.filter(c => c.epistemicLabel === 'inconsistent').length,
              suggestive: critique.acceptedClaims.filter(c => c.epistemicLabel === 'suggestive').length,
              speculative: critique.acceptedClaims.filter(c => c.epistemicLabel === 'speculative').length,
              unknown: critique.acceptedClaims.filter(c => c.epistemicLabel === 'unknown').length,
            },
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
      const claimSources = sources.filter(s => claim.evidence.includes(s.id));
      const avgReliability = claimSources.length > 0
        ? claimSources.reduce((sum, s) => sum + (s.reliability || 0.5), 0) / claimSources.length
        : 0.5;

      let epistemicLabel: EpistemicLabel = 'unknown';
      if (claimSources.length >= 2 && avgReliability >= 0.7) {
        epistemicLabel = 'supported';
      } else if (claimSources.length === 1 && avgReliability >= 0.6) {
        epistemicLabel = 'suggestive';
      } else if (avgReliability < 0.5) {
        epistemicLabel = 'speculative';
      }

      const claimWithLabel = {
        ...claim,
        epistemicLabel,
        supportingSources: claimSources.map(s => s.id),
        contradictingSources: [] as string[],
      };

      if (epistemicLabel === 'supported' || epistemicLabel === 'suggestive') {
        acceptedClaims.push(claimWithLabel as unknown as Claim);
      } else {
        rejectedClaims.push(claimWithLabel as unknown as Claim);
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
    const negationWords = ['not', 'no', 'never', 'cannot', 'impossible', 'false', 'decrease', 'increase', 'higher', 'lower'];
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
