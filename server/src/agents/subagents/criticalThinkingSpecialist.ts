/**
 * Critical Thinking Specialist Agent - Human-Like Critical Analysis
 *
 * This agent simulates how a human thinker critically analyzes information:
 *  - Questions assumptions and biases
 *  - Evaluates evidence quality
 *  - Identifies logical fallacies
 *  - Considers alternative perspectives
 *  - Weighs pros and cons objectively
 *
 * Inspired by:
 *  - Critical thinking theory (Ennis, Paul)
 *  - Cognitive bias awareness
 *  - Argument mapping and evaluation
 */

import { llmService } from '../../services/llm';
import { prisma } from '../../services/prisma';
import { v4 as uuid } from 'uuid';

// ─── Critical Thinking Types ────────────────────────────────────────────────────

export type BiasType = 'confirmation' | 'availability' | 'anchoring' | 'dunningKruger' | 'bandwagon' | 'framing' | 'sunkCost' | 'none';
export type FallacyType = 'adHominem' | 'strawMan' | 'falseDilemma' | 'slipperySlope' | 'appealToAuthority' | 'circular' | 'noTrueScotsman' | 'appealToIgnorance' | 'none';

export interface Claim {
  id: string;
  statement: string;
  evidence?: string;
  confidence: number;
  context?: string;
}

export interface CriticalAnalysis {
  claim: Claim;
  biasesDetected: Array<{
    type: BiasType;
    description: string;
    severity: number; // 0-1
    mitigation: string;
  }>;
  fallaciesDetected: Array<{
    type: FallacyType;
    description: string;
    severity: number;
    correction: string;
  }>;
  evidenceQuality: {
    score: number; // 0-1
    issues: string[];
    recommendations: string[];
  };
  alternativePerspectives: string[];
  logicalSoundness: number; // 0-1
  overallEvaluation: 'strong' | 'moderate' | 'weak' | 'flawed';
  recommendations: string[];
}

export interface AnalysisState {
  thoroughness: 'surface' | 'moderate' | 'deep';
  biasAwareness: number; // 0-1
  confidence: number;
  questionsRaised: string[];
}

// ─── CriticalThinkingSpecialist Class ──────────────────────────────────────────

export class CriticalThinkingSpecialist {
  private userId: string;
  private sessionId: string;
  private taskId: string;

  constructor(userId: string, sessionId: string, taskId: string) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  /**
   * Main critical analysis function
   */
  async analyze(request: {
    claim: Claim;
    context?: string;
    alternativeViews?: string[];
  }): Promise<CriticalAnalysis> {
    console.log(`[CriticalThinkingSpecialist] 🤔 Analyzing claim: "${request.claim.statement.substring(0, 50)}..."`);

    // Initialize analysis state
    const initialState: AnalysisState = {
      thoroughness: 'deep',
      biasAwareness: 0.5,
      confidence: 0.5,
      questionsRaised: [],
    };

    // Phase 1: Initial assessment
    console.log('[CriticalThinkingSpecialist] Phase 1: Initial assessment...');
    const initialAssessment = await this.assessInitial(request);
    initialState.questionsRaised = initialAssessment.questions;
    initialState.confidence = initialAssessment.confidence;

    // Phase 2: Bias detection
    console.log('[CriticalThinkingSpecialist] Phase 2: Detecting cognitive biases...');
    const biases = await this.detectBiases(request, initialState);
    initialState.biasAwareness += biases.biases.length * 0.1;

    // Phase 3: Fallacy detection
    console.log('[CriticalThinkingSpecialist] Phase 3: Detecting logical fallacies...');
    const fallacies = await this.detectFallacies(request, biases);
    initialState.questionsRaised.push(...fallacies.questions);

    // Phase 4: Evidence evaluation
    console.log('[CriticalThinkingSpecialist] Phase 4: Evaluating evidence...');
    const evidenceQuality = await this.evaluateEvidence(request.claim, fallacies);

    // Phase 5: Alternative perspectives
    console.log('[CriticalThinkingSpecialist] Phase 5: Considering alternatives...');
    const perspectives = await this.identifyPerspectives(request);

    // Phase 6: Final synthesis
    console.log('[CriticalThinkingSpecialist] Phase 6: Synthesizing analysis...');
    const analysis = this.synthesizeAnalysis(request.claim, biases, fallacies, evidenceQuality, perspectives, initialState);

    // Store analysis in memory
    await this.storeAnalysisMemory(analysis, request);

    return analysis;
  }

  /**
   * Perform initial assessment
   */
  private async assessInitial(request: any): Promise<{
    questions: string[];
    confidence: number;
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a critical thinking analyst. Given a claim, identify:
1. Key assumptions underlying the claim
2. Questions that should be asked
3. Initial confidence level (0-1)

Return JSON with questions (array) and confidence (0-1).`,
      },
      {
        role: 'user' as const,
        content: `Claim: "${request.claim.statement}"

${request.context ? `Context: ${request.context}` : ''}`,
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
        questions: ['What is the evidence?', 'Who says?', 'Is this always true?'],
        confidence: 0.7,
      };
    }
  }

  /**
   * Detect cognitive biases
   */
  private async detectBiases(request: any, state: AnalysisState): Promise<{
    biases: Array<{
      type: BiasType;
      description: string;
      severity: number;
      mitigation: string;
    }>;
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a bias detection expert. Identify cognitive biases in the claim.

Common biases to look for:
1. Confirmation bias - favoring info that confirms beliefs
2. Availability heuristic - overestimating based on easy recall
3. Anchoring - over-relying on first information
4. Dunning-Kruger - overconfidence in unfamiliar areas
5. Bandwagon - believing because others do
6. Framing - influenced by presentation
7. Sunk cost - continuing due to past investment

Return JSON with biases array containing: type, description, severity (0-1), mitigation strategy.`,
      },
      {
        role: 'user' as const,
        content: `Claim: "${request.claim.statement}"
Evidence: ${request.claim.evidence || 'none'}`,
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
      return { biases: [] };
    }
  }

  /**
   * Detect logical fallacies
   */
  private async detectFallacies(request: any, biasResult: any): Promise<{
    fallacies: Array<{
      type: FallacyType;
      description: string;
      severity: number;
      correction: string;
    }>;
    questions: string[];
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a logic expert. Identify logical fallacies in the claim.

Common fallacies:
1. Ad hominem - attacking person not argument
2. Straw man - misrepresenting to discredit
3. False dilemma - only two options when more exist
4. Slippery slope - exaggerated consequences
5. Appeal to authority - citing authority incorrectly
6. Circular - conclusion in premise
7. No true Scotsman - moving goalposts
8. Appeal to ignorance - absence of evidence

Return JSON with: fallacies array (type, description, severity, correction) and questions array (skeptical questions).`,
      },
      {
        role: 'user' as const,
        content: `Claim: "${request.claim.statement}"
Context: ${request.context || 'none'}

${biasResult.biases?.length ? `Biases detected: ${biasResult.biases.map((b: any) => b.type).join(', ')}` : ''}`,
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
      return {
        fallacies: [],
        questions: ['What evidence supports this?', 'Could this be wrong?', 'What would disprove it?'],
      };
    }
  }

  /**
   * Evaluate evidence quality
   */
  private async evaluateEvidence(claim: Claim, fallacyResult: any): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `Evaluate the quality of evidence supporting this claim.

Consider:
1. Source reliability
2. Evidence sufficiency
3. Relevance to claim
4. Potential bias in sources
5. Statistical validity

Return JSON with: score (0-1), issues (array), recommendations (array).`,
      },
      {
        role: 'user' as const,
        content: `Claim: "${claim.statement}"
Evidence: ${claim.evidence || 'none provided'}`,
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
        score: 0.5,
        issues: ['Evidence quality unknown'],
        recommendations: ['Seek primary sources', 'Verify statistics'],
      };
    }
  }

  /**
   * Identify alternative perspectives
   */
  private async identifyPerspectives(request: any): Promise<string[]> {
    // Check for provided alternative views
    if (request.alternativeViews && request.alternativeViews.length > 0) {
      return request.alternativeViews.slice(0, 3);
    }

    const messages = [
      {
        role: 'system' as const,
        content: `Identify 2-3 reasonable alternative perspectives on this topic.

Each perspective should:
1. Be credible and well-reasoned
2. Offer a different viewpoint
3. Have valid reasoning behind it

Return as JSON array of perspective descriptions.`,
      },
      {
        role: 'user' as const,
        content: `Claim: "${request.claim.statement}"`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 500,
        temperature: 0.6,
        model: 'gpt-4o-mini',
      });
      return JSON.parse(response.content);
    } catch {
      return ['Different interpretation of the same facts', 'Based on different values or priorities', 'From a different cultural or disciplinary perspective'];
    }
  }

  /**
   * Synthesize the complete analysis
   */
  private synthesizeAnalysis(
    claim: Claim,
    biases: any,
    fallacies: any,
    evidenceQuality: any,
    perspectives: string[],
    state: AnalysisState
  ): CriticalAnalysis {
    // Calculate overall soundness
    let soundness = 1.0;
    soundness -= biases.biases.reduce((sum: number, b: any) => sum + b.severity * 0.15, 0);
    soundness -= fallacies.fallacies.reduce((sum: number, f: any) => sum + f.severity * 0.2, 0);
    soundness *= evidenceQuality.score;
    soundness = Math.max(0, Math.min(1, soundness));

    // Determine overall evaluation
    let evaluation: CriticalAnalysis['overallEvaluation'] = 'moderate';
    if (soundness > 0.7 && evidenceQuality.score > 0.6) {
      evaluation = 'strong';
    } else if (soundness < 0.4 || evidenceQuality.score < 0.4) {
      evaluation = 'flawed';
    } else if (soundness < 0.6) {
      evaluation = 'weak';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(biases, fallacies, evidenceQuality, evaluation);

    return {
      claim,
      biasesDetected: biases.biases || [],
      fallaciesDetected: fallacies.fallacies || [],
      evidenceQuality,
      alternativePerspectives: perspectives,
      logicalSoundness: soundness,
      overallEvaluation: evaluation,
      recommendations,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(biases: any, fallacies: any, evidenceQuality: any, evaluation: string): string[] {
    const recommendations: string[] = [];

    if (biases.biases && biases.biases.length > 0) {
      recommendations.push('Be aware of identified cognitive biases');
      recommendations.push('Seek disconfirming evidence');
    }

    if (fallacies.fallacies && fallacies.fallacies.length > 0) {
      recommendations.push('Review argument structure for logical consistency');
      recommendations.push('Avoid common fallacy patterns');
    }

    if (evaluation === 'flawed') {
      recommendations.push('Consider this claim skeptical until verified');
      recommendations.push('Look for stronger evidence');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring for new evidence');
      recommendations.push('Update position as more information becomes available');
    }

    return recommendations;
  }

  /**
   * Store analysis in memory
   */
  private async storeAnalysisMemory(analysis: CriticalAnalysis, request: any): Promise<void> {
    try {
      const analysisId = uuid();

      await prisma.agentTask.create({
        data: {
          sessionId: this.sessionId,
          type: 'critical_analysis',
          agentName: 'CriticalThinkingSpecialist',
          status: 'completed',
          input: { claimLength: request.claim.statement.length } as any,
          output: {
            evaluation: analysis.overallEvaluation,
            biasCount: analysis.biasesDetected.length,
            fallacyCount: analysis.fallaciesDetected.length,
          } as any,
          cost: 0.0002,
        },
      });

      // Store analysis as knowledge
      await prisma.knowledgeNode.upsert({
        where: { id: `analysis_${this.userId}_${analysisId}` },
        update: {},
        create: {
          id: `analysis_${this.userId}_${analysisId}`,
          type: 'analysis',
          name: `Analysis: ${request.claim.statement.substring(0, 30)}...`,
          description: `Evaluation: ${analysis.overallEvaluation}. ${analysis.biasesDetected.length} biases, ${analysis.fallaciesDetected.length} fallacies detected.`,
          properties: {
            soundness: analysis.logicalSoundness,
            evaluation: analysis.overallEvaluation,
            biasAwareness: true,
          } as any,
        },
      });
    } catch (err) {
      console.warn('[CriticalThinkingSpecialist] Could not store memory:', err);
    }
  }

  /**
   * Analyze a set of related claims
   */
  async analyzeMultiple(claims: Claim[], context?: string): Promise<{
    analyses: CriticalAnalysis[];
    patterns: {
      recurringBiases: string[];
      recurringFallacies: string[];
      consistentEvaluations: boolean;
    };
  }> {
    const analyses = await Promise.all(
      claims.map(c => this.analyze({ claim: c, context }))
    );

    // Find patterns
    const recurringBiases: string[] = [];
    const recurringFallacies: string[] = [];

    for (const analysis of analyses) {
      for (const bias of analysis.biasesDetected) {
        recurringBiases.push(bias.type);
      }
      for (const fallacy of analysis.fallaciesDetected) {
        recurringFallacies.push(fallacy.type);
      }
    }

    return {
      analyses,
      patterns: {
        recurringBiases: [...new Set(recurringBiases)],
        recurringFallacies: [...new Set(recurringFallacies)],
        consistentEvaluations: this.checkConsistency(analyses),
      },
    };
  }

  /**
   * Check consistency across multiple analyses
   */
  private checkConsistency(analyses: CriticalAnalysis[]): boolean {
    if (analyses.length < 2) return true;

    const evaluations = analyses.map(a => a.overallEvaluation);
    const uniqueEvaluations = new Set(evaluations);

    // If more than 2 different evaluations, patterns may be inconsistent
    return uniqueEvaluations.size <= 2;
  }
}
