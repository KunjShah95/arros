import { z } from 'zod';
import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { v4 as uuid } from 'uuid';

export interface Syllabus {
  id: string;
  courseName: string;
  courseCode?: string;
  topics: Array<{
    name: string;
    subtopics: string[];
    weight: number;
    estimatedHours: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  examDate?: Date;
  totalHours: number;
}

export interface StudyPlan {
  id: string;
  userId: string;
  syllabus: Syllabus;
  startDate: Date;
  endDate: Date;
  dailySchedule: DailySchedule[];
  totalHours: number;
  hoursPerDay: number;
  priorityBased: boolean;
  weakTopicEmphasis: boolean;
}

export interface DailySchedule {
  date: string;
  dayOfWeek: string;
  sessions: StudySession[];
  totalHours: number;
  completed: boolean;
}

export interface StudySession {
  id: string;
  topic: string;
  subtopics: string[];
  duration: number;
  type: 'reading' | 'practice' | 'review' | 'mock_test' | 'revision';
  priority: 'high' | 'medium' | 'low';
  resources: string[];
  completed: boolean;
  notes?: string;
}

export interface ReadinessScore {
  overall: number;
  topicScores: Array<{
    topic: string;
    score: number;
    readiness: 'not_ready' | 'partially_ready' | 'ready' | 'well_prepared';
  }>;
  weakAreas: string[];
  strongAreas: string[];
  recommendation: string;
  predictedScore?: number;
  confidence: number;
}

export interface BurnoutAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  factors: Array<{
    factor: string;
    value: number;
    trend: 'improving' | 'stable' | 'declining';
  }>;
  warnings: string[];
  recommendations: string[];
  suggestedBreak?: {
    duration: number;
    activity: string;
  };
}

export interface FlashcardSRS {
  id: string;
  front: string;
  back: string;
  topic: string;
  subtopic?: string;
  difficulty: number;
  easeFactor: number;
  interval: number;
  nextReview: Date;
  reviewCount: number;
  lapseCount: number;
  lastReview?: Date;
}

export interface FocusModeConfig {
  enabled: boolean;
  blockedApps?: string[];
  focusDuration: number;
  breakDuration: number;
  sessionsBeforeLongBreak: number;
}

const SyllabusSchema = z.object({
  courseName: z.string(),
  courseCode: z.string().optional(),
  topics: z.array(z.object({
    name: z.string(),
    subtopics: z.array(z.string()),
    weight: z.number(),
    estimatedHours: z.number(),
    difficulty: z.string(),
  })),
  examDate: z.string().optional(),
  totalHours: z.number(),
});

export class StudyPlannerAgent {
  private userId: string;
  private sessionId: string;

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
  }

  async parseSyllabus(syllabusText: string, examDate?: Date): Promise<Syllabus> {
    const messages = [
      {
        role: 'system' as const,
        content: `Parse this syllabus and extract structured information. Return JSON:
{
  "courseName": "Course Name",
  "courseCode": "optional code",
  "topics": [
    {
      "name": "Topic Name",
      "subtopics": ["subtopic1", "subtopic2"],
      "weight": 1-10 (importance),
      "estimatedHours": number,
      "difficulty": "easy|medium|hard"
    }
  ],
  "examDate": "YYYY-MM-DD if mentioned",
  "totalHours": number
}`,
      },
      {
        role: 'user' as const,
        content: `Parse this syllabus:\n\n${syllabusText}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.2 });
      const parsed = SyllabusSchema.parse(JSON.parse(response.content));
      
      const syllabus: Syllabus = {
        id: uuid(),
        courseName: parsed.courseName,
        courseCode: parsed.courseCode,
        topics: parsed.topics.map((t: any) => ({
          ...t,
          difficulty: t.difficulty as Syllabus['topics'][0]['difficulty'],
        })),
        examDate: parsed.examDate ? new Date(parsed.examDate) : examDate,
        totalHours: parsed.totalHours,
      };

      await this.savePlan('syllabus', syllabus);
      return syllabus;
    } catch {
      return this.getFallbackSyllabus(syllabusText, examDate);
    }
  }

  async generateStudyPlan(
    syllabus: Syllabus,
    options: {
      startDate?: Date;
      endDate?: Date;
      dailyHours?: number;
      weakTopicEmphasis?: boolean;
      priorityBased?: boolean;
    } = {}
  ): Promise<StudyPlan> {
    const startDate = options.startDate || new Date();
    const endDate = options.endDate || syllabus.examDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const dailyHours = options.dailyHours || 2;
    
    const daysUntilExam = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalAvailableHours = daysUntilExam * dailyHours;
    
    const syllabusWithHours = {
      ...syllabus,
      totalHours: syllabus.topics.reduce((sum, t) => sum + t.estimatedHours, 0),
    };

    const messages = [
      {
        role: 'system' as const,
        content: `Create a detailed day-by-day study schedule. Return JSON:
{
  "dailySchedule": [
    {
      "date": "YYYY-MM-DD",
      "dayOfWeek": "Monday",
      "sessions": [
        {
          "id": "unique",
          "topic": "topic name",
          "subtopics": ["subtopic"],
          "duration": 60,
          "type": "reading|practice|review|mock_test|revision",
          "priority": "high|medium|low",
          "resources": [],
          "completed": false
        }
      ],
      "totalHours": number,
      "completed": false
    }
  ]
}`,
      },
      {
        role: 'user' as const,
        content: `Create ${daysUntilExam}-day study plan for: ${syllabus.courseName}
Topics: ${syllabus.topics.map(t => `${t.name} (${t.estimatedHours}h, ${t.difficulty})`).join('; ')}
Available hours/day: ${dailyHours}
Exam date: ${endDate.toISOString()}
Priority-based: ${options.priorityBased || false}
Weak topic emphasis: ${options.weakTopicEmphasis || false}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 3000, temperature: 0.4 });
      const parsed = JSON.parse(response.content);
      
      const plan: StudyPlan = {
        id: uuid(),
        userId: this.userId,
        syllabus: syllabusWithHours,
        startDate,
        endDate,
        dailySchedule: parsed.dailySchedule,
        totalHours: syllabusWithHours.totalHours,
        hoursPerDay: dailyHours,
        priorityBased: options.priorityBased || false,
        weakTopicEmphasis: options.weakTopicEmphasis || false,
      };

      await this.savePlan('study_plan', plan);
      return plan;
    } catch {
      return this.getFallbackStudyPlan(syllabusWithHours, startDate, endDate, dailyHours);
    }
  }

  async calculateReadiness(
    syllabus: Syllabus,
    performanceData?: {
      topicsCovered: string[];
      practiceScores: Record<string, number>;
      mockTestScores: number[];
    }
  ): Promise<ReadinessScore> {
    const topicScores: ReadinessScore['topicScores'] = syllabus.topics.map(topic => {
      const score = performanceData?.practiceScores[topic.name] || 50;
      let readiness: ReadinessScore['topicScores'][0]['readiness'];
      
      if (score >= 85) readiness = 'well_prepared';
      else if (score >= 70) readiness = 'ready';
      else if (score >= 50) readiness = 'partially_ready';
      else readiness = 'not_ready';

      return {
        topic: topic.name,
        score,
        readiness,
      };
    });

    const overall = topicScores.reduce((sum, t) => sum + t.score, 0) / topicScores.length;
    
    const weakAreas = topicScores.filter(t => t.score < 60).map(t => t.topic);
    const strongAreas = topicScores.filter(t => t.score >= 80).map(t => t.topic);

    const mockAvg = performanceData?.mockTestScores?.length
      ? performanceData.mockTestScores.reduce((a, b) => a + b, 0) / performanceData.mockTestScores.length
      : overall;

    let recommendation = '';
    if (overall >= 80) {
      recommendation = 'Excellent! You are well-prepared. Focus on revision and practice tests.';
    } else if (overall >= 60) {
      recommendation = 'Good progress. Prioritize weak areas and take more mock tests.';
    } else if (overall >= 40) {
      recommendation = 'Needs more work. Increase study time and focus on fundamentals.';
    } else {
      recommendation = 'Critical gaps. Consider additional help or extending study time significantly.';
    }

    return {
      overall,
      topicScores,
      weakAreas,
      strongAreas,
      recommendation,
      predictedScore: mockAvg,
      confidence: performanceData?.mockTestScores?.length ? 0.85 : 0.6,
    };
  }

  async detectBurnoutRisk(
    userId: string
  ): Promise<BurnoutAnalysis> {
    const outputs = await prisma.agentOutput.findMany({
      where: { type: 'pomodoro' as any },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const recentOutputs = outputs.slice(0, 50);
    const olderOutputs = outputs.slice(50, 100);

    const recentSessions = recentOutputs
      .map(o => o.content as any)
      .filter(s => s.userId === userId && s.completed);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentWeekSessions = recentSessions.filter(s => new Date(s.startedAt) >= weekAgo);

    const totalHoursThisWeek = recentWeekSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;
    const avgSessionLength = recentWeekSessions.length > 0
      ? recentWeekSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / recentWeekSessions.length
      : 0;
    
    const sessionsPerDay = recentWeekSessions.length / 7;
    
    const studyStreak = this.calculateStudyStreak(recentOutputs.map(o => o.createdAt));

    const factors: Array<{ factor: string; value: number; trend: 'improving' | 'stable' | 'declining' }> = [
      { factor: 'weekly_hours', value: totalHoursThisWeek, trend: totalHoursThisWeek > 20 ? 'declining' : 'stable' },
      { factor: 'session_intensity', value: avgSessionLength, trend: avgSessionLength > 45 ? 'declining' : 'stable' },
      { factor: 'consistency', value: sessionsPerDay, trend: sessionsPerDay > 3 ? 'stable' : 'declining' },
      { factor: 'streak', value: studyStreak, trend: studyStreak > 7 ? 'stable' : 'declining' },
    ];

    let score = 50;
    if (totalHoursThisWeek > 30) score += 20;
    if (avgSessionLength > 60) score += 15;
    if (studyStreak > 14) score += 10;
    if (sessionsPerDay > 5) score += 5;
    
    score = Math.min(100, score);

    let riskLevel: BurnoutAnalysis['riskLevel'];
    if (score >= 80) riskLevel = 'critical';
    else if (score >= 60) riskLevel = 'high';
    else if (score >= 40) riskLevel = 'medium';
    else riskLevel = 'low';

    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (totalHoursThisWeek > 25) {
      warnings.push('High weekly study hours detected');
      recommendations.push('Consider taking more breaks or reducing study hours');
    }
    if (avgSessionLength > 50) {
      warnings.push('Long study sessions without breaks');
      recommendations.push('Try the Pomodoro technique: 25 min study, 5 min break');
    }
    if (studyStreak > 10) {
      warnings.push('Long study streak - risk of exhaustion');
      recommendations.push('Take a full rest day this week');
    }

    let suggestedBreak: BurnoutAnalysis['suggestedBreak'];
    if (riskLevel === 'critical' || riskLevel === 'high') {
      suggestedBreak = {
        duration: riskLevel === 'critical' ? 2 : 1,
        activity: 'Take a complete break - walk, rest, do something enjoyable',
      };
    }

    return {
      riskLevel,
      score,
      factors,
      warnings,
      recommendations,
      suggestedBreak,
    };
  }

  async predictExamScore(
    readiness: ReadinessScore,
    studyHoursRemaining: number
  ): Promise<{
    predictedScore: number;
    confidence: number;
    scenarios: {
      optimistic: number;
      realistic: number;
      pessimistic: number;
    };
    recommendation: string;
  }> {
    const baseScore = readiness.overall;
    const potentialImprovement = Math.min(20, studyHoursRemaining * 0.5);
    
    const predictedScore = Math.min(100, baseScore + potentialImprovement);
    
    return {
      predictedScore,
      confidence: 0.75,
      scenarios: {
        optimistic: Math.min(100, predictedScore + 10),
        realistic: predictedScore,
        pessimistic: Math.max(0, predictedScore - 15),
      },
      recommendation: studyHoursRemaining < 10
        ? 'Focus on high-weight topics and weak areas only'
        : 'Follow the study plan strictly and take regular mock tests',
    };
  }

  generateFlashcardsFromSyllabus(syllabus: Syllabus, cardsPerTopic: number = 10): FlashcardSRS[] {
    const flashcards: FlashcardSRS[] = [];
    
    for (const topic of syllabus.topics) {
      for (let i = 0; i < Math.min(cardsPerTopic, topic.subtopics.length); i++) {
        flashcards.push({
          id: uuid(),
          front: `What is ${topic.subtopics[i]} in ${topic.name}?`,
          back: `Answer about ${topic.subtopics[i]}`,
          topic: topic.name,
          subtopic: topic.subtopics[i],
          difficulty: topic.difficulty === 'hard' ? 3 : topic.difficulty === 'medium' ? 2 : 1,
          easeFactor: 2.5,
          interval: 1,
          nextReview: new Date(),
          reviewCount: 0,
          lapseCount: 0,
        });
      }
    }
    
    return flashcards;
  }

  private calculateStudyStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;
    
    const uniqueDays = new Set(dates.map(d => d.toDateString()));
    return uniqueDays.size;
  }

  private async savePlan(type: string, plan: any): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: type as any,
        content: plan as unknown as object,
        confidence: 1,
      },
    });
  }

  private getFallbackSyllabus(text: string, examDate?: Date): Syllabus {
    return {
      id: uuid(),
      courseName: 'Parsed Course',
      topics: [
        { name: 'Topic 1', subtopics: ['Subtopic 1'], weight: 5, estimatedHours: 5, difficulty: 'medium' },
        { name: 'Topic 2', subtopics: ['Subtopic 2'], weight: 5, estimatedHours: 5, difficulty: 'medium' },
      ],
      examDate,
      totalHours: 10,
    };
  }

  private getFallbackStudyPlan(syllabus: Syllabus, startDate: Date, endDate: Date, dailyHours: number): StudyPlan {
    const days: DailySchedule[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate && days.length < 30) {
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        days.push({
          date: current.toISOString().split('T')[0],
          dayOfWeek: current.toLocaleDateString('en-US', { weekday: 'long' }),
          sessions: [{
            id: uuid(),
            topic: syllabus.topics[days.length % syllabus.topics.length]?.name || 'Review',
            subtopics: [],
            duration: dailyHours * 60,
            type: 'reading',
            priority: 'medium',
            resources: [],
            completed: false,
          }],
          totalHours: dailyHours,
          completed: false,
        });
      }
      current.setDate(current.getDate() + 1);
    }

    return {
      id: uuid(),
      userId: this.userId,
      syllabus,
      startDate,
      endDate,
      dailySchedule: days,
      totalHours: syllabus.totalHours,
      hoursPerDay: dailyHours,
      priorityBased: false,
      weakTopicEmphasis: false,
    };
  }
}

export class FocusModeAgent {
  async enableFocusMode(config: FocusModeConfig): Promise<void> {
    console.log('Focus mode enabled:', config);
  }

  async disableFocusMode(): Promise<void> {
    console.log('Focus mode disabled');
  }

  async trackFocusSession(
    userId: string,
    duration: number,
    distractions: number
  ): Promise<{
    focusScore: number;
    recommendation: string;
  }> {
    const focusScore = Math.max(0, 100 - distractions * 10);
    
    return {
      focusScore,
      recommendation: focusScore > 80
        ? 'Excellent focus! Keep it up.'
        : 'Try a quieter environment or shorter sessions.',
    };
  }
}
