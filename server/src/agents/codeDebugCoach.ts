import { z } from 'zod';
import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { v4 as uuid } from 'uuid';

export interface DebugStep {
  stepNumber: number;
  title: string;
  explanation: string;
  codeHighlight?: string;
  concept: string;
  whyItFails: string;
  fix: string;
  similarMistakes: string[];
}

export interface CodeAnalysis {
  id: string;
  language: string;
  issues: Array<{
    type: 'syntax' | 'logic' | 'runtime' | 'performance' | 'security' | 'style';
    severity: 'critical' | 'major' | 'minor';
    line?: number;
    description: string;
    explanation: string;
    fix: string;
    conceptExplanation: string;
  }>;
  overallAssessment: string;
  complexityScore: number;
}

export interface LogicExplanation {
  id: string;
  userCode: string;
  whatItDoes: string;
  whatItShouldDo: string;
  gap: string;
  conceptualIssue: string;
  fix: string;
  explanation: string;
}

export interface ConceptRecommendation {
  concept: string;
  topic: string;
  resourceType: 'video' | 'article' | 'exercise' | 'documentation';
  title: string;
  url?: string;
  relevance: number;
}

export interface DebugPattern {
  id: string;
  pattern: string;
  frequency: number;
  topics: string[];
  lastOccurrence?: Date;
  improvement: string;
}

export interface UnitTestLearning {
  id: string;
  testCase: {
    input: string;
    expected: string;
    actual?: string;
    passed: boolean;
  };
  explanation: string;
  hints: string[];
  relatedConcepts: string[];
}

const CodeAnalysisSchema = z.object({
  language: z.string(),
  issues: z.array(z.object({
    type: z.string(),
    severity: z.string(),
    line: z.number().optional(),
    description: z.string(),
    explanation: z.string(),
    fix: z.string(),
    conceptExplanation: z.string(),
  })),
  overallAssessment: z.string(),
  complexityScore: z.number(),
});

export class CodeDebugCoachAgent {
  private userId: string;
  private sessionId: string;
  private codeHistory: Array<{ code: string; language: string; timestamp: Date }> = [];

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
  }

  async explainDebugStepwise(
    code: string,
    language: string,
    error?: string,
    expectedBehavior?: string
  ): Promise<DebugStep[]> {
    this.codeHistory.push({ code, language, timestamp: new Date() });

    const messages = [
      {
        role: 'system' as const,
        content: `You are a code debug tutor. Explain errors step-by-step, focusing on:
1. What the error is
2. Why it happens (concept)
3. How to fix it
4. Similar mistakes to avoid

Return JSON array:
[
  {
    "stepNumber": 1,
    "title": "Step title",
    "explanation": "Detailed explanation",
    "codeHighlight": "relevant code snippet",
    "concept": "underlying concept being violated",
    "whyItFails": "why this code fails",
    "fix": "how to fix it",
    "similarMistakes": ["mistake 1", "mistake 2"]
  }
]`,
      },
      {
        role: 'user' as const,
        content: `Language: ${language}
Error: ${error || 'None provided'}
Expected: ${expectedBehavior || 'Not specified'}
Code:
\`\`\`${language}
${code}
\`\`\``,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 2500, temperature: 0.3 });
      const parsed = JSON.parse(response.content);
      
      await this.saveDebugSession(code, language, parsed);
      return parsed;
    } catch {
      return this.getFallbackDebugSteps(code, language, error);
    }
  }

  async analyzeCode(code: string, language: string): Promise<CodeAnalysis> {
    const messages = [
      {
        role: 'system' as const,
        content: `Analyze code for issues. Return JSON:
{
  "language": "${language}",
  "issues": [
    {
      "type": "syntax|logic|runtime|performance|security|style",
      "severity": "critical|major|minor",
      "line": 10,
      "description": "what's wrong",
      "explanation": "why it's wrong",
      "fix": "how to fix",
      "conceptExplanation": "concept being violated"
    }
  ],
  "overallAssessment": "summary",
  "complexityScore": 1-10
}`,
      },
      {
        role: 'user' as const,
        content: `Analyze:
\`\`\`${language}
${code}
\`\`\``,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.2 });
      const parsed = CodeAnalysisSchema.parse(JSON.parse(response.content));
      
      const analysis: CodeAnalysis = {
        id: uuid(),
        language: parsed.language,
        issues: parsed.issues.map((i: any) => ({
          ...i,
          type: i.type as CodeAnalysis['issues'][0]['type'],
          severity: i.severity as CodeAnalysis['issues'][0]['severity'],
        })),
        overallAssessment: parsed.overallAssessment,
        complexityScore: parsed.complexityScore,
      };

      await this.saveAnalysis(analysis);
      return analysis;
    } catch {
      return {
        id: uuid(),
        language,
        issues: [],
        overallAssessment: 'Analysis unavailable',
        complexityScore: 5,
      };
    }
  }

  async explainWhyLogicFails(
    code: string,
    expectedOutput: string,
    actualOutput: string,
    language: string
  ): Promise<LogicExplanation> {
    const messages = [
      {
        role: 'system' as const,
        content: `Explain why the code produces wrong output. Focus on:
1. What the code actually does vs what it should do
2. The logical gap
3. Conceptual misunderstanding
4. How to fix it

Return JSON:
{
  "userCode": "relevant code",
  "whatItDoes": "what the code does",
  "whatItShouldDo": "what it should do",
  "gap": "the logical gap",
  "conceptualIssue": "underlying concept",
  "fix": "corrected code",
  "explanation": "detailed explanation"
}`,
      },
      {
        role: 'user' as const,
        content: `Language: ${language}
Expected: ${expectedOutput}
Actual: ${actualOutput}
Code:
\`\`\`${language}
${code}
\`\`\``,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1500, temperature: 0.3 });
      const parsed = JSON.parse(response.content);
      
      return {
        id: uuid(),
        ...parsed,
      };
    } catch {
      return {
        id: uuid(),
        userCode: code.substring(0, 200),
        whatItDoes: 'Unable to determine',
        whatItShouldDo: expectedOutput,
        gap: 'Analysis unavailable',
        conceptualIssue: 'Unknown',
        fix: 'Review code logic',
        explanation: 'Please try again',
      };
    }
  }

  async suggestConceptResources(
    code: string,
    language: string,
    identifiedConcepts: string[]
  ): Promise<ConceptRecommendation[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Suggest learning resources for these concepts. Return JSON array:
[
  {
    "concept": "concept name",
    "topic": "parent topic",
    "resourceType": "video|article|exercise|documentation",
    "title": "resource title",
    "url": "optional url",
    "relevance": 0-100
  }
]`,
      },
      {
        role: 'user' as const,
        content: `Language: ${language}
Concepts to learn: ${identifiedConcepts.join(', ')}
Code context:
\`\`\`${language}
${code.substring(0, 1000)}
\`\`\``,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1500, temperature: 0.4 });
      return JSON.parse(response.content);
    } catch {
      return identifiedConcepts.map(c => ({
        concept: c,
        topic: language,
        resourceType: 'documentation' as const,
        title: `Learn ${c}`,
        relevance: 80,
      }));
    }
  }

  async detectDebugPatterns(): Promise<DebugPattern[]> {
    const recentHistory = this.codeHistory.slice(-20);
    
    const patterns = this.detectCommonMistakes(recentHistory);
    
    for (const pattern of patterns) {
      await prisma.agentOutput.create({
        data: {
          sessionId: this.sessionId,
          taskId: uuid(),
          type: 'debug_pattern' as any,
          content: pattern as unknown as object,
          confidence: 1,
        },
      });
    }
    
    return patterns;
  }

  async learnFromUnitTest(
    code: string,
    testInput: string,
    expectedOutput: string,
    actualOutput: string,
    language: string
  ): Promise<UnitTestLearning> {
    const testPassed = expectedOutput.trim() === actualOutput.trim();
    
    const messages = [
      {
        role: 'system' as const,
        content: `Explain a unit test failure or success. Return JSON:
{
  "testCase": {
    "input": "test input",
    "expected": "expected output",
    "actual": "actual output",
    "passed": true/false
  },
  "explanation": "what this test teaches",
  "hints": ["hint 1", "hint 2"],
  "relatedConcepts": ["concept 1", "concept 2"]
}`,
      },
      {
        role: 'user' as const,
        content: `Test ${testPassed ? 'passed' : 'failed'}
Language: ${language}
Input: ${testInput}
Expected: ${expectedOutput}
Actual: ${actualOutput}
Code:
\`\`\`${language}
${code}
\`\`\``,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1000, temperature: 0.3 });
      const parsed = JSON.parse(response.content);
      
      return {
        id: uuid(),
        ...parsed,
      };
    } catch {
      return {
        id: uuid(),
        testCase: {
          input: testInput,
          expected: expectedOutput,
          actual: actualOutput,
          passed: testPassed,
        },
        explanation: testPassed ? 'Correct implementation' : 'Incorrect implementation',
        hints: ['Review the logic'],
        relatedConcepts: [],
      };
    }
  }

  async createDebugExercise(
    topic: string,
    language: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<{
    description: string;
    buggyCode: string;
    error: string;
    hints: string[];
    solution: string;
    concepts: string[];
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `Create a debug practice exercise. Return JSON:
{
  "description": "what to fix",
  "buggyCode": "code with bug",
  "error": "what error occurs",
  "hints": ["hint1", "hint2"],
  "solution": "corrected code",
  "concepts": ["concept1", "concept2"]
}`,
      },
      {
        role: 'user' as const,
        content: `Create ${difficulty} exercise for ${topic} in ${language}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1500, temperature: 0.5 });
      return JSON.parse(response.content);
    } catch {
      return {
        description: 'Debug exercise unavailable',
        buggyCode: '// Try again',
        error: 'N/A',
        hints: [],
        solution: '',
        concepts: [],
      };
    }
  }

  private detectCommonMistakes(history: Array<{ code: string; language: string }>): DebugPattern[] {
    const patterns: DebugPattern[] = [];
    
    const commonPatterns: Record<string, { topics: string[]; fix: string }> = {
      'off-by-one': { topics: ['Loops', 'Arrays'], fix: 'Check loop boundaries' },
      'null-undefined': { topics: ['Types', 'Null Safety'], fix: 'Add null checks' },
      'async-await': { topics: ['Async', 'Promises'], fix: 'Use await properly' },
      'variable-scope': { topics: ['Scope', 'Closures'], fix: 'Check variable scope' },
    };

    const codeText = history.map(h => h.code).join(' ');
    
    for (const [pattern, info] of Object.entries(commonPatterns)) {
      if (codeText.includes(pattern) || codeText.includes(pattern.replace('-', ' '))) {
        patterns.push({
          id: uuid(),
          pattern,
          frequency: 1,
          topics: info.topics,
          lastOccurrence: new Date(),
          improvement: info.fix,
        });
      }
    }

    return patterns;
  }

  private async saveDebugSession(code: string, language: string, steps: any[]): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'debug_session' as any,
        content: {
          userId: this.userId,
          code,
          language,
          steps,
          timestamp: new Date(),
        } as unknown as object,
        confidence: 0.9,
      },
    });
  }

  private async saveAnalysis(analysis: CodeAnalysis): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'code_analysis' as any,
        content: analysis as unknown as object,
        confidence: 0.9,
      },
    });
  }

  private getFallbackDebugSteps(code: string, language: string, error?: string): DebugStep[] {
    return [
      {
        stepNumber: 1,
        title: 'Analyze the Error',
        explanation: error || 'Review your code for issues',
        codeHighlight: code.substring(0, 200),
        concept: 'Debugging fundamentals',
        whyItFails: 'There is an issue in the code',
        fix: 'Check the error message and line numbers',
        similarMistakes: ['Typos', 'Missing semicolons'],
      },
    ];
  }
}

export class CodeEvolutionWatcher {
  private userId: string;
  private versions: Array<{ timestamp: Date; code: string; issue: string }> = [];

  constructor(userId: string) {
    this.userId = userId;
  }

  async trackCodeVersion(code: string, issue: string): Promise<void> {
    this.versions.push({ timestamp: new Date(), code, issue });
  }

  async getImprovementScore(): Promise<{
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    summary: string;
  }> {
    if (this.versions.length < 2) {
      return { score: 50, trend: 'stable', summary: 'Not enough data' };
    }

    const recent = this.versions.slice(-5);
    const older = this.versions.slice(-10, -5);
    
    const improvement = recent.length > older.length ? 10 : 0;
    const score = Math.min(100, 50 + improvement);

    return {
      score,
      trend: improvement > 0 ? 'improving' : 'stable',
      summary: `Based on ${this.versions.length} code submissions`,
    };
  }
}
