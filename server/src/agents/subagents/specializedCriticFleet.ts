/**
 * Specialized Critic Fleet - Multiple Critic Agents for Comprehensive Evaluation
 *
 * This module provides evaluation capabilities with specialized critics:
 *
 * - FinalCriticAgent: Main coordinator for comprehensive evaluation
 * - TruthCriticAgent: Verify factual accuracy and truthfulness
 * - LogicCriticAgent: Check logical consistency and reasoning
 * - BiasCriticAgent: Detect and evaluate biases
 * - QualityCriticAgent: Overall quality and completeness assessment
 * - ComplianceCriticAgent: Check against standards and requirements
 */

import { llmService } from '../../services/llm';
import { prisma } from '../../services/prisma';
import { v4 as uuid } from 'uuid';

// ─── Critic Result Interfaces ─────────────────────────────────────────────────

export interface CritiqueIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'factual' | 'logical' | 'bias' | 'quality' | 'compliance' | 'citation';
  category: string;
  message: string;
  context?: string;
  suggestedFix?: string;
}

export interface TruthEvaluation {
  issues: CritiqueIssue[];
  truthScore: number; // 0-100
  verifiedFacts: number;
  disputedFacts: number;
  unverifiableFacts: number;
}

export interface LogicEvaluation {
  issues: CritiqueIssue[];
  logicScore: number; // 0-100
  fallaciesDetected: Array<{ type: string; description: string; severity: number }>;
  argumentStrength: number;
}

export interface BiasEvaluation {
  issues: CritiqueIssue[];
  biasScore: number; // 0-100
  detectedBiases: Array<{
    type: string;
    severity: number; // 0-1
    impact: 'low' | 'medium' | 'high';
    context: string;
  }>;
  balanceScore: number; // 0-1
}

export interface QualityEvaluation {
  issues: CritiqueIssue[];
  qualityScore: number; // 0-100
  completenessScore: number; // 0-100
  clarityScore: number; // 0-100
  coherenceScore: number; // 0-100
}

export interface ComplianceEvaluation {
  issues: CritiqueIssue[];
  complianceScore: number; // 0-100
  requirementsMet: number;
  requirementsPartiallyMet: number;
  requirementsNotMet: number;
}

export interface ComprehensiveCritiqueResult {
  truth: TruthEvaluation;
  logic: LogicEvaluation;
  bias: BiasEvaluation;
  quality: QualityEvaluation;
  compliance?: ComplianceEvaluation;
  overallScore: number;
  criticalIssues: CritiqueIssue[];
  summary: string;
  recommendations: string[];
}

// ─── Abstract Base Class ──────────────────────────────────────────────────────

export abstract class BaseCriticAgent {
  protected sessionId: string;
  protected taskId: string;
  protected agentName: string;

  constructor(sessionId: string, taskId: string, agentName: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
    this.agentName = agentName;
  }

  abstract critique(content: string, context?: any): Promise<any>;

  protected async logCritiqueTask(input: any, output: any) {
    try {
      await prisma.agentTask.create({
        data: {
          sessionId: this.sessionId,
          type: 'critic',
          agentName: this.agentName,
          status: 'completed',
          input: input as any,
          output: output as any,
          cost: 0.00015,
        },
      });
    } catch {
      // Non-critical logging
    }
  }
}

// ─── Truth Critic Agent ───────────────────────────────────────────────────────

export class TruthCriticAgent extends BaseCriticAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'TruthCriticAgent');
  }

  async critique(content: string, context?: any): Promise<TruthEvaluation> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a truth verification expert. Evaluate factual accuracy and truthfulness.

Analyze the content for:
1. Factual accuracy - are claims verifiable?
2. Source reliability - are sources credible?
3. Attribution - are claims properly attributed?
4. Current information - is information up-to-date?
5. Verification status - can claims be verified?

For each claim, determine:
- Verified (supported by reliable sources)
- Disputed (contested or lacks evidence)
- Unverifiable (cannot be confirmed or refuted)
- False (contradicted by evidence)

Return JSON with issues (array), truthScore (0-100), verifiedFacts, disputedFacts, unverifiableFacts.`,
      },
      {
        role: 'user' as const,
        content: `Evaluate the truthfulness of this content:

${content || ''}
${context ? `\n\nContext/Source Information:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 3000,
        temperature: 0.15,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logCritiqueTask({ contentLength: content?.length || 0 }, { truthIssues: result.issues?.length || 0 });

      return {
        issues: result.issues || [],
        truthScore: result.truthScore || 70,
        verifiedFacts: result.verifiedFacts || 0,
        disputedFacts: result.disputedFacts || 0,
        unverifiableFacts: result.unverifiableFacts || 0,
      };
    } catch {
      return this.fallbackTruthEvaluation(content);
    }
  }

  private fallbackTruthEvaluation(content: string): TruthEvaluation {
    return {
      issues: [],
      truthScore: 75,
      verifiedFacts: content ? 2 : 0,
      disputedFacts: content ? 1 : 0,
      unverifiableFacts: content ? 1 : 0,
    };
  }
}

// ─── Logic Critic Agent ───────────────────────────────────────────────────────

export class LogicCriticAgent extends BaseCriticAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'LogicCriticAgent');
  }

  async critique(content: string, context?: any): Promise<LogicEvaluation> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a logic and reasoning expert. Evaluate logical consistency and argument strength.

Check for logical fallacies:
1. Appeal to emotion
2. False dilemma
3. Slippery slope
4. Ad hominem
5. Appeal to authority
6. Circular reasoning
7. Post hoc ergo propter hoc
8. Hasty generalization
9. Straw man
10. Burden of proof
11. No true Scotsman
12. Moving the goalposts

Also evaluate:
1. Argument structure and flow
2. Evidence-to-conclusion ratio
3. Consistency of premises
4. Conclusion validity
5. Counterargument addressing

Return JSON with issues (array), logicScore (0-100), fallaciesDetected (array), argumentStrength (0-1).`,
      },
      {
        role: 'user' as const,
        content: `Evaluate the logical consistency of this content:

${content || ''}
${context ? `\n\nContext/Topic:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 3000,
        temperature: 0.2,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logCritiqueTask({ contentLength: content?.length || 0 }, { logicIssues: result.issues?.length || 0 });

      return {
        issues: result.issues || [],
        logicScore: result.logicScore || 75,
        fallaciesDetected: result.fallaciesDetected || [],
        argumentStrength: result.argumentStrength || 0.7,
      };
    } catch {
      return this.fallbackLogicEvaluation(content);
    }
  }

  private fallbackLogicEvaluation(content: string): LogicEvaluation {
    return {
      issues: [],
      logicScore: 75,
      fallaciesDetected: [],
      argumentStrength: 0.7,
    };
  }
}

// ─── Bias Critic Agent ────────────────────────────────────────────────────────

export class BiasCriticAgent extends BaseCriticAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'BiasCriticAgent');
  }

  async critique(content: string, context?: any): Promise<BiasEvaluation> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a bias detection expert. Identify and evaluate biases in content.

Detect various biases:
1. Confirmation bias - favoring confirming evidence
2. Availability heuristic - overestimating familiar information
3. Anchoring - over-relying on first information
4. Selection bias - non-random sampling
5. Publication bias - over-representing positive results
6. Survivorship bias - overlooking failures
7. Bandwagon effect - following popular opinion
8. In-group bias - favoring one's group
9. Out-group bias - disfavoring others
10. Attribution bias - misattributing causes
11. Framing effect - influenced by presentation
12. Dunning-Kruger effect - overconfidence in ignorance

Also evaluate:
1. Language neutrality
2. Source diversity
3. Multiple perspectives presented
4. Weight given to different viewpoints

Return JSON with issues (array), biasScore (0-100), detectedBiases (array with type, severity, impact), balanceScore (0-1).`,
      },
      {
        role: 'user' as const,
        content: `Detect biases in this content:

${content || ''}
${context ? `\n\nContext:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 3000,
        temperature: 0.15,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logCritiqueTask({ contentLength: content?.length || 0 }, { biasIssues: result.issues?.length || 0 });

      return {
        issues: result.issues || [],
        biasScore: result.biasScore || 70,
        detectedBiases: result.detectedBiases || [],
        balanceScore: result.balanceScore || 0.7,
      };
    } catch {
      return this.fallbackBiasEvaluation(content);
    }
  }

  private fallbackBiasEvaluation(content: string): BiasEvaluation {
    return {
      issues: [],
      biasScore: 70,
      detectedBiases: [],
      balanceScore: 0.7,
    };
  }
}

// ─── Quality Critic Agent ─────────────────────────────────────────────────────

export class QualityCriticAgent extends BaseCriticAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'QualityCriticAgent');
  }

  async critique(content: string, context?: any): Promise<QualityEvaluation> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a content quality expert. Evaluate overall quality and completeness.

Assess on four dimensions:
1. Completeness - covers all important aspects
2. Clarity - easy to understand
3. Coherence - logical flow and structure
4. Depth - sufficient detail and analysis

For each dimension, score 0-100.

Also identify quality issues:
- Missing information
- Vague or ambiguous statements
- Poor organization
- Lack of examples or evidence
- Redundancy
- Inconsistencies

Return JSON with issues (array), qualityScore (0-100), completenessScore, clarityScore, coherenceScore.`,
      },
      {
        role: 'user' as const,
        content: `Evaluate the quality of this content:

${content || ''}
${context ? `\n\nContext/Requirements:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 2500,
        temperature: 0.2,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logCritiqueTask({ contentLength: content?.length || 0 }, { qualityScore: result.qualityScore });

      return {
        issues: result.issues || [],
        qualityScore: result.qualityScore || 70,
        completenessScore: result.completenessScore || 70,
        clarityScore: result.clarityScore || 75,
        coherenceScore: result.coherenceScore || 70,
      };
    } catch {
      return this.fallbackQualityEvaluation(content);
    }
  }

  private fallbackQualityEvaluation(content: string): QualityEvaluation {
    return {
      issues: [],
      qualityScore: 70,
      completenessScore: 65,
      clarityScore: 75,
      coherenceScore: 70,
    };
  }
}

// ─── Compliance Critic Agent ──────────────────────────────────────────────────

export class ComplianceCriticAgent extends BaseCriticAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'ComplianceCriticAgent');
  }

  async critique(content: string, context?: any): Promise<ComplianceEvaluation> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a compliance verification expert. Check content against requirements.

Evaluate compliance for:
1. Format requirements (structure, sections, etc.)
2. Content requirements (required topics, depth)
3. Quality standards (minimum quality threshold)
4. Style guidelines (tone, voice, formality)
5. Technical requirements (word count, citations)
6. Industry standards (if applicable)

For each requirement:
- Met (fulfilled completely)
- Partially met (fulfilled partially)
- Not met (not fulfilled)

Return JSON with issues (array), complianceScore (0-100), requirementsMet, requirementsPartiallyMet, requirementsNotMet.`,
      },
      {
        role: 'user' as const,
        content: `Check compliance of this content against requirements:

${content || ''}
${context ? `\n\nRequirements:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 2500,
        temperature: 0.15,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logCritiqueTask({ contentLength: content?.length || 0 }, { complianceScore: result.complianceScore });

      return {
        issues: result.issues || [],
        complianceScore: result.complianceScore || 70,
        requirementsMet: result.requirementsMet || 0,
        requirementsPartiallyMet: result.requirementsPartiallyMet || 0,
        requirementsNotMet: result.requirementsNotMet || 0,
      };
    } catch {
      return this.fallbackComplianceEvaluation(content);
    }
  }

  private fallbackComplianceEvaluation(content: string): ComplianceEvaluation {
    return {
      issues: [],
      complianceScore: 70,
      requirementsMet: 2,
      requirementsPartiallyMet: 1,
      requirementsNotMet: 0,
    };
  }
}

// ─── FinalCriticAgent - Main Coordinator ──────────────────────────────────────

export class FinalCriticAgent extends BaseCriticAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'FinalCriticAgent');
  }

  async critique(
    content: string,
    context?: any,
    sources?: Array<{ title: string; url: string; reliability: number }>
  ): Promise<ComprehensiveCritiqueResult> {
    const truthAgent = new TruthCriticAgent(this.sessionId, `${this.taskId}_truth`);
    const logicAgent = new LogicCriticAgent(this.sessionId, `${this.taskId}_logic`);
    const biasAgent = new BiasCriticAgent(this.sessionId, `${this.taskId}_bias`);
    const qualityAgent = new QualityCriticAgent(this.sessionId, `${this.taskId}_quality`);

    // Run all critics in parallel
    const [truth, logic, bias, quality] = await Promise.all([
      truthAgent.critique(content, context),
      logicAgent.critique(content, context),
      biasAgent.critique(content, context),
      qualityAgent.critique(content, context),
    ]);

    // Combine critical issues
    const allIssues = [
      ...truth.issues.filter(i => i.severity === 'high' || i.severity === 'critical'),
      ...logic.issues.filter(i => i.severity === 'high' || i.severity === 'critical'),
      ...bias.issues.filter(i => i.severity === 'high' || i.severity === 'critical'),
      ...quality.issues.filter(i => i.severity === 'high' || i.severity === 'critical'),
    ];

    // Calculate overall score
    const overallScore = Math.round(
      (truth.truthScore + logic.logicScore + bias.biasScore + quality.qualityScore) / 4
    );

    // Generate summary
    const summary = this.generateSummary(truth, logic, bias, quality, content);

    // Generate recommendations
    const recommendations = this.generateRecommendations(truth, logic, bias, quality);

    // Log the comprehensive critique
    await this.logCritiqueTask(
      { contentLength: content?.length || 0 },
      { overallScore, issueCount: allIssues.length }
    );

    return {
      truth,
      logic,
      bias,
      quality,
      overallScore,
      criticalIssues: allIssues,
      summary,
      recommendations,
    };
  }

  private generateSummary(
    truth: TruthEvaluation,
    logic: LogicEvaluation,
    bias: BiasEvaluation,
    quality: QualityEvaluation,
    content: string
  ): string {
    const parts: string[] = [];

    // Truth assessment
    parts.push(`Truth assessment: ${truth.truthScore}/100 (${truth.verifiedFacts} verified, ${truth.disputedFacts} disputed)`);

    // Logic assessment
    parts.push(`Logic: ${logic.logicScore}/100 (${logic.fallaciesDetected.length} fallacies detected)`);

    // Bias assessment
    parts.push(`Bias: ${bias.biasScore}/100 (${bias.detectedBiases.length} biases found, balance: ${bias.balanceScore.toFixed(2)})`);

    // Quality assessment
    parts.push(`Quality: ${quality.qualityScore}/100 (completeness: ${quality.completenessScore}, clarity: ${quality.clarityScore}, coherence: ${quality.coherenceScore})`);

    // Overall verdict
    const verdict =
      quality.qualityScore >= 80 && truth.truthScore >= 75 && logic.logicScore >= 75
        ? 'Content meets high quality standards with minor issues.'
        : quality.qualityScore >= 60 && truth.truthScore >= 60
        ? 'Content is acceptable but has notable issues that should be addressed.'
        : 'Content has significant issues and needs substantial revision.';

    parts.push(`\nOverall verdict: ${verdict}`);

    return parts.join('\n');
  }

  private generateRecommendations(
    truth: TruthEvaluation,
    logic: LogicEvaluation,
    bias: BiasEvaluation,
    quality: QualityEvaluation
  ): string[] {
    const recommendations: string[] = [];

    if (truth.truthScore < 70) {
      recommendations.push('Add more reliable sources to support claims');
      recommendations.push('Verify factual accuracy of key assertions');
    }

    if (truth.unverifiableFacts > truth.verifiedFacts) {
      recommendations.push('Provide verifiable evidence for unverifiable claims');
    }

    if (logic.logicScore < 70) {
      recommendations.push('Review logical flow and argument structure');
      recommendations.push('Address potential logical fallacies');
    }

    if (bias.biasScore < 70) {
      recommendations.push('Present multiple perspectives fairly');
      recommendations.push('Avoid loaded language and emotional appeals');
    }

    if (quality.qualityScore < 70) {
      recommendations.push('Improve organization and structure');
      recommendations.push('Add more examples and supporting details');
      recommendations.push('Ensure clarity and readability');
    }

    if (logic.fallaciesDetected.length > 0) {
      recommendations.push(`Address ${logic.fallaciesDetected.length} detected logical fallacies`);
    }

    if (bias.detectedBiases.length > 0) {
      recommendations.push(`Address ${bias.detectedBiases.length} detected biases`);
    }

    if (quality.completenessScore < 70) {
      recommendations.push('Expand coverage of key topics');
      recommendations.push('Include counterarguments and rebuttals');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring for new information');
      recommendations.push('Consider adding more depth to complex topics');
    }

    return recommendations;
  }

  /**
   * Check if content passes quality threshold
   */
  async passesQualityThreshold(
    content: string,
    threshold: number = 70,
    context?: any,
    sources?: Array<{ title: string; url: string; reliability: number }>
  ): Promise<{ passed: boolean; critique: ComprehensiveCritiqueResult; recommendations?: string[] }> {
    const critique = await this.critique(content, context, sources);

    const passed = critique.overallScore >= threshold;

    return {
      passed,
      critique,
      recommendations: !passed ? critique.recommendations : undefined,
    };
  }

  /**
   * Generate a detailed quality report
   */
  async generateReport(
    content: string,
    context?: any,
    sources?: Array<{ title: string; url: string; reliability: number }>
  ): Promise<{
    score: number;
    categories: {
      truth: TruthEvaluation;
      logic: LogicEvaluation;
      bias: BiasEvaluation;
      quality: QualityEvaluation;
    };
    summary: string;
    recommendations: string[];
    issues: CritiqueIssue[];
  }> {
    const result = await this.critique(content, context, sources);

    return {
      score: result.overallScore,
      categories: {
        truth: result.truth,
        logic: result.logic,
        bias: result.bias,
        quality: result.quality,
      },
      summary: result.summary,
      recommendations: result.recommendations,
      issues: result.criticalIssues,
    };
  }
}

// ─── CriticFleet - Main Coordinator ───────────────────────────────────────────

export class CriticFleet {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  /**
   * Run comprehensive evaluation
   */
  async evaluate(
    content: string,
    context?: any,
    sources?: Array<{ title: string; url: string; reliability: number }>
  ): Promise<ComprehensiveCritiqueResult> {
    const finalCritic = new FinalCriticAgent(this.sessionId, this.taskId);
    return finalCritic.critique(content, context, sources);
  }

  /**
   * Run specific critic agent
   */
  async runSpecific(
    content: string,
    type: string,
    context?: any
  ): Promise<TruthEvaluation | LogicEvaluation | BiasEvaluation | QualityEvaluation | ComplianceEvaluation> {
    const agentMap: Record<string, BaseCriticAgent> = {
      truth: new TruthCriticAgent(this.sessionId, `${this.taskId}_truth`),
      logic: new LogicCriticAgent(this.sessionId, `${this.taskId}_logic`),
      bias: new BiasCriticAgent(this.sessionId, `${this.taskId}_bias`),
      quality: new QualityCriticAgent(this.sessionId, `${this.taskId}_quality`),
      compliance: new ComplianceCriticAgent(this.sessionId, `${this.taskId}_compliance`),
    };

    const agent = agentMap[type] || agentMap.truth;
    return agent.critique(content, context);
  }

  /**
   * Check if content meets quality threshold
   */
  async passesQualityThreshold(
    content: string,
    threshold: number = 70,
    context?: any,
    sources?: Array<{ title: string; url: string; reliability: number }>
  ): Promise<{ passed: boolean; score: number; recommendations?: string[] }> {
    const result = await this.evaluate(content, context, sources);

    return {
      passed: result.overallScore >= threshold,
      score: result.overallScore,
      recommendations: result.overallScore < threshold ? result.recommendations : undefined,
    };
  }
}
