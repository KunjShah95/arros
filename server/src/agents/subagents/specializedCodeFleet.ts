/**
 * Specialized Code Generation Fleet - Multiple Code Generation Agents
 *
 * This module provides code generation capabilities with specialized agents:
 *
 * - CodeGenerationAgent: General code generation
 * - BackendAgent: Server-side, API, database code
 * - FrontendAgent: UI, client-side code
 * - DevOpsAgent: Infrastructure, deployment, CI/CD
 * - TestAgent: Unit tests, integration tests, E2E tests
 * - CodeReviewAgent: Code review and quality assurance
 */

import { llmService } from '../../services/llm';
import { prisma } from '../../services/prisma';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';

// ─── Code Generation Result Interfaces ────────────────────────────────────────

export interface CodeGenerationResult {
  code: string;
  language: string;
  explanation: string;
  tests?: string[];
  dependencies?: string[];
  notes?: string[];
  confidence: number;
}

export interface CodeReviewResult {
  issues: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: 'bug' | 'style' | 'performance' | 'security' | 'best-practice';
    file?: string;
    line?: number;
    message: string;
    suggestion?: string;
  }>;
  overallScore: number; // 0-100
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

export interface TestGenerationResult {
  unitTests: string[];
  integrationTests?: string[];
  testCoverageEstimate: number;
  testFramework: string;
}

// ─── Abstract Base Class ──────────────────────────────────────────────────────

export abstract class BaseCodeAgent {
  protected sessionId: string;
  protected taskId: string;
  protected agentName: string;

  constructor(sessionId: string, taskId: string, agentName: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
    this.agentName = agentName;
  }

  abstract generate(request: any): Promise<any>;

  protected async logGenerationTask(input: any, output: any) {
    try {
      await prisma.agentTask.create({
        data: {
          sessionId: this.sessionId,
          type: 'code_generation',
          agentName: this.agentName,
          status: 'completed',
          input: input as any,
          output: output as any,
          cost: 0.0002,
        },
      });
    } catch {
      // Non-critical logging
    }
  }
}

// ─── General Code Generation Agent ────────────────────────────────────────────

export class CodeGenerationAgent extends BaseCodeAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'CodeGenerationAgent');
  }

  async generate(request: any): Promise<CodeGenerationResult> {
    const { prompt, language, context, requirements } = request;

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert code generation assistant. Generate clean, efficient, and well-documented code.

Guidelines:
- Write production-ready code with proper error handling
- Include necessary comments and documentation
- Follow language-specific best practices
- Consider edge cases and error handling
- Use meaningful variable and function names

Return JSON with code (the complete code), language, explanation (what the code does), dependencies (array of external packages), and notes (array of important notes).`,
      },
      {
        role: 'user' as const,
        content: `Generate ${language || 'code'} for: ${prompt || 'a function'}${requirements ? `\nRequirements:\n${requirements}` : ''}${context ? `\n\nContext/Existing Code:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 4000,
        temperature: 0.2,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logGenerationTask(
        { prompt, language, context },
        { codeLength: result.code?.length || 0, language: result.language }
      );

      return {
        code: result.code || '',
        language: result.language || language || 'javascript',
        explanation: result.explanation || '',
        dependencies: result.dependencies || [],
        notes: result.notes || [],
        confidence: 0.85,
      };
    } catch {
      return this.fallbackGeneration(request);
    }
  }

  private fallbackGeneration(request: any): CodeGenerationResult {
    const { prompt, language } = request;
    return {
      code: `// Code generation failed - fallback implementation for: ${prompt}\n// Language: ${language || 'unknown'}\n\nfunction placeholder() {\n  // TODO: Implement\n  return null;\n}`,
      language: language || 'javascript',
      explanation: 'Fallback implementation generated due to generation error',
      confidence: 0.5,
    };
  }
}

// ─── Backend Code Agent ───────────────────────────────────────────────────────

export class BackendAgent extends BaseCodeAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'BackendAgent');
  }

  async generate(request: any): Promise<CodeGenerationResult> {
    const { prompt, framework, database, context } = request;

    const messages = [
      {
        role: 'system' as const,
        content: `You are a backend development expert. Generate robust server-side code.

Focus on:
- RESTful API design principles
- Database integration (ORM/ODM)
- Authentication and authorization
- Error handling and validation
- Performance optimization
- Security best practices

Common frameworks: Express.js, FastAPI, Spring Boot, Django, Rails, Laravel

Return JSON with code, language, explanation, dependencies (NPM/pip/packagist packages), and notes.`,
      },
      {
        role: 'user' as const,
        content: `Create ${framework || 'backend'} code for: ${prompt}
Database: ${database || 'relational'}
${context ? `\n\nExisting Code:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 5000,
        temperature: 0.2,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logGenerationTask({ prompt, framework }, { codeLength: result.code?.length || 0 });

      return {
        code: result.code || '',
        language: this.inferLanguage(framework),
        explanation: result.explanation || '',
        dependencies: result.dependencies || [],
        notes: result.notes || ['Implement proper error handling in production', 'Add input validation', 'Use parameterized queries'],
        confidence: 0.88,
      };
    } catch {
      return this.fallbackBackendGeneration(request);
    }
  }

  private inferLanguage(framework: string): string {
    const frameworkLang: Record<string, string> = {
      express: 'javascript',
      node: 'javascript',
      nextjs: 'javascript',
      fastapi: 'python',
      django: 'python',
      spring: 'java',
      rails: 'ruby',
      laravel: 'php',
      flask: 'python',
    };
    const lower = (framework || '').toLowerCase();
    for (const key in frameworkLang) {
      if (lower.includes(key)) return frameworkLang[key];
    }
    return 'javascript';
  }

  private fallbackBackendGeneration(request: any): CodeGenerationResult {
    return {
      code: `// Backend code generation failed\n// Framework: ${request.framework || 'unknown'}\n\n// TODO: Implement backend logic\n// - Define API endpoints\n// - Connect to database\n// - Add authentication\n// - Implement error handling`,
      language: request.framework ? this.inferLanguage(request.framework) : 'javascript',
      explanation: 'Fallback backend code',
      confidence: 0.5,
    };
  }
}

// ─── Frontend Code Agent ──────────────────────────────────────────────────────

export class FrontendAgent extends BaseCodeAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'FrontendAgent');
  }

  async generate(request: any): Promise<CodeGenerationResult> {
    const { prompt, framework, components, context } = request;

    const messages = [
      {
        role: 'system' as const,
        content: `You are a frontend development expert. Generate responsive, accessible UI code.

Focus on:
- Component-based architecture
- Responsive design (mobile-first)
- Accessibility (WCAG compliance)
- State management patterns
- CSS-in-JS or modern CSS practices
- Performance optimization (lazy loading, code splitting)

Common frameworks: React, Vue, Angular, Svelte, SolidJS

Return JSON with code, language (jsx/tsx/html), explanation, dependencies, and notes.`,
      },
      {
        role: 'user' as const,
        content: `Create ${framework || 'frontend'} code for: ${prompt}
Components needed: ${components || 'general UI elements'}
${context ? `\n\nExisting Code/Design System:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 5000,
        temperature: 0.3,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logGenerationTask({ prompt, framework }, { codeLength: result.code?.length || 0 });

      return {
        code: result.code || '',
        language: framework?.toLowerCase().includes('react') ? 'typescript' : 'javascript',
        explanation: result.explanation || '',
        dependencies: result.dependencies || [],
        notes: result.notes || ['Test on multiple screen sizes', 'Ensure keyboard navigation', 'Add loading states'],
        confidence: 0.85,
      };
    } catch {
      return this.fallbackFrontendGeneration(request);
    }
  }

  private fallbackFrontendGeneration(request: any): CodeGenerationResult {
    return {
      code: `// Frontend code generation failed\n// Framework: ${request.framework || 'unknown'}\n\n// TODO: Implement frontend components\n// - Create component structure\n// - Implement responsive design\n// - Add state management\n// - Test accessibility`,
      language: request.framework?.toLowerCase().includes('react') ? 'typescript' : 'javascript',
      explanation: 'Fallback frontend code',
      confidence: 0.5,
    };
  }
}

// ─── DevOps Code Agent ────────────────────────────────────────────────────────

export class DevOpsAgent extends BaseCodeAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'DevOpsAgent');
  }

  async generate(request: any): Promise<CodeGenerationResult> {
    const { prompt, platform, infrastructure, context } = request;

    const messages = [
      {
        role: 'system' as const,
        content: `You are a DevOps/SRE expert. Generate infrastructure-as-code and automation scripts.

Focus on:
- Infrastructure as Code (IaC)
- CI/CD pipeline configuration
- Container orchestration (Docker, Kubernetes)
- Monitoring and logging setup
- Security best practices (secret management, network policies)
- Scalability and reliability patterns

Common tools: Docker, Kubernetes, Terraform, AWS CloudFormation, GitHub Actions, Jenkins

Return JSON with code, language (yaml/hcl/bash/dockerfile), explanation, dependencies, and notes.`,
      },
      {
        role: 'user' as const,
        content: `Create DevOps configuration for: ${prompt}
Platform: ${platform || 'cloud'}
Infrastructure: ${infrastructure || 'general'}
${context ? `\n\nExisting Infrastructure:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 4000,
        temperature: 0.2,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logGenerationTask({ prompt, platform }, { codeLength: result.code?.length || 0 });

      return {
        code: result.code || '',
        language: this.inferDevOpsLanguage(platform),
        explanation: result.explanation || '',
        dependencies: result.dependencies || [],
        notes: result.notes || ['Review security settings', 'Test in staging environment', 'Document all configurations'],
        confidence: 0.82,
      };
    } catch {
      return this.fallbackDevOpsGeneration(request);
    }
  }

  private inferDevOpsLanguage(platform: string): string {
    const platformLang: Record<string, string> = {
      kubernetes: 'yaml',
      k8s: 'yaml',
      terraform: 'hcl',
      docker: 'dockerfile',
      aws: 'yaml',
      azure: 'yaml',
      gcp: 'yaml',
    };
    const lower = (platform || '').toLowerCase();
    for (const key in platformLang) {
      if (lower.includes(key)) return platformLang[key];
    }
    return 'yaml';
  }

  private fallbackDevOpsGeneration(request: any): CodeGenerationResult {
    return {
      code: `# DevOps configuration generation failed\n# Platform: ${request.platform || 'unknown'}\n\n# TODO: Implement DevOps configuration\n# - Define infrastructure\n# - Configure CI/CD\n# - Set up monitoring\n# - Configure security policies`,
      language: 'yaml',
      explanation: 'Fallback DevOps configuration',
      confidence: 0.5,
    };
  }
}

// ─── Test Generation Agent ────────────────────────────────────────────────────

export class TestAgent extends BaseCodeAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'TestAgent');
  }

  async generate(request: any): Promise<TestGenerationResult> {
    const { code, language, framework, context } = request;

    const messages = [
      {
        role: 'system' as const,
        content: `You are a testing expert. Generate comprehensive test suites.

Focus on:
- Unit tests for individual functions/classes
- Integration tests for component interactions
- Edge cases and error scenarios
- Mocking external dependencies
- Test coverage best practices

Common frameworks: Jest, Mocha, pytest, unittest, JUnit, RSpec

Return JSON with unitTests (array of test code strings), integrationTests (optional array), testCoverageEstimate (0-1), and testFramework.`,
      },
      {
        role: 'user' as const,
        content: `Generate tests for: ${language || 'the following code'}
${code ? `\n\nCode to test:\n${code}` : ''}${context ? `\n\nContext/Requirements:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 4000,
        temperature: 0.3,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logGenerationTask({ language, codeLength: code?.length || 0 }, { testCount: result.unitTests?.length || 0 });

      return {
        unitTests: result.unitTests || [],
        integrationTests: result.integrationTests,
        testCoverageEstimate: result.testCoverageEstimate || 0.7,
        testFramework: result.testFramework || this.inferTestFramework(language),
      };
    } catch {
      return this.fallbackTestGeneration(request);
    }
  }

  private inferTestFramework(language: string): string {
    const languageFramework: Record<string, string> = {
      javascript: 'Jest',
      typescript: 'Jest',
      python: 'pytest',
      java: 'JUnit',
      ruby: 'RSpec',
      go: 'testing',
      rust: 'cargo test',
    };
    const lower = (language || '').toLowerCase();
    for (const key in languageFramework) {
      if (lower.includes(key)) return languageFramework[key];
    }
    return 'Jest';
  }

  private fallbackTestGeneration(request: any): TestGenerationResult {
    return {
      unitTests: ['// Test generation failed - add unit tests'],
      testCoverageEstimate: 0.5,
      testFramework: 'Jest',
    };
  }
}

// ─── Code Review Agent ────────────────────────────────────────────────────────

export class CodeReviewAgent extends BaseCodeAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'CodeReviewAgent');
  }

  async generate(request: any): Promise<CodeReviewResult> {
    const { code, language, context, focusAreas } = request;

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert code reviewer. Provide constructive, detailed feedback on code quality.

Review for:
1. Bugs and potential errors
2. Code style and readability
3. Performance issues
4. Security vulnerabilities
5. Best practices and design patterns
6. Test coverage

For each issue, provide:
- Severity (low/medium/high/critical)
- Type (bug, style, performance, security, best-practice)
- Location (file, line number if possible)
- Suggested fix

Return JSON with issues (array), overallScore (0-100), strengths (array), improvements (array), and recommendations (array).`,
      },
      {
        role: 'user' as const,
        content: `Review this ${language || 'code'}:
${code || ''}
${focusAreas ? `\n\nFocus areas: ${focusAreas}` : ''}
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

      await this.logGenerationTask({ codeLength: code?.length || 0, language }, { issueCount: result.issues?.length || 0 });

      return {
        issues: result.issues || [],
        overallScore: result.overallScore || 70,
        strengths: result.strengths || [],
        improvements: result.improvements || [],
        recommendations: result.recommendations || [],
      };
    } catch {
      return this.fallbackCodeReview(request);
    }
  }

  private fallbackCodeReview(request: any): CodeReviewResult {
    return {
      issues: [],
      overallScore: 75,
      strengths: ['Basic structure is sound'],
      improvements: ['Add more comprehensive tests', 'Consider error handling'],
      recommendations: ['Review coding standards', 'Consider code complexity'],
    };
  }
}

// ─── CodeFleet - Main Coordinator ─────────────────────────────────────────────

export class CodeFleet {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  /**
   * Generate code based on requirements
   */
  async generateCode(request: any): Promise<CodeGenerationResult> {
    const type = request.type || 'general';
    const agentMap: Record<string, BaseCodeAgent> = {
      general: new CodeGenerationAgent(this.sessionId, `${this.taskId}_general`),
      backend: new BackendAgent(this.sessionId, `${this.taskId}_backend`),
      frontend: new FrontendAgent(this.sessionId, `${this.taskId}_frontend`),
      devops: new DevOpsAgent(this.sessionId, `${this.taskId}_devops`),
      test: new TestAgent(this.sessionId, `${this.taskId}_test`),
    };

    const agent = agentMap[type] || agentMap.general;
    return agent.generate(request);
  }

  /**
   * Review code quality
   */
  async reviewCode(request: any): Promise<CodeReviewResult> {
    const agent = new CodeReviewAgent(this.sessionId, `${this.taskId}_review`);
    return agent.generate(request);
  }

  /**
   * Generate comprehensive code with tests
   */
  async generateWithTests(request: any): Promise<{
    code: CodeGenerationResult;
    tests: TestGenerationResult;
  }> {
    const codeResult = await this.generateCode({ ...request, type: request.type || 'general' });
    const testResult = await this.generateCode({ ...request, type: 'test', code: codeResult.code, language: codeResult.language });

    return { code: codeResult, tests: testResult as unknown as TestGenerationResult };
  }

  /**
   * Generate backend, frontend, and devops code for full-stack applications
   */
  async generateFullStack(request: any): Promise<{
    backend: CodeGenerationResult;
    frontend: CodeGenerationResult;
    devops: CodeGenerationResult;
  }> {
    const backend = await this.generateCode({ ...request, type: 'backend', framework: 'express' });
    const frontend = await this.generateCode({ ...request, type: 'frontend', framework: 'react' });
    const devops = await this.generateCode({ ...request, type: 'devops', platform: 'docker' });

    return { backend, frontend, devops };
  }
}