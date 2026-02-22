import { z } from 'zod';
import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { v4 as uuid } from 'uuid';

export interface ConfidenceSignal {
  timestamp: Date;
  type: 'hesitation' | 'repeated_mistake' | 'rapid_response' | 'low_score' | 'skip' | 'hint_request';
  severity: number;
  context: string;
  response?: string;
}

export interface AnxietyIndicator {
  type: string;
  evidence: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface EncouragementMessage {
  id: string;
  message: string;
  type: 'celebration' | 'encouragement' | 'reassurance' | 'motivation' | 'reflection';
  context: string;
  generatedAt: Date;
}

export interface MicroSuccess {
  id: string;
  achievement: string;
  description: string;
  timestamp: Date;
  points: number;
  category: 'improvement' | 'consistency' | 'effort' | 'breakthrough';
}

export interface StressResponse {
  tone: 'supportive' | 'calming' | 'encouraging' | 'neutral';
  message: string;
  suggestions: string[];
  resources?: string[];
}

export interface ConfidenceTrend {
  period: string;
  averageConfidence: number;
  trend: 'improving' | 'stable' | 'declining';
  factors: string[];
  recommendations: string[];
}

export class ConfidenceBoosterAgent {
  private userId: string;
  private sessionId: string;
  private signals: ConfidenceSignal[] = [];

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
  }

  async detectHesitation(
    response: string,
    responseTime: number
  ): Promise<ConfidenceSignal> {
    const signals: ConfidenceSignal['type'][] = [];
    let severity = 0;

    if (responseTime > 45) {
      signals.push('hesitation');
      severity += 0.5;
    }

    if (response.length < 20 && responseTime > 20) {
      signals.push('hesitation');
      severity += 0.3;
    }

    const hesitationPhrases = ['i think', 'maybe', 'probably', 'im not sure', 'possibly', 'um', 'uh', 'like'];
    const lowerResponse = response.toLowerCase();
    if (hesitationPhrases.some(p => lowerResponse.includes(p))) {
      signals.push('hesitation');
      severity += 0.3;
    }

    const signal: ConfidenceSignal = {
      timestamp: new Date(),
      type: signals[0] || 'rapid_response',
      severity: Math.min(1, severity),
      context: `Response time: ${responseTime}s, Length: ${response.length} chars`,
      response: response.substring(0, 200),
    };

    this.signals.push(signal);
    await this.saveSignal(signal);

    return signal;
  }

  async detectRepeatedMistakes(
    mistakes: Array<{ topic: string; timestamp: Date; type: string }>
  ): Promise<ConfidenceSignal | null> {
    const recentMistakes = mistakes.filter(
      m => new Date().getTime() - new Date(m.timestamp).getTime() < 24 * 60 * 60 * 1000
    );

    if (recentMistakes.length >= 3) {
      const signal: ConfidenceSignal = {
        timestamp: new Date(),
        type: 'repeated_mistake',
        severity: Math.min(1, recentMistakes.length * 0.3),
        context: `${recentMistakes.length} mistakes in 24 hours`,
      };

      this.signals.push(signal);
      await this.saveSignal(signal);

      return signal;
    }

    return null;
  }

  async adaptTone(
    confidenceScore: number,
    anxietySignals: AnxietyIndicator[]
  ): Promise<'supportive' | 'encouraging' | 'neutral' | 'challenging'> {
    if (anxietySignals.some(s => s.severity === 'high') || confidenceScore < 0.3) {
      return 'supportive';
    } else if (confidenceScore < 0.5) {
      return 'encouraging';
    } else if (confidenceScore > 0.8) {
      return 'challenging';
    }
    return 'neutral';
  }

  async generateEncouragement(
    context: {
      recentScore?: number;
      streak?: number;
      improvement?: number;
      topic?: string;
    },
    tone: 'supportive' | 'encouraging' | 'neutral' | 'challenging'
  ): Promise<EncouragementMessage> {
    const tonePrompts: Record<string, string> = {
      supportive: 'Generate a warm, reassuring message. Acknowledge difficulty. Be understanding.',
      encouraging: 'Generate an uplifting message. Highlight progress. Motivate to continue.',
      neutral: 'Generate a balanced message. Acknowledge effort. Suggest next steps.',
      challenging: 'Generate a motivating message. Push for improvement. Set higher goals.',
    };

    const messages = [
      {
        role: 'system' as const,
        content: `${tonePrompts[tone]}
Context: ${JSON.stringify(context)}
Return JSON:
{
  "message": "encouragement message",
  "type": "celebration|encouragement|reassurance|motivation|reflection",
  "context": "why this message"
}`,
      },
      {
        role: 'user' as const,
        content: 'Generate encouragement',
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 300, temperature: 0.7 });
      const parsed = JSON.parse(response.content);
      
      return {
        id: uuid(),
        ...parsed,
        generatedAt: new Date(),
      };
    } catch {
      return this.getFallbackEncouragement(context, tone);
    }
  }

  async identifyMicroSuccess(
    achievements: Array<{
      type: string;
      value: number;
      previousValue?: number;
      timestamp: Date;
    }>
  ): Promise<MicroSuccess[]> {
    const successes: MicroSuccess[] = [];

    for (const achievement of achievements) {
      if (achievement.type === 'score_improvement' && achievement.previousValue) {
        const improvement = achievement.value - achievement.previousValue;
        if (improvement > 0) {
          successes.push({
            id: uuid(),
            achievement: `Score improved by ${improvement}%`,
            description: `From ${achievement.previousValue}% to ${achievement.value}%`,
            timestamp: achievement.timestamp,
            points: Math.min(50, improvement * 2),
            category: 'improvement',
          });
        }
      }

      if (achievement.type === 'streak') {
        successes.push({
          id: uuid(),
          achievement: `${achievement.value} day streak`,
          description: `${achievement.value} days of consistent learning`,
          timestamp: achievement.timestamp,
          points: achievement.value * 10,
          category: 'consistency',
        });
      }

      if (achievement.type === 'effort' && achievement.value > 30) {
        successes.push({
          id: uuid(),
          achievement: 'Great effort',
          description: `Studied for ${achievement.value} minutes`,
          timestamp: achievement.timestamp,
          points: 15,
          category: 'effort',
        });
      }

      if (achievement.type === 'breakthrough') {
        successes.push({
          id: uuid(),
          achievement: 'Breakthrough moment',
          description: 'Understood a difficult concept',
          timestamp: achievement.timestamp,
          points: 30,
          category: 'breakthrough',
        });
      }
    }

    return successes.sort((a, b) => b.points - a.points);
  }

  async analyzeAnxietyFromText(text: string): Promise<AnxietyIndicator[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Analyze text for anxiety indicators. Look for:
- Self-doubt phrases
- Negative self-talk
- Stress signals
- Overwhelm indicators

Return JSON array:
[
  {
    "type": "self_doubt|negative_talk|stress|overwhelm",
    "evidence": "specific phrase",
    "severity": "low|medium|high",
    "suggestion": "how to help"
  }
]`,
      },
      {
        role: 'user' as const,
        content: `Analyze: ${text}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1000, temperature: 0.3 });
      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }

  async generateStressResponse(
    anxietyLevel: number,
    context: string
  ): Promise<StressResponse> {
    const messages = [
      {
        role: 'system' as const,
        content: `Generate a calming, stress-aware response. Return JSON:
{
  "tone": "supportive|calming|encouraging",
  "message": "response message",
  "suggestions": ["suggestion"],
  "resources": ["optional resource"]
}`,
      },
      {
        role: 'user' as const,
        content: `Anxiety level: ${anxietyLevel}/10
Context: ${context}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 500, temperature: 0.5 });
      return JSON.parse(response.content);
    } catch {
      return {
        tone: 'calming',
        message: 'Take a deep breath. One step at a time.',
        suggestions: ['Take a short break', 'Try again when ready'],
      };
    }
  }

  async trackConfidenceTrend(
    period: 'week' | 'month' | 'semester' = 'week'
  ): Promise<ConfidenceTrend> {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 180;
    
    const outputs = await prisma.agentOutput.findMany({
      where: { type: 'confidence_reading' as any },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const recentSignals = outputs
      .map(o => o.content as any)
      .filter(s => s && new Date(s.timestamp) >= cutoff);

    const scores = recentSignals.map(s => s.score || 0.5);
    const averageConfidence = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0.5;

    const period2x = Math.floor(days / 2);
    const cutoff2 = new Date();
    cutoff2.setDate(cutoff2.getDate() - period2x - days);

    const olderSignals = outputs
      .map(o => o.content as any)
      .filter(s => s && new Date(s.timestamp) >= cutoff2 && new Date(s.timestamp) < cutoff);

    const olderScores = olderSignals.map(s => s.score || 0.5);
    const olderAverage = olderScores.length > 0
      ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length
      : averageConfidence;

    let trend: ConfidenceTrend['trend'];
    if (averageConfidence > olderAverage + 0.05) trend = 'improving';
    else if (averageConfidence < olderAverage - 0.05) trend = 'declining';
    else trend = 'stable';

    return {
      period,
      averageConfidence,
      trend,
      factors: recentSignals.length > 0 ? ['Recent performance', 'Study consistency'] : [],
      recommendations: this.getTrendRecommendations(trend),
    };
  }

  private getTrendRecommendations(trend: ConfidenceTrend['trend']): string[] {
    switch (trend) {
      case 'improving':
        return ['Keep up the great work', 'Increase difficulty slightly'];
      case 'declining':
        return ['Take a break', 'Review basics', 'Seek help on difficult topics'];
      default:
        return ['Maintain consistency', 'Focus on weak areas'];
    }
  }

  private async saveSignal(signal: ConfidenceSignal): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'confidence_signal' as any,
        content: {
          userId: this.userId,
          ...signal,
        } as unknown as object,
        confidence: 1 - signal.severity,
      },
    });
  }

  private getFallbackEncouragement(
    context: any,
    tone: string
  ): EncouragementMessage {
    const messages: Record<string, string> = {
      supportive: "It's okay to find this challenging. Every expert was once a beginner. Take your time.",
      encouraging: "You're making progress! Keep going, you're doing great.",
      neutral: "Good effort. Keep practicing and you'll improve.",
      challenging: "You're ready for more. Push yourself to the next level!",
    };

    return {
      id: uuid(),
      message: messages[tone] || messages.encouraging,
      type: 'encouragement',
      context: JSON.stringify(context),
      generatedAt: new Date(),
    };
  }
}
