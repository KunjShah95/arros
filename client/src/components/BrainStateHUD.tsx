/**
 * BrainStateHUD — Live Cognitive State Display
 *
 * A real-time window into the AI's mind — shows:
 *  - Current emotional state with icon
 *  - Processing mode (System 1 vs System 2)
 *  - Cognitive load & arousal level
 *  - Curiosity score
 *  - Working memory saturation
 *  - Self-reflection (metacognitive notes)
 *  - Open questions the brain is wondering about
 *
 * Designed to be premium, data-dense, and human-readable.
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain,
    Zap,
    Heart,
    Eye,
    HardDrive,
    Sparkles,
    MessageSquareQuote,
    ChevronDown,
    ChevronUp,
    Activity,
    Cpu,
    RefreshCw,
} from 'lucide-react';
import { cn } from './ui';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BrainState {
    isThinking: boolean;
    currentEmotion: string;
    processingMode: string;
    cognitiveLoad: number;
    arousalLevel: number;
    curiosityScore: number;
    workingMemoryLoad: number;
    selfReflection: string;
    openQuestions: string[];
    sessionInsights: string[];
}

interface BrainStateHUDProps {
    brainState: BrainState | null;
    isResearching: boolean;
    className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function modeLabel(mode: string): string {
    const map: Record<string, string> = {
        fast_intuitive: 'Fast · System 1',
        slow_deliberate: 'Deliberate · System 2',
        creative: 'Creative · Exploratory',
        critical: 'Critical · High-alert',
    };
    return map[mode] ?? mode;
}

function modeColor(mode: string): string {
    const map: Record<string, string> = {
        fast_intuitive: 'text-gold',
        slow_deliberate: 'text-peacock',
        creative: 'text-saffron',
        critical: 'text-warning',
    };
    return map[mode] ?? 'text-ash';
}

function modeDot(mode: string): string {
    const map: Record<string, string> = {
        fast_intuitive: 'bg-gold',
        slow_deliberate: 'bg-peacock',
        creative: 'bg-saffron',
        critical: 'bg-warning',
    };
    return map[mode] ?? 'bg-ash';
}

function loadColor(value: number): string {
    if (value > 0.75) return 'bg-warning';
    if (value > 0.5) return 'bg-saffron';
    return 'bg-peacock';
}

function loadGlow(value: number): string {
    if (value > 0.75) return 'shadow-[0_0_8px_rgba(255,160,0,0.4)]';
    if (value > 0.5) return 'shadow-[0_0_8px_rgba(255,107,53,0.3)]';
    return 'shadow-[0_0_8px_rgba(0,168,107,0.3)]';
}

// ─── Animated Meter ───────────────────────────────────────────────────────────

function Meter({
    label,
    value,
    icon: Icon,
    colorClass,
    glowClass,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    colorClass: string;
    glowClass: string;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.15em]">
                <span className="flex items-center gap-1.5 text-ash">
                    <Icon className="w-3 h-3" />
                    {label}
                </span>
                <span className="text-chalk font-mono">{(value * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1 bg-graphite rounded-full overflow-hidden">
                <motion.div
                    className={cn('h-full rounded-full transition-all', colorClass, glowClass)}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, value * 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
}

// ─── BrainStateHUD Component ──────────────────────────────────────────────────

export function BrainStateHUD({ brainState, isResearching, className }: BrainStateHUDProps) {
    const [showQuestions, setShowQuestions] = useState(false);
    const [showInsights, setShowInsights] = useState(false);
    const [pulseEmotion, setPulseEmotion] = useState(false);
    const prevEmotion = useRef<string>('');

    // Pulse emotion display when it changes
    useEffect(() => {
        if (brainState?.currentEmotion && brainState.currentEmotion !== prevEmotion.current) {
            setPulseEmotion(true);
            prevEmotion.current = brainState.currentEmotion;
            const t = setTimeout(() => setPulseEmotion(false), 1000);
            return () => clearTimeout(t);
        }
    }, [brainState?.currentEmotion]);

    // ─── Idle state when no brain data yet ──────────────────────────────────────
    if (!brainState && !isResearching) {
        return (
            <div className={cn('cut-card cut-border glass-premium p-4 space-y-3', className)}>
                <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-ash" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-ash">Cognitive State</span>
                </div>
                <div className="flex flex-col items-center py-6 text-center space-y-2">
                    <div className="w-10 h-10 cut-card bg-slate/60 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-ash/40" />
                    </div>
                    <p className="text-xs text-ash/60">Brain idle</p>
                    <p className="text-[10px] text-ash/40">Submit a query to activate</p>
                </div>
            </div>
        );
    }

    // ─── Thinking / loading state ────────────────────────────────────────────────
    if (isResearching && !brainState) {
        return (
            <div className={cn('cut-card cut-border glass-premium p-4 space-y-3', className)}>
                <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-saffron animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-saffron">Brain Activating</span>
                </div>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-1">
                        <div className="h-2 bg-slate/50 rounded animate-pulse w-3/4" />
                        <div className="h-1 bg-graphite rounded animate-pulse" />
                    </div>
                ))}
            </div>
        );
    }

    if (!brainState) return null;

    const { processingMode, cognitiveLoad, arousalLevel, curiosityScore, workingMemoryLoad } = brainState;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('cut-card cut-border glass-premium p-4 space-y-4', className)}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={isResearching ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        <Brain className={cn('w-4 h-4', isResearching ? 'text-saffron' : 'text-peacock')} />
                    </motion.div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-ash">Cognitive State</span>
                </div>
                <div className={cn('w-2 h-2 rounded-full', isResearching ? 'bg-saffron animate-pulse' : 'bg-peacock')} />
            </div>

            {/* ─── Emotion Display ──────────────────────────────────────────────────── */}
            <motion.div
                animate={pulseEmotion ? { scale: [1, 1.04, 1] } : {}}
                className="cut-card bg-slate/60 border border-smoke/50 px-3 py-2.5"
            >
                <div className="text-[10px] uppercase tracking-[0.15em] text-ash mb-1 flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    Emotional State
                </div>
                <AnimatePresence mode="wait">
                    <motion.p
                        key={brainState.currentEmotion}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        className="text-sm text-chalk font-medium"
                    >
                        {brainState.currentEmotion || '⚡ Activating...'}
                    </motion.p>
                </AnimatePresence>
            </motion.div>

            {/* ─── Processing Mode ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', modeDot(processingMode))} />
                <div>
                    <div className="text-[10px] uppercase tracking-[0.12em] text-ash">Mode</div>
                    <div className={cn('text-xs font-semibold', modeColor(processingMode))}>
                        {modeLabel(processingMode)}
                    </div>
                </div>
                <div className="ml-auto">
                    <Cpu className={cn('w-4 h-4', modeColor(processingMode))} />
                </div>
            </div>

            {/* ─── Meters ──────────────────────────────────────────────────────────── */}
            <div className="space-y-3">
                <Meter
                    label="Cognitive Load"
                    value={cognitiveLoad}
                    icon={Activity}
                    colorClass={loadColor(cognitiveLoad)}
                    glowClass={loadGlow(cognitiveLoad)}
                />
                <Meter
                    label="Arousal"
                    value={arousalLevel}
                    icon={Zap}
                    colorClass={arousalLevel > 0.7 ? 'bg-warning' : 'bg-saffron'}
                    glowClass={arousalLevel > 0.7 ? 'shadow-[0_0_8px_rgba(255,160,0,0.4)]' : ''}
                />
                <Meter
                    label="Curiosity"
                    value={curiosityScore}
                    icon={Sparkles}
                    colorClass="bg-gold"
                    glowClass="shadow-[0_0_8px_rgba(255,200,50,0.3)]"
                />
                <Meter
                    label="Working Memory"
                    value={workingMemoryLoad}
                    icon={HardDrive}
                    colorClass={workingMemoryLoad > 0.8 ? 'bg-error' : 'bg-peacock'}
                    glowClass={workingMemoryLoad > 0.8 ? 'shadow-[0_0_6px_rgba(220,50,50,0.4)]' : ''}
                />
            </div>

            {/* ─── Self-Reflection ─────────────────────────────────────────────────── */}
            {brainState.selfReflection && (
                <div className="cut-card bg-graphite/50 border border-smoke/30 px-3 py-2.5">
                    <div className="text-[10px] uppercase tracking-[0.15em] text-ash mb-1.5 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Self-Reflection
                    </div>
                    <p className="text-[11px] text-silver leading-relaxed italic">
                        "{brainState.selfReflection}"
                    </p>
                </div>
            )}

            {/* ─── Open Questions ───────────────────────────────────────────────────── */}
            {brainState.openQuestions.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowQuestions(!showQuestions)}
                        className="w-full flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-ash hover:text-chalk transition-colors mb-2"
                    >
                        <span className="flex items-center gap-1.5">
                            <MessageSquareQuote className="w-3 h-3" />
                            Open Questions ({brainState.openQuestions.length})
                        </span>
                        {showQuestions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <AnimatePresence>
                        {showQuestions && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-1.5"
                            >
                                {brainState.openQuestions.map((q, i) => (
                                    <div
                                        key={i}
                                        className="text-[11px] text-silver bg-graphite/30 border border-smoke/20 px-2.5 py-2 cut-card leading-relaxed"
                                    >
                                        <span className="text-peacock font-mono mr-1">?</span>
                                        {q}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* ─── Session Insights ─────────────────────────────────────────────────── */}
            {brainState.sessionInsights.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowInsights(!showInsights)}
                        className="w-full flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-ash hover:text-chalk transition-colors mb-2"
                    >
                        <span className="flex items-center gap-1.5">
                            <RefreshCw className="w-3 h-3" />
                            Session Insights ({brainState.sessionInsights.length})
                        </span>
                        {showInsights ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <AnimatePresence>
                        {showInsights && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-1.5"
                            >
                                {brainState.sessionInsights.map((insight, i) => (
                                    <div
                                        key={i}
                                        className="text-[11px] text-silver bg-gold/5 border border-gold/20 px-2.5 py-2 cut-card leading-relaxed"
                                    >
                                        <span className="text-gold font-mono mr-1">→</span>
                                        {insight}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* ─── Footer label ────────────────────────────────────────────────────── */}
            <div className="border-t border-smoke/30 pt-2">
                <p className="text-[9px] text-ash/50 text-center uppercase tracking-[0.2em]">
                    Human Cognitive Architecture v2
                </p>
            </div>
        </motion.div>
    );
}
