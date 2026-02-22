import { z } from 'zod';
import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { v4 as uuid } from 'uuid';

export interface MasteryRecord {
  id: string;
  userId: string;
  topicId: string;
  topicName: string;
  masteryLevel: number;
  confidenceScore: number;
  lastPracticed: Date;
  practiceCount: number;
  correctCount: number;
  streakDays: number;
  weakSubtopics: string[];
  strongSubtopics: string[];
  recommendedNext: string;
  timeSpentMinutes: number;
}

export interface HintLevel {
  level: number;
  type: 'guiding_question' | 'concept_pointer' | 'partial_solution' | 'full_solution';
  content: string;
  explanation: string;
}

export interface AdaptiveDifficulty {
  current: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  score: number;
  nextAdjustment: number;
  recommendation: string;
}

export interface ConfidenceReading {
  timestamp: Date;
  score: number;
  signals: {
    hesitation: boolean;
    repeatedMistakes: boolean;
    rapidResponses: boolean;
    askedForHints: boolean;
    skippedQuestion: boolean;
  };
  context: string;
}

export interface StepwiseExplanation {
  steps: Array<{
    stepNumber: number;
    title: string;
    content: string;
    keyPoint: string;
    analogy?: string;
    visualAid?: string;
  }>;
  summary: string;
  prerequisites: string[];
  nextSteps: string[];
  relatedConcepts: string[];
}

export interface WeakTopicAnalysis {
  topic: string;
  errorRate: number;
  mistakeTypes: Record<string, number>;
  lastErrors: Array<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
    timestamp: Date;
  }>;
  suggestedRemediation: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface LearningSession {
  id: string;
  userId: string;
  topic: string;
  startedAt: Date;
  endedAt?: Date;
  questionsAnswered: number;
  correctAnswers: number;
  hintsUsed: number;
  confidenceReadings: ConfidenceReading[];
  masteryBefore: number;
  masteryAfter?: number;
  difficulty: AdaptiveDifficulty;
}

const MasterySchema = z.object({
  masteryLevel: z.number().min(0).max(1),
  confidenceScore: z.number().min(0).max(1),
  weakSubtopics: z.array(z.string()),
  strongSubtopics: z.array(z.string()),
  recommendedNext: z.string(),
});

const HintSchema = z.object({
  level: z.number(),
  type: z.enum(['guiding_question', 'concept_pointer', 'partial_solution', 'full_solution']),
  content: z.string(),
  explanation: z.string(),
});

const DifficultySchema = z.object({
  current: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  score: z.number().min(0).max(100),
  nextAdjustment: z.number(),
  recommendation: z.string(),
});

export class ConceptCoachAgent {
  private userId: string;
  private sessionId: string;
  
  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
  }

  async explainStepwise(
    topic: string,
    userLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'intermediate',
    context?: string
  ): Promise<StepwiseExplanation> {
    const levelInstructions: Record<string, string> = {
      beginner: 'Use simple language, everyday analogies, avoid jargon. Assume no prior knowledge.',
      intermediate: 'Use moderate technical terms with explanations. Connect to foundational concepts.',
      advanced: 'Use technical terminology freely. Focus on nuances and edge cases.',
      expert: 'Discuss cutting-edge developments, research papers, and advanced applications.',
    };

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert tutor creating step-by-step explanations.
        
Level: ${userLevel}
${levelInstructions[userLevel]}

Create a structured explanation in JSON format:
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step title",
      "content": "Detailed explanation",
      "keyPoint": "The key takeaway",
      "analogy": "Real-world analogy (optional)",
      "visualAid": "Description of a visual that would help (optional)"
    }
  ],
  "summary": "One paragraph summary",
  "prerequisites": ["What student should know before"],
  "nextSteps": ["What to learn next"],
  "relatedConcepts": ["Connected topics"]
}`,
      },
      {
        role: 'user' as const,
        content: `Explain: ${topic}${context ? `\n\nContext: ${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 3000, temperature: 0.4 });
      const parsed = JSON.parse(response.content);
      
      await this.recordLearningActivity(topic, 'explanation', { level: userLevel });
      
      return parsed;
    } catch {
      return this.getFallbackExplanation(topic);
    }
  }

  async giveHint(
    question: string,
    attemptNumber: number,
    previousAnswer?: string,
    context?: string
  ): Promise<HintLevel> {
    const hintLevel = Math.min(attemptNumber, 4);
    
    const hintInstructions: Record<number, string> = {
      1: 'Ask a guiding question that helps them think in the right direction. Do NOT reveal the answer.',
      2: 'Point to the relevant concept or formula. Give a partial hint about the approach.',
      3: 'Show a partial solution or worked example of a similar problem.',
      4: 'Provide the full solution with detailed explanation.',
    };

    const messages = [
      {
        role: 'system' as const,
        content: `You are a patient tutor providing hints. NEVER give the answer directly until level 4.

Hint Level: ${hintLevel}
Instruction: ${hintInstructions[hintLevel]}

Return JSON:
{
  "level": ${hintLevel},
  "type": "guiding_question" | "concept_pointer" | "partial_solution" | "full_solution",
  "content": "The hint content",
  "explanation": "Why this hint is appropriate"
}`,
      },
      {
        role: 'user' as const,
        content: `Question: ${question}
Attempt #: ${attemptNumber}
${previousAnswer ? `Previous attempt: ${previousAnswer}` : ''}
${context ? `Context: ${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 800, temperature: 0.5 });
      const parsed = HintSchema.parse(JSON.parse(response.content));
      
      await this.recordHintUsage(question, hintLevel);
      
      return parsed;
    } catch {
      return {
        level: hintLevel,
        type: hintLevel === 4 ? 'full_solution' : 'guiding_question',
        content: `Let me help you think about this problem. What do you know about the key concepts involved?`,
        explanation: 'Fallback hint due to parsing error',
      };
    }
  }

  async assessMastery(topic: string, subject?: string): Promise<MasteryRecord> {
    const existingRecords = await prisma.agentOutput.findMany({
      where: {
        type: 'mastery_record' as any,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const userRecords = existingRecords.filter(
      r => r.content && typeof r.content === 'object' && (r.content as any).userId === this.userId
    );
    
    const topicRecords = userRecords.filter(
      r => (r.content as any)?.topicName?.toLowerCase().includes(topic.toLowerCase())
    );

    const practiceCount = topicRecords.length;
    const correctCount = topicRecords.filter(r => (r.content as any)?.correct).length;
    const masteryLevel = practiceCount > 0 ? correctCount / practiceCount : 0;
    
    const messages = [
      {
        role: 'system' as const,
        content: `Analyze a student's mastery level. Return JSON:
{
  "masteryLevel": 0.0-1.0,
  "confidenceScore": 0.0-1.0,
  "weakSubtopics": ["areas needing work"],
  "strongSubtopics": ["areas doing well"],
  "recommendedNext": "what to focus on next"
}`,
      },
      {
        role: 'user' as const,
        content: `Topic: ${topic}
Practice count: ${practiceCount}
Correct answers: ${correctCount}
Mastery estimate: ${(masteryLevel * 100).toFixed(1)}%`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 500, temperature: 0.3 });
      const parsed = MasterySchema.parse(JSON.parse(response.content));
      
      const record: MasteryRecord = {
        id: uuid(),
        userId: this.userId,
        topicId: uuid(),
        topicName: topic,
        masteryLevel: parsed.masteryLevel,
        confidenceScore: parsed.confidenceScore,
        lastPracticed: new Date(),
        practiceCount,
        correctCount,
        streakDays: this.calculateStreak(userRecords),
        weakSubtopics: parsed.weakSubtopics,
        strongSubtopics: parsed.strongSubtopics,
        recommendedNext: parsed.recommendedNext,
        timeSpentMinutes: practiceCount * 5,
      };

      await prisma.agentOutput.create({
        data: {
          sessionId: this.sessionId,
          taskId: uuid(),
          type: 'mastery_record',
          content: record as unknown as object,
          confidence: parsed.confidenceScore,
        },
      });

      return record;
    } catch {
      return this.getFallbackMastery(topic, practiceCount, correctCount);
    }
  }

  async detectWeakTopics(): Promise<WeakTopicAnalysis[]> {
    const outputs = await prisma.agentOutput.findMany({
      where: { type: 'mastery_record' as any },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const userRecords = outputs
      .map(o => o.content as unknown as MasteryRecord)
      .filter(r => r.userId === this.userId);

    const topicMap = new Map<string, { correct: number; total: number; errors: any[] }>();

    for (const record of userRecords) {
      const existing = topicMap.get(record.topicName) || { correct: 0, total: 0, errors: [] };
      existing.total += record.practiceCount;
      existing.correct += record.correctCount;
      topicMap.set(record.topicName, existing);
    }

    const weakTopics: WeakTopicAnalysis[] = [];

    for (const [topic, stats] of topicMap) {
      const errorRate = 1 - (stats.correct / Math.max(stats.total, 1));
      
      if (errorRate > 0.3) {
        weakTopics.push({
          topic,
          errorRate,
          mistakeTypes: { conceptual: errorRate * 0.5, calculation: errorRate * 0.3, memory: errorRate * 0.2 },
          lastErrors: [],
          suggestedRemediation: [
            `Review core concepts of ${topic}`,
            `Practice more problems on ${topic}`,
            `Watch video tutorials on ${topic}`,
          ],
          priority: errorRate > 0.7 ? 'critical' : errorRate > 0.5 ? 'high' : 'medium',
        });
      }
    }

    return weakTopics.sort((a, b) => b.errorRate - a.errorRate);
  }

  async adaptDifficulty(
    performance: {
      correctAnswers: number;
      totalQuestions: number;
      avgResponseTime: number;
      hintsUsed: number;
    }
  ): Promise<AdaptiveDifficulty> {
    const accuracy = performance.correctAnswers / Math.max(performance.totalQuestions, 1);
    const hintRatio = performance.hintsUsed / Math.max(performance.totalQuestions, 1);
    
    let score = accuracy * 100 - hintRatio * 20;
    
    if (performance.avgResponseTime < 10 && accuracy > 0.8) {
      score += 10;
    } else if (performance.avgResponseTime > 60) {
      score -= 5;
    }

    score = Math.max(0, Math.min(100, score));

    let current: AdaptiveDifficulty['current'];
    if (score < 25) current = 'beginner';
    else if (score < 50) current = 'intermediate';
    else if (score < 75) current = 'advanced';
    else current = 'expert';

    const nextAdjustment = accuracy > 0.85 ? 5 : accuracy < 0.5 ? -5 : 0;

    const recommendations: Record<string, string> = {
      beginner: 'Focus on fundamentals. Use more examples and analogies.',
      intermediate: 'Ready for more challenging problems. Introduce variations.',
      advanced: 'Explore edge cases and real-world applications.',
      expert: 'Consider teaching others or tackling research-level problems.',
    };

    return {
      current,
      score,
      nextAdjustment,
      recommendation: recommendations[current],
    };
  }

  async assessConfidence(
    response: string,
    responseTime: number,
    previousMistakes: number
  ): Promise<ConfidenceReading> {
    const signals = {
      hesitation: responseTime > 45,
      repeatedMistakes: previousMistakes > 2,
      rapidResponses: responseTime < 5,
      askedForHints: false,
      skippedQuestion: response.toLowerCase().includes('skip') || response.toLowerCase().includes("don't know"),
    };

    let score = 0.7;
    if (signals.hesitation) score -= 0.15;
    if (signals.repeatedMistakes) score -= 0.2;
    if (signals.rapidResponses) score -= 0.1;
    if (signals.skippedQuestion) score -= 0.3;

    score = Math.max(0.1, Math.min(1, score));

    const reading: ConfidenceReading = {
      timestamp: new Date(),
      score,
      signals,
      context: response.substring(0, 200),
    };

    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'confidence_reading',
        content: reading as unknown as object,
        confidence: score,
      },
    });

    return reading;
  }

  getEncouragementMessage(confidence: ConfidenceReading): string {
    const { score, signals } = confidence;

    if (score < 0.3) {
      if (signals.repeatedMistakes) {
        return "It looks like this concept is challenging. Let's break it down into smaller pieces. Every expert was once a beginner!";
      }
      return "Take your time. Learning is a journey, not a race. Would you like a hint?";
    } else if (score < 0.5) {
      return "You're making progress! Remember, making mistakes is part of learning. Let's work through this together.";
    } else if (score < 0.7) {
      return "Good effort! You're on the right track. Let me help you strengthen your understanding.";
    } else {
      return "Excellent work! Your confidence is showing. Ready for a challenge?";
    }
  }

  private async recordLearningActivity(topic: string, activityType: string, metadata: any): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'learning_activity',
        content: {
          userId: this.userId,
          topic,
          activityType,
          metadata,
          timestamp: new Date(),
        } as unknown as object,
        confidence: 1,
      },
    });
  }

  private async recordHintUsage(question: string, level: number): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'hint_usage',
        content: {
          userId: this.userId,
          question,
          level,
          timestamp: new Date(),
        } as unknown as object,
        confidence: 1,
      },
    });
  }

  private calculateStreak(records: any[]): number {
    if (records.length === 0) return 0;
    
    const dates = records
      .map(r => new Date(r.createdAt).toDateString())
      .filter((d, i, arr) => arr.indexOf(d) === i)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const today = new Date().toDateString();
    
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      
      if (dates[i] === expected.toDateString()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private getFallbackExplanation(topic: string): StepwiseExplanation {
    return {
      steps: [
        {
          stepNumber: 1,
          title: 'Introduction',
          content: `Let's explore ${topic} step by step.`,
          keyPoint: 'Understanding the fundamentals',
        },
        {
          stepNumber: 2,
          title: 'Core Concepts',
          content: `${topic} involves several key principles that we will explore.`,
          keyPoint: 'Building the foundation',
        },
        {
          stepNumber: 3,
          title: 'Practical Application',
          content: 'Now let\'s see how this applies in real scenarios.',
          keyPoint: 'Connecting theory to practice',
        },
      ],
      summary: `${topic} is a fundamental concept that builds on core principles.`,
      prerequisites: ['Basic understanding of the subject'],
      nextSteps: ['Practice problems', 'Advanced concepts'],
      relatedConcepts: ['Related topic 1', 'Related topic 2'],
    };
  }

  private getFallbackMastery(topic: string, practiceCount: number, correctCount: number): MasteryRecord {
    const masteryLevel = practiceCount > 0 ? correctCount / practiceCount : 0.5;
    return {
      id: uuid(),
      userId: this.userId,
      topicId: uuid(),
      topicName: topic,
      masteryLevel,
      confidenceScore: masteryLevel * 0.9,
      lastPracticed: new Date(),
      practiceCount,
      correctCount,
      streakDays: 0,
      weakSubtopics: [],
      strongSubtopics: [],
      recommendedNext: 'Continue practicing',
      timeSpentMinutes: practiceCount * 5,
    };
  }
}

export class MasteryGraphGenerator {
  async generateMasteryGraph(userId: string): Promise<{
    subjects: Array<{
      name: string;
      mastery: number;
      topics: Array<{ name: string; mastery: number }>;
    }>;
    overallMastery: number;
    trend: 'improving' | 'stable' | 'declining';
  }> {
    const outputs = await prisma.agentOutput.findMany({
      where: { type: 'mastery_record' as any },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const records = outputs
      .map(o => o.content as unknown as MasteryRecord)
      .filter(r => r.userId === userId);

    const subjectMap = new Map<string, Map<string, number>>();

    for (const record of records) {
      const subject = record.topicName.split(' ')[0] || 'General';
      const topicMap = subjectMap.get(subject) || new Map<string, number>();
      topicMap.set(record.topicName, record.masteryLevel);
      subjectMap.set(subject, topicMap);
    }

    const subjects = Array.from(subjectMap.entries()).map(([name, topics]) => ({
      name,
      mastery: Array.from(topics.values()).reduce((a, b) => a + b, 0) / topics.size,
      topics: Array.from(topics.entries()).map(([tName, mastery]) => ({ name: tName, mastery })),
    }));

    const overallMastery = subjects.reduce((sum, s) => sum + s.mastery, 0) / Math.max(subjects.length, 1);

    const recentRecords = records.slice(0, 10);
    const olderRecords = records.slice(10, 20);
    
    const recentAvg = recentRecords.reduce((sum, r) => sum + r.masteryLevel, 0) / Math.max(recentRecords.length, 1);
    const olderAvg = olderRecords.reduce((sum, r) => sum + r.masteryLevel, 0) / Math.max(olderRecords.length, 1);

    let trend: 'improving' | 'stable' | 'declining';
    if (recentAvg > olderAvg + 0.05) trend = 'improving';
    else if (recentAvg < olderAvg - 0.05) trend = 'declining';
    else trend = 'stable';

    return { subjects, overallMastery, trend };
  }
}
