/**
 * XPDashboardPage — Gamification & Achievement Hub
 *
 * Displays:
 *  - Level badge and XP progress bar
 *  - Weekly XP sparkline
 *  - Streak display
 *  - Achievement grid (locked/unlocked with reveal animation)
 *  - Night research morning digest card
 *  - "Run overnight research" manual trigger button
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, Flame, Star, Zap, Brain, Moon, Sun,
    CheckCircle2, Lock, ChevronRight, Sparkles, RefreshCw,
    MessageSquare, Loader2, BookOpen,
} from 'lucide-react';
import { cn } from '../components/ui';

// ─── API helpers ──────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL || '/api';

async function getXPProfile() {
    const r = await fetch(`${API}/xp/profile`);
    return r.json();
}
async function getMorningDigest() {
    const r = await fetch(`${API}/night/digest`);
    return r.json();
}
async function triggerNightResearch() {
    const r = await fetch(`${API}/night/run`, { method: 'POST' });
    return r.json();
}

// ─── Level badge ──────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<number, string> = {
    1: 'from-ash/30 to-graphite/50',
    2: 'from-peacock/30 to-peacock/10',
    3: 'from-gold/30 to-gold/10',
    4: 'from-saffron/30 to-saffron/10',
    5: 'from-purple-500/30 to-purple-500/10',
    6: 'from-gold/40 to-saffron/20',
    7: 'from-peacock/40 to-gold/20',
    8: 'from-saffron/40 to-peacock/20',
    9: 'from-gold/50 to-peacock/30',
    10: 'from-yellow-400/40 to-gold/30',
    11: 'from-yellow-300/60 to-gold/40',
};

function LevelBadge({ level, title }: { level: number; title: string }) {
    const gradient = LEVEL_COLORS[Math.min(level, 11)] ?? LEVEL_COLORS[11];
    return (
        <div className={cn('cut-card bg-gradient-to-br border border-white/10 p-6 text-center', gradient)}>
            <div className="text-5xl font-black text-chalk">{level}</div>
            <div className="text-xs text-ash uppercase tracking-[0.2em] mt-1">{title}</div>
        </div>
    );
}

// ─── XP Progress bar ──────────────────────────────────────────────────────────

function XPBar({ current, next, progress }: { current: number; next: number; progress: number }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-ash">
                <span>{current.toLocaleString()} XP total</span>
                <span>{next > 0 ? `${next.toLocaleString()} XP to next level` : 'MAX LEVEL'}</span>
            </div>
            <div className="h-2 bg-graphite rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-peacock to-gold rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
}

// ─── Achievement card ──────────────────────────────────────────────────────────

function AchievementCard({ achievement, unlocked }: { achievement: any; unlocked: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                'cut-card border p-4 flex items-center gap-3 transition-all',
                unlocked ? 'border-gold/30 bg-gold/5 hover:border-gold/50' : 'border-smoke/20 bg-graphite/20 opacity-50'
            )}
        >
            <div className={cn('w-10 h-10 cut-card flex items-center justify-center text-xl flex-shrink-0', unlocked ? 'bg-gold/20' : 'bg-graphite/50')}>
                {unlocked ? achievement.icon : <Lock className="w-4 h-4 text-ash/40" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium truncate', unlocked ? 'text-chalk' : 'text-ash')}>{achievement.title}</p>
                <p className="text-[11px] text-ash truncate">{achievement.description}</p>
            </div>
            {unlocked && (
                <div className="text-[10px] text-gold font-mono whitespace-nowrap">+{achievement.xpBonus} XP</div>
            )}
        </motion.div>
    );
}

// ─── Morning Digest Card ──────────────────────────────────────────────────────

function DigestCard({ digest, onTrigger, running }: { digest: any; onTrigger: () => void; running: boolean }) {
    if (!digest?.readyForReview) {
        return (
            <div className="cut-card border border-smoke/40 bg-graphite/20 p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-ash/50" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-ash">Night Research</span>
                </div>
                <p className="text-sm text-ash">No digest for today yet. The brain researches autonomously each night at 2:00 AM, or you can trigger it manually.</p>
                <button
                    onClick={onTrigger}
                    disabled={running}
                    className="cut-card bg-saffron/10 border border-saffron/30 text-saffron px-5 py-2.5 text-sm font-medium hover:bg-saffron/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {running ? <><Loader2 className="w-4 h-4 animate-spin" /> Running...</> : <><Moon className="w-4 h-4" /> Run Overnight Research Now</>}
                </button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="cut-card border border-saffron/30 bg-saffron/5 p-6 space-y-4"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-gold" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-gold">Morning Digest — {digest.date}</span>
                </div>
                <span className="text-[10px] text-ash">{digest.topicsResearched?.length ?? 0} topics researched</span>
            </div>

            <p className="text-sm text-silver leading-relaxed italic">"{digest.morningBriefing}"</p>

            {digest.insightsGenerated?.length > 0 && (
                <div>
                    <div className="text-[10px] uppercase tracking-[0.15em] text-ash mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> New Insights
                    </div>
                    <ul className="space-y-1.5">
                        {digest.insightsGenerated.slice(0, 4).map((insight: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-silver">
                                <span className="text-gold mt-0.5">→</span>
                                {insight}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {digest.novelConnections?.length > 0 && (
                <div className="cut-card bg-peacock/5 border border-peacock/20 p-3">
                    <div className="text-[10px] uppercase tracking-[0.15em] text-peacock mb-2">Novel Connections</div>
                    {digest.novelConnections.map((c: string, i: number) => (
                        <p key={i} className="text-[11px] text-silver">{c}</p>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-4 text-[11px] text-ash pt-2 border-t border-smoke/30">
                <span>{digest.memoriesConsolidated ?? 0} memories consolidated</span>
                <span>·</span>
                <span>{digest.novelConnections?.length ?? 0} novel connections</span>
            </div>
        </motion.div>
    );
}

// ─── All achievement definitions (mirrored from backend) ──────────────────────

const ALL_ACHIEVEMENTS = [
    { id: 'first_research', title: 'First Steps', description: 'Complete your first research', icon: '🚀', xpBonus: 25 },
    { id: 'ten_research', title: 'Researcher', description: 'Complete 10 research sessions', icon: '🔬', xpBonus: 100 },
    { id: 'fifty_research', title: 'Polymath', description: 'Complete 50 research sessions', icon: '🌐', xpBonus: 500 },
    { id: 'first_flashcard', title: 'Flash of Insight', description: 'Review your first flashcard', icon: '⚡', xpBonus: 10 },
    { id: 'hundred_flashcards', title: 'Memory Palace', description: 'Review 100 flashcards', icon: '🏛️', xpBonus: 200 },
    { id: 'insomniac', title: 'Insomniac', description: 'Use Brain Sleep 10 times', icon: '🌙', xpBonus: 150 },
    { id: 'streak_7', title: 'Week Warrior', description: '7-day study streak', icon: '🔥', xpBonus: 70 },
    { id: 'streak_30', title: 'Iron Mind', description: '30-day study streak', icon: '💎', xpBonus: 300 },
    { id: 'pdf_uploader', title: 'Document Devourer', description: 'Upload 5 PDFs for research', icon: '📄', xpBonus: 100 },
    { id: 'youtube_scholar', title: 'Video Scholar', description: 'Research 5 YouTube videos', icon: '▶️', xpBonus: 100 },
    { id: 'night_owl', title: 'Night Owl', description: 'Find 3 morning digests', icon: '🦉', xpBonus: 75 },
    { id: 'perfect_recall', title: 'Photographic Memory', description: 'Get quality=5 on 25 flashcards', icon: '🧠', xpBonus: 125 },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export function XPDashboardPage() {
    const [profile, setProfile] = useState<any>(null);
    const [digest, setDigest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [nightRunning, setNightRunning] = useState(false);

    const loadData = async () => {
        try {
            const [p, d] = await Promise.all([getXPProfile(), getMorningDigest()]);
            setProfile(p);
            setDigest(d);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleNightRun = async () => {
        setNightRunning(true);
        try {
            const d = await triggerNightResearch();
            setDigest(d);
        } catch (e) { console.error(e); }
        setNightRunning(false);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Trophy className="w-8 h-8 text-gold" />
                </motion.div>
            </div>
        );
    }

    const earnedIds = new Set((profile?.achievements ?? []).map((a: any) => a.id));

    return (
        <div className="h-full flex flex-col overflow-y-auto px-6 py-6 space-y-6" style={{ backgroundColor: '#FAFAFA' }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Brain Progress</h1>
                    <p className="text-sm mt-0.5" style={{ color: '#666' }}>Your knowledge journey and achievements</p>
                </div>
                <button onClick={loadData} className="transition-colors" style={{ color: '#666' }}>
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* XP Hero */}
            {profile && (
                <div className="cut-card glass-premium border border-smoke/40 p-6 flex flex-col md:flex-row items-center gap-6">
                    <LevelBadge level={profile.level} title={profile.levelTitle} />
                    <div className="flex-1 w-full space-y-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Flame className="w-4 h-4 text-saffron" />
                                <span className="text-sm text-chalk font-medium">{profile.streakDays}-day streak</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-gold" />
                                <span className="text-sm text-chalk font-medium">{profile.weeklyXP} XP this week</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-peacock" />
                                <span className="text-sm text-chalk font-medium">{profile.achievements?.length ?? 0} achievements</span>
                            </div>
                        </div>
                        <XPBar current={profile.totalXP} next={profile.xpToNextLevel} progress={profile.xpProgress} />
                    </div>
                </div>
            )}

            {/* Morning Digest */}
            <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-ash mb-3 flex items-center gap-2">
                    <Moon className="w-3 h-3" /> Autonomous Night Research
                </div>
                <DigestCard digest={digest} onTrigger={handleNightRun} running={nightRunning} />
            </div>

            {/* Achievements */}
            <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-ash mb-3 flex items-center gap-2">
                    <Trophy className="w-3 h-3" />
                    Achievements ({earnedIds.size} / {ALL_ACHIEVEMENTS.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {ALL_ACHIEVEMENTS.map(a => (
                        <AchievementCard key={a.id} achievement={a} unlocked={earnedIds.has(a.id)} />
                    ))}
                </div>
            </div>

            {/* XP Guide */}
            <div className="cut-card border border-smoke/30 p-5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-ash mb-4 flex items-center gap-2">
                    <BookOpen className="w-3 h-3" />
                    How to Earn XP
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { icon: Brain, label: 'Research', xp: '50 XP' },
                        { icon: Zap, label: 'Flashcard Review', xp: '5 XP' },
                        { icon: Star, label: 'Perfect Recall', xp: '15 XP' },
                        { icon: Flame, label: 'Daily Streak', xp: '25 XP' },
                        { icon: Moon, label: 'Brain Sleep', xp: '30 XP' },
                        { icon: BookOpen, label: 'PDF Upload', xp: '40 XP' },
                        { icon: Sparkles, label: 'Night Research', xp: '60 XP' },
                        { icon: CheckCircle2, label: 'Quiz Complete', xp: '35 XP' },
                    ].map(({ icon: Icon, label, xp }) => (
                        <div key={label} className="cut-card bg-graphite/30 border border-smoke/20 p-3 text-center">
                            <Icon className="w-5 h-5 mx-auto text-ash mb-1.5" />
                            <p className="text-[11px] text-silver">{label}</p>
                            <p className="text-[11px] text-gold font-mono font-bold">{xp}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
