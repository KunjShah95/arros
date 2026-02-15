import axios from 'axios';
import type { ResearchResponse, Session, Source, UserMemory, UserInterest, KnowledgeNode, SarvamOCRResult, SarvamTTSRequest, SarvamTTSResult, SarvamSTTResult, SarvamLanguages } from '../types';

const API_BASE = '/api';

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
};

// Sarvam AI API
export const sarvamApi = {
  // OCR - Optical Character Recognition
  performOCR: async (imageUrl: string, language: string = 'en'): Promise<SarvamOCRResult> => {
    const response = await api.post('/sarvam/ocr', { imageUrl, language });
    return response.data;
  },

  performOCRWithFile: async (file: File, language: string = 'en'): Promise<SarvamOCRResult> => {
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

  // Get available voices for TTS
  getAvailableVoices: async (): Promise<string[]> => {
    const response = await api.get('/sarvam/voices');
    return response.data.voices || [];
  },

  // Get supported languages
  getSupportedLanguages: async (): Promise<SarvamLanguages> => {
    const response = await api.get('/sarvam/languages');
    return response.data.languages || {};
  },
};

export default api;
