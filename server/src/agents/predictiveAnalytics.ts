import { z } from 'zod';
import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { v4 as uuid } from 'uuid';

export interface PerformanceData {
  userId: string;
  topic: string;
  scores: Array<{
    score: number;
    maxScore: number;
    timestamp: Date;
    type: 'quiz' | 'exam' | 'practice' | 'assignment';
  }>;
}

export interface PredictiveAnalysis {
  predictedScore: number;
  confidence: number;
  scenarios: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
  factors: Array<{
    factor: string;
    impact: number;
    direction: 'positive' | 'negative';
  }>;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  atRiskSince?: Date;
  suggestedInterventions: string[];
}

export interface StudyPatternAnalysis {
  studyStreak: number;
  averageStudyTime: number;
  peakStudyHours: number[];
  consistencyScore: number;
  preferredDays: number[];
  breakPattern: {
    averageBreakDuration: number;
    breakFrequency: number;
  };
}

export interface CompetencyScore {
  topic: string;
  score: number;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  growth: number;
  lastAssessment: Date;
}

export class PredictiveAnalyticsAgent {
  private userId: string;
  private sessionId: string;

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
  }

  async predictExamScore(
    topic: string,
    examDate: Date,
    performanceHistory: PerformanceData['scores'],
    studyHoursRemaining: number
  ): Promise<PredictiveAnalysis> {
    const recentScores = performanceHistory.slice(-10);
    const averageScore = recentScores.length > 0
      ? recentScores.reduce((sum, s) => sum + (s.score / s.maxScore) * 100, 0) / recentScores.length
      : 50;

    const scoreTrend = this.calculateTrend(recentScores);
    const improvementRate = scoreTrend * 10;
    
    const hoursImpact = Math.min(20, studyHoursRemaining * 0.8);
    const daysUntilExam = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const timeImpact = daysUntilExam > 7 ? 5 : daysUntilExam > 3 ? 0 : -10;

    let predictedScore = averageScore + improvementRate + hoursImpact + timeImpact;
    predictedScore = Math.max(0, Math.min(100, predictedScore));

    const confidence = Math.min(0.9, 0.5 + (recentScores.length * 0.04));

    const scenarios = {
      optimistic: Math.min(100, predictedScore + 15),
      realistic: predictedScore,
      pessimistic: Math.max(0, predictedScore - 15),
    };

    const factors: PredictiveAnalysis['factors'] = [
      { factor: 'Current average', impact: 40, direction: 'positive' },
      { factor: 'Score trend', impact: improvementRate, direction: improvementRate > 0 ? 'positive' : 'negative' },
      { factor: 'Study time remaining', impact: hoursImpact, direction: hoursImpact > 10 ? 'positive' : 'negative' },
      { factor: 'Days until exam', impact: timeImpact, direction: timeImpact > 0 ? 'positive' : 'negative' },
    ];

    let riskLevel: PredictiveAnalysis['riskLevel'];
    if (predictedScore < 40 || daysUntilExam < 3) riskLevel = 'critical';
    else if (predictedScore < 60 || daysUntilExam < 7) riskLevel = 'high';
    else if (predictedScore < 75) riskLevel = 'medium';
    else riskLevel = 'low';

    const recommendations = this.generateRecommendations(predictedScore, daysUntilExam, studyHoursRemaining);

    return {
      predictedScore: Math.round(predictedScore),
      confidence,
      scenarios,
      factors,
      recommendations,
      riskLevel,
      atRiskSince: riskLevel === 'high' || riskLevel === 'critical' ? new Date() : undefined,
      suggestedInterventions: this.getInterventions(riskLevel),
    };
  }

  async analyzeStudyPatterns(): Promise<StudyPatternAnalysis> {
    const outputs = await prisma.agentOutput.findMany({
      where: { type: 'pomodoro' as any },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const sessions = outputs
      .map(o => o.content as any)
      .filter(s => s.userId === this.userId && s.completed);

    if (sessions.length === 0) {
      return {
        studyStreak: 0,
        averageStudyTime: 0,
        peakStudyHours: [],
        consistencyScore: 0,
        preferredDays: [],
        breakPattern: { averageBreakDuration: 5, breakFrequency: 4 },
      };
    }

    const studyTimes = sessions.map(s => ({
      duration: s.duration || 0,
      hour: new Date(s.startedAt).getHours(),
      day: new Date(s.startedAt).getDay(),
    }));

    const averageStudyTime = studyTimes.reduce((sum, s) => sum + s.duration, 0) / sessions.length;

    const hourCounts = new Array(24).fill(0);
    studyTimes.forEach(s => hourCounts[s.hour]++);
    const peakStudyHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(h => h.hour);

    const dayCounts = new Array(7).fill(0);
    studyTimes.forEach(s => dayCounts[s.day]++);
    const preferredDays = dayCounts
      .map((count, day) => ({ day, count }))
      .filter(d => d.count > 0)
      .map(d => d.day);

    const studyStreak = this.calculateStreak(sessions.map(s => s.startedAt));
    const consistencyScore = this.calculateConsistency(sessions);

    return {
      studyStreak,
      averageStudyTime: Math.round(averageStudyTime),
      peakStudyHours,
      consistencyScore,
      preferredDays,
      breakPattern: { averageBreakDuration: 5, breakFrequency: 4 },
    };
  }

  async getCompetencyRadar(
    topics: string[]
  ): Promise<CompetencyScore[]> {
    const outputs = await prisma.agentOutput.findMany({
      where: { type: 'mastery_record' as any },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const records = outputs
      .map(o => o.content as any)
      .filter(r => r.userId === this.userId);

    return topics.map(topic => {
      const topicRecords = records.filter(r => 
        r.topicName?.toLowerCase().includes(topic.toLowerCase())
      );

      const recentRecords = topicRecords.slice(0, 5);
      const olderRecords = topicRecords.slice(5, 10);

      const recentAvg = recentRecords.length > 0
        ? recentRecords.reduce((sum, r) => sum + r.masteryLevel, 0) / recentRecords.length
        : 0;

      const olderAvg = olderRecords.length > 0
        ? olderRecords.reduce((sum, r) => sum + r.masteryLevel, 0) / olderRecords.length
        : recentAvg;

      const growth = (recentAvg - olderAvg) * 100;

      let level: CompetencyScore['level'];
      if (recentAvg >= 0.8) level = 'expert';
      else if (recentAvg >= 0.6) level = 'advanced';
      else if (recentAvg >= 0.4) level = 'intermediate';
      else level = 'beginner';

      return {
        topic,
        score: Math.round(recentAvg * 100),
        level,
        growth: Math.round(growth),
        lastAssessment: recentRecords[0]?.lastPracticed || new Date(),
      };
    });
  }

  async identifyAtRiskStudents(): Promise<{
    atRisk: boolean;
    riskFactors: string[];
    triggers: string[];
    supportRecommendations: string[];
  }> {
    const patterns = await this.analyzeStudyPatterns();
    const readiness = await prisma.agentOutput.findMany({
      where: { type: 'readiness_score' as any },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const riskFactors: string[] = [];
    const triggers: string[] = [];

    if (patterns.studyStreak < 3) {
      riskFactors.push('Low study consistency');
      triggers.push('No study in last 3 days');
    }

    if (patterns.consistencyScore < 50) {
      riskFactors.push('Irregular study patterns');
      triggers.push('Inconsistent daily study time');
    }

    if (readiness.length === 0) {
      riskFactors.push('No recent assessments');
      triggers.push('No quiz/exam data available');
    }

    const atRisk = riskFactors.length >= 2;

    return {
      atRisk,
      riskFactors,
      triggers,
      supportRecommendations: this.getSupportRecommendations(riskFactors),
    };
  }

  async generateLearningInsights(): Promise<{
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  }> {
    const patterns = await this.analyzeStudyPatterns();
    const competency = await this.getCompetencyRadar(['Mathematics', 'Science', 'Programming', 'Languages']);

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const threats: string[] = [];

    if (patterns.consistencyScore > 70) {
      strengths.push('Consistent study habits');
    }
    if (patterns.studyStreak > 7) {
      strengths.push('Strong study streak');
    }

    const strongSubjects = competency.filter(c => c.score > 70);
    const weakSubjects = competency.filter(c => c.score < 50);

    strongSubjects.forEach(s => strengths.push(`Strong in ${s.topic}`));
    weakSubjects.forEach(w => weaknesses.push(`Needs improvement in ${w.topic}`));

    if (patterns.peakStudyHours.length > 0) {
      opportunities.push('Peak performance hours identified');
    }

    if (patterns.consistencyScore < 50) {
      threats.push('Inconsistent performance');
    }

    return { strengths, weaknesses, opportunities, threats };
  }

  private calculateTrend(scores: Array<{ score: number; maxScore: number }>): number {
    if (scores.length < 2) return 0;

    const n = scores.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = scores.map(s => s.score / s.maxScore);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;

    const uniqueDays = new Set(dates.map(d => d.toDateString()));
    const sortedDays = Array.from(uniqueDays).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < sortedDays.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);

      if (sortedDays[i] === expected.toDateString()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private calculateConsistency(sessions: any[]): number {
    if (sessions.length < 5) return 50;

    const durations = sessions.map(s => s.duration || 0);
    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance = durations.reduce((acc, d) => acc + Math.pow(d - mean, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);

    const coefficientOfVariation = (stdDev / mean) * 100;
    return Math.max(0, Math.round(100 - coefficientOfVariation));
  }

  private generateRecommendations(predictedScore: number, daysUntilExam: number, hoursRemaining: number): string[] {
    const recommendations: string[] = [];

    if (predictedScore < 50) {
      recommendations.push('Focus on fundamental concepts first');
      recommendations.push('Consider additional tutoring or study groups');
    } else if (predictedScore < 70) {
      recommendations.push('Target weak areas with focused practice');
      recommendations.push('Take more mock exams to build confidence');
    }

    if (daysUntilExam > 14) {
      recommendations.push('Spread study over multiple sessions');
    } else if (daysUntilExam < 7) {
      recommendations.push('Intensive review - prioritize high-weight topics');
    }

    if (hoursRemaining < 10) {
      recommendations.push('Maximize efficiency with active recall');
    }

    return recommendations;
  }

  private getInterventions(riskLevel: string): string[] {
    switch (riskLevel) {
      case 'critical':
        return [
          'Immediate one-on-one session needed',
          'Simplify study material',
          'Reduce scope to essential topics',
        ];
      case 'high':
        return [
          'Daily check-ins recommended',
          'Provide simplified notes',
          'Focus on high-yield topics',
        ];
      case 'medium':
        return [
          'Offer study group options',
          'Provide practice tests',
        ];
      default:
        return ['Continue current approach'];
    }
  }

  private getSupportRecommendations(riskFactors: string[]): string[] {
    const recommendations: string[] = [];

    if (riskFactors.includes('Low study consistency')) {
      recommendations.push('Set up daily study reminders');
      recommendations.push('Create study schedule with small achievable goals');
    }

    if (riskFactors.includes('Irregular study patterns')) {
      recommendations.push('Establish fixed study times');
      recommendations.push('Use Pomodoro technique for focused sessions');
    }

    if (riskFactors.includes('No recent assessments')) {
      recommendations.push('Take diagnostic quiz to identify gaps');
      recommendations.push('Schedule regular assessment checkpoints');
    }

    return recommendations;
  }
}
