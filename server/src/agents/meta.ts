import type { EvaluationResult, SynthesisResult, CritiqueResult } from '../types';
import { prisma } from '../services/prisma';
import { Prisma } from '@prisma/client';

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
    const evaluations: EvaluationResult[] = [];

    evaluations.push(this.evaluateCompleteness(synthesisResult, query));
    evaluations.push(this.evaluateAgreement(critiqueResult));
    evaluations.push(this.evaluateConfidence(synthesisResult, critiqueResult));

    const overallScore = evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length;
    const passed = overallScore >= 0.7;

    const finalEvaluation: EvaluationResult = {
      type: 'completeness',
      score: overallScore,
      details: {
        evaluations: evaluations.map(e => ({ type: e.type, score: e.score, passed: e.passed })),
        query,
      },
      passed,
      recommendations: passed ? undefined : ['Improve source quality', 'Add more verification', 'Resolve contradictions'],
    };

    await prisma.evaluation.create({
      data: {
        sessionId: this.sessionId,
        type: 'completeness',
        score: finalEvaluation.score,
        details: finalEvaluation.details as unknown as Prisma.InputJsonValue,
        passed: finalEvaluation.passed,
      },
    });

    await prisma.agentTask.update({
      where: { id: this.taskId },
      data: { status: 'completed', output: finalEvaluation as unknown as Prisma.InputJsonValue },
    });

    return finalEvaluation;
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
