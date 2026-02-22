import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, BookOpen, FileText, Code, Mic, MicOff,
  ChevronRight, ChevronDown, CheckCircle, AlertCircle,
  Lightbulb, Target, Zap, Heart, MessageSquare,
  TrendingUp, TrendingDown, Minus, Sparkles, GraduationCap,
  Briefcase, Video, Users, FileCode, AlertTriangle,
  Scale, Eye, RefreshCw, Send, Loader2
} from 'lucide-react';
import {
  Card, Button, Input, Badge, ProgressBar,
  cn
} from '../components/ui';
import {
  coachApi, evaluateApi, integrityApi, plannerApi,
  debugApi, careerApi, confidenceApi, thinkingApi
} from '../services/api';

const features = [
  { id: 'coach', icon: Brain, label: 'AI Concept Coach', color: 'from-peacock to-cyan-500' },
  { id: 'evaluator', icon: FileText, label: 'Assignment Evaluator', color: 'from-gold to-saffron' },
  { id: 'integrity', icon: Scale, label: 'Academic Integrity', color: 'from-emerald to-teal' },
  { id: 'planner', icon: Target, label: 'Study Planner', color: 'from-violet to-purple' },
  { id: 'debug', icon: FileCode, label: 'Code Debug Coach', color: 'from-orange to-red' },
  { id: 'career', icon: Briefcase, label: 'Career Navigator', color: 'from-blue to-indigo' },
  { id: 'confidence', icon: Heart, label: 'Confidence Booster', color: 'from-pink to-rose' },
  { id: 'thinking', icon: Lightbulb, label: 'Critical Thinking', color: 'from-yellow to-amber' },
];

export function LearningOSPage() {
  const [activeFeature, setActiveFeature] = useState('coach');

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 pb-20">
      <div className="max-w-7xl mx-auto py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Learning OS
          </h1>
          <p className="text-silver">Your personal AI-powered learning assistant</p>
        </motion.div>

        {/* Feature Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {features.map((f, idx) => (
            <motion.button
              key={f.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setActiveFeature(f.id)}
              className={cn(
                "p-4 rounded-xl border transition-all flex flex-col items-center gap-2",
                activeFeature === f.id
                  ? "bg-gradient-to-br from-void to-graphite border-peacock/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                  : "bg-void/40 border-smoke/10 hover:border-smoke/30"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                activeFeature === f.id ? "bg-peacock/20 text-peacock" : "bg-smoke/10 text-ash"
              )}>
                <f.icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[9px] uppercase font-bold tracking-wider text-center",
                activeFeature === f.id ? "text-white" : "text-ash"
              )}>{f.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Feature Panels */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <FeaturePanel featureId={activeFeature} />
          <LearningSidebar />
        </div>
      </div>
    </div>
  );
}

function FeaturePanel({ featureId }: { featureId: string }) {
  switch (featureId) {
    case 'coach':
      return <ConceptCoachPanel />;
    case 'evaluator':
      return <AssignmentEvaluatorPanel />;
    case 'integrity':
      return <IntegrityPanel />;
    case 'planner':
      return <StudyPlannerPanel />;
    case 'debug':
      return <CodeDebugPanel />;
    case 'career':
      return <CareerNavigatorPanel />;
    case 'confidence':
      return <ConfidenceBoosterPanel />;
    case 'thinking':
      return <CriticalThinkingPanel />;
    default:
      return null;
  }
}

function ConceptCoachPanel() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showHint, setShowHint] = useState(false);
  const [hint, setHint] = useState<any>(null);

  const handleExplain = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await coachApi.explain(topic, level);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGetHint = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await coachApi.getHint(`Explain ${topic}`, 1);
      setHint(res);
      setShowHint(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-graphite/40 border border-smoke/20">
      <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5 text-peacock" />
        AI Concept Coach
      </h3>

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-xs text-ash uppercase tracking-wider mb-2 block">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What do you want to learn?"
            className="w-full bg-void border border-smoke/30 rounded-lg px-4 py-3 text-silver focus:border-peacock/50 outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-ash uppercase tracking-wider mb-2 block">Your Level</label>
          <div className="flex gap-2">
            {(['beginner', 'intermediate', 'advanced', 'expert'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs uppercase font-bold transition-all",
                  level === l ? "bg-peacock text-void" : "bg-smoke/20 text-ash hover:text-silver"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleExplain} disabled={loading || !topic} className="flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Explain Concept
          </Button>
          <Button variant="secondary" onClick={handleGetHint} disabled={loading || !topic}>
            <Lightbulb className="w-4 h-4 mr-2" />
            Get Hint
          </Button>
        </div>
      </div>

      {showHint && hint && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-saffron/10 border border-saffron/30 mb-4"
        >
          <p className="text-saffron text-sm font-bold mb-2">Hint (Level {hint.level})</p>
          <p className="text-silver text-sm">{hint.content}</p>
        </motion.div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {result.steps?.map((step: any, idx: number) => (
            <div key={idx} className="p-4 rounded-lg bg-void/50 border border-smoke/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-peacock/20 text-peacock text-xs font-bold flex items-center justify-center">
                  {step.stepNumber}
                </span>
                <h4 className="text-white font-bold text-sm">{step.title}</h4>
              </div>
              <p className="text-silver text-sm mb-2">{step.content}</p>
              {step.analogy && (
                <p className="text-ash text-xs italic">💡 {step.analogy}</p>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </Card>
  );
}

function AssignmentEvaluatorPanel() {
  const [content, setContent] = useState('');
  const [type, setType] = useState<'essay' | 'code'>('essay');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleEvaluate = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = type === 'essay'
        ? await evaluateApi.evaluateEssay(content)
        : await evaluateApi.evaluateCode(content, language);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-graphite/40 border border-smoke/20">
      <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-gold" />
        Assignment Evaluator
      </h3>

      <div className="space-y-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setType('essay')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all",
              type === 'essay' ? "bg-gold text-void" : "bg-smoke/20 text-ash"
            )}
          >
            Essay
          </button>
          <button
            onClick={() => setType('code')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all",
              type === 'code' ? "bg-gold text-void" : "bg-smoke/20 text-ash"
            )}
          >
            Code
          </button>
        </div>

        {type === 'code' && (
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-void border border-smoke/30 rounded-lg px-4 py-3 text-silver outline-none"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="typescript">TypeScript</option>
          </select>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={type === 'essay' ? "Paste your essay here..." : "Paste your code here..."}
          className="w-full h-48 bg-void border border-smoke/30 rounded-lg px-4 py-3 text-silver focus:border-gold/50 outline-none resize-none font-mono text-sm"
        />

        <Button onClick={handleEvaluate} disabled={loading || !content} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Evaluate
        </Button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between p-4 rounded-lg bg-gold/10 border border-gold/30">
            <div>
              <p className="text-ash text-xs uppercase">Score</p>
              <p className="text-3xl font-display font-bold text-gold">{result.overallScore}%</p>
            </div>
            <div className="text-right">
              <p className="text-ash text-xs uppercase">Grade</p>
              <p className="text-2xl font-display font-bold text-gold">{result.grade}</p>
            </div>
          </div>

          {result.criteriaScores && (
            <div className="space-y-2">
              {result.criteriaScores.map((c: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-void/50">
                  <div className="flex justify-between mb-1">
                    <span className="text-silver text-sm">{c.criterionName}</span>
                    <span className="text-gold text-sm">{c.score}/{c.maxScore}</span>
                  </div>
                  <ProgressBar progress={(c.score / c.maxScore) * 100} variant="gold" className="h-1" />
                </div>
              ))}
            </div>
          )}

          {result.suggestions && (
            <div className="p-3 rounded-lg bg-void/50">
              <p className="text-ash text-xs uppercase mb-2">Suggestions</p>
              {result.suggestions.map((s: string, idx: number) => (
                <p key={idx} className="text-silver text-sm mb-1">• {s}</p>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </Card>
  );
}

function IntegrityPanel() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'originality' | 'ai' | 'citations'>('originality');

  const handleCheck = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = activeTab === 'originality'
        ? await integrityApi.checkOriginality(content)
        : activeTab === 'ai'
        ? await integrityApi.detectAIUsage(content)
        : await integrityApi.checkCitations(content);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-graphite/40 border border-smoke/20">
      <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
        <Scale className="w-5 h-5 text-emerald" />
        Academic Integrity
      </h3>

      <div className="flex gap-2 mb-4">
        {(['originality', 'ai', 'citations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setResult(null); }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
              activeTab === tab ? "bg-emerald text-void" : "bg-smoke/20 text-ash"
            )}
          >
            {tab === 'ai' ? 'AI Detection' : tab}
          </button>
        ))}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste your text to check..."
        className="w-full h-32 bg-void border border-smoke/30 rounded-lg px-4 py-3 text-silver focus:border-emerald/50 outline-none resize-none mb-4"
      />

      <Button onClick={handleCheck} disabled={loading || !content} className="w-full">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
        Check {activeTab === 'ai' ? 'AI Usage' : activeTab}
      </Button>

      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 rounded-lg bg-void/50"
        >
          {activeTab === 'originality' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-ash text-xs uppercase">Similarity</p>
                  <p className="text-2xl font-display font-bold text-white">{result.overallSimilarity}%</p>
                </div>
                <Badge variant={result.assessment === 'original' ? 'success' : 'warning'}>
                  {result.assessment}
                </Badge>
              </div>
              <p className="text-silver text-sm">{result.overallFeedback}</p>
            </>
          )}
          {activeTab === 'ai' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-ash text-xs uppercase">AI Probability</p>
                  <p className="text-2xl font-display font-bold text-white">{result.probability}%</p>
                </div>
                <div className="text-right">
                  <p className="text-ash text-xs uppercase">Human Score</p>
                  <p className="text-xl font-display font-bold text-emerald">{result.humanScore}%</p>
                </div>
              </div>
            </>
          )}
          {activeTab === 'citations' && (
            <>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center p-2 rounded bg-void">
                  <p className="text-xl font-bold text-white">{result.totalCitations}</p>
                  <p className="text-[10px] text-ash uppercase">Total</p>
                </div>
                <div className="text-center p-2 rounded bg-void">
                  <p className="text-xl font-bold text-emerald">{result.properCitations}</p>
                  <p className="text-[10px] text-ash uppercase">Proper</p>
                </div>
                <div className="text-center p-2 rounded bg-void">
                  <p className="text-xl font-bold text-saffron">{result.missingCitations}</p>
                  <p className="text-[10px] text-ash uppercase">Missing</p>
                </div>
                <div className="text-center p-2 rounded bg-void">
                  <p className="text-xl font-bold text-gold">{result.incorrectFormat}</p>
                  <p className="text-[10px] text-ash uppercase">Wrong</p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </Card>
  );
}

function StudyPlannerPanel() {
  const [syllabus, setSyllabus] = useState('');
  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [burnout, setBurnout] = useState<any>(null);

  const handleGenerate = async () => {
    if (!syllabus.trim()) return;
    setLoading(true);
    try {
      const res = await plannerApi.generatePlan(syllabus, examDate, dailyHours);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkBurnout = async () => {
    try {
      const res = await plannerApi.getBurnoutRisk();
      setBurnout(res);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card className="p-6 bg-graphite/40 border border-smoke/20">
      <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-violet" />
        Study Planner
      </h3>

      <div className="space-y-4 mb-6">
        <textarea
          value={syllabus}
          onChange={(e) => setSyllabus(e.target.value)}
          placeholder="Paste your syllabus here..."
          className="w-full h-32 bg-void border border-smoke/30 rounded-lg px-4 py-3 text-silver focus:border-violet/50 outline-none resize-none"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-ash uppercase tracking-wider mb-2 block">Exam Date</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-void border border-smoke/30 rounded-lg px-4 py-2 text-silver outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-ash uppercase tracking-wider mb-2 block">Hours/Day</label>
            <input
              type="number"
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              min={1}
              max={12}
              className="w-full bg-void border border-smoke/30 rounded-lg px-4 py-2 text-silver outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleGenerate} disabled={loading || !syllabus} className="flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate Plan
          </Button>
          <Button variant="secondary" onClick={checkBurnout}>
            <Heart className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {burnout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg bg-void/50 mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-silver text-sm">Burnout Risk</p>
            <Badge variant={burnout.riskLevel === 'low' ? 'success' : burnout.riskLevel === 'high' ? 'warning' : 'danger'}>
              {burnout.riskLevel}
            </Badge>
          </div>
          {burnout.recommendations?.map((r: string, idx: number) => (
            <p key={idx} className="text-ash text-xs">• {r}</p>
          ))}
        </motion.div>
      )}

      {result?.plan && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2 max-h-64 overflow-y-auto"
        >
          {result.plan.dailySchedule?.slice(0, 7).map((day: any, idx: number) => (
            <div key={idx} className="p-3 rounded-lg bg-void/50">
              <div className="flex justify-between mb-1">
                <span className="text-white text-sm font-bold">{day.dayOfWeek}</span>
                <span className="text-violet text-xs">{day.totalHours}h</span>
              </div>
              {day.sessions?.map((s: any, sidx: number) => (
                <p key={sidx} className="text-silver text-xs">• {s.topic} ({s.duration}min)</p>
              ))}
            </div>
          ))}
        </motion.div>
      )}
    </Card>
  );
}

function CodeDebugPanel() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDebug = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await debugApi.explainDebug(code, language, error);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-graphite/40 border border-smoke/20">
      <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
        <FileCode className="w-5 h-5 text-orange" />
        Code Debug Coach
      </h3>

      <div className="space-y-4 mb-6">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full bg-void border border-smoke/30 rounded-lg px-4 py-2 text-silver outline-none"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="typescript">TypeScript</option>
        </select>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your buggy code here..."
          className="w-full h-32 bg-void border border-smoke/30 rounded-lg px-4 py-3 text-silver focus:border-orange/50 outline-none resize-none font-mono text-sm"
        />

        <input
          type="text"
          value={error}
          onChange={(e) => setError(e.target.value)}
          placeholder="Error message (optional)"
          className="w-full bg-void border border-smoke/30 rounded-lg px-4 py-2 text-silver focus:border-orange/50 outline-none"
        />

        <Button onClick={handleDebug} disabled={loading || !code} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Explain Debug
        </Button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {result.map((step: any, idx: number) => (
            <div key={idx} className="p-3 rounded-lg bg-void/50 border-l-2 border-orange">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded bg-orange/20 text-orange text-xs font-bold flex items-center justify-center">
                  {step.stepNumber}
                </span>
                <h4 className="text-white text-sm font-bold">{step.title}</h4>
              </div>
              <p className="text-silver text-sm mb-2">{step.explanation}</p>
              <div className="p-2 rounded bg-void font-mono text-xs text-ash">
                {step.fix}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </Card>
  );
}

function CareerNavigatorPanel() {
  const [resume, setResume] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mode, setMode] = useState<'resume' | 'interview'>('resume');

  const handleReview = async () => {
    if (!resume.trim()) return;
    setLoading(true);
    try {
      const res = await careerApi.reviewResume(resume, targetRole);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-graphite/40 border border-smoke/20">
      <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-blue" />
        Career Navigator
      </h3>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('resume')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
            mode === 'resume' ? "bg-blue text-void" : "bg-smoke/20 text-ash"
          )}
        >
          Resume Review
        </button>
        <button
          onClick={() => setMode('interview')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
            mode === 'interview' ? "bg-blue text-void" : "bg-smoke/20 text-ash"
          )}
        >
          Mock Interview
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <input
          type="text"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="Target role (e.g., Software Engineer)"
          className="w-full bg-void border border-smoke/30 rounded-lg px-4 py-2 text-silver focus:border-blue/50 outline-none"
        />

        <textarea
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          placeholder="Paste your resume..."
          className="w-full h-40 bg-void border border-smoke/30 rounded-lg px-4 py-3 text-silver focus:border-blue/50 outline-none resize-none"
        />

        <Button onClick={handleReview} disabled={loading || !resume} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {mode === 'resume' ? 'Review Resume' : 'Start Interview'}
        </Button>
      </div>

      {result && mode === 'resume' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between p-4 rounded-lg bg-blue/10 border border-blue/30">
            <div>
              <p className="text-ash text-xs uppercase">Resume Score</p>
              <p className="text-3xl font-display font-bold text-blue">{result.overallScore}%</p>
            </div>
            <div className="text-right">
              <p className="text-ash text-xs uppercase">ATS Score</p>
              <p className="text-2xl font-display font-bold text-blue">{result.atsScore}%</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-void/50">
            <p className="text-ash text-xs uppercase mb-2">Missing Keywords</p>
            <div className="flex flex-wrap gap-1">
              {result.keywords?.missing?.map((k: string, idx: number) => (
                <Badge key={idx} variant="warning" className="text-[10px]">{k}</Badge>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </Card>
  );
}

function ConfidenceBoosterPanel() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await confidenceApi.analyzeAnxiety(text);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkTrend = async () => {
    try {
      const res = await confidenceApi.getTrend('week');
      setTrend(res);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card className="p-6 bg-graphite/40 border border-smoke/20">
      <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
        <Heart className="w-5 h-5 text-pink" />
        Confidence Booster
      </h3>

      <div className="space-y-4 mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="How are you feeling about your studies?"
          className="w-full h-24 bg-void border border-smoke/30 rounded-lg px-4 py-3 text-silver focus:border-pink/50 outline-none resize-none"
        />

        <div className="flex gap-3">
          <Button onClick={handleAnalyze} disabled={loading || !text} className="flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Analyze Feelings
          </Button>
          <Button variant="secondary" onClick={checkTrend}>
            <TrendingUp className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {trend && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg bg-pink/10 border border-pink/30 mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-silver text-sm">Confidence Trend</p>
            <Badge variant={trend.trend === 'improving' ? 'success' : trend.trend === 'declining' ? 'warning' : 'default'}>
              {trend.trend}
            </Badge>
          </div>
          <p className="text-2xl font-display font-bold text-white">{Math.round(trend.averageConfidence * 100)}%</p>
          {trend.recommendations?.map((r: string, idx: number) => (
            <p key={idx} className="text-ash text-xs mt-2">💡 {r}</p>
          ))}
        </motion.div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {result.map((indicator: any, idx: number) => (
            <div key={idx} className="p-3 rounded-lg bg-void/50">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={indicator.severity === 'high' ? 'warning' : 'default'} className="text-[10px]">
                  {indicator.severity}
                </Badge>
                <span className="text-white text-sm">{indicator.type}</span>
              </div>
              <p className="text-silver text-xs">{indicator.suggestion}</p>
            </div>
          ))}
        </motion.div>
      )}
    </Card>
  );
}

function CriticalThinkingPanel() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await thinkingApi.detectFallacies(text);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-graphite/40 border border-smoke/20">
      <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-yellow" />
        Critical Thinking
      </h3>

      <div className="space-y-4 mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste an argument or text to analyze..."
          className="w-full h-32 bg-void border border-smoke/30 rounded-lg px-4 py-3 text-silver focus:border-yellow/50 outline-none resize-none"
        />

        <Button onClick={handleAnalyze} disabled={loading || !text} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Detect Fallacies
        </Button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {result.length === 0 ? (
            <p className="text-emerald text-sm">✓ No logical fallacies detected!</p>
          ) : (
            result.map((fallacy: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg bg-void/50 border-l-2 border-yellow">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="warning" className="text-[10px]">{fallacy.type}</Badge>
                  <Badge variant={fallacy.severity === 'severe' ? 'danger' : 'default'} className="text-[10px]">
                    {fallacy.severity}
                  </Badge>
                </div>
                <p className="text-silver text-sm mb-2">{fallacy.description}</p>
                <p className="text-ash text-xs italic">💡 {fallacy.suggestion}</p>
              </div>
            ))
          )}
        </motion.div>
      )}
    </Card>
  );
}

function LearningSidebar() {
  const [stats, setStats] = useState({
    streak: 12,
    xp: 4250,
    level: 8,
    nextLevel: 5000,
  });

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card className="p-6 bg-graphite/40 border border-smoke/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-peacock to-cyan-500 flex items-center justify-center text-2xl font-bold text-void">
            {stats.level}
          </div>
          <div>
            <p className="text-white font-bold">Level {stats.level}</p>
            <p className="text-ash text-xs">Learning Explorer</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-ash">XP Progress</span>
            <span className="text-peacock">{stats.xp}/{stats.nextLevel}</span>
          </div>
          <ProgressBar progress={(stats.xp / stats.nextLevel) * 100} variant="peacock" className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-void/50 text-center">
            <p className="text-2xl font-bold text-saffron">🔥 {stats.streak}</p>
            <p className="text-[10px] text-ash uppercase">Day Streak</p>
          </div>
          <div className="p-3 rounded-lg bg-void/50 text-center">
            <p className="text-2xl font-bold text-gold">⭐ 24</p>
            <p className="text-[10px] text-ash uppercase">Badges</p>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6 bg-graphite/40 border border-smoke/20">
        <h4 className="text-xs uppercase text-ash tracking-wider mb-4">Quick Actions</h4>
        <div className="space-y-2">
          <button className="w-full p-3 rounded-lg bg-void/50 hover:bg-void text-left text-silver text-sm flex items-center gap-2 transition-all">
            <Brain className="w-4 h-4 text-peacock" />
            Start Practice Session
          </button>
          <button className="w-full p-3 rounded-lg bg-void/50 hover:bg-void text-left text-silver text-sm flex items-center gap-2 transition-all">
            <FileText className="w-4 h-4 text-gold" />
            Upload Assignment
          </button>
          <button className="w-full p-3 rounded-lg bg-void/50 hover:bg-void text-left text-silver text-sm flex items-center gap-2 transition-all">
            <Target className="w-4 h-4 text-violet" />
            View Study Plan
          </button>
        </div>
      </Card>

      {/* Weak Topics */}
      <Card className="p-6 bg-graphite/40 border border-smoke/20">
        <h4 className="text-xs uppercase text-ash tracking-wider mb-4">Areas to Focus</h4>
        <div className="space-y-2">
          {['Calculus', 'Data Structures', 'Physics'].map((topic, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded bg-void/50">
              <span className="text-silver text-sm">{topic}</span>
              <ProgressBar progress={60 - idx * 15} variant="saffron" className="w-16 h-1" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default LearningOSPage;
