import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { ResearchWorkspace } from './components/ResearchWorkspace';
import { LandingPage } from './pages/LandingPage.tsx';
import { SignInPage } from './pages/SignInPage.tsx';
import { SignUpPage } from './pages/SignUpPage.tsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx';
import { PricingPage } from './pages/PricingPage';
import { SourcesPage } from './pages/SourcesPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { DashboardPage } from './pages/DashboardPage';
import { VoiceStudio } from './pages/VoiceStudioPage';
import { DocumentScanner } from './pages/DocumentScannerPage';
import { KnowledgeGraphPage } from './pages/KnowledgeGraphPage';
import { StudyOSPage } from './pages/StudyOSPage';
import { LearningOSPage } from './pages/LearningOSPage';
import { LearningOS2Page } from './pages/LearningOS2Page';
import { researchApi } from './services/api';
import type { ResearchResponse, AgentTask, Source } from './types';

function AppLayout() {
  const [activeView, setActiveView] = useState('dashboard');
  const [query, setQuery] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [result, setResult] = useState<ResearchResponse | null>(null);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [sources, setSources] = useState<Source[]>([]);

  const handleSubmit = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsResearching(true);
    setQuery(searchQuery);
    setResult(null);
    setTasks([]);
    setSources([]);
    setActiveView('workspace');

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
    setQuery('');
    setTasks([]);
    setSources([]);
  };

  useEffect(() => {
    const handleRemoteResearch = (e: any) => {
      if (e.detail?.query) {
        handleSubmit(e.detail.query);
      }
    };
    window.addEventListener('arros:research', handleRemoteResearch);
    return () => window.removeEventListener('arros:research', handleRemoteResearch);
  }, [handleSubmit]);

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

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardPage
            onStartResearch={handleSubmit}
            onViewChange={setActiveView}
          />
        );
      case 'workspace':
        return (
          <ResearchWorkspace
            query={query}
            setQuery={setQuery}
            onSubmit={handleSubmit}
            isResearching={isResearching}
            result={result}
            tasks={tasks}
            sources={sources}
          />
        );
      case 'sources':
        return <SourcesPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      case 'voice':
        return <VoiceStudio />;
      case 'scanner':
        return <DocumentScanner />;
      case 'graph':
        return <KnowledgeGraphPage />;
      case 'studyos':
        return <StudyOSPage />;
      case 'learningos':
        return <LearningOSPage />;
      case 'learningos2':
        return <LearningOS2Page />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex bg-void overflow-hidden relative">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onNewResearch={handleNewResearch}
      />
      <main className="flex-1 overflow-hidden relative pb-[5.5rem] md:pb-0">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-[-8rem] w-[24rem] h-[24rem] bg-saffron/8 blur-3xl" />
          <div className="absolute bottom-[-10rem] left-[-8rem] w-[28rem] h-[28rem] bg-peacock/8 blur-3xl" />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/app" element={<AppLayout />} />
        <Route path="/login" element={<Navigate to="/signin" replace />} />
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
