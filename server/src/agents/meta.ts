import type { EvaluationResult, SynthesisResult, CritiqueResult } from '../types';
import { prisma } from '../services/prisma';
import { Prisma } from '@prisma/client';
import { llmService } from '../services/llm';
import { z } from 'zod';

export class MetaEvaluatorAgent {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  async evaluate(
    synthesisResult: SynthesisResult,
    critiqueResult: CritiqueResult,
    query: string
  ): Promise<EvaluationResult> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a Meta-Evaluator Agent for ARROS. Your task is to evaluate the quality of an autonomous research synthesis.
Evaluate based on:
1. completeness: Does it answer all parts of the query?
2. agreement: Do the synthesis and critique align? Are there unresolved contradictions?
3. confidence: Is the confidence score justified by the evidence?
4. hallucination: Are there any claims that seem unfounded or contradicted by the critique?
5. bias: Is the summary balanced or does it lean too much on one source type?

Critique Details:
- Accepted Claims: ${critiqueResult.acceptedClaims.length}
- Rejected Claims: ${critiqueResult.rejectedClaims.length}
- Contradictions Found: ${critiqueResult.contradictions.join(', ')}
- Source Reliability: ${critiqueResult.overallConfidence}

Synthesis Summary:
${synthesisResult.summary}

Return JSON with overallScore (0-1), passed (boolean), type ('meta'), details (object with completeness, agreement, hallucination, bias scores), and recommendations (array).`,
      },
      {
        role: 'user' as const,
        content: `Query: "${query}"\n\nEvaluate the research quality and provide specific recommendations for improvement if it failed.`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        temperature: 0.1,
        model: 'gpt-4o-mini',
        responseFormat: z.object({
          overallScore: z.number(),
          passed: z.boolean(),
          type: z.string(),
          details: z.object({
            completeness: z.number(),
            agreement: z.number(),
            hallucination: z.number(),
            bias: z.number(),
          }),
          recommendations: z.array(z.string()),
        }),
      });

      const finalEvaluation = JSON.parse(response.content);

      await prisma.evaluation.create({
        data: {
          sessionId: this.sessionId,
          type: 'meta',
          score: finalEvaluation.overallScore,
          details: finalEvaluation.details as unknown as Prisma.InputJsonValue,
          passed: finalEvaluation.passed,
        },
      });

      await prisma.agentTask.update({
        where: { id: this.taskId },
        data: { status: 'completed', output: finalEvaluation as unknown as Prisma.InputJsonValue },
      });

      return {
        type: 'meta',
        score: finalEvaluation.overallScore,
        details: finalEvaluation.details,
        passed: finalEvaluation.passed,
        recommendations: finalEvaluation.recommendations,
      };
    } catch (error) {
      console.error('LLM evaluation failed, falling back to deterministic:', error);
      return this.fallbackEvaluate(synthesisResult, critiqueResult, query);
    }
  }

  private async fallbackEvaluate(
    synthesisResult: SynthesisResult,
    critiqueResult: CritiqueResult,
    query: string
  ): Promise<EvaluationResult> {
    const evaluations: EvaluationResult[] = [];

    evaluations.push(this.evaluateCompleteness(synthesisResult, query));
    evaluations.push(this.evaluateAgreement(critiqueResult));
    evaluations.push(this.evaluateConfidence(synthesisResult, critiqueResult));

    const overallScore = evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length;
    const passed = overallScore >= 0.7;

    return {
      type: 'meta',
      score: overallScore,
      details: {
        evaluations: evaluations.map(e => ({ type: e.type, score: e.score, passed: e.passed })),
        query,
      },
      passed,
      recommendations: passed ? undefined : ['Improve source quality', 'Add more verification', 'Resolve contradictions'],
    };
  }

  private evaluateCompleteness(synthesisResult: SynthesisResult, query: string): EvaluationResult {
    const hasSummary = synthesisResult.summary.length > 50;
    const hasDeepDive = synthesisResult.deepDive.length > 100;
    const hasKeyFindings = synthesisResult.keyFindings.length >= 3;
    const hasActions = synthesisResult.actionableOutputs && synthesisResult.actionableOutputs.length > 0;

    const score = (Number(hasSummary) + Number(hasDeepDive) + Number(hasKeyFindings) + Number(hasActions)) / 4;

    return {
      type: 'completeness',
      score,
      details: { hasSummary, hasDeepDive, hasKeyFindings, hasActions },
      passed: score >= 0.75,
    };
  }

  private evaluateAgreement(critiqueResult: CritiqueResult): EvaluationResult {
    const totalClaims = critiqueResult.acceptedClaims.length + critiqueResult.rejectedClaims.length;
    const acceptanceRate = totalClaims > 0 ? critiqueResult.acceptedClaims.length / totalClaims : 0;

    const contradictionPenalty = critiqueResult.contradictions.length * 0.15;
    const score = Math.max(0, acceptanceRate - contradictionPenalty);

    return {
      type: 'agreement',
      score,
      details: {
        accepted: critiqueResult.acceptedClaims.length,
        rejected: critiqueResult.rejectedClaims.length,
        contradictions: critiqueResult.contradictions.length,
      },
      passed: score >= 0.5,
    };
  }

  private evaluateConfidence(synthesisResult: SynthesisResult, critiqueResult: CritiqueResult): EvaluationResult {
    const confidenceMatch = Math.abs(synthesisResult.confidence - critiqueResult.overallConfidence);
    const score = 1 - confidenceMatch;

    return {
      type: 'hallucination',
      score,
      details: {
        synthesisConfidence: synthesisResult.confidence,
        critiqueConfidence: critiqueResult.overallConfidence,
        difference: confidenceMatch,
      },
      passed: score >= 0.8,
    };
  }
}
