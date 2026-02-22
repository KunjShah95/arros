import { z } from 'zod';
import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { v4 as uuid } from 'uuid';

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing' | 'mixed';

export interface LearningStyleProfile {
  userId: string;
  primaryStyle: LearningStyle;
  secondaryStyle?: LearningStyle;
  scores: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    reading_writing: number;
  };
  preferences: {
    preferredContent: string[];
    studyEnvironment: string;
    noteTakingStyle: string;
    assessmentPreference: string;
  };
  recommendations: {
    contentTypes: string[];
    studyStrategies: string[];
    resources: Array<{ type: string; title: string; url?: string }>;
  };
  confidence: number;
  lastUpdated: Date;
}

export interface VAKQuestionnaire {
  questions: Array<{
    id: string;
    category: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
    question: string;
    options: Array<{ text: string; score: { visual: number; auditory: number; kinesthetic: number; reading_writing: number } }>;
  }>;
}

export class LearningStyleDetectorAgent {
  private userId: string;
  private sessionId: string;

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
  }

  async generateQuestionnaire(): Promise<VAKQuestionnaire> {
    return {
      questions: [
        {
          id: '1',
          category: 'visual',
          question: 'When learning something new, I prefer to:',
          options: [
            { text: 'See diagrams, charts, or videos', score: { visual: 4, auditory: 0, kinesthetic: 0, reading_writing: 1 } },
            { text: 'Listen to explanations or podcasts', score: { visual: 0, auditory: 4, kinesthetic: 0, reading_writing: 1 } },
            { text: 'Try it hands-on or with experiments', score: { visual: 0, auditory: 1, kinesthetic: 4, reading_writing: 0 } },
            { text: 'Read textbooks or articles', score: { visual: 0, auditory: 1, kinesthetic: 0, reading_writing: 4 } },
          ],
        },
        {
          id: '2',
          category: 'visual',
          question: 'In a classroom, I learn best when:',
          options: [
            { text: 'The teacher uses slides or whiteboard', score: { visual: 4, auditory: 1, kinesthetic: 0, reading_writing: 0 } },
            { text: 'The teacher explains verbally', score: { visual: 0, auditory: 4, kinesthetic: 0, reading_writing: 1 } },
            { text: 'There are hands-on activities', score: { visual: 0, auditory: 0, kinesthetic: 4, reading_writing: 0 } },
            { text: 'I can take detailed notes', score: { visual: 1, auditory: 1, kinesthetic: 0, reading_writing: 4 } },
          ],
        },
        {
          id: '3',
          category: 'auditory',
          question: 'When following directions, I prefer:',
          options: [
            { text: 'Seeing them written down', score: { visual: 4, auditory: 0, kinesthetic: 0, reading_writing: 1 } },
            { text: 'Having someone explain them to me', score: { visual: 0, auditory: 4, kinesthetic: 0, reading_writing: 1 } },
            { text: 'Figuring them out as I go', score: { visual: 0, auditory: 1, kinesthetic: 4, reading_writing: 0 } },
            { text: 'Reading them silently to myself', score: { visual: 1, auditory: 0, kinesthetic: 0, reading_writing: 4 } },
          ],
        },
        {
          id: '4',
          category: 'kinesthetic',
          question: 'When learning a new software, I usually:',
          options: [
            { text: 'Watch tutorial videos', score: { visual: 4, auditory: 1, kinesthetic: 0, reading_writing: 0 } },
            { text: 'Listen to audio guides', score: { visual: 0, auditory: 4, kinesthetic: 1, reading_writing: 0 } },
            { text: 'Just start clicking around', score: { visual: 0, auditory: 0, kinesthetic: 4, reading_writing: 1 } },
            { text: 'Read the documentation', score: { visual: 1, auditory: 0, kinesthetic: 0, reading_writing: 4 } },
          ],
        },
        {
          id: '5',
          category: 'reading_writing',
          question: 'I remember information best when I:',
          options: [
            { text: 'Create visual maps or diagrams', score: { visual: 4, auditory: 0, kinesthetic: 0, reading_writing: 1 } },
            { text: 'Discuss it with others', score: { visual: 0, auditory: 4, kinesthetic: 1, reading_writing: 0 } },
            { text: 'Practice doing it', score: { visual: 0, auditory: 0, kinesthetic: 4, reading_writing: 1 } },
            { text: 'Write it down or rewrite notes', score: { visual: 1, auditory: 0, kinesthetic: 0, reading_writing: 4 } },
          ],
        },
        {
          id: '6',
          category: 'auditory',
          question: 'When studying for exams, I typically:',
          options: [
            { text: 'Highlight and color-code notes', score: { visual: 4, auditory: 0, kinesthetic: 1, reading_writing: 1 } },
            { text: 'Read notes out loud', score: { visual: 0, auditory: 4, kinesthetic: 0, reading_writing: 1 } },
            { text: 'Use flashcards hands-on', score: { visual: 1, auditory: 1, kinesthetic: 4, reading_writing: 0 } },
            { text: 'Rewrite my notes multiple times', score: { visual: 1, auditory: 0, kinesthetic: 0, reading_writing: 4 } },
          ],
        },
        {
          id: '7',
          category: 'kinesthetic',
          question: 'I feel most engaged when:',
          options: [
            { text: 'Watching demonstrations', score: { visual: 4, auditory: 1, kinesthetic: 0, reading_writing: 0 } },
            { text: 'Listening to discussions', score: { visual: 0, auditory: 4, kinesthetic: 1, reading_writing: 0 } },
            { text: 'Doing physical activities or role-plays', score: { visual: 0, auditory: 1, kinesthetic: 4, reading_writing: 0 } },
            { text: 'Reading and writing independently', score: { visual: 0, auditory: 0, kinesthetic: 0, reading_writing: 4 } },
          ],
        },
        {
          id: '8',
          category: 'visual',
          question: 'When remembering names, I usually:',
          options: [
            { text: 'Remember faces but forget names', score: { visual: 4, auditory: 1, kinesthetic: 0, reading_writing: 0 } },
            { text: 'Need to hear the name multiple times', score: { visual: 0, auditory: 4, kinesthetic: 0, reading_writing: 1 } },
            { text: 'Associate name with a physical action', score: { visual: 1, auditory: 0, kinesthetic: 4, reading_writing: 0 } },
            { text: 'Write the name down to remember', score: { visual: 1, auditory: 0, kinesthetic: 0, reading_writing: 4 } },
          ],
        },
        {
          id: '9',
          category: 'reading_writing',
          question: 'My ideal study space has:',
          options: [
            { text: 'Whiteboards or visual displays', score: { visual: 4, auditory: 0, kinesthetic: 1, reading_writing: 0 } },
            { text: 'Opportunity for discussion', score: { visual: 0, auditory: 4, kinesthetic: 1, reading_writing: 0 } },
            { text: 'Flexible seating for movement', score: { visual: 0, auditory: 1, kinesthetic: 4, reading_writing: 0 } },
            { text: 'Quiet environment with books', score: { visual: 0, auditory: 0, kinesthetic: 0, reading_writing: 4 } },
          ],
        },
        {
          id: '10',
          category: 'kinesthetic',
          question: 'When solving problems, I prefer to:',
          options: [
            { text: 'Draw or visualize the problem', score: { visual: 4, auditory: 0, kinesthetic: 1, reading_writing: 0 } },
            { text: 'Talk through the problem', score: { visual: 0, auditory: 4, kinesthetic: 1, reading_writing: 0 } },
            { text: 'Work through examples physically', score: { visual: 0, auditory: 0, kinesthetic: 4, reading_writing: 1 } },
            { text: 'Write out step-by-step solutions', score: { visual: 1, auditory: 0, kinesthetic: 0, reading_writing: 4 } },
          ],
        },
      ],
    };
  }

  async analyzeResponses(
    responses: Array<{ questionId: string; selectedOption: number }>
  ): Promise<LearningStyleProfile> {
    const questionnaire = await this.generateQuestionnaire();
    
    const scores = {
      visual: 0,
      auditory: 0,
      kinesthetic: 0,
      reading_writing: 0,
    };

    for (const response of responses) {
      const question = questionnaire.questions.find(q => q.id === response.questionId);
      if (question) {
        const selectedOption = question.options[response.selectedOption];
        scores.visual += selectedOption.score.visual;
        scores.auditory += selectedOption.score.auditory;
        scores.kinesthetic += selectedOption.score.kinesthetic;
        scores.reading_writing += selectedOption.score.reading_writing;
      }
    }

    const total = scores.visual + scores.auditory + scores.kinesthetic + scores.reading_writing;
    const normalizedScores = {
      visual: (scores.visual / total) * 100,
      auditory: (scores.auditory / total) * 100,
      kinesthetic: (scores.kinesthetic / total) * 100,
      reading_writing: (scores.reading_writing / total) * 100,
    };

    const sorted = Object.entries(normalizedScores).sort((a, b) => b[1] - a[1]);
    const primaryStyle = sorted[0][0] as LearningStyle;
    const secondaryStyle = sorted[1][1] > 20 ? sorted[1][0] as LearningStyle : undefined;

    const recommendations = this.generateRecommendations(primaryStyle, secondaryStyle);

    const profile: LearningStyleProfile = {
      userId: this.userId,
      primaryStyle,
      secondaryStyle,
      scores: normalizedScores,
      preferences: {
        preferredContent: recommendations.contentTypes,
        studyEnvironment: this.getStudyEnvironment(primaryStyle),
        noteTakingStyle: this.getNoteTakingStyle(primaryStyle),
        assessmentPreference: this.getAssessmentPreference(primaryStyle),
      },
      recommendations,
      confidence: Math.min(0.95, sorted[0][1] / 100 + 0.5),
      lastUpdated: new Date(),
    };

    await this.saveProfile(profile);
    return profile;
  }

  async detectFromBehavior(
    studyPatterns: Array<{
      activity: string;
      duration: number;
      engagement: number;
      contentType: string;
    }>
  ): Promise<LearningStyleProfile> {
    const contentCounts = {
      visual: studyPatterns.filter(p => ['video', 'diagram', 'image'].some(t => p.contentType.includes(t))).length,
      auditory: studyPatterns.filter(p => ['audio', 'podcast', 'discussion'].some(t => p.contentType.includes(t))).length,
      kinesthetic: studyPatterns.filter(p => ['hands-on', 'practice', 'experiment'].some(t => p.contentType.includes(t))).length,
      reading_writing: studyPatterns.filter(p => ['text', 'note', 'article'].some(t => p.contentType.includes(t))).length,
    };

    const total = Object.values(contentCounts).reduce((a, b) => a + b, 0);
    const scores = {
      visual: (contentCounts.visual / Math.max(total, 1)) * 100,
      auditory: (contentCounts.auditory / Math.max(total, 1)) * 100,
      kinesthetic: (contentCounts.kinesthetic / Math.max(total, 1)) * 100,
      reading_writing: (contentCounts.reading_writing / Math.max(total, 1)) * 100,
    };

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const primaryStyle = sorted[0][0] as LearningStyle;

    return {
      userId: this.userId,
      primaryStyle,
      scores,
      preferences: {
        preferredContent: [],
        studyEnvironment: '',
        noteTakingStyle: '',
        assessmentPreference: '',
      },
      recommendations: this.generateRecommendations(primaryStyle),
      confidence: 0.7,
      lastUpdated: new Date(),
    };
  }

  async getProfile(): Promise<LearningStyleProfile | null> {
    const output = await prisma.agentOutput.findFirst({
      where: { type: 'learning_style_profile' as any },
      orderBy: { createdAt: 'desc' },
    });

    return output?.content as unknown as LearningStyleProfile;
  }

  private generateRecommendations(
    primary: LearningStyle,
    secondary?: LearningStyle
  ): LearningStyleProfile['recommendations'] {
    const recommendations: Record<LearningStyle, LearningStyleProfile['recommendations']> = {
      visual: {
        contentTypes: ['Videos', 'Diagrams', 'Infographics', 'Slides', 'Flowcharts', 'Mind maps'],
        studyStrategies: [
          'Use color-coded notes',
          'Watch video tutorials',
          'Create visual summaries',
          'Use flashcards with images',
        ],
        resources: [
          { type: 'video', title: 'Khan Academy', url: 'https://khanacademy.org' },
          { type: 'visual', title: 'Canva for Education', url: 'https://canva.com/education' },
        ],
      },
      auditory: {
        contentTypes: ['Podcasts', 'Audiobooks', 'Lectures', 'Discussions', 'Music'],
        studyStrategies: [
          'Record and replay lectures',
          'Study with music',
          'Participate in study groups',
          'Use text-to-speech tools',
        ],
        resources: [
          { type: 'audio', title: 'Podcast Notes' },
          { type: 'discussion', title: 'Study Groups' },
        ],
      },
      kinesthetic: {
        contentTypes: ['Hands-on labs', 'Simulations', 'Experiments', 'Role-play', 'Demos'],
        studyStrategies: [
          'Take frequent breaks to move',
          'Use hands-on learning activities',
          'Practice with real examples',
          'Build models or prototypes',
        ],
        resources: [
          { type: 'simulation', title: 'PhET Simulations' },
          { type: 'lab', title: 'Virtual Labs' },
        ],
      },
      reading_writing: {
        contentTypes: ['Textbooks', 'Articles', 'Notes', 'Writing exercises', 'Lists'],
        studyStrategies: [
          'Rewrite notes by hand',
          'Create detailed outlines',
          'Write summaries of topics',
          'Use flashcards with text',
        ],
        resources: [
          { type: 'text', title: 'Quizlet' },
          { type: 'writing', title: 'Cornell Notes Method' },
        ],
      },
      mixed: {
        contentTypes: ['Mixed media', 'Multimedia', 'Interactive content'],
        studyStrategies: [
          'Use varied study methods',
          'Combine reading with videos',
          'Mix hands-on with theory',
        ],
        resources: [],
      },
    };

    return recommendations[primary] || recommendations.mixed;
  }

  private getStudyEnvironment(style: LearningStyle): string {
    const envs: Record<LearningStyle, string> = {
      visual: 'Well-lit space with whiteboard access',
      auditory: 'Quiet space or collaborative area',
      kinesthetic: 'Flexible space with room to move',
      reading_writing: 'Quiet library or private space',
      mixed: 'Adaptable environment',
    };
    return envs[style];
  }

  private getNoteTakingStyle(style: LearningStyle): string {
    const styles: Record<LearningStyle, string> = {
      visual: 'Cornell notes with diagrams',
      auditory: 'Voice-recorded notes',
      kinesthetic: 'Bullet points with movement breaks',
      reading_writing: 'Detailed linear notes',
      mixed: 'Flexible note system',
    };
    return styles[style];
  }

  private getAssessmentPreference(style: LearningStyle): string {
    const prefs: Record<LearningStyle, string> = {
      visual: 'Visual presentations, diagram labeling',
      auditory: 'Oral exams, verbal presentations',
      kinesthetic: 'Practical exams, demonstrations',
      reading_writing: 'Written exams, essays',
      mixed: 'Varied assessment formats',
    };
    return prefs[style];
  }

  private async saveProfile(profile: LearningStyleProfile): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'learning_style_profile' as any,
        content: profile as unknown as object,
        confidence: profile.confidence,
      },
    });
  }
}
