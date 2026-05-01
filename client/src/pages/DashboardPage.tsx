import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Clock,
    CheckCircle2,
    TrendingUp,
    Plus,
    History as HistoryIcon,
    Sparkles,
    GraduationCap,
    ArrowRight,
} from 'lucide-react';
import { Card, Button, Badge, cn } from '../components/ui';
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
        <div className="h-full overflow-y-auto p-4 md:p-6 bg-[var(--color-bg-primary)]">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--color-accent)] flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Academic Sanctuary</h2>
                        <p className="text-xs text-[var(--color-text-muted)]">Research cockpit</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        <span className="font-medium text-[var(--color-text-primary)]">{stats.total}</span> sessions
                    </p>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => onViewChange?.('workspace')}
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        New Research
                    </Button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 md:mb-8">
                {[
                    { label: 'Total Research', value: stats.total, icon: BookOpen, color: 'text-[var(--color-accent)]' },
                    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-[var(--color-success)]' },
                    { label: 'Topics', value: stats.topics, icon: TrendingUp, color: 'text-[var(--color-text-secondary)]' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="p-4 md:p-5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center gap-3">
                            <div className={cn("w-10 h-10 flex items-center justify-center bg-[var(--color-bg-tertiary)]", stat.color)}>
                                <stat.icon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-[var(--color-text-primary)]">{stat.value}</p>
                                <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">{stat.label}</p>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 md:gap-8">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <HistoryIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                            <h3 className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Recent Research</h3>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => onViewChange?.('history')}>
                            View All
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-32 py-8">
                                <div className="animate-spin w-6 h-6 border-2 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full mb-3" />
                                <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Loading...</span>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="p-8 text-center bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                                <BookOpen className="w-8 h-8 text-[var(--color-text-muted)]/30 mx-auto mb-3" />
                                <p className="text-sm text-[var(--color-text-secondary)]">No research yet</p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">Start your first research to see it here</p>
                            </div>
                        ) : (
                            sessions.map((session, index) => (
                                <motion.div
                                    key={session.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] group hover:border-[var(--color-accent)]/30 transition-all">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full shrink-0",
                                                        session.status === 'completed' ? "bg-[var(--color-success)]" : "bg-[var(--color-accent)]"
                                                    )} />
                                                    <h4 className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent)] transition-colors">
                                                        {session.title || session.query}
                                                    </h4>
                                                </div>
                                                <p className="text-xs text-[var(--color-text-muted)] truncate ml-3.5">{session.query}</p>
                                                <div className="flex items-center gap-3 mt-2 ml-3.5">
                                                    <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatTimeAgo(new Date(session.updatedAt))}
                                                    </span>
                                                    <Badge 
                                                        variant={session.status === 'completed' ? 'default' : 'outline'} 
                                                        className="text-[9px] px-1.5 py-0"
                                                    >
                                                        {session.status}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleContinueResearch(session.query || session.title || '')}
                                            >
                                                Continue
                                                <ArrowRight className="w-3 h-3 ml-1" />
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                            <h3 className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Quick Start</h3>
                        </div>
                        <div className="space-y-2">
                            {recentTopicSuggestions.map((topic, i) => (
                                <motion.button
                                    key={topic}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="w-full text-left p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-all flex items-center justify-between group"
                                    onClick={() => {
                                        onViewChange?.('workspace');
                                        setTimeout(() => onStartResearch?.(topic), 100);
                                    }}
                                >
                                    <span className="text-xs text-[var(--color-text-secondary)] truncate pr-3 group-hover:text-[var(--color-text-primary)]">{topic}</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] shrink-0" />
                                </motion.button>
                            ))}
                        </div>
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