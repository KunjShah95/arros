import { create } from 'zustand';
import type { Session, Source, ResearchResponse, AgentTask } from '../types';

interface ResearchState {
  currentSession: Session | null;
  sessions: Session[];
  sources: Source[];
  tasks: AgentTask[];
  researchResult: ResearchResponse | null;
  isResearching: boolean;
  error: string | null;
  
  setCurrentSession: (session: Session | null) => void;
  setSessions: (sessions: Session[]) => void;
  setSources: (sources: Source[]) => void;
  addSource: (source: Source) => void;
  setTasks: (tasks: AgentTask[]) => void;
  updateTask: (taskId: string, updates: Partial<AgentTask>) => void;
  setResearchResult: (result: ResearchResponse | null) => void;
  setIsResearching: (isResearching: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useResearchStore = create<ResearchState>((set) => ({
  currentSession: null,
  sessions: [],
  sources: [],
  tasks: [],
  researchResult: null,
  isResearching: false,
  error: null,

  setCurrentSession: (session) => set({ currentSession: session }),
  setSessions: (sessions) => set({ sessions }),
  setSources: (sources) => set({ sources }),
  addSource: (source) => set((state) => ({ sources: [...state.sources, source] })),
  setTasks: (tasks) => set({ tasks }),
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    })),
  setResearchResult: (result) => set({ researchResult: result }),
  setIsResearching: (isResearching) => set({ isResearching }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      currentSession: null,
      sources: [],
      tasks: [],
      researchResult: null,
      isResearching: false,
      error: null,
    }),
}));
