import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Search,
    Brain,
    FileText,
    Sparkles,
    GraduationCap,
    TrendingUp,
    Plus,
    History as HistoryIcon,
    Layout,
    Layers,
    Shield,
} from 'lucide-react';
import { Card, Button, Badge, HoverCard, SanskritButton, Mandala, cn } from '../components/ui';
import type { Session } from '../types';
import { researchApi } from '../services/api';

interface DashboardProps {
    onStartResearch?: (query: string) => void;
    onViewChange?: (view: string) => void;
}

const recentTopicSuggestions = [
    'Explain Federated Learning in Healthcare',
    'Literature review on Transformer architecture in NLP',
    'Applications of CRISPR-Cas9 gene editing',
    'Survey of reinforcement learning from human feedback',
    'Quantum computing approaches for optimization problems',
];

const agentStatuses = [
    { name: 'The Planner', icon: Layout, color: 'text-saffron', description: 'Creates academic research plan' },
    { name: 'Web Sage', icon: Search, color: 'text-peacock', description: 'Searches web sources' },
    { name: 'The Scholar', icon: BookOpen, color: 'text-gold', description: 'Finds academic papers' },
    { name: 'The Critic', icon: Shield, color: 'text-saffron', description: 'Verifies & scores sources' },
    { name: 'The Weaver', icon: Sparkles, color: 'text-peacock', description: 'Writes academic report' },
];

export function DashboardPage({ onStartResearch, onViewChange }: DashboardProps) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const data = await researchApi.getSessions('default').catch(() => null);
            if (data && data.length > 0) {
                setSessions(data);
            } else {
                setSessions(getMockSessions());
            }
        } catch {
            setSessions(getMockSessions());
        } finally {
            setLoading(false);
        }
    };

    const getMockSessions = (): Session[] => [
        {
            id: '1',
            userId: 'default',
            title: 'Federated Learning in Healthcare',
            query: 'Explain Federated Learning in Healthcare with recent research',
            status: 'completed',
            createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        },
        {
            id: '2',
            userId: 'default',
            title: 'Transformer Architecture in NLP',
            query: 'Explain the Transformer architecture and its impact on NLP',
            status: 'completed',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        },
        {
            id: '3',
            userId: 'default',
            title: 'RLHF for Language Models',
            query: 'Reinforcement Learning from Human Feedback in large language models',
            status: 'completed',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
    ];

    const stats = {
        total: sessions.length,
        completed: sessions.filter(s => s.status === 'completed').length,
        topics: new Set(sessions.map(s => (s.title || '').split(' ').slice(0, 2).join(' '))).size,
    };

    const handleContinueResearch = (query: string) => {
        if (onViewChange) onViewChange('workspace');
        if (onStartResearch) {
            setTimeout(() => onStartResearch(`Continue my research on: ${query}`), 100);
        }
    };

    return (
        <div className="h-full overflow-y-auto p-6 scroll-smooth no-scrollbar">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="cut-card cut-border bg-graphite/40 p-8 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 opacity-10 pointer-events-none">
                    <Mandala size="lg" />
                </div>

                <div className="relative">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 cut-card bg-gradient-to-br from-saffron to-gold flex items-center justify-center shadow-xl shadow-saffron/20">
                            <GraduationCap className="w-6 h-6 text-void" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-bold text-white tracking-tight">Academic Sanctuary</h2>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-saffron font-bold">Protocol Active</p>
                        </div>
                    </div>
                    <p className="text-sm text-silver max-w-lg leading-relaxed">
                        Welcome back to your second brain. ARROS has refined your past
                        <span className="text-white font-bold mx-1">{stats.total} sessions</span>
                        into active memory. Ready for a new realization?
                    </p>
                </div>

                <SanskritButton
                    variant="primary"
                    className="flex-shrink-0"
                    onClick={() => onViewChange?.('workspace')}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Realization
                </SanskritButton>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: 'Total Realizations', value: stats.total, icon: BookOpen, color: 'text-saffron', gradient: 'from-saffron/20 to-gold/20' },
                    { label: 'Verified Findings', value: stats.completed, icon: CheckCircle2, color: 'text-peacock', gradient: 'from-peacock/20 to-indus/20' },
                    { label: 'Conceptual Loops', value: stats.topics, icon: TrendingUp, color: 'text-gold', gradient: 'from-gold/20 to-saffron/20' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <HoverCard gradient={stat.gradient}>
                            <Card className="p-6 bg-slate/40 border-smoke/30 cut-card flex items-center gap-5">
                                <div className={cn("w-12 h-12 cut-card flex items-center justify-center bg-void border border-smoke/30", stat.color)}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-display font-bold text-white">{stat.value}</p>
                                    <p className="text-[10px] text-ash uppercase tracking-widest font-bold">{stat.label}</p>
                                </div>
                            </Card>
                        </HoverCard>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8">
                {/* Left Column: Recent Realizations */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <HistoryIcon className="w-5 h-5 text-saffron" />
                            <h3 className="text-[11px] font-bold text-ash uppercase tracking-[0.3em]">Recent Realizations</h3>
                        </div>
                        <SanskritButton variant="ghost" className="px-3 py-1 text-[10px]" onClick={() => onViewChange?.('history')}>
                            View Scroll
                        </SanskritButton>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-48 py-12">
                                <div className="animate-spin w-8 h-8 border-2 border-saffron border-t-transparent rounded-full mb-4" />
                                <span className="text-[10px] uppercase tracking-widest text-ash">Reading Akashic Records...</span>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="cut-card cut-border bg-slate/20 p-12 text-center">
                                <BookOpen className="w-10 h-10 text-ash/30 mx-auto mb-4" />
                                <p className="text-silver text-sm">The records are empty.</p>
                                <p className="text-ash text-xs mt-1">Begin your first research protocol to see it here.</p>
                            </div>
                        ) : (
                            sessions.map((session, index) => (
                                <motion.div
                                    key={session.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <HoverCard>
                                        <Card className="p-5 bg-slate/40 border-smoke/20 group hover:border-saffron/40 transition-all cut-card">
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={cn(
                                                            "w-1.5 h-1.5 rounded-full shrink-0",
                                                            session.status === 'completed' ? "bg-peacock shadow-[0_0_8px_rgba(0,168,107,0.5)]" : "bg-saffron animate-pulse"
                                                        )} />
                                                        <h4 className="text-sm font-display font-bold text-chalk truncate group-hover:text-saffron transition-colors">
                                                            {session.title || session.query}
                                                        </h4>
                                                    </div>
                                                    <p className="text-xs text-ash truncate ml-4.5">{session.query}</p>
                                                    <div className="flex items-center gap-4 mt-3 ml-4.5">
                                                        <span className="text-[10px] text-ash/60 flex items-center gap-1.5">
                                                            <Clock className="w-3 h-3" />
                                                            {formatTimeAgo(new Date(session.updatedAt))}
                                                        </span>
                                                        <Badge variant={session.status === 'completed' ? 'peacock' : 'saffron'} className="text-[9px] px-2 py-0">
                                                            {session.status}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <SanskritButton
                                                    variant="secondary"
                                                    className="px-4 py-2 text-[10px] shrink-0"
                                                    onClick={() => handleContinueResearch(session.query || session.title || '')}
                                                >
                                                    Continue
                                                    <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                                                </SanskritButton>
                                            </div>
                                        </Card>
                                    </HoverCard>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Council & Tools */}
                <div className="space-y-8">
                    {/* Agent Council Status */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <Brain className="w-5 h-5 text-peacock" />
                            <h3 className="text-[11px] font-bold text-ash uppercase tracking-[0.3em]">Agent Council Status</h3>
                        </div>
                        <Card className="p-6 bg-slate/60 border-smoke/30 cut-card relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 opacity-5 pointer-events-none">
                                <Mandala size="md" />
                            </div>
                            <div className="space-y-4 relative z-10">
                                {agentStatuses.map((agent) => (
                                    <div key={agent.name} className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 cut-card bg-void border border-smoke/30 flex items-center justify-center shrink-0 group-hover:border-saffron/30 transition-colors">
                                            <agent.icon className={cn("w-4 h-4", agent.color)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-bold text-chalk uppercase tracking-wider">{agent.name}</div>
                                            <div className="text-[10px] text-ash tracking-tight">{agent.description}</div>
                                        </div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-peacock shadow-[0_0_8px_rgba(0,168,107,0.5)] shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Quick Start Capsules */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="w-5 h-5 text-gold" />
                            <h3 className="text-[11px] font-bold text-ash uppercase tracking-[0.2em]">Quick Realizations</h3>
                        </div>
                        <div className="grid gap-3">
                            {recentTopicSuggestions.map((topic, i) => (
                                <motion.button
                                    key={topic}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="w-full text-left p-4 cut-card bg-graphite/40 border border-smoke/20 hover:border-saffron/30 transition-all flex items-center justify-between group"
                                    onClick={() => {
                                        onViewChange?.('workspace');
                                        setTimeout(() => onStartResearch?.(topic), 100);
                                    }}
                                >
                                    <span className="text-[11px] text-silver font-medium truncate pr-4 group-hover:text-white">{topic}</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-ash group-hover:text-saffron group-hover:translate-x-1 transition-all shrink-0" />
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Knowledge Tip */}
                    <div className="p-6 cut-card bg-saffron/5 border border-saffron/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-24 h-24 -ml-12 -mt-12 opacity-5 pointer-events-none">
                            <Mandala size="sm" />
                        </div>
                        <p className="text-[10px] font-bold text-saffron uppercase tracking-[0.25em] mb-3 flex items-center gap-2 relative z-10">
                            <div className="w-1.5 h-1.5 bg-saffron rounded-full" />
                            Second Brain Protocol
                        </p>
                        <p className="text-xs text-silver leading-relaxed relative z-10">
                            ARROS evolves with every realization. Use the <span className="text-saffron font-bold uppercase tracking-tight">"Continue my research"</span> feature to build upon established Sutras and deepen the Council's perspective on any topic.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export default DashboardPage;
