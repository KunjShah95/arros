import { z } from 'zod';
import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { v4 as uuid } from 'uuid';

export interface SkillProfile {
  userId: string;
  currentSkills: Skill[];
  targetRoles: string[];
  skillGaps: SkillGap[];
  jobReadinessScore: number;
  recommendations: string[];
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsExperience?: number;
  verified: boolean;
  evidence?: string;
}

export interface SkillGap {
  skill: string;
  importance: 'required' | 'preferred' | 'nice_to_have';
  currentLevel: string;
  targetLevel: string;
  gapSize: number;
  resources: string[];
  estimatedTimeToAcquire: number;
}

export interface ResumeFeedback {
  id: string;
  overallScore: number;
  sections: Array<{
    name: string;
    score: number;
    feedback: string;
    suggestions: string[];
  }>;
  atsScore: number;
  atsIssues: string[];
  keywords: {
    found: string[];
    missing: string[];
  };
  overallFeedback: string;
  improvementSuggestions: string[];
}

export interface MockInterview {
  id: string;
  role: string;
  questions: InterviewQuestion[];
  responses: Array<{
    questionId: string;
    userAnswer: string;
    score: number;
    feedback: string;
    suggestedAnswer?: string;
  }>;
  overallScore: number;
  strengths: string[];
  areasToImprove: string[];
  finalFeedback: string;
}

export interface InterviewQuestion {
  id: string;
  type: 'behavioral' | 'technical' | 'situational';
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  idealAnswerPoints: string[];
  sampleAnswer?: string;
}

export interface PortfolioReview {
  id: string;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    score: number;
    feedback: string;
    improvements: string[];
  }>;
  overallScore: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

export interface CareerRoadmap {
  targetRole: string;
  currentLevel: string;
  targetLevel: string;
  timeline: RoadmapStep[];
  milestones: Milestone[];
  requiredSkills: string[];
  optionalSkills: string[];
}

export interface RoadmapStep {
  phase: number;
  title: string;
  duration: string;
  skills: string[];
  activities: string[];
  deliverables: string[];
}

export interface Milestone {
  title: string;
  description: string;
  targetDate: Date;
  completed: boolean;
}

export interface JobMatch {
  jobId: string;
  title: string;
  company: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  applyUrl?: string;
}

const ResumeFeedbackSchema = z.object({
  overallScore: z.number().min(0).max(100),
  sections: z.array(z.object({
    name: z.string(),
    score: z.number(),
    feedback: z.string(),
    suggestions: z.array(z.string()),
  })),
  atsScore: z.number(),
  atsIssues: z.array(z.string()),
  keywords: z.object({
    found: z.array(z.string()),
    missing: z.array(z.string()),
  }),
  overallFeedback: z.string(),
  improvementSuggestions: z.array(z.string()),
});

export class CareerSkillNavigatorAgent {
  private userId: string;
  private sessionId: string;

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
  }

  async mapSkills(
    skills: Array<{ name: string; level: string; evidence?: string }>,
    targetRoles: string[]
  ): Promise<SkillProfile> {
    const messages = [
      {
        role: 'system' as const,
        content: `Analyze skills and identify gaps for target roles. Return JSON:
{
  "skillGaps": [
    {
      "skill": "skill name",
      "importance": "required|preferred|nice_to_have",
      "currentLevel": "beginner|intermediate|advanced|expert",
      "targetLevel": "target level",
      "gapSize": 1-10,
      "resources": ["resource1"],
      "estimatedTimeToAcquire": "weeks"
    }
  ],
  "jobReadinessScore": 0-100,
  "recommendations": ["recommendation"]
}`,
      },
      {
        role: 'user' as const,
        content: `Current skills: ${JSON.stringify(skills)}
Target roles: ${targetRoles.join(', ')}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1500, temperature: 0.3 });
      const parsed = JSON.parse(response.content);
      
      const profile: SkillProfile = {
        userId: this.userId,
        currentSkills: skills as Skill[],
        targetRoles,
        skillGaps: parsed.skillGaps,
        jobReadinessScore: parsed.jobReadinessScore,
        recommendations: parsed.recommendations,
      };

      await this.saveProfile(profile);
      return profile;
    } catch {
      return this.getFallbackProfile(skills, targetRoles);
    }
  }

  async reviewResume(
    resumeText: string,
    targetRole?: string
  ): Promise<ResumeFeedback> {
    const messages = [
      {
        role: 'system' as const,
        content: `Review resume for ${targetRole || 'general positions'}. Evaluate:
- Structure and formatting
- Content quality
- ATS compatibility
- Keywords
- Impact metrics

Return JSON:
{
  "overallScore": 0-100,
  "sections": [
    {
      "name": "section name",
      "score": 0-100,
      "feedback": "feedback",
      "suggestions": ["suggestion"]
    }
  ],
  "atsScore": 0-100,
  "atsIssues": ["issue"],
  "keywords": {"found": [], "missing": []},
  "overallFeedback": "feedback",
  "improvementSuggestions": ["suggestion"]
}`,
      },
      {
        role: 'user' as const,
        content: `Resume:\n\n${resumeText}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.3 });
      const parsed = ResumeFeedbackSchema.parse(JSON.parse(response.content));
      
      const feedback: ResumeFeedback = {
        id: uuid(),
        ...parsed,
      };

      await this.saveResumeReview(feedback);
      return feedback;
    } catch {
      return this.getFallbackResumeFeedback();
    }
  }

  async generateMockInterview(
    role: string,
    type: 'technical' | 'behavioral' | 'mixed' = 'mixed',
    difficulty: 'entry' | 'mid' | 'senior' = 'mid',
    questionCount: number = 5
  ): Promise<MockInterview> {
    const messages = [
      {
        role: 'system' as const,
        content: `Generate mock interview questions for ${role} position (${difficulty} level).
Return JSON (${questionCount} questions):
{
  "questions": [
    {
      "id": "q1",
      "type": "behavioral|technical|situational",
      "question": "question text",
      "category": "category",
      "difficulty": "easy|medium|hard",
      "idealAnswerPoints": ["point1", "point2"],
      "sampleAnswer": "optional example"
    }
  ]
}`,
      },
      {
        role: 'user' as const,
        content: `Generate ${questionCount} ${type} interview questions for ${role}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.5 });
      const parsed = JSON.parse(response.content);
      
      return {
        id: uuid(),
        role,
        questions: parsed.questions,
        responses: [],
        overallScore: 0,
        strengths: [],
        areasToImprove: [],
        finalFeedback: '',
      };
    } catch {
      return this.getFallbackMockInterview(role);
    }
  }

  async evaluateAnswer(
    question: InterviewQuestion,
    userAnswer: string
  ): Promise<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    suggestedAnswer: string;
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `Evaluate interview answer. Return JSON:
{
  "score": 0-100,
  "feedback": "overall feedback",
  "strengths": ["strength"],
  "improvements": ["improvement"],
  "suggestedAnswer": "better answer"
}`,
      },
      {
        role: 'user' as const,
        content: `Question (${question.type}): ${question.question}
User Answer: ${userAnswer}
Ideal Points: ${question.idealAnswerPoints.join(', ')}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1000, temperature: 0.3 });
      return JSON.parse(response.content);
    } catch {
      return {
        score: 50,
        feedback: 'Unable to evaluate',
        strengths: [],
        improvements: ['Try again'],
        suggestedAnswer: 'Provide more specific examples',
      };
    }
  }

  async reviewPortfolio(
    projects: Array<{
      name: string;
      description: string;
      technologies: string[];
      link?: string;
    }>
  ): Promise<PortfolioReview> {
    const messages = [
      {
        role: 'system' as const,
        content: `Review portfolio projects. Evaluate:
- Project descriptions
- Technology stack
- Impact and results
- Presentation quality

Return JSON:
{
  "projects": [
    {
      "name": "name",
      "description": "desc",
      "technologies": [],
      "score": 0-100,
      "feedback": "feedback",
      "improvements": ["improvement"]
    }
  ],
  "overallScore": 0-100,
  "strengths": ["strength"],
  "gaps": ["gap"],
  "recommendations": ["recommendation"]
}`,
      },
      {
        role: 'user' as const,
        content: `Projects:\n${JSON.stringify(projects)}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.3 });
      const parsed = JSON.parse(response.content);
      
      return {
        id: uuid(),
        ...parsed,
      };
    } catch {
      return this.getFallbackPortfolioReview();
    }
  }

  async generateCareerRoadmap(
    targetRole: string,
    currentSkills: Skill[],
    timelineMonths: number = 6
  ): Promise<CareerRoadmap> {
    const skillNames = currentSkills.map(s => s.name).join(', ');
    
    const messages = [
      {
        role: 'system' as const,
        content: `Generate career roadmap for ${targetRole}. Return JSON:
{
  "targetRole": "${targetRole}",
  "currentLevel": "entry",
  "targetLevel": "mid",
  "timeline": [
    {
      "phase": 1,
      "title": "Phase title",
      "duration": "weeks",
      "skills": ["skill"],
      "activities": ["activity"],
      "deliverables": ["deliverable"]
    }
  ],
  "milestones": [
    {
      "title": "milestone",
      "description": "desc",
      "targetDate": "YYYY-MM-DD",
      "completed": false
    }
  ],
  "requiredSkills": [],
  "optionalSkills": []
}`,
      },
      {
        role: 'user' as const,
        content: `Current skills: ${skillNames}
Timeline: ${timelineMonths} months
Target: ${targetRole}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.4 });
      const parsed = JSON.parse(response.content);
      
      return {
        ...parsed,
        milestones: parsed.milestones.map((m: any) => ({
          ...m,
          targetDate: new Date(m.targetDate),
        })),
      };
    } catch {
      return this.getFallbackRoadmap(targetRole);
    }
  }

  async findJobMatches(
    skills: Skill[],
    targetRoles: string[],
    location?: string,
    limit: number = 10
  ): Promise<JobMatch[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Find matching job opportunities. Return JSON array (${limit} jobs):
[
  {
    "jobId": "id",
    "title": "Job Title",
    "company": "Company",
    "matchScore": 0-100,
    "matchedSkills": ["skill"],
    "missingSkills": ["skill"],
    "applyUrl": "url"
  }
]`,
      },
      {
        role: 'user' as const,
        content: `Skills: ${skills.map(s => s.name).join(', ')}
Roles: ${targetRoles.join(', ')}
Location: ${location || 'Any'}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.4 });
      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }

  async getInterviewTips(
    role: string,
    companyType: 'startup' | 'faang' | 'mid-size' | 'enterprise' = 'mid-size'
  ): Promise<{
    generalTips: string[];
    technicalTips: string[];
    behavioralTips: string[];
    redFlags: string[];
    questionsToAsk: string[];
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `Get interview tips for ${role} at ${companyType} company. Return JSON:
{
  "generalTips": ["tip"],
  "technicalTips": ["tip"],
  "behavioralTips": ["tip"],
  "redFlags": ["flag"],
  "questionsToAsk": ["question"]
}`,
      },
      {
        role: 'user' as const,
        content: `Tips for ${role} interview`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1000, temperature: 0.4 });
      return JSON.parse(response.content);
    } catch {
      return {
        generalTips: ['Research the company'],
        technicalTips: ['Practice coding problems'],
        behavioralTips: ['Use STAR method'],
        redFlags: ['Watch for red flags in interview'],
        questionsToAsk: ['Ask about team culture'],
      };
    }
  }

  private async saveProfile(profile: SkillProfile): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'skill_profile' as any,
        content: profile as unknown as object,
        confidence: 1,
      },
    });
  }

  private async saveResumeReview(feedback: ResumeFeedback): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'resume_review' as any,
        content: feedback as unknown as object,
        confidence: feedback.overallScore / 100,
      },
    });
  }

  private getFallbackProfile(skills: any[], targetRoles: string[]): SkillProfile {
    return {
      userId: this.userId,
      currentSkills: skills as Skill[],
      targetRoles,
      skillGaps: [],
      jobReadinessScore: 50,
      recommendations: ['Add more skills', 'Get certifications'],
    };
  }

  private getFallbackResumeFeedback(): ResumeFeedback {
    return {
      id: uuid(),
      overallScore: 50,
      sections: [],
      atsScore: 50,
      atsIssues: [],
      keywords: { found: [], missing: [] },
      overallFeedback: 'Unable to analyze',
      improvementSuggestions: ['Try again'],
    };
  }

  private getFallbackMockInterview(role: string): MockInterview {
    return {
      id: uuid(),
      role,
      questions: [],
      responses: [],
      overallScore: 0,
      strengths: [],
      areasToImprove: [],
      finalFeedback: '',
    };
  }

  private getFallbackPortfolioReview(): PortfolioReview {
    return {
      id: uuid(),
      projects: [],
      overallScore: 50,
      strengths: [],
      gaps: [],
      recommendations: [],
    };
  }

  private getFallbackRoadmap(targetRole: string): CareerRoadmap {
    return {
      targetRole,
      currentLevel: 'entry',
      targetLevel: 'mid',
      timeline: [
        {
          phase: 1,
          title: 'Foundation',
          duration: '4 weeks',
          skills: [],
          activities: [],
          deliverables: [],
        },
      ],
      milestones: [],
      requiredSkills: [],
      optionalSkills: [],
    };
  }
}
