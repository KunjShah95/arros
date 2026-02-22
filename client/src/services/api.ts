import axios from 'axios';
import type { ResearchResponse, Session, Source, UserMemory, UserInterest, KnowledgeNode, SarvamOCRResult, SarvamTTSRequest, SarvamTTSResult, SarvamSTTResult, SarvamLanguages, Integration, ActionItem } from '../types';

const getApiBase = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return '/api';
};

const API_BASE = getApiBase();

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const researchApi = {
  createResearch: async (query: string, userId?: string): Promise<ResearchResponse> => {
    const response = await api.post('/research', { query, userId });
    return response.data;
  },

  createResearchStream: async (query: string, userId?: string): Promise<EventSource> => {
    const eventSource = new EventSource(`${API_BASE}/research/stream?query=${encodeURIComponent(query)}&userId=${userId || 'guest'}`);
    return eventSource;
  },

  getSession: async (sessionId: string): Promise<Session> => {
    const response = await api.get(`/session/${sessionId}`);
    return response.data;
  },

  getSessions: async (userId: string): Promise<Session[]> => {
    const response = await api.get('/sessions', { params: { userId } });
    return response.data;
  },

  getSources: async (sessionId: string): Promise<Source[]> => {
    const response = await api.get(`/sources/${sessionId}`);
    return response.data;
  },

  exportSession: async (sessionId: string): Promise<Blob> => {
    const response = await api.get(`/research/export/${sessionId}`, { responseType: 'blob' });
    return response.data;
  },

  getTasks: async (sessionId: string): Promise<any[]> => {
    const response = await api.get(`/tasks/${sessionId}`);
    return response.data;
  },

  getEvaluations: async (sessionId: string): Promise<any[]> => {
    const response = await api.get(`/evaluations/${sessionId}`);
    return response.data;
  },
};

export const analyticsApi = {
  getUsage: async (userId: string, days: number = 30): Promise<any> => {
    const response = await api.get('/analytics/usage', { params: { userId, days } });
    return response.data;
  },
};

export const agentsApi = {
  getConfig: async (): Promise<any> => {
    const response = await api.get('/agents/config');
    return response.data;
  },
};

export const memoryApi = {
  getMemories: async (userId: string): Promise<UserMemory[]> => {
    const response = await api.get('/memory', { params: { userId } });
    return response.data;
  },

  getInterests: async (userId: string): Promise<UserInterest[]> => {
    const response = await api.get('/interests', { params: { userId } });
    return response.data;
  },

  getKnowledgeGraph: async (userId: string): Promise<KnowledgeNode[]> => {
    const response = await api.get('/knowledge-graph', { params: { userId } });
    return response.data;
  },

  searchMemory: async (query: string, userId: string, limit: number = 5): Promise<UserMemory[]> => {
    const response = await api.post('/memory/search', { query, limit }, { params: { userId } });
    return response.data;
  },

  deleteMemory: async (memoryId: string, userId: string): Promise<void> => {
    await api.delete(`/memory/${memoryId}`, { params: { userId } });
  },

  deleteKnowledgeNode: async (nodeId: string): Promise<void> => {
    await api.delete(`/knowledge-graph/${nodeId}`);
  },
};

export const integrationsApi = {
  getIntegrations: async (userId?: string): Promise<Integration[]> => {
    const response = await api.get('/integrations', { params: { userId } });
    return response.data;
  },

  executeAction: async (action: ActionItem, integrationId: string): Promise<{ success: boolean; url?: string }> => {
    const response = await api.post('/research/action/execute', { action, integrationId });
    return response.data;
  },
};

// Sarvam AI API
export const sarvamApi = {
  // Document Intelligence - Extract text from PDFs and images
  performOCR: async (imageUrl: string, language: string = 'en-IN'): Promise<SarvamOCRResult> => {
    const response = await api.post('/sarvam/ocr', { imageUrl, language });
    return response.data;
  },

  performOCRWithFile: async (file: File, language: string = 'en-IN'): Promise<SarvamOCRResult> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('language', language);

    const response = await api.post('/sarvam/ocr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // TTS - Text to Speech
  textToSpeech: async (request: SarvamTTSRequest): Promise<SarvamTTSResult> => {
    const response = await api.post('/sarvam/tts', request);
    return response.data;
  },

  // STT - Speech to Text
  speechToText: async (audioUrl: string, language: string = 'en'): Promise<SarvamSTTResult> => {
    const response = await api.post('/sarvam/stt', { audioUrl, language });
    return response.data;
  },

  speechToTextWithFile: async (file: File, language: string = 'en'): Promise<SarvamSTTResult> => {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('language', language);

    const response = await api.post('/sarvam/stt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getAvailableVoices: async (): Promise<string[]> => {
    const response = await api.get('/sarvam/voices');
    return response.data.voices || [];
  },

  getSupportedLanguages: async (): Promise<SarvamLanguages> => {
    const response = await api.get('/sarvam/languages');
    return response.data.languages || {};
  },
};

// ============ Learning OS API ============

// Concept Coach
export const coachApi = {
  explain: async (topic: string, level?: string, context?: string) => {
    const response = await api.post('/coach/explain', { topic, level, context });
    return response.data;
  },
  getHint: async (question: string, attemptNumber: number, previousAnswer?: string) => {
    const response = await api.post('/coach/hint', { question, attemptNumber, previousAnswer });
    return response.data;
  },
  getMastery: async (topic: string) => {
    const response = await api.get(`/coach/mastery/${encodeURIComponent(topic)}`);
    return response.data;
  },
  getWeakTopics: async () => {
    const response = await api.get('/coach/weak-topics');
    return response.data;
  },
  adaptDifficulty: async (correctAnswers: number, totalQuestions: number, avgResponseTime: number, hintsUsed: number) => {
    const response = await api.post('/coach/adapt-difficulty', { correctAnswers, totalQuestions, avgResponseTime, hintsUsed });
    return response.data;
  },
  getMasteryGraph: async () => {
    const response = await api.get('/coach/mastery-graph');
    return response.data;
  },
};

// Assignment Evaluator
export const evaluateApi = {
  evaluateEssay: async (content: string, rubric?: any, assignmentType?: string) => {
    const response = await api.post('/evaluate/essay', { content, rubric, assignmentType });
    return response.data;
  },
  evaluateCode: async (code: string, language: string, criteria?: any) => {
    const response = await api.post('/evaluate/code', { code, language, criteria });
    return response.data;
  },
  evaluatePresentation: async (slides: any[], rubric?: any) => {
    const response = await api.post('/evaluate/presentation', { slides, rubric });
    return response.data;
  },
  suggestImprovements: async (work: string, workType: string, targetGrade?: string) => {
    const response = await api.post('/evaluate/improve', { work, workType, targetGrade });
    return response.data;
  },
  compareVersions: async (v1: string, v2: string, workType: string) => {
    const response = await api.post('/evaluate/compare', { v1, v2, workType });
    return response.data;
  },
};

// Integrity
export const integrityApi = {
  checkOriginality: async (content: string) => {
    const response = await api.post('/integrity/check', { content });
    return response.data;
  },
  detectAIUsage: async (content: string) => {
    const response = await api.post('/integrity/ai-usage', { content });
    return response.data;
  },
  checkCitations: async (content: string, style?: string) => {
    const response = await api.post('/integrity/citations', { content, style });
    return response.data;
  },
  generateCitations: async (sources: any[], format?: string) => {
    const response = await api.post('/integrity/generate-citations', { sources, format });
    return response.data;
  },
  suggestReferences: async (topic: string, count?: number) => {
    const response = await api.post('/integrity/references', { topic, count });
    return response.data;
  },
};

// Study Planner
export const plannerApi = {
  generatePlan: async (syllabusText: string, examDate?: string, dailyHours?: number) => {
    const response = await api.post('/planner/generate', { syllabusText, examDate, dailyHours });
    return response.data;
  },
  getReadiness: async (syllabus: any, performanceData?: any) => {
    const response = await api.get('/planner/readiness', { params: { syllabus, performanceData } });
    return response.data;
  },
  getBurnoutRisk: async () => {
    const response = await api.get('/planner/burnout');
    return response.data;
  },
  generateFlashcards: async (syllabus: any, cardsPerTopic?: number) => {
    const response = await api.post('/planner/flashcards', { syllabus, cardsPerTopic });
    return response.data;
  },
};

// Code Debug
export const debugApi = {
  explainDebug: async (code: string, language: string, error?: string, expectedBehavior?: string) => {
    const response = await api.post('/debug/explain', { code, language, error, expectedBehavior });
    return response.data;
  },
  analyzeCode: async (code: string, language: string) => {
    const response = await api.post('/debug/analyze', { code, language });
    return response.data;
  },
  explainLogic: async (code: string, expectedOutput: string, actualOutput: string, language: string) => {
    const response = await api.post('/debug/logic', { code, expectedOutput, actualOutput, language });
    return response.data;
  },
  suggestConcepts: async (code: string, language: string, concepts: string[]) => {
    const response = await api.post('/debug/concepts', { code, language, concepts });
    return response.data;
  },
  learnFromTest: async (code: string, testInput: string, expectedOutput: string, actualOutput: string, language: string) => {
    const response = await api.post('/debug/unittest', { code, testInput, expectedOutput, actualOutput, language });
    return response.data;
  },
};

// Career Navigator
export const careerApi = {
  mapSkills: async (skills: any[], targetRoles: string[]) => {
    const response = await api.post('/career/skills', { skills, targetRoles });
    return response.data;
  },
  reviewResume: async (resume: string, targetRole?: string) => {
    const response = await api.post('/career/resume', { resume, targetRole });
    return response.data;
  },
  generateInterview: async (role: string, type?: string, difficulty?: string, questionCount?: number) => {
    const response = await api.post('/career/interview', { role, type, difficulty, questionCount });
    return response.data;
  },
  evaluateAnswer: async (question: any, answer: string) => {
    const response = await api.post('/career/interview/evaluate', { question, answer });
    return response.data;
  },
  reviewPortfolio: async (projects: any[]) => {
    const response = await api.post('/career/portfolio', { projects });
    return response.data;
  },
  generateRoadmap: async (targetRole: string, currentSkills: any[], timelineMonths?: number) => {
    const response = await api.post('/career/roadmap', { targetRole, currentSkills, timelineMonths });
    return response.data;
  },
};

// Confidence Booster
export const confidenceApi = {
  detectHesitation: async (responseText: string, responseTime: number) => {
    const response = await api.post('/confidence/hesitation', { response: responseText, responseTime });
    return response.data;
  },
  generateEncouragement: async (context: any, tone?: string) => {
    const response = await api.post('/confidence/encourage', { context, tone });
    return response.data;
  },
  analyzeAnxiety: async (text: string) => {
    const response = await api.post('/confidence/anxiety', { text });
    return response.data;
  },
  generateStressResponse: async (anxietyLevel: number, context: string) => {
    const response = await api.post('/confidence/stress', { anxietyLevel, context });
    return response.data;
  },
  getTrend: async (period?: string) => {
    const response = await api.get('/confidence/trend', { params: { period } });
    return response.data;
  },
};

// Critical Thinking
export const thinkingApi = {
  detectFallacies: async (text: string) => {
    const response = await api.post('/thinking/fallacies', { text });
    return response.data;
  },
  analyzeArgument: async (argument: string, context?: string) => {
    const response = await api.post('/thinking/analyze', { argument, context });
    return response.data;
  },
  evaluateDebate: async (yourArgument: string, opponentResponse: string, isProponent?: boolean) => {
    const response = await api.post('/thinking/debate', { yourArgument, opponentResponse, isProponent });
    return response.data;
  },
  assessThinking: async (text: string) => {
    const response = await api.post('/thinking/score', { text });
    return response.data;
  },
  generateChallenges: async (argument: string, count?: number) => {
    const response = await api.post('/thinking/challenge', { argument, count });
    return response.data;
  },
  detectBias: async (text: string) => {
    const response = await api.post('/thinking/bias', { text });
    return response.data;
  },
};

// Quiz Generator
export const quizApi = {
  generate: async (content: string, topic: string, questionCount?: number, difficulty?: string) => {
    const response = await api.post('/quiz/generate', { content, topic, questionCount, difficulty });
    return response.data;
  },
  evaluate: async (quizId: string, answers: any[]) => {
    const response = await api.post('/quiz/evaluate', { quizId, answers });
    return response.data;
  },
  getAnalytics: async (quizId: string) => {
    const response = await api.get(`/quiz/analytics/${quizId}`);
    return response.data;
  },
};

// Learning Style
export const learningStyleApi = {
  getQuestionnaire: async () => {
    const response = await api.get('/learning-style/questionnaire');
    return response.data;
  },
  analyze: async (responses: any[]) => {
    const response = await api.post('/learning-style/analyze', { responses });
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/learning-style/profile');
    return response.data;
  },
};

// Analytics
export const analyticsApi2 = {
  predict: async (topic: string, examDate: string, performanceHistory: any[], studyHoursRemaining: number) => {
    const response = await api.post('/analytics/predict', { topic, examDate, performanceHistory, studyHoursRemaining });
    return response.data;
  },
  getPatterns: async () => {
    const response = await api.get('/analytics/patterns');
    return response.data;
  },
  getCompetency: async (topics: string[]) => {
    const response = await api.get('/analytics/competency', { params: { topics } });
    return response.data;
  },
};

// Calendar
export const calendarApi = {
  generateSchedule: async (examDate: string, topics: any[], dailyStudyHours: number) => {
    const response = await api.post('/calendar/schedule', { examDate, topics, dailyStudyHours });
    return response.data;
  },
  getEvents: async (days: number = 7) => {
    const response = await api.get('/calendar/events', { params: { days } });
    return response.data;
  },
  exportICS: async (schedule: any) => {
    const response = await api.get('/calendar/export', { params: { schedule } });
    return response.data;
  },
};

// Skills
export const skillsApi = {
  map: async (activities: any[]) => {
    const response = await api.post('/skills/map', { activities });
    return response.data;
  },
  getRecommendations: async () => {
    const response = await api.get('/skills/recommendations');
    return response.data;
  },
  generatePath: async (targetRole: string, currentLevel: string, targetLevel: string, skills: any[]) => {
    const response = await api.post('/skills/path', { targetRole, currentLevel, targetLevel, skills });
    return response.data;
  },
};

// Web Search
export const searchApi = {
  learning: async (topic: string, sources?: string[], maxResults?: number, difficulty?: string) => {
    const response = await api.post('/search/learning', { topic, sources, maxResults, difficulty });
    return response.data;
  },
  summarize: async (url: string) => {
    const response = await api.post('/search/summarize', { url });
    return response.data;
  },
};

// Portfolio
export const portfolioApi = {
  generate: async (userData: any, projectData: any[]) => {
    const response = await api.post('/portfolio/generate', { userData, projectData });
    return response.data;
  },
  exportMarkdown: async (portfolio: any) => {
    const response = await api.get('/portfolio/export/markdown', { params: { portfolio } });
    return response.data;
  },
};

// Certificate
export const certificateApi = {
  generate: async (recipient: any, course: any) => {
    const response = await api.post('/certificate/generate', { recipient, course });
    return response.data;
  },
  verify: async (credentialId: string) => {
    const response = await api.get(`/certificate/verify/${credentialId}`);
    return response.data;
  },
};

// LMS
export const lmsApi = {
  connect: async (provider: string, baseUrl: string) => {
    const response = await api.post('/lms/connect', { provider, baseUrl });
    return response.data;
  },
  getCourses: async () => {
    const response = await api.get('/lms/courses');
    return response.data;
  },
  getAssignments: async (courseId: string) => {
    const response = await api.get(`/lms/assignments/${courseId}`);
    return response.data;
  },
  getGrades: async (courseId: string) => {
    const response = await api.get(`/lms/grades/${courseId}`);
    return response.data;
  },
  sync: async () => {
    const response = await api.post('/lms/sync');
    return response.data;
  },
};

export default api;
