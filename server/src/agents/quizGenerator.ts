import { z } from 'zod';
import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { v4 as uuid } from 'uuid';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  subtopic?: string;
  bloomsLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  tags: string[];
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  description: string;
  questions: QuizQuestion[];
  totalQuestions: number;
  totalMarks: number;
  timeLimit?: number;
  passingScore: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  createdAt: Date;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: Array<{
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
    timeSpent: number;
  }>;
  score: number;
  totalMarks: number;
  percentage: number;
  completedAt: Date;
  timeTaken: number;
}

export interface QuizAnalytics {
  quizId: string;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  difficultyAnalysis: {
    easy: { correct: number; total: number };
    medium: { correct: number; total: number };
    hard: { correct: number; total: number };
  };
  topicAnalysis: Array<{
    topic: string;
    accuracy: number;
    needsReview: boolean;
  }>;
  questionAnalysis: Array<{
    questionId: string;
    correctRate: number;
    averageTime: number;
    discriminative: boolean;
  }>;
}

const QuizSchema = z.object({
  title: z.string(),
  topic: z.string(),
  description: z.string(),
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.number(),
    explanation: z.string(),
    difficulty: z.string(),
    bloomsLevel: z.string().optional(),
    tags: z.array(z.string()),
  })),
  timeLimit: z.number().optional(),
  passingScore: z.number(),
  difficulty: z.string(),
});

export class QuizGeneratorAgent {
  private userId: string;
  private sessionId: string;

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
  }

  async generateFromContent(
    content: string,
    topic: string,
    options: {
      questionCount?: number;
      difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
      types?: Array<'mcq' | 'true_false' | 'fill_blank' | 'short_answer'>;
      focusAreas?: string[];
    } = {}
  ): Promise<Quiz> {
    const questionCount = options.questionCount || 10;
    const difficulty = options.difficulty || 'mixed';
    const types = options.types || ['mcq', 'true_false'];

    const typeInstructions = types.map(t => {
      switch (t) {
        case 'mcq': return 'Multiple Choice Questions with 4 options';
        case 'true_false': return 'True/False questions';
        case 'fill_blank': return 'Fill in the blank questions';
        case 'short_answer': return 'Short answer questions';
      }
    }).join(', ');

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert quiz generator. Generate ${questionCount} high-quality questions from the given content.

Requirements:
- Difficulty: ${difficulty}
- Question Types: ${typeInstructions}
- Each question should test understanding, not just recall
- Include explanations for correct answers
- Vary the difficulty across questions
- Add Bloom's taxonomy levels where appropriate

Return JSON:
{
  "title": "Quiz on [Topic]",
  "topic": "${topic}",
  "description": "A comprehensive quiz testing knowledge of ${topic}",
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct",
      "difficulty": "easy|medium|hard",
      "bloomsLevel": "remember|understand|apply|analyze|evaluate|create",
      "tags": ["tag1", "tag2"]
    }
  ],
  "timeLimit": ${questionCount * 60},
  "passingScore": 60,
  "difficulty": "${difficulty}"
}`,
      },
      {
        role: 'user' as const,
        content: `Generate quiz from:\n\n${content.substring(0, 8000)}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 4000, temperature: 0.4 });
      const parsed = QuizSchema.parse(JSON.parse(response.content));

      const quiz: Quiz = {
        id: uuid(),
        title: parsed.title,
        topic: parsed.topic,
        description: parsed.description,
        questions: parsed.questions.map((q, idx) => ({
          id: uuid(),
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty as QuizQuestion['difficulty'],
          topic,
          bloomsLevel: q.bloomsLevel as QuizQuestion['bloomsLevel'],
          tags: q.tags,
        })),
        totalQuestions: parsed.questions.length,
        totalMarks: parsed.questions.length * 10,
        timeLimit: parsed.timeLimit,
        passingScore: parsed.passingScore,
        difficulty: parsed.difficulty as Quiz['difficulty'],
        createdAt: new Date(),
      };

      await this.saveQuiz(quiz);
      return quiz;
    } catch (error) {
      return this.getFallbackQuiz(topic);
    }
  }

  async generateFromSyllabus(
    syllabusText: string,
    topicCount: number = 5
  ): Promise<Quiz[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Parse syllabus and generate quiz questions for main topics.
Return JSON array (one quiz per topic):
[
  {
    "title": "Quiz on [Topic Name]",
    "topic": "[Topic Name]",
    "description": "Description",
    "questions": [...5 questions...],
    "difficulty": "medium"
  }
]`,
      },
      {
        role: 'user' as const,
        content: `Syllabus:\n\n${syllabusText}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 4000, temperature: 0.4 });
      const parsed = JSON.parse(response.content);

      const quizzes: Quiz[] = parsed.map((p: any) => ({
        id: uuid(),
        title: p.title,
        topic: p.topic,
        description: p.description,
        questions: p.questions.map((q: any, idx: number) => ({
          id: uuid(),
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: (q.difficulty || 'medium') as QuizQuestion['difficulty'],
          topic: p.topic,
          tags: q.tags || [],
        })),
        totalQuestions: p.questions.length,
        totalMarks: p.questions.length * 10,
        timeLimit: p.questions.length * 60,
        passingScore: 60,
        difficulty: (p.difficulty || 'medium') as Quiz['difficulty'],
        createdAt: new Date(),
      }));

      return quizzes.slice(0, topicCount);
    } catch {
      return [this.getFallbackQuiz('General')];
    }
  }

  async generateAdaptiveQuiz(
    userId: string,
    topic: string,
    performanceHistory: Array<{
      topic: string;
      score: number;
      difficulty: string;
    }>
  ): Promise<Quiz> {
    const topicPerformance = performanceHistory.filter(p => p.topic === topic);
    const avgScore = topicPerformance.length > 0
      ? topicPerformance.reduce((a, b) => a + b.score, 0) / topicPerformance.length
      : 50;

    let difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
    if (avgScore >= 80) difficulty = 'hard';
    else if (avgScore >= 60) difficulty = 'medium';
    else if (avgScore >= 40) difficulty = 'mixed';
    else difficulty = 'easy';

    const weakTopics = topicPerformance
      .filter(p => p.score < 60)
      .map(p => p.topic);

    const content = `Generate a ${difficulty} quiz on ${topic}.
${weakTopics.length > 0 ? `Focus on: ${weakTopics.join(', ')}` : ''}
Include questions that test deeper understanding.`;

    return this.generateFromContent(content, topic, {
      difficulty,
      questionCount: 10,
      focusAreas: weakTopics,
    });
  }

  async evaluateQuiz(
    quizId: string,
    answers: Array<{ questionId: string; selectedAnswer: number; timeSpent: number }>
  ): Promise<QuizAttempt> {
    const quiz = await this.getQuiz(quizId);
    if (!quiz) throw new Error('Quiz not found');

    let score = 0;
    const evaluatedAnswers = answers.map(answer => {
      const question = quiz.questions.find(q => q.id === answer.questionId);
      const isCorrect = question ? question.correctAnswer === answer.selectedAnswer : false;
      if (isCorrect) score += 10;
      return { ...answer, isCorrect };
    });

    const attempt: QuizAttempt = {
      id: uuid(),
      quizId,
      userId: this.userId,
      answers: evaluatedAnswers,
      score,
      totalMarks: quiz.totalMarks,
      percentage: (score / quiz.totalMarks) * 100,
      completedAt: new Date(),
      timeTaken: answers.reduce((a, b) => a + b.timeSpent, 0),
    };

    await this.saveAttempt(attempt);
    return attempt;
  }

  async getQuizAnalytics(quizId: string): Promise<QuizAnalytics> {
    const attempts = await prisma.agentOutput.findMany({
      where: { type: 'quiz_attempt' as any },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const quizAttempts = attempts
      .map(a => a.content as any)
      .filter(a => a.quizId === quizId);

    if (quizAttempts.length === 0) {
      return {
        quizId,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        difficultyAnalysis: { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } },
        topicAnalysis: [],
        questionAnalysis: [],
      };
    }

    const averageScore = quizAttempts.reduce((a, b) => a + b.percentage, 0) / quizAttempts.length;
    const passCount = quizAttempts.filter(a => a.percentage >= 60).length;
    const passRate = (passCount / quizAttempts.length) * 100;

    return {
      quizId,
      totalAttempts: quizAttempts.length,
      averageScore,
      passRate,
      difficultyAnalysis: { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } },
      topicAnalysis: [],
      questionAnalysis: [],
    };
  }

  async getSuggestedRemediation(
    attempt: QuizAttempt
  ): Promise<{
    weakTopics: string[];
    reviewResources: string[];
    nextSteps: string[];
  }> {
    const wrongAnswers = attempt.answers.filter(a => !a.isCorrect);
    const weakTopics = wrongAnswers.map(a => a.questionId);

    const messages = [
      {
        role: 'system' as const,
        content: 'Based on quiz performance, suggest remediation. Return JSON:',
      },
      {
        role: 'user' as const,
        content: `Wrong answers: ${wrongAnswers.length}/${attempt.totalMarks / 10}
Score: ${attempt.percentage.toFixed(1)}%
Identify weak topics and suggest review resources.`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 500, temperature: 0.3 });
      return JSON.parse(response.content);
    } catch {
      return {
        weakTopics: ['Review all incorrect answers'],
        reviewResources: ['Review class notes', 'Watch video tutorials'],
        nextSteps: ['Practice more questions', 'Take another quiz'],
      };
    }
  }

  private async getQuiz(quizId: string): Promise<Quiz | null> {
    const output = await prisma.agentOutput.findFirst({
      where: { type: 'quiz' as any, sessionId: quizId },
    });
    return output?.content as unknown as Quiz;
  }

  private async saveQuiz(quiz: Quiz): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'quiz' as any,
        content: quiz as unknown as object,
        confidence: 1,
      },
    });
  }

  private async saveAttempt(attempt: QuizAttempt): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: attempt.quizId,
        taskId: uuid(),
        type: 'quiz_attempt' as any,
        content: {
          ...attempt,
          userId: this.userId,
        } as unknown as object,
        confidence: attempt.percentage / 100,
      },
    });
  }

  private getFallbackQuiz(topic: string): Quiz {
    return {
      id: uuid(),
      title: `Quiz on ${topic}`,
      topic,
      description: `Assessment of ${topic} knowledge`,
      questions: [
        {
          id: uuid(),
          question: `What is a key concept in ${topic}?`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0,
          explanation: 'This is the correct answer',
          difficulty: 'medium',
          topic,
          tags: [topic],
        },
      ],
      totalQuestions: 1,
      totalMarks: 10,
      timeLimit: 60,
      passingScore: 60,
      difficulty: 'mixed',
      createdAt: new Date(),
    };
  }
}

export class QuizBankAgent {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async addToBank(questions: QuizQuestion[]): Promise<void> {
    for (const q of questions) {
      await prisma.agentOutput.create({
        data: {
          sessionId: this.userId,
          taskId: uuid(),
          type: 'question_bank' as any,
          content: q as unknown as object,
          confidence: 1,
        },
      });
    }
  }

  async getFromBank(
    topic?: string,
    difficulty?: string,
    count: number = 10
  ): Promise<QuizQuestion[]> {
    const outputs = await prisma.agentOutput.findMany({
      where: { type: 'question_bank' as any },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    let questions = outputs.map(o => o.content as unknown as QuizQuestion);

    if (topic) {
      questions = questions.filter(q => q.topic.toLowerCase().includes(topic.toLowerCase()));
    }
    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }

    return questions.slice(0, count);
  }
}
