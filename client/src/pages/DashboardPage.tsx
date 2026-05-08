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
    'Literature review on attention mechanisms in LLMs',
    'Systematic review of neural networks in healthcare',
    'Survey of reinforcement learning algorithms',
    'Compare transformer architectures in NLP tasks',
    'Applications of graph neural networks',
];

const mockCorpora = [
    { id: '1', name: 'NLP Papers', paperCount: 47, lastUpdated: '2h ago' },
    { id: '2', name: 'Thesis Sources', paperCount: 23, lastUpdated: '1d ago' },
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
        hoursSaved: (sessions.length * 2.5).toFixed(1),
    };

    const handleContinueResearch = (query: string) => {
        if (onViewChange) onViewChange('workspace');
        if (onStartResearch) {
            setTimeout(() => onStartResearch(`Continue my research on: ${query}`), 100);
        }
    };

    return (
        <div className="h-full overflow-y-auto p-4 md:p-6 bg-[#FAFAF5]">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-white border border-[#E5E5E0]"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#2D4A6F] flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[#1A1A2E]">Academic Sanctuary</h2>
                        <p className="text-xs text-[#6B7B6B]">Research cockpit for CS/Engineering</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <p className="text-sm text-[#6B7B6B]">
                        <span className="font-medium text-[#1A1A2E]">{stats.total}</span> sessions
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

            {/* Academic Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 md:mb-8">
                {[
                    { label: 'Total Research', value: stats.total, icon: BookOpen, color: 'text-[#2D4A6F]' },
                    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-[#2E7D32]' },
                    { label: 'Hours Saved', value: `${stats.hoursSaved}h`, icon: Clock, color: 'text-[#F57C00]' },
                    { label: 'Citations', value: '127', icon: TrendingUp, color: 'text-[#6B7B6B]' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="p-4 md:p-5 bg-white border border-[#E5E5E0] flex items-center gap-3">
                            <div className={cn("w-10 h-10 flex items-center justify-center bg-[#FAFAF5]", stat.color)}>
                                <stat.icon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-[#1A1A2E]">{stat.value}</p>
                                <p className="text-[10px] text-[#6B7B6B] uppercase tracking-wider">{stat.label}</p>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 md:gap-8">
                <div>
                    {/* Recent Research */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <HistoryIcon className="w-4 h-4 text-[#6B7B6B]" />
                            <h3 className="text-xs font-medium text-[#6B7B6B] uppercase tracking-wider">Recent Research</h3>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => onViewChange?.('history')}>
                            View All
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-32 py-8">
                                <div className="animate-spin w-6 h-6 border-2 border-[#E5E5E0] border-t-[#2D4A6F] rounded-full mb-3" />
                                <span className="text-[10px] text-[#6B7B6B] uppercase tracking-wider">Loading...</span>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="p-8 text-center bg-white border border-[#E5E5E0]">
                                <BookOpen className="w-8 h-8 text-[#6B7B6B]/30 mx-auto mb-3" />
                                <p className="text-sm text-[#6B7B6B]">No research yet</p>
                                <p className="text-xs text-[#6B7B6B] mt-1">Start your first research to see it here</p>
                            </div>
                        ) : (
                            sessions.map((session, index) => (
                                <motion.div
                                    key={session.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="p-4 bg-white border border-[#E5E5E0] group hover:border-[#2D4A6F]/30 transition-all">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full shrink-0",
                                                        session.status === 'completed' ? "bg-[#2E7D32]" : "bg-[#2D4A6F]"
                                                    )} />
                                                    <h4 className="text-sm font-medium text-[#1A1A2E] truncate group-hover:text-[#2D4A6F] transition-colors">
                                                        {session.title || session.query}
                                                    </h4>
                                                </div>
                                                <p className="text-xs text-[#6B7B6B] truncate ml-3.5">{session.query}</p>
                                                <div className="flex items-center gap-3 mt-2 ml-3.5">
                                                    <span className="text-[10px] text-[#6B7B6B] flex items-center gap-1">
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
                    {/* Quick Start */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-4 h-4 text-[#2D4A6F]" />
                            <h3 className="text-xs font-medium text-[#6B7B6B] uppercase tracking-wider">Quick Start</h3>
                        </div>
                        <div className="space-y-2">
                            {recentTopicSuggestions.map((topic, i) => (
                                <motion.button
                                    key={topic}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="w-full text-left p-3 bg-white border border-[#E5E5E0] hover:border-[#2D4A6F]/30 transition-all flex items-center justify-between group"
                                    onClick={() => {
                                        onViewChange?.('workspace');
                                        setTimeout(() => onStartResearch?.(topic), 100);
                                    }}
                                >
                                    <span className="text-xs text-[#6B7B6B] truncate pr-3 group-hover:text-[#1A1A2E]">{topic}</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-[#6B7B6B] group-hover:text-[#2D4A6F] shrink-0" />
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Corpus Library */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-[#2D4A6F]" />
                                <h3 className="text-xs font-medium text-[#6B7B6B] uppercase tracking-wider">My Libraries</h3>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => onViewChange?.('corpus')}>
                                + New
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {mockCorpora.map((corpus) => (
                                <Card 
                                    key={corpus.id} 
                                    className="p-4 bg-white border border-[#E5E5E0] hover:border-[#2D4A6F]/30 cursor-pointer transition-all"
                                    onClick={() => onViewChange?.('corpus')}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-sm font-medium text-[#1A1A2E]">{corpus.name}</h4>
                                            <p className="text-xs text-[#6B7B6B] mt-1">{corpus.paperCount} papers</p>
                                        </div>
                                        <Badge variant="outline" className="text-[9px]">{corpus.lastUpdated}</Badge>
                                    </div>
                                </Card>
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
