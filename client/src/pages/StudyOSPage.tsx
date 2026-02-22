import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, BookOpen, FileText, Calendar, Award,
  Search, Quote, GitCompare, Network, HelpCircle,
  Lightbulb, Download, BarChart3, Sparkles, GraduationCap,
  Video, Users, Timer, Camera, Trophy, Target,
  Clock, BookMarked, Zap, Star, Lock, Play, Pause, RotateCcw,
  Map, Fingerprint, Flame, Scroll, ArrowRight, CheckCircle2, MessageSquare
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Badge,
  ProgressBar,
  SanskritButton,
  Mandala,
  cn
} from '../components/ui';

interface UserProfile {
  xp: number;
  level: number;
  streak: number;
  badges: Array<{ id: string; name: string; icon: string; description: string }>;
}

const features = [
  { id: 'exam-prep', icon: GraduationCap, label: 'Exam Sadhana', color: 'from-gold to-saffron', desc: 'Holistic examination preparation' },
  { id: 'srs', icon: Brain, label: 'Sutradhar', color: 'from-peacock to-emerald-600', desc: 'Spaced repetition memory mastery' },
  { id: 'pomodoro', icon: Timer, label: 'Dhyana Timer', color: 'from-saffron to-vibrant', desc: 'Sacred focus & discipline' },
  { id: 'formulas', icon: Scroll, label: 'Shastra Matrix', color: 'from-silver to-ash', desc: 'Formula & axiom extraction' },
  { id: 'mindmap', icon: Map, label: 'Jnana Map', color: 'from-peacock to-cyan-700', desc: 'Visual knowledge mapping' },
  { id: 'mock-exam', icon: FileText, label: 'Pariksha', color: 'from-gold to-vibrant', desc: 'Simulated examination trials' },
  { id: 'socratic', icon: MessageSquare, label: 'Guru AI', color: 'from-indigo-400 to-peacock', desc: 'Dialectical learning interface' },
];


export function StudyOSPage() {
  const [activeFeature, setActiveFeature] = useState('exam-prep');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<any>(null);

  // States for sub-features
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroType, setPomodoroType] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pomodoroActive && pomodoroTime > 0) {
      timerRef.current = setInterval(() => {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            setPomodoroActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pomodoroActive]);

  const handleAction = async () => {
    setLoading(true);
    // Mocking API results for themed UI demonstration
    await new Promise(r => setTimeout(r, 2000));
    setResult({
      summary: `The fundamental principles of ${topic || 'Ancient Robotics'} involve the harmonious integration of dharma and logic...`,
      mantras: ['Focus is the path to realization', 'Repetition builds the subtle body of knowledge', 'Doubt is the threshold of wisdom'],
      concepts: ['Recursive Logic', 'Sacred Geometry', 'Computational Panini']
    });
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar scroll-smooth p-6 pb-20">
      <div className="max-w-7xl mx-auto py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="inline-block relative mb-4">
            <Mandala className="w-20 h-20 animate-[spin_60s_linear_infinite] opacity-5 absolute inset-0 -m-0" />
            <h1 className="text-5xl font-display font-bold text-white relative z-10 tracking-tight italic">
              Vidya OS
            </h1>
          </div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-saffron font-bold">The Sovereign Discipline Interface</p>
        </motion.div>

        {/* Feature Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-10">
          {features.map((f, idx) => (
            <motion.button
              key={f.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => { setActiveFeature(f.id); setResult(null); }}
              className={cn(
                "p-4 cut-card transition-all flex flex-col items-center gap-3 border relative overflow-hidden group/btn",
                activeFeature === f.id
                  ? "bg-gradient-to-br from-void to-graphite border-gold/40 shadow-[0_0_25px_rgba(212,175,55,0.1)]"
                  : "bg-void/40 border-smoke/10 hover:border-smoke/30"
              )}
            >
              {activeFeature === f.id && (
                <motion.div layoutId="active-nav-glow" className="absolute inset-0 bg-gold/5 pointer-events-none" />
              )}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover/btn:scale-110",
                activeFeature === f.id ? "bg-gold/20 text-gold" : "bg-smoke/10 text-ash"
              )}>
                <f.icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[9px] uppercase font-bold tracking-widest text-center",
                activeFeature === f.id ? "text-white" : "text-ash"
              )}>{f.label}</span>
            </motion.button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-10">
          {/* Primary Workspace */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full"
              >
                {activeFeature === 'pomodoro' ? (
                  <DhyanaTimer
                    time={pomodoroTime}
                    active={pomodoroActive}
                    type={pomodoroType}
                    onToggle={() => setPomodoroActive(!pomodoroActive)}
                    onReset={() => { setPomodoroActive(false); setPomodoroTime(25 * 60); }}
                    onSetType={(t) => {
                      setPomodoroType(t);
                      setPomodoroTime(t === 'focus' ? 25 * 60 : t === 'short_break' ? 5 * 60 : 15 * 60);
                      setPomodoroActive(true);
                    }}
                  />
                ) : (
                  <CoreFeaturePanel
                    title={features.find(f => f.id === activeFeature)?.label || ''}
                    desc={features.find(f => f.id === activeFeature)?.desc || ''}
                    topic={topic}
                    setTopic={setTopic}
                    content={content}
                    setContent={setContent}
                    onAction={handleAction}
                    loading={loading}
                    result={result}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar:修行 (Sadhana) Profile */}
          <div className="space-y-8">
            <Card className="p-8 cut-card cut-border bg-graphite/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Trophy className="w-16 h-16 text-gold" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 cut-card border-2 border-gold/40 p-1">
                    <div className="w-full h-full bg-gold/10 flex items-center justify-center text-gold font-display font-bold text-2xl">
                      12
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-ash tracking-widest leading-none mb-1">Scholar Level</p>
                    <h3 className="text-2xl font-display font-bold text-white tracking-tight">Kunj Shah</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-peacock" />
                      <span className="text-[9px] uppercase font-bold text-peacock tracking-widest">Adept Realizer</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold text-ash tracking-widest mb-2">
                      <span>Jnana XP (Progress)</span>
                      <span className="text-gold">4,250 / 5,000</span>
                    </div>
                    <ProgressBar progress={85} variant="gold" className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="px-4 py-3 cut-card bg-void/50 border border-smoke/10">
                      <p className="text-[9px] uppercase font-bold text-ash tracking-widest mb-1">Consistency</p>
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-saffron" />
                        <span className="text-lg font-display font-bold text-white">14 Days</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 cut-card bg-void/50 border border-smoke/10">
                      <p className="text-[9px] uppercase font-bold text-ash tracking-widest mb-1">Realizations</p>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-gold" />
                        <span className="text-lg font-display font-bold text-white">128</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Today's Dharma Tasks */}
            <div className="space-y-4">
              <h4 className="text-[10px] uppercase font-bold text-ash tracking-[0.3em] ml-2 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-peacock" />
                Today's Dharma
              </h4>
              <div className="space-y-3">
                {[
                  'Analyze Vedic Robotics shastra',
                  'Complete 3 Dhyana Focus sessions',
                  'Review 42 Sutradhar cards',
                  'Generate mock Pariksha for ML'
                ].map((task, i) => (
                  <label key={i} className="flex items-center gap-4 p-4 cut-card bg-graphite/40 border border-smoke/10 hover:border-smoke/30 transition-all cursor-pointer group">
                    <div className="relative w-5 h-5 flex-shrink-0">
                      <input type="checkbox" className="peer absolute inset-0 opacity-0 cursor-pointer" />
                      <div className="absolute inset-0 border border-smoke/40 rounded-md transition-all group-hover:border-peacock/60 peer-checked:bg-peacock peer-checked:border-peacock" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                        <CheckCircle2 className="w-3 h-3 text-void" />
                      </div>
                    </div>
                    <span className="text-xs text-silver group-hover:text-white transition-colors">{task}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoreFeaturePanel({
  title, desc, topic, setTopic, content, setContent, onAction, loading, result
}: any) {
  return (
    <Card className="p-8 cut-card cut-border bg-graphite/40 h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 -mr-16 -mt-16 opacity-5">
        <Mandala size="md" />
      </div>

      <div className="relative z-10 mb-8">
        <h3 className="text-2xl font-display font-bold text-white tracking-tight mb-1 italic">{title}</h3>
        <p className="text-sm text-ash">{desc}</p>
      </div>

      <div className="relative z-10 flex-1 flex flex-col gap-6">
        <div>
          <label className="text-[10px] uppercase font-bold text-ash tracking-[0.2em] block mb-3">Sutra Topic (Subject)</label>
          <input
            type="text"
            placeholder="Enter the essence of your study..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="w-full bg-void border border-smoke/30 rounded-xl px-4 py-4 text-chalk placeholder:text-ash/40 focus:border-gold/50 outline-none transition-all font-body text-sm"
          />
        </div>

        <div className="flex-1 min-h-[300px] flex flex-col">
          <label className="text-[10px] uppercase font-bold text-ash tracking-[0.2em] block mb-3">Shastra Content (Knowledge Base)</label>
          <textarea
            placeholder="Transcribe your knowledge here to begin extraction..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="flex-1 w-full bg-void border border-smoke/30 rounded-xl px-4 py-4 text-silver placeholder:text-ash/40 focus:border-gold/50 outline-none transition-all font-body text-sm resize-none custom-scrollbar"
          />
        </div>

        <div className="flex gap-4 items-center">
          <SanskritButton variant="primary" className="flex-1 h-14 text-[10px]" onClick={onAction} disabled={loading}>
            {loading ? 'Manifesting Intelligence...' : `Initiate ${title} Synthesis`}
            {!loading && <Sparkles className="w-4 h-4 ml-3" />}
          </SanskritButton>
        </div>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 pt-10 border-t border-smoke/10"
        >
          <div className="p-6 cut-card bg-gold/5 border border-gold/20">
            <h4 className="text-[10px] uppercase font-bold text-gold tracking-[0.3em] mb-4">Realized Synthese</h4>
            <p className="text-sm text-silver leading-relaxed font-body mb-6">
              {result.summary}
            </p>
            <div className="flex flex-wrap gap-2">
              {result.concepts.map((c: string, idx: number) => (
                <Badge key={idx} variant="gold" className="text-[9px] uppercase">{c}</Badge>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </Card>
  );
}

function DhyanaTimer({ time, active, type, onToggle, onReset, onSetType }: {
  time: number;
  active: boolean;
  type: 'focus' | 'short_break' | 'long_break';
  onToggle: () => void;
  onReset: () => void;
  onSetType: (t: 'focus' | 'short_break' | 'long_break') => void;
}) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-12 cut-card cut-border bg-graphite/40 h-full flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <Mandala className="w-[150%] h-[150%] animate-[spin_120s_linear_infinite]" />
      </div>

      <div className="relative z-10 text-center space-y-12">
        <div>
          <h3 className="text-2xl font-display font-bold text-white tracking-tight mb-2 italic">Dhyana Timer</h3>
          <p className="text-[10px] uppercase tracking-[0.3em] text-saffron font-bold">Cultivating Sacred Discipline</p>
        </div>

        <div className="relative">
          <div className="text-[140px] font-display font-black text-white leading-none tracking-tighter filter blur-[0.5px]">
            {formatTime(time)}
          </div>
          <div className="text-[10px] uppercase font-bold text-ash tracking-[0.5em] mt-4">
            Current State: <span className="text-saffron">{type.replace('_', ' ')} Sadhana</span>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <SanskritButton variant="primary" className="w-48 h-16 group" onClick={onToggle}>
            {active ? <Pause className="w-5 h-5 mr-3" /> : <Play className="w-5 h-5 mr-3" />}
            <span className="text-sm">{active ? 'Pause Focus' : 'Begin Sadhana'}</span>
          </SanskritButton>
          <button
            onClick={onReset}
            className="w-16 h-16 cut-card bg-void/60 border border-smoke/20 flex items-center justify-center text-ash hover:text-white transition-all"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-3 justify-center">
          {[
            { id: 'focus' as const, label: 'Tapas (Focus)', val: 25 },
            { id: 'short_break' as const, label: 'Viram (Short)', val: 5 },
            { id: 'long_break' as const, label: 'Vishram (Long)', val: 15 },
          ].map(mode => (
              <button
                key={mode.id}
                onClick={() => onSetType(mode.id)}
              className={cn(
                "px-6 py-3 cut-card border text-[9px] uppercase font-bold tracking-widest transition-all",
                type === mode.id ? "bg-saffron text-void border-saffron" : "bg-void/40 border-smoke/10 text-ash hover:text-silver"
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

// Fallback Spinner
const Spinner = ({ className, size = 'md', variant = 'peacock' }: { className?: string, size?: 'sm' | 'md' | 'lg', variant?: string }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  const colorClass = variant === 'saffron' ? 'border-saffron' : 'border-peacock';
  return <div className={cn("animate-spin rounded-full border-2 border-t-transparent", sizeClass, colorClass, className)} />;
};


export default StudyOSPage;
