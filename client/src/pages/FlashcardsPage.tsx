/**
 * FlashcardsPage — Spaced Repetition Study Interface
 *
 * Design: Premium flashcard review UI with:
 *  - Deck overview with stats
 *  - Card flip animation (3D perspective)
 *  - Quality rating (0-5 buttons)
 *  - Due today count + progress ring
 *  - Topic filter
 *  - Generate cards from a past session
 *  - Brain integration: curiosity score influences card order
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Zap, RotateCcw, CheckCircle2, XCircle, ChevronRight,
    BookOpen, Layers, Trophy, Flame, TrendingUp, Plus, Filter,
    Clock, Target, Star, RefreshCw, Sparkles,
} from 'lucide-react';
import { cn } from '../components/ui';
import type { Flashcard } from '../../../server/src/agents/spacedRepetition';

// ─── API helpers ──────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL || '/api';

async function getDueCards(): Promise<Flashcard[]> {
    const r = await fetch(`${API}/flashcards/due?limit=30`);
    return r.json();
}
async function getAllCards(): Promise<Flashcard[]> {
    const r = await fetch(`${API}/flashcards`);
    return r.json();
}
async function getStats() {
    const r = await fetch(`${API}/flashcards/stats`);
    return r.json();
}
async function submitReview(cardId: string, quality: number, responseTimeMs: number) {
    const r = await fetch(`${API}/flashcards/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, quality, responseTimeMs }),
    });
    return r.json();
}

// ─── Quality button config ─────────────────────────────────────────────────────

const QUALITY_BUTTONS = [
    { q: 0, label: 'Blackout', desc: 'Complete blank', color: 'bg-error/20 border-error/40 text-error hover:bg-error/30' },
    { q: 1, label: 'Bad', desc: 'Wrong, hint helped', color: 'bg-error/10 border-error/30 text-error/80 hover:bg-error/20' },
    { q: 2, label: 'Hard', desc: 'Right but tough', color: 'bg-saffron/20 border-saffron/40 text-saffron hover:bg-saffron/30' },
    { q: 3, label: 'Good', desc: 'Correct with effort', color: 'bg-gold/20 border-gold/40 text-gold hover:bg-gold/30' },
    { q: 4, label: 'Easy', desc: 'Small hesitation', color: 'bg-peacock/20 border-peacock/40 text-peacock hover:bg-peacock/30' },
    { q: 5, label: 'Perfect', desc: 'Instant recall', color: 'bg-peacock/30 border-peacock/60 text-peacock hover:bg-peacock/40' },
];

// ─── StatsRing ────────────────────────────────────────────────────────────────

function StatsRing({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
    const pct = max > 0 ? Math.min(1, value / max) : 0;
    const r = 28, circ = 2 * Math.PI * r;
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                    <motion.circle
                        cx="32" cy="32" r={r} fill="none"
                        stroke={color} strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: circ * (1 - pct) }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-mono font-bold text-chalk">{value}</span>
                </div>
            </div>
            <span className="text-[10px] text-ash uppercase tracking-widest">{label}</span>
        </div>
    );
}

// ─── FlashCard 3D Component ───────────────────────────────────────────────────

function FlashCardView({
    card,
    isFlipped,
    onFlip,
}: { card: Flashcard; isFlipped: boolean; onFlip: () => void }) {
    return (
        <div
            className="relative cursor-pointer select-none"
            style={{ perspective: '1200px', height: '280px' }}
            onClick={onFlip}
        >
            <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
                {/* Front */}
                <div
                    className="absolute inset-0 cut-card glass-premium border border-peacock/30 flex flex-col items-center justify-center p-8 text-center"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="text-[10px] uppercase tracking-[0.2em] text-peacock mb-4 flex items-center gap-2">
                        <BookOpen className="w-3 h-3" />
                        Question
                    </div>
                    <p className="text-xl text-chalk font-medium leading-relaxed">{card.front}</p>
                    <div className="mt-6 text-[10px] text-ash/50">tap to reveal answer</div>
                    {/* difficulty pip */}
                    <div className="absolute top-4 right-4 flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={cn('w-1.5 h-1.5 rounded-full', i <= card.difficulty ? 'bg-saffron' : 'bg-graphite')} />
                        ))}
                    </div>
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 cut-card glass-premium border border-gold/30 flex flex-col items-center justify-center p-8 text-center"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <div className="text-[10px] uppercase tracking-[0.2em] text-gold mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" />
                        Answer
                    </div>
                    <p className="text-xl text-chalk font-medium leading-relaxed">{card.back}</p>
                    <div className="mt-4 px-3 py-1 bg-saffron/10 border border-saffron/30 cut-card text-[10px] text-saffron">
                        {card.topic}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function FlashcardsPage() {
    const [mode, setMode] = useState<'overview' | 'study'>('overview');
    const [dueCards, setDueCards] = useState<Flashcard[]>([]);
    const [allCards, setAllCards] = useState<Flashcard[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionResults, setSessionResults] = useState<{ card: Flashcard; quality: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewing, setReviewing] = useState(false);
    const [cardStartTime, setCardStartTime] = useState(Date.now());
    const [showComplete, setShowComplete] = useState(false);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        Promise.all([getDueCards(), getAllCards(), getStats()])
            .then(([due, all, s]) => {
                setDueCards(due);
                setAllCards(all);
                setStats(s);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const startStudy = () => {
        setCurrentIdx(0);
        setIsFlipped(false);
        setSessionResults([]);
        setShowComplete(false);
        setCardStartTime(Date.now());
        setMode('study');
    };

    const handleQuality = async (quality: number) => {
        if (reviewing) return;
        const card = dueCards[currentIdx];
        if (!card) return;

        setReviewing(true);
        const elapsed = Date.now() - cardStartTime;
        try {
            await submitReview(card.id, quality, elapsed);
            setSessionResults(prev => [...prev, { card, quality }]);
        } catch (e) {
            console.error(e);
        }

        // Next card
        const next = currentIdx + 1;
        if (next >= dueCards.length) {
            setShowComplete(true);
        } else {
            setCurrentIdx(next);
            setIsFlipped(false);
            setCardStartTime(Date.now());
        }
        setReviewing(false);
    };

    const filteredAll = filter
        ? allCards.filter(c => c.topic.toLowerCase().includes(filter.toLowerCase()) || c.front.toLowerCase().includes(filter.toLowerCase()))
        : allCards;

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Brain className="w-8 h-8 text-peacock" />
                </motion.div>
            </div>
        );
    }

    // ─── Study Mode ──────────────────────────────────────────────────────────────
    if (mode === 'study') {
        const currentCard = dueCards[currentIdx];

        if (showComplete) {
            const correct = sessionResults.filter(r => r.quality >= 3).length;
            const avgQ = sessionResults.reduce((s, r) => s + r.quality, 0) / (sessionResults.length || 1);
            return (
                <div className="h-full flex flex-col items-center justify-center p-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="cut-card glass-premium border border-gold/30 p-10 text-center max-w-md w-full space-y-6"
                    >
                        <Trophy className="w-12 h-12 text-gold mx-auto" />
                        <div>
                            <h2 className="text-2xl font-bold text-chalk">Session Complete!</h2>
                            <p className="text-ash mt-1">{sessionResults.length} cards reviewed</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="cut-card bg-graphite/50 p-3 text-center">
                                <p className="text-2xl font-mono font-bold text-peacock">{correct}</p>
                                <p className="text-[10px] text-ash">Correct</p>
                            </div>
                            <div className="cut-card bg-graphite/50 p-3 text-center">
                                <p className="text-2xl font-mono font-bold text-error">{sessionResults.length - correct}</p>
                                <p className="text-[10px] text-ash">Missed</p>
                            </div>
                            <div className="cut-card bg-graphite/50 p-3 text-center">
                                <p className="text-2xl font-mono font-bold text-gold">{avgQ.toFixed(1)}</p>
                                <p className="text-[10px] text-ash">Avg Quality</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setMode('overview')}
                            className="w-full cut-card bg-peacock/20 border border-peacock/40 text-peacock py-3 text-sm font-medium hover:bg-peacock/30 transition-all"
                        >
                            Back to Deck
                        </button>
                    </motion.div>
                </div>
            );
        }

        return (
            <div className="h-full flex flex-col overflow-hidden px-6 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setMode('overview')} className="text-ash hover:text-chalk transition-colors text-sm flex items-center gap-1">
                        ← Back
                    </button>
                    <div className="text-[10px] text-ash uppercase tracking-widest">
                        {currentIdx + 1} / {dueCards.length}
                    </div>
                    <div className="w-32 h-1 bg-graphite rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-peacock rounded-full"
                            animate={{ width: `${((currentIdx) / dueCards.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Card */}
                <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full gap-6">
                    {currentCard && (
                        <>
                            <FlashCardView card={currentCard} isFlipped={isFlipped} onFlip={() => setIsFlipped(!isFlipped)} />

                            <AnimatePresence>
                                {isFlipped && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 12 }}
                                        className="grid grid-cols-3 gap-2 md:grid-cols-6"
                                    >
                                        {QUALITY_BUTTONS.map(({ q, label, desc, color }) => (
                                            <button
                                                key={q}
                                                onClick={() => handleQuality(q)}
                                                disabled={reviewing}
                                                className={cn(
                                                    'cut-card border px-2 py-3 text-center transition-all disabled:opacity-50',
                                                    color
                                                )}
                                            >
                                                <div className="text-sm font-bold">{q}</div>
                                                <div className="text-[10px] font-medium">{label}</div>
                                                <div className="text-[9px] opacity-70 hidden md:block">{desc}</div>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!isFlipped && (
                                <button
                                    onClick={() => setIsFlipped(true)}
                                    className="cut-card bg-peacock/10 border border-peacock/30 text-peacock py-3 w-full text-sm font-medium hover:bg-peacock/20 transition-all"
                                >
                                    Reveal Answer
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    // ─── Overview Mode ────────────────────────────────────────────────────────────
    return (
        <div className="h-full flex flex-col overflow-y-auto px-6 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-chalk">Flashcard Deck</h1>
                    <p className="text-sm text-ash mt-0.5">SM-2 spaced repetition powered by your brain</p>
                </div>
                {dueCards.length > 0 && (
                    <button
                        onClick={startStudy}
                        className="cut-card bg-peacock/20 border border-peacock/40 text-peacock px-5 py-2.5 text-sm font-medium hover:bg-peacock/30 transition-all flex items-center gap-2"
                    >
                        <Zap className="w-4 h-4" />
                        Study ({dueCards.length} due)
                    </button>
                )}
            </div>

            {/* Stats row */}
            {stats && (
                <div className="cut-card glass-premium border border-smoke/40 p-5">
                    <div className="flex items-center justify-around flex-wrap gap-6">
                        <StatsRing value={stats.dueToday} max={stats.totalCards || 1} label="Due Today" color="#00a86b" />
                        <StatsRing value={stats.masteredCards} max={stats.totalCards || 1} label="Mastered" color="#ffd700" />
                        <StatsRing value={stats.totalCards} max={Math.max(stats.totalCards, 50)} label="Total Cards" color="#ff6b35" />
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-16 h-16 cut-card bg-saffron/10 border border-saffron/30 flex items-center justify-center">
                                <Flame className="w-6 h-6 text-saffron" />
                            </div>
                            <span className="text-[10px] text-ash uppercase tracking-widest">Streak</span>
                            <span className="text-sm font-mono font-bold text-saffron">{stats.streakDays}d</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-16 h-16 cut-card bg-peacock/10 border border-peacock/30 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-peacock" />
                            </div>
                            <span className="text-[10px] text-ash uppercase tracking-widest">Avg Interval</span>
                            <span className="text-sm font-mono font-bold text-peacock">{stats.averageInterval}d</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Topics */}
            {stats?.topicsLearned?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {stats.topicsLearned.map((topic: string) => (
                        <button
                            key={topic}
                            onClick={() => setFilter(filter === topic ? '' : topic)}
                            className={cn('text-[11px] px-3 py-1 cut-card border transition-all', filter === topic
                                ? 'bg-peacock/20 border-peacock/40 text-peacock'
                                : 'bg-graphite/40 border-smoke/30 text-ash hover:text-chalk')}
                        >
                            {topic}
                        </button>
                    ))}
                </div>
            )}

            {/* Cards list */}
            {filteredAll.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredAll.map(card => {
                        const isDue = new Date(card.nextReview) <= new Date();
                        return (
                            <motion.div
                                key={card.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    'cut-card border p-4 space-y-2',
                                    isDue ? 'border-peacock/30 bg-peacock/5' : 'border-smoke/30 bg-graphite/20'
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm text-chalk line-clamp-2 flex-1">{card.front}</p>
                                    {isDue && <div className="w-2 h-2 rounded-full bg-peacock flex-shrink-0 mt-1 animate-pulse" />}
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-ash">
                                    <span className="px-2 py-0.5 bg-graphite/50 cut-card">{card.topic}</span>
                                    <span>Rep {card.repetitions} · {card.interval}d</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                    <Sparkles className="w-12 h-12 text-ash/30 mb-4" />
                    <p className="text-ash">No flashcards yet</p>
                    <p className="text-sm text-ash/50 mt-1">Complete a research session and generate cards from the results</p>
                </div>
            )}
        </div>
    );
}
