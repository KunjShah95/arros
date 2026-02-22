import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ExternalLink,
  Calendar,
  Filter,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { Card, Button, Badge, Input, SanskritButton, Mandala, cn } from '../components/ui';
import { researchApi } from '../services/api';
import type { Session } from '../types';

export function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      // In a real app we'd use: const data = await researchApi.getSessions('user-id');
      // For now using themed mock data
      const mockSessions: Session[] = [
        {
          id: '1',
          userId: '1',
          title: 'Vedic Philosophy vs Western Existentialism',
          query: 'Vedic Philosophy vs Western Existentialism',
          status: 'completed',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: '2',
          userId: '1',
          title: 'Quantum Entanglement in Dravidian Cosmology',
          query: 'Quantum Entanglement in Dravidian Cosmology',
          status: 'completed',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: '3',
          userId: '1',
          title: 'Linguistic Evolution of Proto-Indo-Aryan',
          query: 'Linguistic Evolution of Proto-Indo-Aryan',
          status: 'completed',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
        {
          id: '4',
          userId: '1',
          title: 'Harappan Urban Planning Systems',
          query: 'Harappan Urban Planning Systems',
          status: 'completed',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        },
        {
          id: '5',
          userId: '1',
          title: 'Metallurgy in Ancient South India',
          query: 'Metallurgy in Ancient South India',
          status: 'failed',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        },
      ];
      setSessions(mockSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions
    .filter((session) => {
      const matchesSearch = (session.title || session.query || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const stats = {
    total: sessions.length,
    completed: sessions.filter((s) => s.status === 'completed').length,
    failed: sessions.filter((s) => s.status === 'failed').length,
  };

  const groupedByDate = filteredSessions.reduce((groups, session) => {
    const date = new Date(session.updatedAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = 'Prarambh (Today)';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Gat-Kal (Yesterday)';
    } else {
      key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(session);
    return groups;
  }, {} as Record<string, Session[]>);

  return (
    <div className="h-full overflow-y-auto no-scrollbar scroll-smooth p-6 pb-20">
      <div className="max-w-6xl mx-auto py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="cut-card cut-border bg-graphite/40 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 -mr-16 -mt-16 opacity-5 pointer-events-none">
              <Mandala size="md" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 cut-card bg-saffron/10 flex items-center justify-center border border-saffron/20 text-saffron">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-display font-bold text-white tracking-tight">Anubhav Ledger</h1>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-saffron font-bold">Historical Research Records</p>
                  </div>
                </div>
                <p className="text-sm text-silver max-w-xl leading-relaxed">
                  Your journey through the collective consciousness. Every realization is indexed for future wisdom.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="px-5 py-3 cut-card bg-void border border-smoke/30">
                  <p className="text-[9px] uppercase font-bold text-ash tracking-widest mb-1">Satya (Realized)</p>
                  <p className="text-lg font-display font-bold text-peacock">{stats.completed}</p>
                </div>
                <div className="px-5 py-3 cut-card bg-void border border-smoke/30">
                  <p className="text-[9px] uppercase font-bold text-ash tracking-widest mb-1">Mithya (Failed)</p>
                  <p className="text-lg font-display font-bold text-saffron">{stats.failed}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="grid lg:grid-cols-[1fr_auto] gap-4 mb-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ash group-focus-within:text-saffron transition-colors" />
            <input
              type="text"
              placeholder="Search the ledger of realizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate/40 border border-smoke/30 rounded-xl text-chalk placeholder:text-ash/40 focus:outline-none focus:border-saffron/50 transition-all font-body text-sm"
            />
          </div>

          <div className="flex gap-2">
            {['all', 'completed', 'failed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-6 py-4 rounded-xl font-display font-bold text-[10px] uppercase tracking-widest transition-all cut-card",
                  filterStatus === status
                    ? 'bg-saffron text-void shadow-lg shadow-saffron/20'
                    : 'bg-slate/40 text-ash hover:text-silver border border-smoke/20'
                )}
              >
                {status === 'all' ? 'Universal' : status === 'completed' ? 'Satya' : 'Mithya'}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <Mandala className="w-16 h-16 animate-[spin_10s_linear_infinite] opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-saffron rounded-full animate-ping" />
                </div>
              </div>
              <p className="text-[10px] uppercase font-bold text-ash tracking-[0.3em]">Revealing Past Truths...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-20 text-center cut-card cut-border bg-graphite/20 flex flex-col items-center">
              <BookOpen className="w-12 h-12 text-ash/30 mb-6" />
              <h3 className="text-xl font-display font-bold text-ash mb-2">The Ledger is Empty</h3>
              <p className="text-sm text-ash/60 max-w-xs">No research matching your filters was found in this dimension.</p>
            </div>
          ) : (
            Object.entries(groupedByDate).map(([dateGroup, groupSessions]) => (
              <div key={dateGroup} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-smoke/20" />
                  <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-ash/60">{dateGroup}</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-smoke/20" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupSessions.map((session, index) => (
                    <SessionCard key={session.id} session={session} index={index} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SessionCard({ session, index }: { session: Session; index: number }) {
  const timeAgo = formatTimeAgo(new Date(session.updatedAt));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group"
      onClick={() => {
        // Dispatch custom event to trigger research in parent
        window.dispatchEvent(new CustomEvent('arros:research', { detail: { query: session.query } }));
      }}
    >
      <Card className="p-5 cut-card border-smoke/30 bg-graphite/40 hover:border-saffron/40 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-saffron/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex justify-between items-start mb-4">
          <Badge
            variant={session.status === 'completed' ? 'peacock' : 'saffron'}
            className="text-[9px] px-2"
          >
            {session.status === 'completed' ? 'SATYA (VERIFIED)' : 'MITHYA (FAILED)'}
          </Badge>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-lg bg-void border border-smoke/30 flex items-center justify-center text-ash hover:text-gold hover:border-gold/50 transition-all">
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 rounded-lg bg-void border border-smoke/30 flex items-center justify-center text-ash hover:text-saffron hover:border-saffron/50 transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <h3 className="text-base font-display font-bold text-white group-hover:text-saffron transition-colors mb-2 leading-snug line-clamp-2">
          {session.title || session.query}
        </h3>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-smoke/10">
          <div className="flex items-center gap-2 text-ash">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-bold tracking-widest">{timeAgo}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-saffron tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            Re-materialize <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </Card>
    </motion.div>
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
