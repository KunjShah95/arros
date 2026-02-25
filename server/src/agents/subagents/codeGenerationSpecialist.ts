/**
 * Code Generation Specialist Agent - Human-Like Code Generation
 *
 * This agent simulates how a human developer writes code:
 *  - Understands requirements through questioning
 *  - Draws on experience patterns
 *  - Considers edge cases and error handling
 *  - Follows best practices and conventions
 *  - Explains the reasoning behind implementation choices
 *
 * Inspired by:
 *  - Programming by Intention (Preye)
 *  - Schema theory in programming
 *  - Code review best practices
 */

import { llmService } from '../../services/llm';
import { prisma } from '../../services/prisma';
import { v4 as uuid } from 'uuid';

// ─── Code Generation Types ──────────────────────────────────────────────────────

export type CodeStyle = 'production' | 'learning' | 'prototype' | 'optimized' | 'minimal';
export type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'ruby' | 'rust' | 'go' | 'csharp';

export interface CodeGenerationRequest {
  prompt: string;
  language?: Language;
  style?: CodeStyle;
  context?: string;         // existing code or architecture
  requirements?: string[];
  constraints?: string[];
  testRequirements?: string[];
}

export interface CodeGenerationResult {
  code: string;
  language: Language;
  explanation: string;
  approach: string;         // the reasoning behind the implementation
  tests?: string[];
  dependencies?: string[];
  notes?: string[];
  confidence: number;
  complexityScore: number;  // 0-1, estimated complexity
}

export interface GenerationState {
  understandingQuality: number; // how well we understand requirements
  confidence: number;
  style: CodeStyle;
  completedSteps: string[];
}

// ─── CodeGenerationSpecialist Class ────────────────────────────────────────────

export class CodeGenerationSpecialist {
  private userId: string;
  private sessionId: string;
  private taskId: string;

  constructor(userId: string, sessionId: string, taskId: string) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  /**
   * Main code generation function - simulates human coding behavior
   */
  async generate(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    console.log(`[CodeGenerationSpecialist] 💻 Generating code for: "${request.prompt.substring(0, 50)}..."`);

    // Phase 1: Understanding and clarification
    console.log('[CodeGenerationSpecialist] Phase 1: Analyzing requirements...');
    const understanding = await this.analyzeRequirements(request);
    const currentState: GenerationState = {
      understandingQuality: understanding.quality,
      confidence: 0.5,
      style: request.style || 'production',
      completedSteps: ['requirements_analysis'],
    };

    // Phase 2: Strategy selection
    console.log('[CodeGenerationSpecialist] Phase 2: Selecting implementation strategy...');
    const strategy = this.selectStrategy(understanding, currentState);
    currentState.completedSteps.push('strategy_selection');

    // Phase 3: Code generation
    console.log('[CodeGenerationSpecialist] Phase 3: Generating code...');
    const generationResult = await this.generateCode(understanding, strategy, request);
    currentState.completedSteps.push('code_generation');
    currentState.confidence = generationResult.confidence;

    // Phase 4: Test generation (if needed)
    if (request.testRequirements || request.style === 'production') {
      console.log('[CodeGenerationSpecialist] Phase 4: Generating tests...');
      const tests = await this.generateTests(generationResult.code, request);
      currentState.completedSteps.push('test_generation');
      generationResult.tests = tests;
    }

    // Phase 5: Final review and explanation
    console.log('[CodeGenerationSpecialist] Phase 5: Reviewing and explaining...');
    const explanation = await this.generateExplanation(generationResult, request);
    currentState.completedSteps.push('explanation');

    // Store generation in memory
    await this.storeGenerationMemory(generationResult, request, currentState);

    return { ...generationResult, explanation };
  }

  /**
   * Analyze and understand the requirements
   */
  private async analyzeRequirements(request: CodeGenerationRequest): Promise<{
    quality: number;
    understoodRequirements: string[];
    ambiguousPoints: string[];
    suggestedClarifications: string[];
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a requirements analyst for code generation. Given a request, identify:
1. What is clearly understood
2. What is ambiguous or needs clarification
3. The quality of understanding (0-1)

Return JSON with understoodRequirements (array), ambiguousPoints (array), suggestedClarifications (array), and quality (0-1).`,
      },
      {
        role: 'user' as const,
        content: `Prompt: "${request.prompt}"

${request.context ? `Context: ${request.context}` : ''}
${request.requirements?.length ? `Explicit requirements: ${request.requirements.join(', ')}` : ''}`,
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
        quality: 0.7,
        understoodRequirements: [request.prompt.substring(0, 50)],
        ambiguousPoints: [],
        suggestedClarifications: [],
      };
    }
  }

  /**
   * Select the best implementation strategy
   */
  private selectStrategy(understanding: any, state: GenerationState): string {
    const strategies = [
      {
        name: 'conventional_approach',
        description: 'Use standard, well-established patterns that are easy to understand and maintain',
        suitableFor: ['production', 'learning'],
        complexity: 'low',
      },
      {
        name: 'idiomatic_approach',
        description: 'Use language-specific idioms and best practices for optimal readability',
        suitableFor: ['production', 'optimized'],
        complexity: 'medium',
      },
      {
        name: 'explorative_approach',
        description: 'Try newer patterns or techniques to solve the problem creatively',
        suitableFor: ['prototype', 'learning'],
        complexity: 'high',
      },
      {
        name: 'minimal_approach',
        description: 'Use the simplest possible solution that meets requirements',
        suitableFor: ['minimal', 'learning'],
        complexity: 'low',
      },
    ];

    // Select strategy based on style
    const suitableStrategies = strategies.filter(s => s.suitableFor.includes(state.style));
    if (understanding.ambiguousPoints.length > 2) {
      return suitableStrategies.find(s => s.complexity === 'low')?.description || suitableStrategies[0].description;
    }
    return suitableStrategies[0]?.description || strategies[0].description;
  }

  /**
   * Generate the actual code
   */
  private async generateCode(understanding: any, strategy: string, request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    const language = request.language || this.inferLanguage(request.prompt);

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert ${language} developer. Generate clean, maintainable code.

Style: ${request.style || 'production'}
Strategy: ${strategy}

Requirements:
${understanding.understoodRequirements.map((r: string) => `- ${r}`).join('\n')}

${request.constraints?.length ? `Constraints:
${request.constraints.map((c: string) => `- ${c}`).join('\n')}` : ''}

Follow ${language} best practices. Include proper error handling and edge case considerations.`,
      },
      {
        role: 'user' as const,
        content: request.prompt,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 4000,
        temperature: 0.2,
        model: 'gpt-4o-mini',
      });

      // Extract code from response
      const code = this.extractCode(response.content, language);

      return {
        code,
        language,
        explanation: '', // will be filled later
        approach: strategy,
        dependencies: [],
        notes: [
          'Review before production use',
          'Test with your specific data',
          'Consider edge cases not covered',
        ],
        confidence: 0.8,
        complexityScore: this.estimateComplexity(code),
      };
    } catch {
      return {
        code: `// Code generation failed for: ${request.prompt.substring(0, 30)}...`,
        language: language,
        explanation: '',
        approach: 'fallback',
        dependencies: [],
        notes: ['Generation error occurred'],
        confidence: 0.5,
        complexityScore: 0.3,
      };
    }
  }

  /**
   * Generate tests for the code
   */
  private async generateTests(code: string, request: CodeGenerationRequest): Promise<string[]> {
    const language = request.language || this.inferLanguage(request.prompt);

    const messages = [
      {
        role: 'system' as const,
        content: `Generate comprehensive tests for the following ${language} code.

Focus on:
- Normal cases
- Edge cases
- Error cases
- Boundary conditions

Return test code only, without explanations.`,
      },
      {
        role: 'user' as const,
        content: `Code to test:
${code}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 2000,
        temperature: 0.3,
        model: 'gpt-4o-mini',
      });
      return [this.extractCode(response.content, language)];
    } catch {
      return ['// Test generation failed'];
    }
  }

  /**
   * Generate explanation of the code
   */
  private async generateExplanation(result: CodeGenerationResult, request: CodeGenerationRequest): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: `Explain the code in a way that helps a developer understand:
1. What the code does
2. Why certain approaches were chosen
3. Key implementation details
4. How to use or modify it

Be clear and educational.`,
      },
      {
        role: 'user' as const,
        content: `Code: ${result.code.substring(0, 1000)}

Purpose: ${request.prompt}

Key features to explain:
- Approach used: ${result.approach}
- Language: ${result.language}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 800,
        temperature: 0.5,
        model: 'gpt-4o-mini',
      });
      return response.content;
    } catch {
      return `This code implements: ${request.prompt.substring(0, 50)}...`;
    }
  }

  /**
   * Store code generation in memory
   */
  private async storeGenerationMemory(result: CodeGenerationResult, request: CodeGenerationRequest, state: GenerationState): Promise<void> {
    try {
      const generationId = uuid();

      await prisma.agentTask.create({
        data: {
          sessionId: this.sessionId,
          type: 'code_generation',
          agentName: 'CodeGenerationSpecialist',
          status: 'completed',
          input: { prompt: request.prompt, style: request.style } as any,
          output: { codeLength: result.code.length, language: result.language } as any,
          cost: 0.0005,
        },
      });

      // Store code pattern as reusable knowledge
      await prisma.knowledgeNode.upsert({
        where: { id: `code_${this.userId}_${generationId}` },
        update: {},
        create: {
          id: `code_${this.userId}_${generationId}`,
          type: 'code',
          name: request.prompt.substring(0, 50),
          description: result.code,
          properties: {
            language: result.language,
            style: request.style,
            complexity: result.complexityScore,
          } as any,
        },
      });
    } catch (err) {
      console.warn('[CodeGenerationSpecialist] Could not store memory:', err);
    }
  }

  /**
   * Extract code from LLM response
   */
  private extractCode(content: string, language: Language): string {
    // Try to extract code from markdown
    const codeBlockRegex = /```(?:typescript|javascript|python|java|go|rust|csharp)?\s*([\s\S]*?)```/gi;
    const match = codeBlockRegex.exec(content);
    if (match) return match[1].trim();

    // If no code blocks, return content as-is
    return content;
  }

  /**
   * Infer language from prompt
   */
  private inferLanguage(prompt: string): Language {
    const lower = prompt.toLowerCase();
    if (lower.includes('react') || lower.includes('node') || lower.includes('express')) return 'javascript';
    if (lower.includes('py') || lower.includes('django') || lower.includes('flask')) return 'python';
    if (lower.includes('java')) return 'java';
    if (lower.includes('go') || lower.includes('golang')) return 'go';
    if (lower.includes('rust')) return 'rust';
    if (lower.includes('c#') || lower.includes('csharp')) return 'csharp';
    return 'javascript';
  }

  /**
   * Estimate code complexity
   */
  private estimateComplexity(code: string): number {
    const lines = code.split('\n').length;
    const indentCount = (code.match(/\s{4}/g) || []).length;
    const functionCount = (code.match(/\bfunction\b|\bconst\b.+=\s*\(.*\)\s*=>/g) || []).length;

    let complexity = 0.3;
    complexity += Math.min(0.3, lines / 100);
    complexity += Math.min(0.2, indentCount / 20);
    complexity += Math.min(0.2, functionCount / 5);

    return Math.min(1, complexity);
  }
}
