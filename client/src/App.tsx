import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { OCRComponent } from './components/OCRComponent';
import { TTSComponent } from './components/TTSComponent';
import { STTComponent } from './components/STTComponent';
import { LandingPage, LandingPage as OldLandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';
import { SourcesPage } from './pages/SourcesPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { researchApi, memoryApi } from './services/api';
import type { ResearchResponse, AgentTask, Source, KnowledgeNode } from './types';

function AppLayout() {
  const [activeView, setActiveView] = useState('workspace');
  const [query, setQuery] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [result, setResult] = useState<ResearchResponse | null>(null);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [knowledgeNodes, setKnowledgeNodes] = useState<KnowledgeNode[]>([]);

  const handleSubmit = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsResearching(true);
    setQuery(searchQuery);
    setResult(null);
    setTasks([]);
    setSources([]);

    try {
      const response = await researchApi.createResearch(searchQuery);
      setResult(response);
      setTasks(generateTasksFromPlan(response.plan));
      setSources([]);
    } catch (error) {
      console.error('Research failed:', error);
    } finally {
      setIsResearching(false);
    }
  }, []);

  const handleNewResearch = () => {
    setActiveView('workspace');
    setResult(null);
    setTasks([]);
    setSources([]);
  };

  useEffect(() => {
    if (result?.sessionId) {
      const interval = setInterval(async () => {
        try {
          const sessionData = await researchApi.getSession(result.sessionId);
          const sourcesData = await researchApi.getSources(result.sessionId);

          if ('tasks' in sessionData && Array.isArray(sessionData.tasks)) {
            setTasks(sessionData.tasks as unknown as AgentTask[]);
          }
          if (sourcesData) {
            setSources(sourcesData);
          }
        } catch (error) {
          console.error('Failed to fetch session data:', error);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [result?.sessionId]);

  useEffect(() => {
    const loadKnowledgeGraph = async () => {
      try {
        const nodes = await memoryApi.getKnowledgeGraph('default');
        setKnowledgeNodes(nodes);
      } catch (error) {
        console.error('Failed to load knowledge graph:', error);
      }
    };

    if (activeView === 'graph') {
      loadKnowledgeGraph();
    }
  }, [activeView]);

  const renderContent = () => {
    switch (activeView) {
      case 'workspace':
        return (
          <LandingPage
            query={query}
            setQuery={setQuery}
            onSubmit={handleSubmit}
            isResearching={isResearching}
            result={result}
            tasks={tasks}
            sources={sources}
          />
        );
      case 'graph':
        return (
          <KnowledgeGraph
            nodes={knowledgeNodes}
            edges={[]}
          />
        );
      case 'sources':
        return <SourcesPage />;
      case 'history':
        return <HistoryPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'ocr':
        return <OCRComponent />;
      case 'tts':
        return <TTSComponent />;
      case 'stt':
        return <STTComponent />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex bg-void overflow-hidden">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onNewResearch={handleNewResearch}
      />
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="/landing" element={<OldLandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/app" element={<AppLayout />} />
        <Route path="/login" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function generateTasksFromPlan(plan: ResearchResponse['plan']): AgentTask[] {
  return plan.subtasks.map((subtask, index) => ({
    id: subtask.id,
    sessionId: '',
    type: subtask.type as AgentTask['type'],
    status: index === 0 ? 'completed' : 'pending',
    createdAt: new Date().toISOString(),
  }));
}

export default App;
