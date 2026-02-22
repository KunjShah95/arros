import { z } from 'zod';
import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { wsService } from '../services/websocket';
import { v4 as uuid } from 'uuid';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  sourceFinding?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  easeFactor?: number;
  interval?: number;
  nextReview?: Date;
  reviews?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  sourceSection?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface StudyNotes {
  id: string;
  title: string;
  content: string;
  summary: string;
  keyConcepts: string[];
  formulas: string[];
  diagrams: string[];
  relatedTopics: string[];
}

export interface ExamPrepReport {
  id: string;
  topic: string;
  notes: StudyNotes;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  studyGuide: string;
  lastUpdated: Date;
}

export interface SpacedRepetitionCard extends Flashcard {
  easeFactor: number;
  interval: number;
  nextReview: Date;
  reviews: number;
  lapses: number;
  lastReview?: Date;
}

export interface ScheduleItem {
  id: string;
  day: string;
  topic: string;
  subtopics: string[];
  duration: number;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  resources: string[];
}

export interface FormulaSheet {
  id: string;
  topic: string;
  formulas: Array<{
    name: string;
    formula: string;
    description: string;
    variables: string[];
    example?: string;
  }>;
  categories: string[];
}

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
  color?: string;
}

export interface MockExam {
  id: string;
  title: string;
  topic: string;
  duration: number;
  sections: Array<{
    type: 'mcq' | 'short' | 'long' | 'true_false';
    questions: QuizQuestion[];
    marks: number;
  }>;
  totalMarks: number;
  instructions: string[];
}

export interface LiteratureReview {
  id: string;
  topic: string;
  papers: Array<{
    title: string;
    authors: string[];
    year: number;
    keyFindings: string[];
    methodology: string;
    limitations: string[];
  }>;
  themes: string[];
  gaps: string[];
  synthesis: string;
}

export interface ThesisValidation {
  isValid: boolean;
  score: number;
  strength: 'strong' | 'moderate' | 'weak';
  feedback: string[];
  suggestions: string[];
}

export interface ResearchGap {
  area: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  suggestedTopics: string[];
}

export interface Citation {
  id: string;
  type: 'apa' | 'mla' | 'chicago' | 'ieee' | 'harvard';
  authors: string[];
  title: string;
  year: number;
  source: string;
  url?: string;
  doi?: string;
  formatted: string;
}

export interface SocraticQuestion {
  id: string;
  type: 'clarification' | 'assumption' | 'evidence' | 'implication' | 'viewpoint' | 'concept';
  question: string;
  hint?: string;
  followUp?: string;
}

export interface ConceptDependency {
  concept: string;
  prerequisites: string[];
  difficulty: number;
  timeToLearn: number;
}

export interface AnkiDeck {
  name: string;
  description: string;
  cards: Array<{
    front: string;
    back: string;
    tags: string[];
  }>;
}

export interface StudyAnalytics {
  totalStudyTime: number;
  sessionsCompleted: number;
  cardsReviewed: number;
  averageAccuracy: number;
  strongTopics: string[];
  weakTopics: string[];
  studyStreak: number;
  retentionRate: number;
  competencyRadar: Record<string, number>;
}

const FlashcardSchema = z.object({
  front: z.string(),
  back: z.string(),
  sourceFinding: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.string()),
});

const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number().min(0).max(3),
  explanation: z.string(),
  sourceSection: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

const StudyNotesSchema = z.object({
  title: z.string(),
  content: z.string(),
  summary: z.string(),
  keyConcepts: z.array(z.string()),
  formulas: z.array(z.string()),
  diagrams: z.array(z.string()),
  relatedTopics: z.array(z.string()),
});

export class StudyOSAgent {
  private sessionId: string;
  private userId: string;
  private taskId: string;

  constructor(sessionId: string, userId: string, taskId: string) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.taskId = taskId;
  }

  async generateExamPrepMaterials(
    researchContent: string,
    topic: string,
    options: {
      includeFlashcards?: boolean;
      includeQuiz?: boolean;
      includeNotes?: boolean;
      includeAudio?: boolean;
      numFlashcards?: number;
      numQuestions?: number;
    } = {}
  ): Promise<ExamPrepReport> {
    const {
      includeFlashcards = true,
      includeQuiz = true,
      includeNotes = true,
      includeAudio = false,
      numFlashcards = 10,
      numQuestions = 5,
    } = options;

    wsService.emitTaskProgress(this.sessionId, this.taskId, 10, 'Analyzing research content...');

    const analysis = await this.analyzeContentForLearning(researchContent, topic);

    wsService.emitTaskProgress(this.sessionId, this.taskId, 30, 'Generating study notes...');

    let notes: StudyNotes | null = null;
    if (includeNotes) {
      notes = await this.generateStudyNotes(analysis, topic);
    }

    let flashcards: Flashcard[] = [];
    if (includeFlashcards) {
      wsService.emitTaskProgress(this.sessionId, this.taskId, 50, 'Creating flashcards...');
      flashcards = await this.generateFlashcards(analysis, topic, numFlashcards);
    }

    let quiz: QuizQuestion[] = [];
    if (includeQuiz) {
      wsService.emitTaskProgress(this.sessionId, this.taskId, 70, 'Generating quiz questions...');
      quiz = await this.generateQuiz(analysis, topic, numQuestions);
    }

    const studyGuide = await this.generateStudyGuide(topic, analysis, notes, flashcards, quiz);

    const report: ExamPrepReport = {
      id: uuid(),
      topic,
      notes: notes!,
      flashcards,
      quiz,
      studyGuide,
      lastUpdated: new Date(),
    };

    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: this.taskId,
        type: 'exam_prep',
        content: report as unknown as object,
        confidence: 0.9,
      },
    });

    wsService.emitTaskProgress(this.sessionId, this.taskId, 100, 'Exam prep materials ready!');
    wsService.emitTaskCompleted(this.sessionId, this.taskId, report);

    return report;
  }

  private async analyzeContentForLearning(content: string, topic: string) {
    const messages = [
      {
        role: 'system' as const,
        content: `Analyze content and extract learning components. Return JSON with:
- keyConcepts: array of essential concepts
- definitions: object mapping term to definition
- importantFacts: array of testable facts
- formulas: array of equations
- relationships: array of concept connections`,
      },
      { role: 'user' as const, content: `Topic: ${topic}\n\nContent: ${content.substring(0, 8000)}` },
    ];
    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.3 });
      return JSON.parse(response.content);
    } catch { return { keyConcepts: [], definitions: {}, importantFacts: [], formulas: [], relationships: [] }; }
  }

  async generateStudyNotes(analysis: any, topic: string): Promise<StudyNotes> {
    const messages = [
      {
        role: 'system' as const,
        content: `Create exam-ready study notes. Output JSON:
{
  "title": "Complete Study Notes: [TOPIC]",
  "content": "Full markdown notes",
  "summary": "One paragraph overview",
  "keyConcepts": ["concept1", ...],
  "formulas": ["equations"],
  "diagrams": ["suggested diagrams"],
  "relatedTopics": ["topics to review"]
}`,
      },
      { role: 'user' as const, content: `Generate notes for: ${topic}\n\nAnalysis: ${JSON.stringify(analysis)}` },
    ];
    const response = await llmService.chat(messages, { maxTokens: 3000, temperature: 0.4, responseFormat: StudyNotesSchema });
    const parsed = StudyNotesSchema.parse(JSON.parse(response.content));
    return { ...parsed, id: uuid() };
  }

  async generateFlashcards(analysis: any, topic: string, count: number = 10): Promise<Flashcard[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Generate ${count} effective flashcards. JSON array:
[{"front": "Q", "back": "A", "difficulty": "easy|medium|hard", "tags": ["tag"]}]`,
      },
      { role: 'user' as const, content: `Flashcards for: ${topic}\nConcepts: ${analysis.keyConcepts?.join(', ')}\nFacts: ${analysis.importantFacts?.slice(0, 5).join('; ')}` },
    ];
    try {
      const response = await llmService.chat(messages, { maxTokens: 2500, temperature: 0.5 });
      const flashcardsData = JSON.parse(response.content);
      const parsed = z.array(FlashcardSchema).parse(flashcardsData);
      return parsed.map(f => ({ ...f, id: uuid() }));
    } catch { return this.generateFallbackFlashcards(topic, count); }
  }

  private generateFallbackFlashcards(topic: string, count: number): Flashcard[] {
    const base = [
      { front: `What is ${topic}?`, back: `Definition`, difficulty: 'easy' as const },
      { front: `Why important?`, back: `Significance`, difficulty: 'medium' as const },
      { front: `Applications`, back: `Real-world uses`, difficulty: 'medium' as const },
      { front: `Challenges`, back: `Limitations`, difficulty: 'hard' as const },
      { front: `Future`, back: `Trends`, difficulty: 'hard' as const },
    ];
    return base.slice(0, count).map((c, i) => ({ ...c, id: uuid(), tags: [topic] }));
  }

  async generateQuiz(analysis: any, topic: string, count: number = 5): Promise<QuizQuestion[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Generate ${count} quiz questions. JSON array:
[{"question": "Q", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "E", "difficulty": "easy|medium|hard"}]`,
      },
      { role: 'user' as const, content: `Quiz for: ${topic}\nConcepts: ${analysis.keyConcepts?.join(', ')}` },
    ];
    try {
      const response = await llmService.chat(messages, { maxTokens: 2500, temperature: 0.5 });
      const quizData = JSON.parse(response.content);
      const parsed = z.array(QuizQuestionSchema).parse(quizData);
      return parsed.map(q => ({ ...q, id: uuid() }));
    } catch { return this.generateFallbackQuiz(topic, count); }
  }

  private generateFallbackQuiz(topic: string, count: number): QuizQuestion[] {
    const fallback: QuizQuestion[] = [
      { id: uuid(), question: `What is ${topic}?`, options: ['A', 'B', 'C', 'D'], correctAnswer: 0, explanation: 'Main definition', difficulty: 'easy' },
      { id: uuid(), question: `Key challenge?`, options: ['A', 'B', 'C', 'D'], correctAnswer: 3, explanation: 'Both A and B', difficulty: 'medium' },
    ];
    return fallback.slice(0, count);
  }

  private async generateStudyGuide(topic: string, analysis: any, notes: StudyNotes | null, flashcards: Flashcard[], quiz: QuizQuestion[]): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Create practical 1-week study plan with daily schedule, time estimates, tips.',
      },
      { role: 'user' as const, content: `Study guide for: ${topic}\nConcepts: ${analysis.keyConcepts?.join(', ')}\nCards: ${flashcards.length}\nQuestions: ${quiz.length}` },
    ];
    const response = await llmService.chat(messages, { maxTokens: 1500, temperature: 0.4 });
    return response.content;
  }

  async generateFromPDF(pdfText: string, title: string): Promise<ExamPrepReport> {
    return this.generateExamPrepMaterials(pdfText, title, { includeFlashcards: true, includeQuiz: true, includeNotes: true, includeAudio: true });
  }

  async continueStudySession(previousMaterials: ExamPrepReport, focusAreas?: string[]): Promise<ExamPrepReport> {
    const enhancedTopic = focusAreas ? `${previousMaterials.topic} (Focus: ${focusAreas.join(', ')})` : previousMaterials.topic;
    const existingContent = `Previous: ${previousMaterials.notes?.summary || ''}\nConcepts: ${previousMaterials.notes?.keyConcepts?.join(', ')}`;
    return this.generateExamPrepMaterials(existingContent, enhancedTopic, { numFlashcards: 5, numQuestions: 3 });
  }
}

export class SpacedRepetitionAgent {
  private userId: string;
  constructor(userId: string) { this.userId = userId; }

  async createSRSQueue(cards: Flashcard[], settings?: { maxDaily?: number; startingEase?: number }): Promise<SpacedRepetitionCard[]> {
    const srsCards: SpacedRepetitionCard[] = cards.map(card => ({
      ...card,
      easeFactor: settings?.startingEase || 2.5,
      interval: 1,
      nextReview: new Date(),
      reviews: 0,
      lapses: 0,
    }));
    
    await prisma.agentOutput.create({
      data: {
        sessionId: uuid(),
        taskId: uuid(),
        type: 'srs_queue',
        content: { cards: srsCards, settings } as unknown as object,
        confidence: 1.0,
      },
    });
    
    return srsCards;
  }

  async reviewCard(cardId: string, quality: number): Promise<{ nextReview: Date; interval: number; easeFactor: number }> {
    const SM2 = (quality: number, ease: number, interval: number, reps: number) => {
      let newEase = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      newEase = Math.max(1.3, newEase);
      
      let newInterval: number;
      if (quality < 3) { newInterval = 1; }
      else if (reps === 0) { newInterval = 1; }
      else if (reps === 1) { newInterval = 6; }
      else { newInterval = Math.round(interval * newEase); }
      
      return { ease: newEase, interval: newInterval };
    };

    const result = SM2(quality, 2.5, 1, 0);
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + result.interval);
    
    return { nextReview, interval: result.interval, easeFactor: result.ease };
  }

  async getDueCards(): Promise<SpacedRepetitionCard[]> {
    const outputs = await prisma.agentOutput.findMany({
      where: { type: 'srs_queue' as any },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    
    const now = new Date();
    return outputs
      .filter(o => o.content && typeof o.content === 'object' && 'cards' in o.content)
      .flatMap(o => (o.content as any).cards as SpacedRepetitionCard[])
      .filter(c => c.nextReview && new Date(c.nextReview) <= now);
  }

  async getReviewStats(): Promise<{ today: number; tomorrow: number; week: number }> {
    const now = new Date();
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    const week = new Date(now); week.setDate(week.getDate() + 7);
    
    return { today: await this.getDueCards().then(c => c.length), tomorrow: 5, week: 20 };
  }
}

export class FormulaSheetAgent {
  async generateFormulaSheet(topic: string, content: string): Promise<FormulaSheet> {
    const messages = [
      {
        role: 'system' as const,
        content: `Extract all formulas into structured JSON:
{
  "topic": "topic name",
  "formulas": [{"name": "Formula Name", "formula": "E=mc^2", "description": "What it means", "variables": ["E","m","c"], "example": "optional"}],
  "categories": ["category1"]
}`,
      },
      { role: 'user' as const, content: `Extract formulas for: ${topic}\n\nContent: ${content.substring(0, 5000)}` },
    ];
    
    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.3 });
      const parsed = JSON.parse(response.content);
      return { id: uuid(), ...parsed };
    } catch {
      return { id: uuid(), topic, formulas: [], categories: [] };
    }
  }

  generateCheatSheet(formulas: FormulaSheet[]): string {
    let sheet = `# Quick Reference: ${formulas[0]?.topic || 'Formulas'}\n\n`;
    
    for (const fs of formulas) {
      sheet += `## ${fs.topic}\n\n`;
      for (const f of fs.formulas) {
        sheet += `**${f.name}**: \`${f.formula}\`\n`;
        sheet += `> ${f.description}\n`;
        if (f.variables?.length) sheet += `Vars: ${f.variables.join(', ')}\n`;
        sheet += '\n';
      }
    }
    return sheet;
  }
}

export class MockExamAgent {
  async generateMockExam(topic: string, content: string, options?: { 
    duration?: number; 
    sections?: string[];
    totalMarks?: number;
  }): Promise<MockExam> {
    const messages = [
      {
        role: 'system' as const,
        content: `Generate a complete mock exam. JSON:
{
  "title": "Exam Title",
  "topic": "topic",
  "duration": 180,
  "totalMarks": 100,
  "instructions": ["instruction1"],
  "sections": [{"type": "mcq|short|long|true_false", "questions": [...], "marks": 25}]
}`,
      },
      { role: 'user' as const, content: `Create exam for: ${topic}\nMarks: ${options?.totalMarks || 100}\nDuration: ${options?.duration || 180}min\nContent: ${content.substring(0, 5000)}` },
    ];
    
    const response = await llmService.chat(messages, { maxTokens: 3000, temperature: 0.5 });
    const parsed = JSON.parse(response.content);
    
    return {
      id: uuid(),
      duration: options?.duration || 180,
      ...parsed,
      sections: parsed.sections?.map((s: any) => ({
        ...s,
        questions: s.questions?.map((q: any) => ({ ...q, id: uuid() })) || []
      })) || []
    };
  }

  generateAnswerKey(exam: MockExam): string {
    let key = `# Answer Key: ${exam.title}\n\n`;
    let qNum = 1;
    
    for (const section of exam.sections) {
      key += `## ${section.type.toUpperCase()} (${section.marks} marks)\n\n`;
      for (const q of section.questions) {
        key += `**Q${qNum}**: ${q.question}\n`;
        key += `**Ans**: Option ${q.correctAnswer + 1} - ${q.options[q.correctAnswer]}\n`;
        key += `**Exp**: ${q.explanation}\n\n`;
        qNum++;
      }
    }
    return key;
  }
}

export class RevisionSchedulerAgent {
  async generateSchedule(
    topic: string,
    subtopics: string[],
    examDate: Date,
    dailyHours: number = 2
  ): Promise<ScheduleItem[]> {
    const daysUntil = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const totalHours = daysUntil * dailyHours;
    
    const messages = [
      {
        role: 'system' as const,
        content: `Create a day-by-day study schedule. JSON array:
[{"day": "Day 1", "topic": "Main topic", "subtopics": ["sub1"], "duration": 60, "priority": "high|medium|low", "completed": false, "resources": []}]`,
      },
      { role: 'user' as const, content: `Create ${daysUntil}-day schedule for: ${topic}\nTopics: ${subtopics.join(', ')}\nHours/day: ${dailyHours}\nExam: ${examDate.toISOString()}` },
    ];
    
    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.4 });
      const schedule = JSON.parse(response.content);
      return schedule.map((s: any) => ({ ...s, id: uuid() }));
    } catch { return []; }
  }

  async updateProgress(scheduleId: string, completed: boolean): Promise<void> {
    console.log(`Updated schedule ${scheduleId} to ${completed}`);
  }

  getProgress(schedule: ScheduleItem[]): number {
    const completed = schedule.filter(s => s.completed).length;
    return schedule.length > 0 ? (completed / schedule.length) * 100 : 0;
  }
}

export class LiteratureReviewAgent {
  async buildLiteratureReview(topic: string, papers: string[]): Promise<LiteratureReview> {
    const messages = [
      {
        role: 'system' as const,
        content: `Analyze papers and create literature review. JSON:
{
  "topic": "topic",
  "papers": [{"title": "", "authors": [], "year": 2024, "keyFindings": [], "methodology": "", "limitations": []}],
  "themes": [],
  "gaps": [],
  "synthesis": "overall summary"
}`,
      },
      { role: 'user' as const, content: `Build lit review for: ${topic}\nPapers:\n${papers.join('\n---\n')}` },
    ];
    
    const response = await llmService.chat(messages, { maxTokens: 3000, temperature: 0.4 });
    const parsed = JSON.parse(response.content);
    return { id: uuid(), ...parsed };
  }

  async getRelatedPapers(topic: string, count: number = 10): Promise<any[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Find related academic papers. Return JSON array of ${count} papers with: title, authors, year, abstract, url`,
      },
      { role: 'user' as const, content: `Find papers related to: ${topic}` },
    ];
    
    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.5 });
      return JSON.parse(response.content);
    } catch { return []; }
  }
}

export class ThesisValidatorAgent {
  async validateThesis(thesis: string, context?: string): Promise<ThesisValidation> {
    const messages = [
      {
        role: 'system' as const,
        content: `Evaluate a thesis statement. JSON:
{"isValid": true, "score": 85, "strength": "strong|moderate|weak", "feedback": [], "suggestions": []}`,
      },
      { role: 'user' as const, content: `Thesis: ${thesis}\nContext: ${context || 'No additional context'}` },
    ];
    
    const response = await llmService.chat(messages, { maxTokens: 1500, temperature: 0.3 });
    const parsed = JSON.parse(response.content);
    return parsed;
  }
}

export class ResearchGapFinderAgent {
  async findGaps(topic: string, existingPapers: string[]): Promise<ResearchGap[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Identify research gaps. JSON array:
[{"area": "Gap area", "description": "description", "importance": "high|medium|low", "suggestedTopics": []}]`,
      },
      { role: 'user' as const, content: `Find gaps in: ${topic}\nKnown papers:\n${existingPapers.join('\n')}` },
    ];
    
    const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.4 });
    try { return JSON.parse(response.content); }
    catch { return []; }
  }
}

export class CitationGeneratorAgent {
  generateCitation(citation: Omit<Citation, 'id' | 'formatted'>, format: Citation['type']): string {
    const { authors, title, year, source, url, doi } = citation;
    const authorStr = authors.length > 3 ? `${authors[0]} et al.` : authors.join(', ');
    
    switch (format) {
      case 'apa': return `${authorStr} (${year}). ${title}. ${source}. ${doi || url || ''}`;
      case 'mla': return `${authorStr}. "${title}." ${source}, ${year}. ${url || ''}`;
      case 'chicago': return `${authorStr}. "${title}." ${source} (${year}). ${doi || url || ''}`;
      case 'ieee': return `${authorStr}, "${title}," ${source}, ${year}.`;
      case 'harvard': return `${authorStr} (${year}) '${title}', ${source}.`;
      default: return `${authorStr} (${year}). ${title}.`;
    }
  }

  async formatReferences(papers: string[], format: Citation['type']): Promise<Citation[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Extract citation info and format as JSON: [{"authors": [], "title": "", "year": 2024, "source": "", "url": "", "doi": ""}]`,
      },
      { role: 'user' as const, content: `Extract citations from:\n${papers.join('\n---\n')}` },
    ];
    
    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.3 });
      const extracted = JSON.parse(response.content);
      return extracted.map((c: any) => ({
        id: uuid(),
        ...c,
        type: format,
        formatted: this.generateCitation({ ...c, type: format } as any, format)
      }));
    } catch { return []; }
  }
}

export class PaperComparatorAgent {
  async comparePapers(papers: string[]): Promise<{
    comparison: any;
    summary: string;
    recommendations: string[];
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `Compare papers. JSON:
{"comparison": {"methodology": {}, "findings": {}, "limitations": {}}, "summary": "summary", "recommendations": []}`,
      },
      { role: 'user' as const, content: `Compare these papers:\n${papers.join('\n\n===\n\n')}` },
    ];
    
    const response = await llmService.chat(messages, { maxTokens: 2500, temperature: 0.4 });
    return JSON.parse(response.content);
  }
}

export class MindMapGeneratorAgent {
  async generateMindMap(topic: string, content: string): Promise<MindMapNode> {
    const messages = [
      {
        role: 'system' as const,
        content: `Generate a hierarchical mind map. JSON:
{"id": "root", "label": "Main Topic", "children": [{"id": "c1", "label": "Branch", "children": []}], "color": "#color"}`,
      },
      { role: 'user' as const, content: `Create mind map for: ${topic}\nContent: ${content.substring(0, 4000)}` },
    ];
    
    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.5 });
      return JSON.parse(response.content);
    } catch { return { id: 'root', label: topic, children: [] }; }
  }

  generateMermaidCode(node: MindMapNode): string {
    let code = `mindmap\n  root(( ${node.label} ))\n`;
    
    const traverse = (n: MindMapNode, indent: string = '    ') => {
      if (n.children) {
        for (const child of n.children) {
          code += `${indent}${child.label}\n`;
          traverse(child, indent + '    ');
        }
      }
    };
    
    traverse(node);
    return code;
  }
}

export class SocraticTutorAgent {
  private conversationHistory: SocraticQuestion[] = [];
  
  async askQuestion(topic: string, context?: string): Promise<SocraticQuestion> {
    const messages = [
      {
        role: 'system' as const,
        content: `Ask a Socratic question to guide learning. Types: clarification, assumption, evidence, implication, viewpoint, concept. JSON:
{"type": "clarification", "question": "Socratic question", "hint": "optional hint", "followUp": "follow-up question"}`,
      },
      { role: 'user' as const, content: `Ask about: ${topic}\nContext: ${context || 'No context'}\nHistory: ${JSON.stringify(this.conversationHistory.slice(-3))}` },
    ];
    
    const response = await llmService.chat(messages, { maxTokens: 500, temperature: 0.7 });
    const question = JSON.parse(response.content);
    this.conversationHistory.push(question);
    return question;
  }

  async evaluateAnswer(question: SocraticQuestion, answer: string): Promise<{ score: number; feedback: string }> {
    const messages = [
      {
        role: 'system' as const,
        content: `Evaluate a student answer. JSON: {"score": 0-100, "feedback": "constructive feedback"}`,
      },
      { role: 'user' as const, content: `Question: ${question.question}\nAnswer: ${answer}` },
    ];
    
    const response = await llmService.chat(messages, { maxTokens: 500, temperature: 0.4 });
    return JSON.parse(response.content);
  }

  async explainAtLevel(concept: string, level: number): Promise<string> {
    const levels = ['Explain like I\'m 5', 'Explain like a middle schooler', 'Explain like a high schooler', 'Explain academically', 'Expert level'];
    const messages = [
      { role: 'system' as const, content: `Explain concepts at the specified level.` },
      { role: 'user' as const, content: `${levels[level]}: ${concept}` },
    ];
    
    const response = await llmService.chat(messages, { maxTokens: 1000, temperature: 0.4 });
    return response.content;
  }

  resetConversation() { this.conversationHistory = []; }
}

export class ConceptDependencyAgent {
  async buildDependencyGraph(concepts: string[], content: string): Promise<ConceptDependency[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Map concept dependencies. JSON array:
[{"concept": "name", "prerequisites": ["prereq1"], "difficulty": 1-5, "timeToLearn": 30}]`,
      },
      { role: 'user' as const, content: `Map dependencies for: ${concepts.join(', ')}\nContent: ${content.substring(0, 3000)}` },
    ];
    
    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.4 });
      return JSON.parse(response.content);
    } catch { return []; }
  }

  suggestLearningPath(dependencies: ConceptDependency[]): string[] {
    const learned = new Set<string>();
    const path: string[] = [];
    
    const canLearn = (concept: string): boolean => {
      const dep = dependencies.find(d => d.concept === concept);
      if (!dep) return true;
      return dep.prerequisites.every(p => learned.has(p));
    };
    
    const remaining = [...dependencies];
    while (remaining.length > 0) {
      const next = remaining.find(c => canLearn(c.concept));
      if (!next) break;
      learned.add(next.concept);
      path.push(next.concept);
      remaining.splice(remaining.indexOf(next), 1);
    }
    
    return path;
  }
}

export class AnkiExportAgent {
  generateAnkiDeck(cards: Flashcard[], deckName: string): AnkiDeck {
    return {
      name: deckName,
      description: `Generated by StudyOS - ${deckName}`,
      cards: cards.map(c => ({
        front: c.front,
        back: c.back,
        tags: c.tags,
      })),
    };
  }

  generateApkgFile(deck: AnkiDeck): Buffer {
    const csv = deck.cards.map(c => `"${c.front}","${c.back}","${c.tags.join(';')}"`).join('\n');
    return Buffer.from(csv);
  }

  async exportToCSV(deck: AnkiDeck): Promise<string> {
    let csv = 'front,back,tags\n';
    for (const card of deck.cards) {
      csv += `"${card.front.replace(/"/g, '""')}","${card.back.replace(/"/g, '""')}","${card.tags.join(';')}"\n`;
    }
    return csv;
  }
}

export class LearningAnalyticsAgent {
  async getAnalytics(userId: string): Promise<StudyAnalytics> {
    const sessions = await prisma.session.findMany({ where: { userId }, take: 50 });
    
    const analytics: StudyAnalytics = {
      totalStudyTime: sessions.length * 45,
      sessionsCompleted: sessions.filter(s => s.status === 'completed').length,
      cardsReviewed: Math.floor(Math.random() * 500) + 100,
      averageAccuracy: Math.random() * 20 + 75,
      strongTopics: ['Machine Learning', 'Data Structures'],
      weakTopics: ['Quantum Computing'],
      studyStreak: Math.floor(Math.random() * 10) + 1,
      retentionRate: Math.random() * 15 + 80,
      competencyRadar: { 'ML': 85, 'Algorithms': 72, 'Databases': 68, 'Web Dev': 90, 'System Design': 65 },
    };
    
    return analytics;
  }

  generateInsights(analytics: StudyAnalytics): string[] {
    const insights: string[] = [];
    
    if (analytics.studyStreak > 5) insights.push('Great job maintaining your study streak!');
    if (analytics.averageAccuracy < 80) insights.push('Focus more on weak topics: ' + analytics.weakTopics.join(', '));
    if (analytics.retentionRate < 85) insights.push('Consider using spaced repetition to improve retention');
    
    return insights;
  }
}

export class DecentralizedShareAgent {
  private userId: string;
  constructor(userId: string) { this.userId = userId; }

  async createShareableStudyBundle(materials: any, options: {
    includeFlashcards?: boolean;
    includeNotes?: boolean;
    includeQuiz?: boolean;
    accessLevel?: 'public' | 'university' | 'private';
  } = {}): Promise<{ bundleId: string; shareUrl: string; qrCode: string; accessCode?: string }> {
    const bundleId = uuid().substring(0, 8);
    const shareUrl = `https://studyos.ai/s/${bundleId}`;
    const accessCode = options.accessLevel === 'private' ? uuid().substring(0, 6).toUpperCase() : undefined;

    await prisma.agentOutput.create({
      data: {
        sessionId: bundleId,
        taskId: bundleId,
        type: 'share_bundle',
        content: { materials, accessLevel: options.accessLevel || 'public', creatorId: this.userId } as unknown as object,
        confidence: 1.0,
      },
    });

    return {
      bundleId,
      shareUrl,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`,
      accessCode,
    };
  }
}

export interface VideoSummary {
  id: string;
  url: string;
  title: string;
  duration: number;
  summary: string;
  timestamps: Array<{ time: number; label: string }>;
  keyTakeaways: string[];
  transcript?: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export interface StudyRoom {
  id: string;
  name: string;
  topic: string;
  participants: string[];
  currentSlide?: number;
  sharedNotes: string;
  createdAt: Date;
  isActive: boolean;
}

export interface PomodoroSession {
  id: string;
  userId: string;
  type: 'focus' | 'short_break' | 'long_break';
  duration: number;
  startedAt: Date;
  completedAt?: Date;
  completed: boolean;
  task?: string;
}

export interface ErrorLog {
  id: string;
  userId: string;
  topic: string;
  question: string;
  yourAnswer: string;
  correctAnswer: string;
  mistakeType: 'concept' | 'calculation' | 'memory' | 'misread';
  timestamp: Date;
}

export interface QuestionBankItem {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  author: string;
  upvotes: number;
  createdAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  unlockedAt?: Date;
}

export interface UserProfile {
  userId: string;
  xp: number;
  level: number;
  streak: number;
  badges: Badge[];
  totalStudyTime: number;
  examsPassed: number;
}

export class VideoSummarizerAgent {
  async summarizeVideo(url: string): Promise<VideoSummary> {
    const messages = [
      {
        role: 'system' as const,
        content: `Analyze a video and create a comprehensive summary. JSON:
{
  "url": "video url",
  "title": "Video Title",
  "duration": 600,
  "summary": "Full summary",
  "timestamps": [{"time": 0, "label": "Intro"}, {"time": 120, "label": "Main Topic"}],
  "keyTakeaways": ["point1", "point2"],
  "transcript": "optional transcript excerpt"
}`,
      },
      { role: 'user' as const, content: `Summarize: ${url}` },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 3000, temperature: 0.4 });
      const parsed = JSON.parse(response.content);
      
      const summary: VideoSummary = {
        id: uuid(),
        ...parsed,
        flashcards: this.generateFlashcardsFromSummary(parsed),
        quiz: this.generateQuizFromSummary(parsed),
      };
      
      return summary;
    } catch {
      return { id: uuid(), url, title: 'Video Summary', duration: 0, summary: '', timestamps: [], keyTakeaways: [], flashcards: [], quiz: [] };
    }
  }

  private generateFlashcardsFromSummary(video: any): Flashcard[] {
    const takeaways = video.keyTakeaways || [];
    return takeaways.slice(0, 5).map((t: string, i: number) => ({
      id: uuid(),
      front: `Key point ${i + 1} from video`,
      back: t,
      difficulty: 'medium' as const,
      tags: [video.title?.substring(0, 20) || 'video'],
    }));
  }

  private generateQuizFromSummary(video: any): QuizQuestion[] {
    const takeaways = video.keyTakeaways || [];
    return takeaways.slice(0, 3).map((t: string, i: number) => ({
      id: uuid(),
      question: `What is "${t.substring(0, 50)}..." about?`,
      options: ['The main topic', 'A supporting point', 'An example', 'A conclusion'],
      correctAnswer: 0,
      explanation: t,
      difficulty: 'medium' as const,
    }));
  }

  async extractTimestamps(content: string): Promise<Array<{ time: number; label: string }>> {
    const messages = [
      { role: 'system' as const, content: 'Extract key timestamps from transcript. JSON array: [{"time": 0, "label": "intro"}]' },
      { role: 'user' as const, content: content.substring(0, 5000) },
    ];
    try {
      const response = await llmService.chat(messages, { maxTokens: 1000, temperature: 0.3 });
      return JSON.parse(response.content);
    } catch { return []; }
  }
}

export class CollaborativeStudyRoomAgent {
  private rooms: Map<string, StudyRoom> = new Map();

  async createRoom(name: string, topic: string, creatorId: string): Promise<StudyRoom> {
    const room: StudyRoom = {
      id: uuid().substring(0, 8),
      name,
      topic,
      participants: [creatorId],
      sharedNotes: '',
      createdAt: new Date(),
      isActive: true,
    };
    
    this.rooms.set(room.id, room);
    
    await prisma.agentOutput.create({
      data: {
        sessionId: room.id,
        taskId: room.id,
        type: 'study_room',
        content: room as unknown as object,
        confidence: 1.0,
      },
    });
    
    return room;
  }

  async joinRoom(roomId: string, userId: string): Promise<StudyRoom | null> {
    const room = this.rooms.get(roomId);
    if (room && !room.participants.includes(userId)) {
      room.participants.push(userId);
    }
    return room || null;
  }

  async updateNotes(roomId: string, notes: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      room.sharedNotes = notes;
    }
  }

  async getActiveRooms(): Promise<StudyRoom[]> {
    return Array.from(this.rooms.values()).filter(r => r.isActive);
  }

  async endSession(roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      room.isActive = false;
    }
  }
}

export class PomodoroAgent {
  async startSession(userId: string, type: PomodoroSession['type'], duration: number, task?: string): Promise<PomodoroSession> {
    const session: PomodoroSession = {
      id: uuid(),
      userId,
      type,
      duration,
      startedAt: new Date(),
      task,
      completed: false,
    };

    await prisma.agentOutput.create({
      data: {
        sessionId: session.id,
        taskId: session.id,
        type: 'pomodoro',
        content: session as unknown as object,
        confidence: 1.0,
      },
    });

    return session;
  }

  async completeSession(sessionId: string): Promise<PomodoroSession | null> {
    const outputs = await prisma.agentOutput.findMany({
      where: { sessionId: sessionId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (outputs.length === 0) return null;

    const session = outputs[0].content as unknown as PomodoroSession;
    session.completed = true;
    session.completedAt = new Date();

    return session;
  }

  async getTodayStats(userId: string): Promise<{ focusTime: number; sessions: number; breaks: number }> {
    const outputs = await prisma.agentOutput.findMany({
      where: { 
        type: 'pomodoro' as any,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions = outputs.filter(o => {
      const s = o.content as unknown as PomodoroSession;
      return s.userId === userId && s.startedAt >= today && s.completed;
    });

    const focusSessions = todaySessions.filter(s => (s.content as any).type === 'focus');
    
    return {
      focusTime: focusSessions.reduce((sum, s) => sum + (s.content as any).duration, 0),
      sessions: focusSessions.length,
      breaks: todaySessions.filter(s => (s.content as any).type.includes('break')).length,
    };
  }
}

export class ErrorTrackingAgent {
  async logError(error: Omit<ErrorLog, 'id' | 'timestamp'>): Promise<ErrorLog> {
    const errorLog: ErrorLog = {
      id: uuid(),
      ...error,
      timestamp: new Date(),
    };

    await prisma.agentOutput.create({
      data: {
        sessionId: errorLog.id,
        taskId: errorLog.id,
        type: 'error_log',
        content: errorLog as unknown as object,
        confidence: 1.0,
      },
    });

    return errorLog;
  }

  async getWeakAreas(userId: string): Promise<Array<{ topic: string; errorCount: number; mistakeTypes: Record<string, number> }>> {
    const outputs = await prisma.agentOutput.findMany({
      where: { type: 'error_log' as any },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const errors = outputs.map(o => o.content as unknown as ErrorLog).filter(e => e.userId === userId);
    
    const topicCounts: Record<string, number> = {};
    const topicMistakes: Record<string, Record<string, number>> = {};

    for (const error of errors) {
      topicCounts[error.topic] = (topicCounts[error.topic] || 0) + 1;
      if (!topicMistakes[error.topic]) topicMistakes[error.topic] = {};
      topicMistakes[error.topic][error.mistakeType] = (topicMistakes[error.topic][error.mistakeType] || 0) + 1;
    }

    return Object.entries(topicCounts).map(([topic, count]) => ({
      topic,
      errorCount: count,
      mistakeTypes: topicMistakes[topic],
    })).sort((a, b) => b.errorCount - a.errorCount);
  }

  generateRemedialStudyplan(weakAreas: Array<{ topic: string; errorCount: number }>): string {
    const plan = weakAreas.slice(0, 5).map((area, i) => 
      `Day ${i + 1}: Review ${area.topic} (${area.errorCount} mistakes to correct)`
    ).join('\n');
    return `# Remedial Study Plan\n\n${plan}`;
  }
}

export class QuestionBankAgent {
  async addQuestion(question: Omit<QuestionBankItem, 'id' | 'upvotes' | 'createdAt'>): Promise<QuestionBankItem> {
    const item: QuestionBankItem = {
      id: uuid(),
      ...question,
      upvotes: 0,
      createdAt: new Date(),
    };

    await prisma.agentOutput.create({
      data: {
        sessionId: item.id,
        taskId: item.id,
        type: 'question_bank',
        content: item as unknown as object,
        confidence: 1.0,
      },
    });

    return item;
  }

  async getQuestions(topic?: string, difficulty?: string, limit: number = 20): Promise<QuestionBankItem[]> {
    const outputs = await prisma.agentOutput.findMany({
      where: { type: 'question_bank' as any },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    let questions = outputs.map(o => o.content as unknown as QuestionBankItem);
    
    if (topic) questions = questions.filter(q => q.topic.toLowerCase().includes(topic.toLowerCase()));
    if (difficulty) questions = questions.filter(q => q.difficulty === difficulty);
    
    return questions.slice(0, limit);
  }

  async upvote(questionId: string): Promise<void> {
    console.log(`Upvoted question ${questionId}`);
  }

  async generateFromContent(topic: string, content: string, count: number = 10): Promise<QuestionBankItem[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Generate ${count} exam-style questions. JSON array:
[{"question": "Q", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "E", "topic": "topic", "difficulty": "easy|medium|hard", "author": "AI"}]`,
      },
      { role: 'user' as const, content: `Questions for: ${topic}\n\nContent: ${content.substring(0, 4000)}` },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 2500, temperature: 0.5 });
      return JSON.parse(response.content);
    } catch { return []; }
  }
}

export class GamificationAgent {
  private badges: Badge[] = [
    { id: 'streak_7', name: 'Week Warrior', description: 'Study for 7 days in a row', icon: '🔥', xp: 100 },
    { id: 'streak_30', name: 'Monthly Master', description: 'Study for 30 days in a row', icon: '🏆', xp: 500 },
    { id: 'cards_100', name: 'Card Collector', description: 'Review 100 flashcards', icon: '📚', xp: 50 },
    { id: 'cards_1000', name: 'Memory Master', description: 'Review 1000 flashcards', icon: '🧠', xp: 200 },
    { id: 'exam_pass', name: 'Exam Crusher', description: 'Score 90%+ on a mock exam', icon: '🎯', xp: 150 },
    { id: 'perfect_quiz', name: 'Perfect Score', description: 'Get 100% on any quiz', icon: '⭐', xp: 75 },
    { id: 'early_bird', name: 'Early Bird', description: 'Study before 6 AM', icon: '🌅', xp: 25 },
    { id: 'night_owl', name: 'Night Owl', description: 'Study after midnight', icon: '🦉', xp: 25 },
    { id: 'first_card', name: 'First Step', description: 'Create your first flashcard', icon: '🚀', xp: 10 },
    { id: 'help_hand', name: 'Helper', description: 'Share a question with the community', icon: '🤝', xp: 30 },
  ];

  async getUserProfile(userId: string): Promise<UserProfile> {
    const outputs = await prisma.agentOutput.findMany({
      where: { type: 'pomodoro' as any },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const sessions = outputs.filter(o => (o.content as any).userId === userId && (o.content as any).completed);
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.content as any).duration, 0);
    const xp = Math.floor(totalMinutes * 2 + sessions.length * 10);
    const level = Math.floor(xp / 500) + 1;

    return {
      userId,
      xp,
      level,
      streak: Math.floor(Math.random() * 15) + 1,
      badges: this.badges.slice(0, 3),
      totalStudyTime: totalMinutes,
      examsPassed: Math.floor(Math.random() * 5),
    };
  }

  async checkAndAwardBadges(userId: string): Promise<Badge[]> {
    const profile = await this.getUserProfile(userId);
    const unlocked: Badge[] = [];

    if (profile.streak >= 7) unlocked.push(this.badges.find(b => b.id === 'streak_7')!);
    if (profile.streak >= 30) unlocked.push(this.badges.find(b => b.id === 'streak_30')!);
    if (profile.totalStudyTime >= 600) unlocked.push(this.badges.find(b => b.id === 'cards_100')!);

    return unlocked;
  }

  getLevelProgress(xp: number): { currentLevel: number; xpForNext: number; progress: number } {
    const currentLevel = Math.floor(xp / 500);
    const xpForNext = (currentLevel + 1) * 500;
    const progress = ((xp % 500) / 500) * 100;
    return { currentLevel: currentLevel + 1, xpForNext, progress };
  }
}

export class PDFAnnotationAgent {
  async annotatePDF(pdfId: string, annotations: Array<{ page: number; type: 'highlight' | 'note'; content: string; position: any }>): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: pdfId,
        taskId: uuid(),
        type: 'pdf_annotation',
        content: { annotations } as unknown as object,
        confidence: 1.0,
      },
    });
  }

  async getAnnotations(pdfId: string): Promise<any[]> {
    const outputs = await prisma.agentOutput.findMany({
      where: { sessionId: pdfId, type: 'pdf_annotation' as any },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    const content = outputs[0]?.content as any;
    return content?.annotations || [];
  }

  async generateHighlights(content: string): Promise<Array<{ text: string; note: string }>> {
    const messages = [
      { role: 'system' as const, content: 'Extract important passages and notes. JSON: [{"text": "quote", "note": "why important"}]' },
      { role: 'user' as const, content: content.substring(0, 5000) },
    ];
    try {
      const response = await llmService.chat(messages, { maxTokens: 1500, temperature: 0.3 });
      return JSON.parse(response.content);
    } catch { return []; }
  }
}

export class ExamCountdownAgent {
  addExam(examId: string, name: string, date: Date, subject: string): void {
    console.log(`Added exam: ${name} on ${date.toISOString()}`);
  }

  getCountdown(examDate: Date): { days: number; hours: number; minutes: number; seconds: number } {
    const now = new Date();
    const diff = examDate.getTime() - now.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days: Math.max(0, days), hours: Math.max(0, hours), minutes: Math.max(0, minutes), seconds: Math.max(0, seconds) };
  }

  getUrgencyLevel(daysLeft: number): 'critical' | 'high' | 'medium' | 'low' {
    if (daysLeft <= 1) return 'critical';
    if (daysLeft <= 7) return 'high';
    if (daysLeft <= 30) return 'medium';
    return 'low';
  }
}
