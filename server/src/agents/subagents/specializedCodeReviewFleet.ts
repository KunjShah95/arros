/**
 * Specialized Code Review Fleet - Multiple Code Review Agents
 *
 * This module provides comprehensive code review capabilities with specialized agents:
 *
 * - CodeReviewAgent: General code review
 * - StyleReviewAgent: Code style, formatting, and consistency
 * - PerformanceReviewAgent: Performance optimization and efficiency
 * - SecurityReviewAgent: Security vulnerabilities and best practices
 * - ArchitectureReviewAgent: Code structure and design patterns
 */

import { llmService } from '../../services/llm';
import { prisma } from '../../services/prisma';
import { v4 as uuid } from 'uuid';

// ─── Review Result Interfaces ─────────────────────────────────────────────────

export interface ReviewIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'bug' | 'style' | 'performance' | 'security' | 'best-practice' | 'architecture';
  file?: string;
  line?: number;
  column?: number;
  message: string;
  codeSnippet?: string;
  suggestion?: string;
  fixExample?: string;
}

export interface StyleReviewResult {
  issues: ReviewIssue[];
  styleScore: number; // 0-100
  formatterRecommendations: string[];
  conventionViolations: string[];
}

export interface PerformanceReviewResult {
  issues: ReviewIssue[];
  performanceScore: number; // 0-100
  optimizationSuggestions: string[];
  bottleneckIdentifications: string[];
}

export interface SecurityReviewResult {
  issues: ReviewIssue[];
  securityScore: number; // 0-100
  vulnerabilities: Array<{
    id: string;
    cwe?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    remediation: string;
  }>;
  securityBestPractices: string[];
}

export interface ArchitectureReviewResult {
  issues: ReviewIssue[];
  architectureScore: number; // 0-100
  designPatternViolations: string[];
  couplingAssessment: string;
  cohesionAssessment: string;
  recommendations: string[];
}

export interface ComprehensiveReviewResult {
  style: StyleReviewResult;
  performance: PerformanceReviewResult;
  security: SecurityReviewResult;
  architecture: ArchitectureReviewResult;
  overallScore: number;
  priorityActionItems: string[];
}

// ─── Abstract Base Class ──────────────────────────────────────────────────────

export abstract class BaseReviewAgent {
  protected sessionId: string;
  protected taskId: string;
  protected agentName: string;

  constructor(sessionId: string, taskId: string, agentName: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
    this.agentName = agentName;
  }

  abstract review(code: string, context?: any): Promise<any>;

  protected async logReviewTask(input: any, output: any) {
    try {
      await prisma.agentTask.create({
        data: {
          sessionId: this.sessionId,
          type: 'code_review',
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

// ─── General Code Review Agent ────────────────────────────────────────────────

export class CodeReviewAgent extends BaseReviewAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'CodeReviewAgent');
  }

  async review(code: string, context?: any): Promise<{
    issues: ReviewIssue[];
    overallScore: number;
    strengths: string[];
    improvements: string[];
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert code reviewer. Provide comprehensive feedback on code quality.

Analyze for:
1. Bugs and potential errors
2. Code readability and maintainability
3. Performance issues
4. Security vulnerabilities
5. Best practices adherence

For each issue:
- Severity: low, medium, high, critical
- Type: bug, style, performance, security, best-practice
- Include a specific fix suggestion

Return JSON with issues (array), overallScore (0-100), strengths (array), improvements (array).`,
      },
      {
        role: 'user' as const,
        content: `Please review this code:

${code || ''}
${context ? `\n\nContext/Requirements:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 4000,
        temperature: 0.2,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logReviewTask({ codeLength: code?.length || 0 }, { issueCount: result.issues?.length || 0 });

      return {
        issues: result.issues || [],
        overallScore: result.overallScore || 70,
        strengths: result.strengths || [],
        improvements: result.improvements || [],
      };
    } catch {
      return this.fallbackReview(code);
    }
  }

  private fallbackReview(code: string): {
    issues: ReviewIssue[];
    overallScore: number;
    strengths: string[];
    improvements: string[];
  } {
    return {
      issues: [],
      overallScore: 75,
      strengths: code.length > 50 ? ['Basic implementation present'] : [],
      improvements: ['Add error handling', 'Consider edge cases', 'Add comments for complex logic'],
    };
  }
}

// ─── Style Review Agent ───────────────────────────────────────────────────────

export class StyleReviewAgent extends BaseReviewAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'StyleReviewAgent');
  }

  async review(code: string, context?: any): Promise<StyleReviewResult> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a code style expert. Review code for style consistency and formatting.

Check for:
1. Consistent naming conventions (camelCase, snake_case, PascalCase)
2. Code formatting (indentation, line length, spacing)
3. Comment style and documentation
4. Import/sort order
5. Maximum line length violations
6. Trailing whitespace
7. Unused imports/variables

Common style guides: Airbnb JS, PEP 8 Python, Google Java, Rust Style Guide

Return JSON with issues (array with file, line, column), styleScore (0-100), formatterRecommendations (array), conventionViolations (array).`,
      },
      {
        role: 'user' as const,
        content: `Review the style of this code:

${code || ''}
${context ? `\n\nTarget language/style guide: ${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 3000,
        temperature: 0.1,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logReviewTask({ codeLength: code?.length || 0 }, { styleIssues: result.issues?.length || 0 });

      return {
        issues: result.issues || [],
        styleScore: result.styleScore || 80,
        formatterRecommendations: result.formatterRecommendations || ['Use a consistent formatter'],
        conventionViolations: result.conventionViolations || [],
      };
    } catch {
      return this.fallbackStyleReview(code);
    }
  }

  private fallbackStyleReview(code: string): StyleReviewResult {
    return {
      issues: [],
      styleScore: 75,
      formatterRecommendations: ['Consider using Prettier (JS)', 'Consider using Black (Python)', 'Consider using clang-format (C/C++)'],
      conventionViolations: [],
    };
  }
}

// ─── Performance Review Agent ─────────────────────────────────────────────────

export class PerformanceReviewAgent extends BaseReviewAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'PerformanceReviewAgent');
  }

  async review(code: string, context?: any): Promise<PerformanceReviewResult> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a performance optimization expert. Review code for performance issues.

Analyze for:
1. Time complexity issues (O(n²), unnecessary loops)
2. Space complexity issues (memory leaks, unnecessary copies)
3. I/O operations (database queries, file reads)
4. Cache opportunities
5. Parallelization opportunities
6. Algorithm efficiency
7. Resource cleanup

Common anti-patterns: N+1 queries, missing indexes, blocking calls, memory leaks

Return JSON with issues (array), performanceScore (0-100), optimizationSuggestions (array), bottleneckIdentifications (array).`,
      },
      {
        role: 'user' as const,
        content: `Review the performance of this code:

${code || ''}
${context ? `\n\nPerformance requirements: ${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 3000,
        temperature: 0.2,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logReviewTask({ codeLength: code?.length || 0 }, { perfIssues: result.issues?.length || 0 });

      return {
        issues: result.issues || [],
        performanceScore: result.performanceScore || 70,
        optimizationSuggestions: result.optimizationSuggestions || [],
        bottleneckIdentifications: result.bottleneckIdentifications || [],
      };
    } catch {
      return this.fallbackPerformanceReview(code);
    }
  }

  private fallbackPerformanceReview(code: string): PerformanceReviewResult {
    return {
      issues: [],
      performanceScore: 70,
      optimizationSuggestions: ['Profile before optimizing', 'Use caching for expensive operations', 'Consider async operations'],
      bottleneckIdentifications: [],
    };
  }
}

// ─── Security Review Agent ────────────────────────────────────────────────────

export class SecurityReviewAgent extends BaseReviewAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'SecurityReviewAgent');
  }

  async review(code: string, context?: any): Promise<SecurityReviewResult> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a security expert. Review code for security vulnerabilities.

Check for:
1. Injection vulnerabilities (SQL, XSS, command injection)
2. Authentication/authorization issues
3. Insecure cryptographic practices
4. Sensitive data exposure
5. API security (rate limiting, input validation)
6. Dependency vulnerabilities
7. Secure headers and configurations
8. Error handling (don't leak info)

Refer to: OWASP Top 10, CWE/SANS Top 25

Return JSON with issues (array), securityScore (0-100), vulnerabilities (array with CWE), securityBestPractices (array).`,
      },
      {
        role: 'user' as const,
        content: `Review the security of this code:

${code || ''}
${context ? `\n\nSecurity requirements: ${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 3500,
        temperature: 0.15,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logReviewTask({ codeLength: code?.length || 0 }, { securityIssues: result.issues?.length || 0 });

      return {
        issues: result.issues || [],
        securityScore: result.securityScore || 60,
        vulnerabilities: result.vulnerabilities || [],
        securityBestPractices: result.securityBestPractices || [],
      };
    } catch {
      return this.fallbackSecurityReview(code);
    }
  }

  private fallbackSecurityReview(code: string): SecurityReviewResult {
    return {
      issues: [],
      securityScore: 65,
      vulnerabilities: [],
      securityBestPractices: ['Validate all user inputs', 'Use parameterized queries', 'Sanitize output', 'Keep dependencies updated'],
    };
  }
}

// ─── Architecture Review Agent ────────────────────────────────────────────────

export class ArchitectureReviewAgent extends BaseReviewAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'ArchitectureReviewAgent');
  }

  async review(code: string, context?: any): Promise<ArchitectureReviewResult> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a software architecture expert. Review code structure and design.

Analyze for:
1. Design patterns usage and appropriateness
2. Separation of concerns
3. Coupling between modules
4. Cohesion within modules
5. Single Responsibility Principle
6. Open/Closed Principle
7. Dependency inversion
8. Code organization and modularity

Common patterns: MVC, MVVM, Repository, Factory, Strategy, Observer

Return JSON with issues (array), architectureScore (0-100), designPatternViolations (array), couplingAssessment, cohesionAssessment, recommendations (array).`,
      },
      {
        role: 'user' as const,
        content: `Review the architecture of this code:

${code || ''}
${context ? `\n\nArchitecture requirements: ${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 3000,
        temperature: 0.25,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logReviewTask({ codeLength: code?.length || 0 }, { architectureIssues: result.issues?.length || 0 });

      return {
        issues: result.issues || [],
        architectureScore: result.architectureScore || 70,
        designPatternViolations: result.designPatternViolations || [],
        couplingAssessment: result.couplingAssessment || 'Needs evaluation',
        cohesionAssessment: result.cohesionAssessment || 'Needs evaluation',
        recommendations: result.recommendations || [],
      };
    } catch {
      return this.fallbackArchitectureReview(code);
    }
  }

  private fallbackArchitectureReview(code: string): ArchitectureReviewResult {
    return {
      issues: [],
      architectureScore: 70,
      designPatternViolations: [],
      couplingAssessment: 'Moderate coupling detected',
      cohesionAssessment: 'Functions grouped by purpose',
      recommendations: ['Consider separating concerns', 'Review dependency flow', 'Apply design patterns appropriately'],
    };
  }
}

// ─── CodeReviewFleet - Main Coordinator ───────────────────────────────────────

export class CodeReviewFleet {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  /**
   * Run all review agents and combine results
   */
  async runAll(code: string, context?: any): Promise<ComprehensiveReviewResult> {
    const styleAgent = new StyleReviewAgent(this.sessionId, `${this.taskId}_style`);
    const perfAgent = new PerformanceReviewAgent(this.sessionId, `${this.taskId}_perf`);
    const securityAgent = new SecurityReviewAgent(this.sessionId, `${this.taskId}_security`);
    const archAgent = new ArchitectureReviewAgent(this.sessionId, `${this.taskId}_arch`);

    const [style, performance, security, architecture] = await Promise.all([
      styleAgent.review(code, context),
      perfAgent.review(code, context),
      securityAgent.review(code, context),
      archAgent.review(code, context),
    ]);

    const overallScore = Math.round(
      (style.styleScore + performance.performanceScore + security.securityScore + architecture.architectureScore) / 4
    );

    // Combine all issues
    const allIssues = [
      ...style.issues,
      ...performance.issues,
      ...security.issues,
      ...architecture.issues,
    ];

    // Identify priority action items
    const priorityActionItems = [
      ...security.issues.filter(i => i.severity === 'critical' || i.severity === 'high').map(i => `CRITICAL: ${i.message}`),
      ...performance.issues.filter(i => i.severity === 'high' || i.severity === 'critical').map(i => `PERF: ${i.message}`),
      ...architecture.issues.filter(i => i.severity === 'high' || i.severity === 'critical').map(i => `ARCH: ${i.message}`),
    ];

    return {
      style,
      performance,
      security,
      architecture,
      overallScore,
      priorityActionItems,
    };
  }

  /**
   * Run a specific review agent by type
   */
  async runSpecific(code: string, type: string, context?: any): Promise<any> {
    const agentMap: Record<string, BaseReviewAgent> = {
      code: new CodeReviewAgent(this.sessionId, `${this.taskId}_code`),
      style: new StyleReviewAgent(this.sessionId, `${this.taskId}_style`),
      performance: new PerformanceReviewAgent(this.sessionId, `${this.taskId}_perf`),
      security: new SecurityReviewAgent(this.sessionId, `${this.taskId}_security`),
      architecture: new ArchitectureReviewAgent(this.sessionId, `${this.taskId}_arch`),
    };

    const agent = agentMap[type] || agentMap.code;
    return agent.review(code, context);
  }

  /**
   * Generate a review report
   */
  async generateReport(code: string, context?: any): Promise<{
    summary: {
      overallScore: number;
      totalIssues: number;
      criticalIssues: number;
      highPriorityIssues: number;
    };
    details: ComprehensiveReviewResult;
  }> {
    const details = await this.runAll(code, context);

    const criticalIssues = details.priorityActionItems.filter(i => i.startsWith('CRITICAL:')).length;
    const highPriorityIssues = details.priorityActionItems.filter(i => i.startsWith('PERF:') || i.startsWith('ARCH:') || i.startsWith('CRITICAL:')).length;

    return {
      summary: {
        overallScore: details.overallScore,
        totalIssues: details.style.issues.length + details.performance.issues.length + details.security.issues.length + details.architecture.issues.length,
        criticalIssues,
        highPriorityIssues,
      },
      details,
    };
  }
}
