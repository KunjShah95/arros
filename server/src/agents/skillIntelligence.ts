import { z } from 'zod';
import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { v4 as uuid } from 'uuid';

export interface Skill {
  id: string;
  name: string;
  category: string;
  level: number;
  maxLevel: number;
  verified: boolean;
  evidence?: string;
}

export interface CompetencyMap {
  userId: string;
  skills: Skill[];
  radarData: Array<{
    axis: string;
    value: number;
  }>;
  overallScore: number;
  lastUpdated: Date;
}

export interface SkillGap {
  skill: string;
  importance: number;
  currentLevel: number;
  targetLevel: number;
  gap: number;
  resources: string[];
  timeToAcquire: string;
}

export interface LearningPath {
  id: string;
  targetRole: string;
  currentLevel: string;
  targetLevel: string;
  milestones: Array<{
    id: string;
    title: string;
    skills: string[];
    duration: string;
    completed: boolean;
  }>;
  estimatedDuration: string;
}

export interface SkillRecommendation {
  skill: string;
  reason: string;
  urgency: 'high' | 'medium' | 'low';
  relatedRoles: string[];
}

export class SkillIntelligenceEngine {
  private userId: string;
  private sessionId: string;

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
  }

  async buildCompetencyMap(
    activities: Array<{
      type: string;
      topic: string;
      score?: number;
      duration?: number;
    }>
  ): Promise<CompetencyMap> {
    const skillMap = new Map<string, { scores: number[]; category: string }>();

    const categoryMap: Record<string, string> = {
      programming: 'Technical',
      math: 'Analytical',
      writing: 'Communication',
      research: 'Research',
      presentation: 'Communication',
      analysis: 'Analytical',
      design: 'Creative',
    };

    for (const activity of activities) {
      const topic = activity.topic.split(' ')[0];
      const existing = skillMap.get(topic) || { scores: [], category: categoryMap[activity.type] || 'General' };
      if (activity.score !== undefined) {
        existing.scores.push(activity.score);
      }
      skillMap.set(topic, existing);
    }

    const skills: Skill[] = Array.from(skillMap.entries()).map(([name, data]) => {
      const avgScore = data.scores.length > 0
        ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
        : 0;

      return {
        id: uuid(),
        name,
        category: data.category,
        level: Math.round(avgScore),
        maxLevel: 100,
        verified: data.scores.length >= 3,
      };
    });

    const categories = [...new Set(skills.map(s => s.category))];
    const radarData = categories.map(cat => {
      const catSkills = skills.filter(s => s.category === cat);
      const avg = catSkills.length > 0
        ? catSkills.reduce((sum, s) => sum + s.level, 0) / catSkills.length
        : 0;
      return { axis: cat, value: Math.round(avg) };
    });

    const overallScore = skills.length > 0
      ? skills.reduce((sum, s) => sum + s.level, 0) / skills.length
      : 0;

    const competencyMap: CompetencyMap = {
      userId: this.userId,
      skills,
      radarData,
      overallScore: Math.round(overallScore),
      lastUpdated: new Date(),
    };

    await this.saveCompetencyMap(competencyMap);
    return competencyMap;
  }

  async identifySkillGaps(
    targetRole: string,
    currentSkills: Skill[]
  ): Promise<SkillGap[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Analyze skill gaps for ${targetRole} role. Return JSON array:
[
  {
    "skill": "skill name",
    "importance": 1-10,
    "currentLevel": 0-100,
    "targetLevel": 0-100,
    "gap": 0-100,
    "resources": ["resource1", "resource2"],
    "timeToAcquire": "weeks/months"
  }
]`,
      },
      {
        role: 'user' as const,
        content: `Current skills: ${currentSkills.map(s => s.name).join(', ')}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1500, temperature: 0.3 });
      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }

  async generateLearningPath(
    targetRole: string,
    currentLevel: string,
    targetLevel: string,
    skills: Skill[]
  ): Promise<LearningPath> {
    const messages = [
      {
        role: 'system' as const,
        content: `Generate a learning path for ${targetRole} from ${currentLevel} to ${targetLevel} level.
Return JSON:
{
  "targetRole": "${targetRole}",
  "currentLevel": "${currentLevel}",
  "targetLevel": "${targetLevel}",
  "milestones": [
    {
      "id": "1",
      "title": "milestone title",
      "skills": ["skill1", "skill2"],
      "duration": "weeks",
      "completed": false
    }
  ],
  "estimatedDuration": "total time"
}`,
      },
      {
        role: 'user' as const,
        content: `Current skills: ${skills.map(s => s.name).join(', ')}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1500, temperature: 0.4 });
      const parsed = JSON.parse(response.content);
      
      return {
        id: uuid(),
        ...parsed,
      };
    } catch {
      return {
        id: uuid(),
        targetRole,
        currentLevel,
        targetLevel,
        milestones: [],
        estimatedDuration: 'Unknown',
      };
    }
  }

  async getSkillRecommendations(): Promise<SkillRecommendation[]> {
    const outputs = await prisma.agentOutput.findMany({
      where: { type: 'competency_map' as any },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const latest = outputs.find(o => o.content && (o.content as any).userId === this.userId);
    if (!latest) return [];

    const skills = (latest.content as any).skills as Skill[];
    const weakSkills = skills.filter(s => s.level < 50);

    return weakSkills.map(s => ({
      skill: s.name,
      reason: `Low proficiency in ${s.name}`,
      urgency: s.level < 30 ? 'high' : 'medium',
      relatedRoles: this.getRelatedRoles(s.name),
    }));
  }

  async compareWithIndustryBenchmarks(
    role: string
  ): Promise<{
    yourScore: number;
    benchmarkScore: number;
    gap: number;
    recommendations: string[];
  }> {
    const outputs = await prisma.agentOutput.findMany({
      where: { type: 'competency_map' as any },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const latest = outputs.find(o => o.content && (o.content as any).userId === this.userId);
    const yourScore = latest ? (latest.content as any).overallScore : 0;

    const benchmarks: Record<string, number> = {
      'Software Engineer': 75,
      'Data Scientist': 70,
      'Product Manager': 65,
      'Designer': 60,
    };

    const benchmarkScore = benchmarks[role] || 60;
    const gap = benchmarkScore - yourScore;

    return {
      yourScore,
      benchmarkScore,
      gap,
      recommendations: gap > 20 
        ? [`Focus on core ${role} skills`, 'Get certifications', 'Build portfolio projects']
        : ['Keep practicing', 'Take on advanced projects'],
    };
  }

  private getRelatedRoles(skill: string): string[] {
    const roleMap: Record<string, string[]> = {
      'Python': ['Data Scientist', 'Backend Developer', 'ML Engineer'],
      'JavaScript': ['Frontend Developer', 'Full Stack Developer'],
      'Research': ['Research Scientist', 'Academic'],
      'Analysis': ['Data Analyst', 'Business Analyst'],
    };
    return roleMap[skill] || ['Related roles'];
  }

  private async saveCompetencyMap(map: CompetencyMap): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'competency_map' as any,
        content: map as unknown as object,
        confidence: map.overallScore / 100,
      },
    });
  }
}
