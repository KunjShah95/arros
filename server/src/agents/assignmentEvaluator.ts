import { z } from 'zod';
import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { v4 as uuid } from 'uuid';

export interface Rubric {
  id: string;
  name: string;
  type: 'essay' | 'code' | 'presentation' | 'lab_report' | 'research_paper';
  criteria: RubricCriterion[];
  totalPoints: number;
  passingThreshold: number;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  levels: Array<{
    score: number;
    description: string;
    characteristics: string[];
  }>;
  weight: number;
}

export interface EssayEvaluation {
  id: string;
  overallScore: number;
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
  criteriaScores: Array<{
    criterionId: string;
    criterionName: string;
    score: number;
    maxScore: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }>;
  overallFeedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  improvementPath: string[];
  aPlusComparison: string;
}

export interface CodeEvaluation {
  id: string;
  overallScore: number;
  grade: string;
  categories: {
    correctness: { score: number; feedback: string; issues: string[] };
    efficiency: { score: number; feedback: string; issues: string[] };
    readability: { score: number; feedback: string; issues: string[] };
    documentation: { score: number; feedback: string; issues: string[] };
    testing: { score: number; feedback: string; issues: string[] };
    bestPractices: { score: number; feedback: string; issues: string[] };
  };
  bugs: Array<{
    line?: number;
    type: 'logic' | 'syntax' | 'runtime' | 'style' | 'security';
    severity: 'critical' | 'major' | 'minor';
    description: string;
    suggestion: string;
  }>;
  suggestions: string[];
  refactoredCode?: string;
  testCases?: Array<{ input: string; expected: string; actual?: string }>;
}

export interface PresentationEvaluation {
  id: string;
  overallScore: number;
  grade: string;
  slides: Array<{
    slideNumber: number;
    title: string;
    issues: string[];
    suggestions: string[];
  }>;
  categories: {
    content: { score: number; feedback: string };
    design: { score: number; feedback: string };
    structure: { score: number; feedback: string };
    visualAids: { score: number; feedback: string };
    citations: { score: number; feedback: string };
  };
  overallFeedback: string;
  speakerNotes: string[];
}

export interface LabReportEvaluation {
  id: string;
  overallScore: number;
  grade: string;
  sections: {
    abstract: { score: number; feedback: string };
    introduction: { score: number; feedback: string };
    methodology: { score: number; feedback: string };
    results: { score: number; feedback: string };
    discussion: { score: number; feedback: string };
    conclusion: { score: number; feedback: string };
    references: { score: number; feedback: string };
  };
  dataAnalysis: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  scientificMethod: {
    hypothesisClear: boolean;
    variablesIdentified: boolean;
    controlledVariables: boolean;
    reproducibility: boolean;
  };
}

export interface VersionComparison {
  improvements: string[];
  regressions: string[];
  scoreChange: number;
  detailedDiff: Array<{
    section: string;
    v1: string;
    v2: string;
    improvement: string;
  }>;
}

const EssayEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  grade: z.string(),
  criteriaScores: z.array(z.object({
    criterionId: z.string(),
    criterionName: z.string(),
    score: z.number(),
    maxScore: z.number(),
    feedback: z.string(),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
  })),
  overallFeedback: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
  improvementPath: z.array(z.string()),
  aPlusComparison: z.string(),
});

const CodeEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  grade: z.string(),
  categories: z.object({
    correctness: z.object({ score: z.number(), feedback: z.string(), issues: z.array(z.string()) }),
    efficiency: z.object({ score: z.number(), feedback: z.string(), issues: z.array(z.string()) }),
    readability: z.object({ score: z.number(), feedback: z.string(), issues: z.array(z.string()) }),
    documentation: z.object({ score: z.number(), feedback: z.string(), issues: z.array(z.string()) }),
    testing: z.object({ score: z.number(), feedback: z.string(), issues: z.array(z.string()) }),
    bestPractices: z.object({ score: z.number(), feedback: z.string(), issues: z.array(z.string()) }),
  }),
  bugs: z.array(z.object({
    line: z.number().optional(),
    type: z.string(),
    severity: z.string(),
    description: z.string(),
    suggestion: z.string(),
  })),
  suggestions: z.array(z.string()),
});

export class AssignmentEvaluatorAgent {
  private userId: string;
  private sessionId: string;

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
  }

  async evaluateEssay(
    content: string,
    rubric: Rubric,
    assignmentType: 'essay' | 'research_paper' | 'reflection' = 'essay'
  ): Promise<EssayEvaluation> {
    const criteriaDescription = rubric.criteria.map(c => 
      `- ${c.name} (${c.maxPoints} pts): ${c.description}`
    ).join('\n');

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert academic evaluator. Evaluate essays against rubric criteria.
        
Assignment Type: ${assignmentType}
Total Points: ${rubric.totalPoints}
Passing Threshold: ${rubric.passingThreshold}%

Rubric Criteria:
${criteriaDescription}

Return JSON:
{
  "overallScore": 0-100,
  "grade": "A+|A|A-|B+|B|B-|C+|C|C-|D|F",
  "criteriaScores": [
    {
      "criterionId": "id",
      "criterionName": "name",
      "score": 0-maxPoints,
      "maxScore": maxPoints,
      "feedback": "specific feedback",
      "strengths": ["strength1"],
      "improvements": ["improvement1"]
    }
  ],
  "overallFeedback": "comprehensive feedback",
  "strengths": ["overall strength"],
  "weaknesses": ["area to improve"],
  "suggestions": ["actionable suggestion"],
  "improvementPath": ["step 1 to improve", "step 2"],
  "aPlusComparison": "what differentiates this from A+ work"
}`,
      },
      {
        role: 'user' as const,
        content: `Essay Content:\n\n${content.substring(0, 8000)}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 2500, temperature: 0.3 });
      const parsed = EssayEvaluationSchema.parse(JSON.parse(response.content));
      
      const evaluation: EssayEvaluation = {
        id: uuid(),
        overallScore: parsed.overallScore,
        grade: parsed.grade as EssayEvaluation['grade'],
        criteriaScores: parsed.criteriaScores,
        overallFeedback: parsed.overallFeedback,
        strengths: parsed.strengths,
        weaknesses: parsed.weaknesses,
        suggestions: parsed.suggestions,
        improvementPath: parsed.improvementPath,
        aPlusComparison: parsed.aPlusComparison,
      };

      await this.saveEvaluation('essay', evaluation);
      return evaluation;
    } catch (error) {
      return this.getFallbackEssayEvaluation(rubric);
    }
  }

  async evaluateCode(
    code: string,
    language: string,
    criteria?: {
      checkCorrectness?: boolean;
      checkEfficiency?: boolean;
      checkStyle?: boolean;
      checkDocumentation?: boolean;
      checkTesting?: boolean;
    }
  ): Promise<CodeEvaluation> {
    const enabledChecks = criteria || {
      checkCorrectness: true,
      checkEfficiency: true,
      checkStyle: true,
      checkDocumentation: true,
      checkTesting: true,
    };

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert code reviewer and educator. Evaluate code for:
- Correctness: Does it work? Does it handle edge cases?
- Efficiency: Time and space complexity
- Readability: Naming, structure, clarity
- Documentation: Comments, docstrings
- Testing: Test coverage, test quality
- Best Practices: Language-specific conventions

Return JSON:
{
  "overallScore": 0-100,
  "grade": "A+ to F",
  "categories": {
    "correctness": {"score": 0-100, "feedback": "...", "issues": []},
    "efficiency": {"score": 0-100, "feedback": "...", "issues": []},
    "readability": {"score": 0-100, "feedback": "...", "issues": []},
    "documentation": {"score": 0-100, "feedback": "...", "issues": []},
    "testing": {"score": 0-100, "feedback": "...", "issues": []},
    "bestPractices": {"score": 0-100, "feedback": "...", "issues": []}
  },
  "bugs": [
    {"line": 10, "type": "logic|syntax|runtime|style|security", "severity": "critical|major|minor", "description": "...", "suggestion": "..."}
  ],
  "suggestions": ["improvement suggestion"]
}`,
      },
      {
        role: 'user' as const,
        content: `Language: ${language}
Enabled Checks: ${JSON.stringify(enabledChecks)}

Code:
\`\`\`${language}
${code}
\`\`\``,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 3000, temperature: 0.3 });
      const parsed = CodeEvaluationSchema.parse(JSON.parse(response.content));
      
      const evaluation: CodeEvaluation = {
        id: uuid(),
        overallScore: parsed.overallScore,
        grade: parsed.grade,
        categories: parsed.categories,
        bugs: parsed.bugs.map((b: any) => ({
          ...b,
          type: b.type as CodeEvaluation['bugs'][0]['type'],
          severity: b.severity as CodeEvaluation['bugs'][0]['severity'],
        })),
        suggestions: parsed.suggestions,
      };

      await this.saveEvaluation('code', evaluation);
      return evaluation;
    } catch {
      return this.getFallbackCodeEvaluation();
    }
  }

  async evaluatePresentation(
    slides: Array<{ title: string; content: string; notes?: string }>,
    rubric?: Rubric
  ): Promise<PresentationEvaluation> {
    const slidesText = slides.map((s, i) => 
      `Slide ${i + 1}: ${s.title}\n${s.content}${s.notes ? `\nNotes: ${s.notes}` : ''}`
    ).join('\n\n---\n\n');

    const messages = [
      {
        role: 'system' as const,
        content: `Evaluate a presentation/slides. Consider:
- Content quality and depth
- Visual design and layout
- Logical structure and flow
- Effective use of visual aids
- Proper citations and references

Return JSON:
{
  "overallScore": 0-100,
  "grade": "A+ to F",
  "slides": [
    {"slideNumber": 1, "title": "...", "issues": [], "suggestions": []}
  ],
  "categories": {
    "content": {"score": 0-100, "feedback": "..."},
    "design": {"score": 0-100, "feedback": "..."},
    "structure": {"score": 0-100, "feedback": "..."},
    "visualAids": {"score": 0-100, "feedback": "..."},
    "citations": {"score": 0-100, "feedback": "..."}
  },
  "overallFeedback": "...",
  "speakerNotes": ["suggestion for presenting"]
}`,
      },
      {
        role: 'user' as const,
        content: `Presentation Slides:\n\n${slidesText}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 2500, temperature: 0.3 });
      const parsed = JSON.parse(response.content);
      
      const evaluation: PresentationEvaluation = {
        id: uuid(),
        ...parsed,
      };

      await this.saveEvaluation('presentation', evaluation);
      return evaluation;
    } catch {
      return this.getFallbackPresentationEvaluation();
    }
  }

  async evaluateLabReport(
    content: string,
    labType: 'physics' | 'chemistry' | 'biology' | 'engineering' | 'computer_science' = 'physics'
  ): Promise<LabReportEvaluation> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a scientific lab report evaluator. Evaluate for:
- Proper scientific method
- Clear hypothesis and variables
- Accurate data analysis
- Logical conclusions
- Proper citations

Lab Type: ${labType}

Return JSON:
{
  "overallScore": 0-100,
  "grade": "A+ to F",
  "sections": {
    "abstract": {"score": 0-100, "feedback": "..."},
    "introduction": {"score": 0-100, "feedback": "..."},
    "methodology": {"score": 0-100, "feedback": "..."},
    "results": {"score": 0-100, "feedback": "..."},
    "discussion": {"score": 0-100, "feedback": "..."},
    "conclusion": {"score": 0-100, "feedback": "..."},
    "references": {"score": 0-100, "feedback": "..."}
  },
  "dataAnalysis": {
    "score": 0-100,
    "issues": [],
    "suggestions": []
  },
  "scientificMethod": {
    "hypothesisClear": true/false,
    "variablesIdentified": true/false,
    "controlledVariables": true/false,
    "reproducibility": true/false
  }
}`,
      },
      {
        role: 'user' as const,
        content: `Lab Report Content:\n\n${content.substring(0, 8000)}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 2500, temperature: 0.3 });
      const parsed = JSON.parse(response.content);
      
      const evaluation: LabReportEvaluation = {
        id: uuid(),
        ...parsed,
      };

      await this.saveEvaluation('lab_report', evaluation);
      return evaluation;
    } catch {
      return this.getFallbackLabReportEvaluation();
    }
  }

  async suggestImprovements(
    work: string,
    workType: 'essay' | 'code' | 'presentation' | 'lab_report',
    targetGrade: 'A' | 'A+' = 'A+'
  ): Promise<{
    improvements: string[];
    beforeExample: string;
    afterExample: string;
    priorityActions: string[];
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `Analyze work and provide specific improvements to achieve ${targetGrade} grade.
        
Return JSON:
{
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "beforeExample": "example of current quality",
  "afterExample": "example of improved quality",
  "priorityActions": ["most important change to make first"]
}`,
      },
      {
        role: 'user' as const,
        content: `Work Type: ${workType}\nTarget Grade: ${targetGrade}\n\nContent:\n${work.substring(0, 5000)}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1500, temperature: 0.4 });
      return JSON.parse(response.content);
    } catch {
      return {
        improvements: ['Review structure and organization'],
        beforeExample: 'Current version',
        afterExample: 'Improved version with better structure',
        priorityActions: ['Focus on the main weaknesses identified'],
      };
    }
  }

  async compareVersions(
    v1: string,
    v2: string,
    workType: 'essay' | 'code' | 'presentation'
  ): Promise<VersionComparison> {
    const messages = [
      {
        role: 'system' as const,
        content: `Compare two versions of ${workType} work and identify improvements and regressions.

Return JSON:
{
  "improvements": ["what got better"],
  "regressions": ["what got worse or was removed"],
  "scoreChange": -10 to +10,
  "detailedDiff": [
    {
      "section": "section name",
      "v1": "version 1 content",
      "v2": "version 2 content",
      "improvement": "what changed"
    }
  ]
}`,
      },
      {
        role: 'user' as const,
        content: `VERSION 1:\n${v1.substring(0, 3000)}\n\n---\n\nVERSION 2:\n${v2.substring(0, 3000)}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.3 });
      return JSON.parse(response.content);
    } catch {
      return {
        improvements: [],
        regressions: [],
        scoreChange: 0,
        detailedDiff: [],
      };
    }
  }

  async createRubric(
    name: string,
    type: Rubric['type'],
    criteria: Array<{
      name: string;
      description: string;
      maxPoints: number;
      weight?: number;
    }>
  ): Promise<Rubric> {
    const rubricCriteria: RubricCriterion[] = criteria.map((c, i) => ({
      id: uuid(),
      name: c.name,
      description: c.description,
      maxPoints: c.maxPoints,
      weight: c.weight || 1,
      levels: [
        { score: c.maxPoints, description: 'Excellent', characteristics: ['Exceeds expectations'] },
        { score: c.maxPoints * 0.8, description: 'Good', characteristics: ['Meets expectations'] },
        { score: c.maxPoints * 0.6, description: 'Satisfactory', characteristics: ['Adequate'] },
        { score: c.maxPoints * 0.4, description: 'Needs Improvement', characteristics: ['Below expectations'] },
        { score: 0, description: 'Unsatisfactory', characteristics: ['Does not meet requirements'] },
      ],
    }));

    const rubric: Rubric = {
      id: uuid(),
      name,
      type,
      criteria: rubricCriteria,
      totalPoints: rubricCriteria.reduce((sum, c) => sum + c.maxPoints, 0),
      passingThreshold: 60,
    };

    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'rubric',
        content: rubric as unknown as object,
        confidence: 1,
      },
    });

    return rubric;
  }

  async getRubrics(type?: Rubric['type']): Promise<Rubric[]> {
    const outputs = await prisma.agentOutput.findMany({
      where: { type: 'rubric' as any },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    let rubrics = outputs.map(o => o.content as unknown as Rubric);
    
    if (type) {
      rubrics = rubrics.filter(r => r.type === type);
    }

    return rubrics;
  }

  private async saveEvaluation(type: string, evaluation: any): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: `evaluation_${type}` as any,
        content: {
          userId: this.userId,
          ...evaluation,
        } as unknown as object,
        confidence: evaluation.overallScore / 100,
      },
    });
  }

  private getFallbackEssayEvaluation(rubric: Rubric): EssayEvaluation {
    return {
      id: uuid(),
      overallScore: 70,
      grade: 'B-',
      criteriaScores: rubric.criteria.map(c => ({
        criterionId: c.id,
        criterionName: c.name,
        score: c.maxPoints * 0.7,
        maxScore: c.maxPoints,
        feedback: 'Evaluation unavailable. Please try again.',
        strengths: [],
        improvements: ['Review and resubmit for detailed feedback'],
      })),
      overallFeedback: 'Unable to evaluate at this time.',
      strengths: [],
      weaknesses: [],
      suggestions: ['Resubmit for detailed evaluation'],
      improvementPath: [],
      aPlusComparison: 'Submit again for comparison',
    };
  }

  private getFallbackCodeEvaluation(): CodeEvaluation {
    return {
      id: uuid(),
      overallScore: 70,
      grade: 'B-',
      categories: {
        correctness: { score: 70, feedback: 'Unable to analyze', issues: [] },
        efficiency: { score: 70, feedback: 'Unable to analyze', issues: [] },
        readability: { score: 70, feedback: 'Unable to analyze', issues: [] },
        documentation: { score: 70, feedback: 'Unable to analyze', issues: [] },
        testing: { score: 70, feedback: 'Unable to analyze', issues: [] },
        bestPractices: { score: 70, feedback: 'Unable to analyze', issues: [] },
      },
      bugs: [],
      suggestions: ['Resubmit for detailed code review'],
    };
  }

  private getFallbackPresentationEvaluation(): PresentationEvaluation {
    return {
      id: uuid(),
      overallScore: 70,
      grade: 'B-',
      slides: [],
      categories: {
        content: { score: 70, feedback: 'Unable to analyze' },
        design: { score: 70, feedback: 'Unable to analyze' },
        structure: { score: 70, feedback: 'Unable to analyze' },
        visualAids: { score: 70, feedback: 'Unable to analyze' },
        citations: { score: 70, feedback: 'Unable to analyze' },
      },
      overallFeedback: 'Unable to evaluate at this time.',
      speakerNotes: [],
    };
  }

  private getFallbackLabReportEvaluation(): LabReportEvaluation {
    return {
      id: uuid(),
      overallScore: 70,
      grade: 'B-',
      sections: {
        abstract: { score: 70, feedback: '' },
        introduction: { score: 70, feedback: '' },
        methodology: { score: 70, feedback: '' },
        results: { score: 70, feedback: '' },
        discussion: { score: 70, feedback: '' },
        conclusion: { score: 70, feedback: '' },
        references: { score: 70, feedback: '' },
      },
      dataAnalysis: { score: 70, issues: [], suggestions: [] },
      scientificMethod: {
        hypothesisClear: false,
        variablesIdentified: false,
        controlledVariables: false,
        reproducibility: false,
      },
    };
  }
}

export class QuickFeedbackGenerator {
  async generateQuickFeedback(work: string, type: 'essay' | 'code' | 'presentation'): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Provide 2-3 sentences of constructive feedback on this work. Be specific and encouraging.',
      },
      {
        role: 'user' as const,
        content: `${type}:\n${work.substring(0, 2000)}`,
      },
    ];

    const response = await llmService.chat(messages, { maxTokens: 200, temperature: 0.5 });
    return response.content;
  }
}
