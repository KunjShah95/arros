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
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
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
    { name: 'Planner', icon: Brain, color: 'text-flame', description: 'Creates academic research plan' },
    { name: 'Web Agent', icon: Search, color: 'text-electric', description: 'Searches web sources' },
    { name: 'Scholar Agent', icon: FileText, color: 'text-mint', description: 'Finds academic papers' },
    { name: 'Critic', icon: CheckCircle2, color: 'text-warning', description: 'Verifies & scores sources' },
    { name: 'Synthesizer', icon: Sparkles, color: 'text-flame', description: 'Writes academic report' },
];

export function DashboardPage({ onStartResearch, onViewChange }: DashboardProps) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            // Try to load real sessions; fall back to demo data for MVP
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
        <div className="h-full overflow-y-auto p-6">
            {/* Welcome header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="cut-card cut-border bg-graphite/60 p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 cut-card bg-flame flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-void" />
                        </div>
                        <div>
                            <h2 className="text-xl font-display text-chalk">ARROS Dashboard</h2>
                            <p className="text-xs text-ash uppercase tracking-[0.2em]">Academic Research OS</p>
                        </div>
                    </div>
                    <p className="text-sm text-silver">
                        Your personal research assistant with memory. Every session builds on the last.
                    </p>
                </div>
                <Button
                    variant="electric"
                    size="sm"
                    className="gap-2 flex-shrink-0"
                    onClick={() => onViewChange?.('workspace')}
                >
                    <Plus className="w-4 h-4" />
                    New Research
                </Button>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total Sessions', value: stats.total, icon: BookOpen, color: 'bg-electric/10 text-electric' },
                    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'bg-mint/10 text-mint' },
                    { label: 'Topics Explored', value: stats.topics, icon: TrendingUp, color: 'bg-flame/10 text-flame' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="p-4 cut-card cut-border">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 cut-card flex items-center justify-center ${stat.color}`}>
                                    <stat.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-2xl font-display text-chalk">{stat.value}</p>
                                    <p className="text-xs text-ash">{stat.label}</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
                {/* Past Sessions */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-xs text-ash uppercase tracking-[0.2em]">
                            <Clock className="w-4 h-4" />
                            Recent Research
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => onViewChange?.('history')}>
                            View all
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin w-6 h-6 border-2 border-flame border-t-transparent rounded-full" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="cut-card cut-border bg-slate/60 p-8 text-center">
                            <BookOpen className="w-8 h-8 text-ash mx-auto mb-3" />
                            <p className="text-ash text-sm">No research sessions yet.</p>
                            <p className="text-xs text-ash/70 mt-1">Start your first research session above.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map((session, index) => (
                                <motion.div
                                    key={session.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.06 }}
                                >
                                    <Card className="p-4 cut-card cut-border hover:border-flame/40 transition-colors group">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {session.status === 'completed' ? (
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-mint flex-shrink-0" />
                                                    ) : (
                                                        <AlertCircle className="w-3.5 h-3.5 text-error flex-shrink-0" />
                                                    )}
                                                    <h3 className="text-sm font-medium text-chalk truncate group-hover:text-flame transition-colors">
                                                        {session.title || session.query}
                                                    </h3>
                                                </div>
                                                <p className="text-xs text-ash truncate pl-5">{session.query}</p>
                                                <p className="text-xs text-ash/60 pl-5 mt-1">{formatTimeAgo(new Date(session.updatedAt))}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Badge variant={session.status === 'completed' ? 'success' : 'error'}>
                                                    {session.status}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs gap-1"
                                                    onClick={() => handleContinueResearch(session.query || session.title || '')}
                                                >
                                                    Continue
                                                    <ArrowRight className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right panel */}
                <div className="space-y-5">
                    {/* Agent Society status */}
                    <div>
                        <div className="text-xs text-ash uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            Agent Society
                        </div>
                        <Card className="cut-card cut-border p-4">
                            <div className="space-y-3">
                                {agentStatuses.map((agent) => (
                                    <div key={agent.name} className="flex items-center gap-3">
                                        <div className="w-7 h-7 cut-card bg-slate/80 flex items-center justify-center flex-shrink-0">
                                            <agent.icon className={`w-3.5 h-3.5 ${agent.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-chalk">{agent.name}</div>
                                            <div className="text-[10px] text-ash">{agent.description}</div>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-mint/60 flex-shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Quick start suggestions */}
                    <div>
                        <div className="text-xs text-ash uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Quick Start Topics
                        </div>
                        <div className="space-y-2">
                            {recentTopicSuggestions.slice(0, 4).map((topic) => (
                                <button
                                    key={topic}
                                    className="w-full text-left cut-card cut-border bg-slate/50 px-4 py-2.5 text-xs text-silver hover:text-chalk hover:border-flame/30 transition-colors flex items-center justify-between group"
                                    onClick={() => {
                                        onViewChange?.('workspace');
                                        setTimeout(() => onStartResearch?.(topic), 100);
                                    }}
                                >
                                    <span className="truncate">{topic}</span>
                                    <ArrowRight className="w-3 h-3 text-ash group-hover:text-flame transition-colors flex-shrink-0 ml-2" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Memory indicator */}
                    <div className="cut-card cut-border bg-graphite/50 p-4">
                        <div className="flex items-center gap-2 text-xs text-ash uppercase tracking-[0.2em] mb-3">
                            <Brain className="w-3.5 h-3.5 text-electric" />
                            Memory Layer
                        </div>
                        <p className="text-xs text-silver leading-relaxed">
                            ARROS remembers your past research topics, preferred depth, and key concepts.
                            Use <span className="text-flame font-medium">"Continue my research on..."</span> to pick up where you left off.
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
