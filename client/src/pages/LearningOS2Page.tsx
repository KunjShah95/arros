import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, FileText, Target, Code, Briefcase, Heart, Lightbulb,
  Sparkles, CircleHelp, Compass, TrendingUp, Calendar, Search,
  BookOpen, Award, Link2, Clock, CheckCircle, AlertCircle,
  Video, ExternalLink, Download, Copy, Send, Loader2,
  GraduationCap, BarChart2, Users, Layers, Fingerprint
} from 'lucide-react';
import {
  Card, Button, Input, Badge, ProgressBar, cn
} from '../components/ui';
import {
  quizApi, learningStyleApi, analyticsApi2, calendarApi,
  skillsApi, searchApi, portfolioApi, certificateApi, lmsApi
} from '../services/api';

const features2 = [
  { id: 'quiz', icon: CircleHelp, label: 'Quiz Generator', color: 'from-blue to-cyan' },
  { id: 'style', icon: Fingerprint, label: 'Learning Style', color: 'from-purple to-pink' },
  { id: 'analytics', icon: TrendingUp, label: 'Predictive Analytics', color: 'from-green to-emerald' },
  { id: 'calendar', icon: Calendar, label: 'Calendar', color: 'from-orange to-amber' },
  { id: 'skills', icon: Layers, label: 'Skill Intelligence', color: 'from-indigo to-violet' },
  { id: 'search', icon: Search, label: 'Web Search', color: 'from-red to-rose' },
  { id: 'portfolio', icon: BookOpen, label: 'Portfolio', color: 'from-teal to-cyan' },
  { id: 'certificate', icon: Award, label: 'Certificates', color: 'from-gold to-yellow' },
  { id: 'lms', icon: Link2, label: 'LMS Connect', color: 'from-slate to-zinc' },
];

export function LearningOS2Page() {
  const [activeFeature, setActiveFeature] = useState('quiz');

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 pb-20">
      <div className="max-w-7xl mx-auto py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-display font-bold text-white">
              Learning OS 2.0
            </h1>
            <Badge variant="success" className="text-xs">2026 Edition</Badge>
          </div>
          <p className="text-silver">Advanced AI-powered learning features</p>
        </motion.div>

        {/* Feature Navigation */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 mb-8">
          {features2.map((f, idx) => (
            <motion.button
              key={f.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => setActiveFeature(f.id)}
              className={cn(
                "p-3 rounded-xl border transition-all flex flex-col items-center gap-1",
                activeFeature === f.id
                  ? "bg-gradient-to-br from-void to-graphite border-peacock/40"
                  : "bg-void/40 border-smoke/10 hover:border-smoke/30"
              )}
            >
              <f.icon className={cn(
                "w-5 h-5",
                activeFeature === f.id ? "text-peacock" : "text-ash"
              )} />
              <span className={cn(
                "text-[8px] uppercase font-bold text-center",
                activeFeature === f.id ? "text-white" : "text-ash"
              )}>{f.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Feature Panels */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          <FeaturePanel2 featureId={activeFeature} />
          <LearningSidebar2 />
        </div>
      </div>
    </div>
  );
}

function FeaturePanel2({ featureId }: { featureId: string }) {
  switch (featureId) {
    case 'quiz': return <QuizGeneratorPanel />;
    case 'style': return <LearningStylePanel />;
    case 'analytics': return <PredictiveAnalyticsPanel />;
    case 'calendar': return <CalendarPanel />;
    case 'skills': return <SkillIntelligencePanel />;
    case 'search': return <WebSearchPanel />;
    case 'portfolio': return <PortfolioPanel />;
    case 'certificate': return <CertificatePanel />;
    case 'lms': return <LMSPanel />;
    default: return null;
  }
}

function QuizGeneratorPanel() {
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);

  const handleGenerate = async () => {
    if (!content || !topic) return;
    setLoading(true);
    try {
      const result = await quizApi.generate(content, topic, count);
      setQuiz(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-graphite/40 border border-smoke/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <CircleHelp className="w-5 h-5 text-blue" />
        AI Quiz Generator
      </h3>

      <div className="space-y-4 mb-4">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Quiz topic..."
          className="w-full bg-void border border-smoke/30 rounded-lg px-4 py-2 text-silver"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste study content..."
          className="w-full h-32 bg-void border border-smoke/30 rounded-lg px-4 py-2 text-silver resize-none"
        />
        <div className="flex items-center gap-4">
          <label className="text-xs text-ash">Questions:</label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-20 bg-void border border-smoke/30 rounded px-3 py-1 text-silver"
            min={5}
            max={50}
          />
        </div>
        <Button onClick={handleGenerate} disabled={loading || !content} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate Quiz
        </Button>
      </div>

      {quiz && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="p-3 rounded-lg bg-blue/10 border border-blue/30">
            <p className="text-white font-bold">{quiz.title}</p>
            <p className="text-ash text-xs">{quiz.questions?.length} questions</p>
          </div>
          {quiz.questions?.slice(0, 3).map((q: any, i: number) => (
            <div key={i} className="p-3 rounded-lg bg-void/50">
              <p className="text-silver text-sm mb-2">{i + 1}. {q.question}</p>
              <div className="flex flex-wrap gap-1">
                {q.options?.map((o: string, j: number) => (
                  <Badge key={j} variant={j === q.correctAnswer ? 'success' : 'default'} className="text-[10px]">
                    {o}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </Card>
  );
}

function LearningStylePanel() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [step, setStep] = useState<'intro' | 'questionnaire' | 'result'>('intro');

  const startAssessment = async () => {
    setLoading(true);
    try {
      await learningStyleApi.getQuestionnaire();
      setStep('questionnaire');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-graphite/40 border border-smoke/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Fingerprint className="w-5 h-5 text-purple" />
        Learning Style Detector
      </h3>

      {step === 'intro' && (
        <div className="text-center py-8">
          <p className="text-silver mb-4">Discover your optimal learning style (VAK)</p>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {['Visual', 'Auditory', 'Kinesthetic'].map(s => (
              <div key={s} className="p-3 rounded-lg bg-void/50 text-center">
                <p className="text-silver text-xs">{s}</p>
              </div>
            ))}
          </div>
          <Button onClick={startAssessment} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Start Assessment
          </Button>
        </div>
      )}

      {step === 'questionnaire' && (
        <div className="space-y-4">
          <p className="text-silver text-sm">Questionnaire loaded. (Full UI would show 10 questions)</p>
          <Button onClick={() => setStep('result')} className="w-full">
            Complete Assessment
          </Button>
        </div>
      )}

      {step === 'result' && profile && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="p-4 rounded-lg bg-purple/10 border border-purple/30 text-center">
            <p className="text-2xl font-bold text-purple">Visual Learner</p>
          </div>
        </motion.div>
      )}
    </Card>
  );
}

function PredictiveAnalyticsPanel() {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);

  const runPrediction = async () => {
    setLoading(true);
    try {
      const result = await analyticsApi2.predict(
        'Mathematics',
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        [{ score: 75, maxScore: 100 }],
        20
      );
      setPrediction(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-graphite/40 border border-smoke/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green" />
        Predictive Analytics
      </h3>

      <div className="space-y-4 mb-4">
        <p className="text-silver text-sm">Forecast exam scores and identify at-risk students</p>
        <Button onClick={runPrediction} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Run Prediction
        </Button>
      </div>

      {prediction && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg bg-void/50 text-center">
              <p className="text-xl font-bold text-green">{prediction.predictedScore}%</p>
              <p className="text-[10px] text-ash">Predicted</p>
            </div>
            <div className="p-3 rounded-lg bg-void/50 text-center">
              <p className="text-xl font-bold text-blue">{Math.round(prediction.confidence * 100)}%</p>
              <p className="text-[10px] text-ash">Confidence</p>
            </div>
            <div className="p-3 rounded-lg bg-void/50 text-center">
              <p className="text-xl font-bold text-saffron">{prediction.riskLevel}</p>
              <p className="text-[10px] text-ash">Risk</p>
            </div>
          </div>
          {prediction.recommendations?.map((r: string, i: number) => (
            <p key={i} className="text-silver text-xs">• {r}</p>
          ))}
        </motion.div>
      )}
    </Card>
  );
}

function CalendarPanel() {
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<any>(null);

  const generateSchedule = async () => {
    setLoading(true);
    try {
      const result = await calendarApi.generateSchedule(
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        [{ name: 'Math', weight: 5, hoursNeeded: 10 }],
        2
      );
      setSchedule(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-graphite/40 border border-smoke/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-orange" />
        Smart Calendar
      </h3>

      <div className="space-y-4 mb-4">
        <Button onClick={generateSchedule} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate Study Schedule
        </Button>
      </div>

      {schedule && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 max-h-64 overflow-y-auto">
          {schedule.events?.slice(0, 7).map((e: any, i: number) => (
            <div key={i} className="p-2 rounded bg-void/50 flex justify-between">
              <span className="text-silver text-xs">{e.title}</span>
              <span className="text-ash text-xs">{new Date(e.startTime).toLocaleDateString()}</span>
            </div>
          ))}
        </motion.div>
      )}
    </Card>
  );
}

function SkillIntelligencePanel() {
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<any>(null);

  const analyzeSkills = async () => {
    setLoading(true);
    try {
      const result = await skillsApi.getRecommendations();
      setSkills(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-graphite/40 border border-smoke/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Layers className="w-5 h-5 text-indigo" />
        Skill Intelligence
      </h3>

      <div className="space-y-4 mb-4">
        <p className="text-silver text-sm">Map competencies and identify skill gaps</p>
        <Button onClick={analyzeSkills} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Analyze Skills
        </Button>
      </div>

      {skills && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0 }}>
          <p className="text-silver text-sm">Skill analysis results would appear here</p>
        </motion.div>
      )}
    </Card>
  );
}

function WebSearchPanel() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const search = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const result = await searchApi.learning(topic, ['youtube', 'wikipedia'], 5);
      setResults(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-graphite/40 border border-smoke/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-red" />
        Learning Content Search
      </h3>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Search topic..."
          className="flex-1 bg-void border border-smoke/30 rounded-lg px-4 py-2 text-silver"
        />
        <Button onClick={search} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {results.map((r, i) => (
          <div key={i} className="p-3 rounded bg-void/50">
            <p className="text-silver text-sm font-bold">{r.title}</p>
            <p className="text-ash text-xs mb-1">{r.source}</p>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-blue text-xs flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Open
            </a>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PortfolioPanel() {
  const [loading, setLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<any>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await portfolioApi.generate(
        { name: 'Student', targetRole: 'Developer' },
        [{ name: 'Project 1', description: 'My project', technologies: ['React', 'Node'] }]
      );
      setPortfolio(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-graphite/40 border border-smoke/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-teal" />
        Portfolio Generator
      </h3>

      <div className="space-y-4 mb-4">
        <p className="text-silver text-sm">Auto-generate your portfolio</p>
        <Button onClick={generate} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate Portfolio
        </Button>
      </div>

      {portfolio && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0 }}>
          <p className="text-silver text-sm">{portfolio.title}</p>
        </motion.div>
      )}
    </Card>
  );
}

function CertificatePanel() {
  const [loading, setLoading] = useState(false);
  const [cert, setCert] = useState<any>(null);
  const [verifyId, setVerifyId] = useState('');

  const generateCert = async () => {
    setLoading(true);
    try {
      const result = await certificateApi.generate(
        { name: 'Student Name', email: 'student@email.com' },
        { name: 'Course Name', skills: ['React', 'Node'] }
      );
      setCert(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-graphite/40 border border-smoke/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-gold" />
        Certificate Generator
      </h3>

      <div className="space-y-4 mb-4">
        <Button onClick={generateCert} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate Certificate
        </Button>

        {cert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded bg-gold/10 border border-gold/30">
            <p className="text-gold text-sm font-bold">Certificate Created!</p>
            <p className="text-ash text-xs">ID: {cert.credentialId}</p>
          </motion.div>
        )}
      </div>
    </Card>
  );
}

function LMSPanel() {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);

  const connectLMS = async () => {
    setLoading(true);
    try {
      await lmsApi.connect('canvas', 'https://canvas.instructure.com');
      const result = await lmsApi.getCourses();
      setCourses(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-graphite/40 border border-smoke/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Link2 className="w-5 h-5 text-slate" />
        LMS Connector
      </h3>

      <div className="space-y-4 mb-4">
        <p className="text-silver text-sm">Connect Canvas, Moodle, Google Classroom</p>
        <Button onClick={connectLMS} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
          Connect LMS
        </Button>
      </div>

      {courses.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {courses.map((c, i) => (
            <div key={i} className="p-2 rounded bg-void/50">
              <p className="text-silver text-sm">{c.name}</p>
            </div>
          ))}
        </motion.div>
      )}
    </Card>
  );
}

function LearningSidebar2() {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-graphite/40 border border-smoke/20">
        <h4 className="text-xs uppercase text-ash tracking-wider mb-4">Quick Stats</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-void/50 text-center">
            <p className="text-xl font-bold text-blue">12</p>
            <p className="text-[10px] text-ash">Quizzes</p>
          </div>
          <div className="p-3 rounded-lg bg-void/50 text-center">
            <p className="text-xl font-bold text-purple">85%</p>
            <p className="text-[10px] text-ash">Style Match</p>
          </div>
          <div className="p-3 rounded-lg bg-void/50 text-center">
            <p className="text-xl font-bold text-green">+5%</p>
            <p className="text-[10px] text-ash">Prediction</p>
          </div>
          <div className="p-3 rounded-lg bg-void/50 text-center">
            <p className="text-xl font-bold text-orange">3</p>
            <p className="text-[10px] text-ash">Certs</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-graphite/40 border border-smoke/20">
        <h4 className="text-xs uppercase text-ash tracking-wider mb-4">Recent Activity</h4>
        <div className="space-y-2">
          {[
            { icon: CircleHelp, text: 'Quiz completed', time: '2h ago' },
            { icon: Calendar, text: 'Schedule updated', time: '5h ago' },
            { icon: Award, text: 'Certificate earned', time: '1d ago' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-void/30">
              <item.icon className="w-4 h-4 text-ash" />
              <span className="text-silver text-xs flex-1">{item.text}</span>
              <span className="text-ash text-[10px]">{item.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default LearningOS2Page;
