/**
 * Code Review Specialist Agent - Human-Like Code Review
 *
 * This agent simulates how a human developer reviews code:
 *  - Reviews holistically first, then details
 *  - Considers context and intent
 *  - Balances constructive feedback with positivity
 *  - Identifies both technical issues and design concerns
 *  - Suggests practical improvements
 *
 * Inspired by:
 *  - Code review best practices (Google, Microsoft)
 *  - Psychological safety in feedback
 *  - Technical debt identification
 */

import { llmService } from '../../services/llm';
import { prisma } from '../../services/prisma';
import { v4 as uuid } from 'uuid';

// ─── Code Review Types ─────────────────────────────────────────────────────────

export type ReviewFocus = 'bugs' | 'style' | 'performance' | 'security' | 'best-practices' | 'design' | 'test-coverage';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'suggestion';

export interface ReviewIssue {
  id: string;
  severity: Severity;
  type: ReviewFocus;
  location: {
    file?: string;
    line?: number;
    context?: string;
  };
  description: string;
  impact: string;
  suggestion: string;
  codeExample?: string;
}

export interface CodeReviewResult {
  overallScore: number;     // 0-100
  reviewQuality: number;    // how thorough was the review
  issues: ReviewIssue[];
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  reviewState: ReviewState;
}

export interface ReviewState {
  scope: 'quick' | 'thorough' | 'deep';
  confidence: number;
  issuesFound: number;
  timeSpent: string;        // 'quick' | 'thorough' | 'extended'
}

// ─── CodeReviewSpecialist Class ────────────────────────────────────────────────

export class CodeReviewSpecialist {
  private userId: string;
  private sessionId: string;
  private taskId: string;

  constructor(userId: string, sessionId: string, taskId: string) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  /**
   * Main code review function - simulates human code review
   */
  async review(request: {
    code: string;
    language?: string;
    context?: string;
    focusAreas?: ReviewFocus[];
  }): Promise<CodeReviewResult> {
    console.log(`[CodeReviewSpecialist] 👁️ Reviewing code (${request.language || 'unknown'}): ${request.code.substring(0, 50)}...`);

    // Phase 1: Quick scan
    console.log('[CodeReviewSpecialist] Phase 1: Quick scan...');
    const quickScan = await this.performQuickScan(request);
    const reviewState: ReviewState = {
      scope: 'thorough',
      confidence: 0.6,
      issuesFound: 0,
      timeSpent: 'thorough',
    };

    // Phase 2: Detailed analysis
    console.log('[CodeReviewSpecialist] Phase 2: Detailed analysis...');
    const detailedIssues = await this.analyzeDetailed(request, quickScan);
    reviewState.issuesFound = detailedIssues.issues.length;

    // Phase 3: Strengths identification
    console.log('[CodeReviewSpecialist] Phase 3: Identifying strengths...');
    const strengths = await this.identifyStrengths(request, detailedIssues);

    // Phase 4: Synthesize review
    console.log('[CodeReviewSpecialist] Phase 4: Synthesizing review...');
    const review = this.synthesizeReview(detailedIssues, strengths, reviewState);

    // Store review in memory
    await this.storeReviewMemory(review, request);

    return review;
  }

  /**
   * Perform a quick initial scan
   */
  private async performQuickScan(request: any): Promise<{
    syntaxErrors: string[];
    structuralIssues: string[];
    obviousProblems: string[];
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `Perform a quick scan of this ${request.language || 'code'} for obvious issues.

Look for:
1. Syntax errors (missing brackets, semicolons, etc.)
2. Structural issues (inconsistent indentation, naming)
3. Obvious problems (TODOs, hardcoded secrets, console.logs in production)

Return JSON with syntaxErrors, structuralIssues, and obviousProblems (arrays).`,
      },
      {
        role: 'user' as const,
        content: request.code.substring(0, 1000),
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 500,
        temperature: 0.2,
        model: 'gpt-4o-mini',
      });
      return JSON.parse(response.content);
    } catch {
      return {
        syntaxErrors: [],
        structuralIssues: [],
        obviousProblems: [],
      };
    }
  }

  /**
   * Perform detailed analysis
   */
  private async analyzeDetailed(request: any, quickScan: any): Promise<{
    issues: ReviewIssue[];
  }> {
    const focus = request.focusAreas || ['bugs', 'style', 'security', 'best-practices'];

    const messages = [
      {
        role: 'system' as const,
        content: `You are an experienced code reviewer. Analyze this ${request.language || 'code'} for:
${focus.map((f: string) => `- ${f}`).join('\n')}

For each issue found, provide:
1. Severity (critical/high/medium/low/suggestion)
2. Type of issue
3. Location (line number and context)
4. Description of the problem
5. Impact on code quality
6. Suggested fix
7. Code example if applicable

Return JSON with issues (array).`,
      },
      {
        role: 'user' as const,
        content: `Code:
${request.code}

${request.context ? `Context: ${request.context}` : ''}
Focus areas: ${focus.join(', ')}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 3000,
        temperature: 0.3,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);
      return {
        issues: (result.issues || []).map((issue: any) => ({
          id: `issue_${uuid().substring(0, 8)}`,
          severity: (issue.severity || 'medium') as Severity,
          type: (issue.type || 'unknown') as ReviewFocus,
          location: {
            file: issue.location?.file,
            line: issue.location?.line,
            context: issue.location?.context,
          },
          description: issue.description,
          impact: issue.impact,
          suggestion: issue.suggestion,
          codeExample: issue.codeExample,
        })),
      };
    } catch {
      return {
        issues: this.fallbackIssues(quickScan.obviousProblems),
      };
    }
  }

  /**
   * Identify strengths in the code
   */
  private async identifyStrengths(request: any, detailedIssues: any): Promise<string[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Identify 3-5 strengths of this code.

Look for:
1. Good design patterns
2. Clear structure
3. Proper error handling
4. Good documentation
5. Efficient algorithms
6. Proper testing
7. Adherence to best practices

Return as JSON array of strength descriptions.`,
      },
      {
        role: 'user' as const,
        content: `Code:
${request.code.substring(0, 1000)}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 500,
        temperature: 0.5,
        model: 'gpt-4o-mini',
      });
      return JSON.parse(response.content);
    } catch {
      return ['Basic structure is maintainable', 'Follows basic language conventions'];
    }
  }

  /**
   * Synthesize the complete review
   */
  private synthesizeReview(
    detailedIssues: any,
    strengths: string[],
    state: ReviewState
  ): CodeReviewResult {
    // Calculate overall score
    const criticalCount = detailedIssues.issues.filter((i: ReviewIssue) => i.severity === 'critical').length;
    const highCount = detailedIssues.issues.filter((i: ReviewIssue) => i.severity === 'high').length;
    const mediumCount = detailedIssues.issues.filter((i: ReviewIssue) => i.severity === 'medium').length;

    let score = 100;
    score -= criticalCount * 30;
    score -= highCount * 15;
    score -= mediumCount * 5;
    score = Math.max(0, Math.min(100, score));

    // Group concerns
    const concerns = detailedIssues.issues
      .filter((i: ReviewIssue) => i.severity === 'critical' || i.severity === 'high')
      .map((i: ReviewIssue) => i.description);

    // Generate recommendations
    const recommendations = this.generateRecommendations(detailedIssues.issues);

    return {
      overallScore: score,
      reviewQuality: 0.85,
      issues: detailedIssues.issues,
      strengths,
      concerns,
      recommendations,
      reviewState: {
        ...state,
        confidence: score > 70 ? 0.9 : score > 40 ? 0.7 : 0.5,
      },
    };
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(issues: ReviewIssue[]): string[] {
    const recommendations: string[] = [];
    const hasSecurity = issues.some(i => i.type === 'security');
    const hasPerformance = issues.some(i => i.type === 'performance');
    const hasBugs = issues.some(i => i.severity === 'critical' || i.severity === 'high');

    if (hasSecurity) {
      recommendations.push('Address security issues before deployment');
      recommendations.push('Run security audit and penetration testing');
    }

    if (hasPerformance) {
      recommendations.push('Optimize performance-critical sections');
      recommendations.push('Add performance monitoring');
    }

    if (hasBugs) {
      recommendations.push('Fix critical bugs before merging');
      recommendations.push('Write tests for bug-prone areas');
    }

    if (recommendations.length === 0) {
      recommendations.push('Consider adding more comprehensive tests');
      recommendations.push('Review and update documentation');
    }

    return recommendations;
  }

  /**
   * Store review in memory
   */
  private async storeReviewMemory(review: CodeReviewResult, request: any): Promise<void> {
    try {
      const reviewId = uuid();

      await prisma.agentTask.create({
        data: {
          sessionId: this.sessionId,
          type: 'code_review',
          agentName: 'CodeReviewSpecialist',
          status: 'completed',
          input: { codeLength: request.code.length, language: request.language } as any,
          output: {
            score: review.overallScore,
            issueCount: review.issues.length,
          } as any,
          cost: 0.0003,
        },
      });

      // Store review summary as knowledge
      await prisma.knowledgeNode.upsert({
        where: { id: `review_${this.userId}_${reviewId}` },
        update: {},
        create: {
          id: `review_${this.userId}_${reviewId}`,
          type: 'review',
          name: `Code review: ${request.code.substring(0, 30)}...`,
          description: `Score: ${review.overallScore}/100. ${review.strengths.length} strengths, ${review.issues.length} issues found.`,
          properties: {
            score: review.overallScore,
            language: request.language,
            concerns: review.concerns.length,
          } as any,
        },
      });
    } catch (err) {
      console.warn('[CodeReviewSpecialist] Could not store memory:', err);
    }
  }

  /**
   * Fallback issues when LLM fails
   */
  private fallbackIssues(obviousProblems: string[]): ReviewIssue[] {
    const issues: ReviewIssue[] = [];

    for (const problem of obviousProblems.slice(0, 3)) {
      issues.push({
        id: `issue_fallback_${Math.random()}`,
        severity: 'medium',
        type: 'best-practices',
        location: { line: undefined, context: problem.substring(0, 50) },
        description: problem,
        impact: 'Code quality and maintainability',
        suggestion: 'Review and fix the identified issue',
      });
    }

    return issues;
  }

  /**
   * Get review state
   */
  getState(): ReviewState {
    return {
      scope: 'thorough',
      confidence: 0.6,
      issuesFound: 0,
      timeSpent: 'thorough',
    };
  }
}
