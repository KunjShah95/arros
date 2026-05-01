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
import { Card, Button, Badge, Input, cn } from '../components/ui';
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
    <div className="h-full overflow-y-auto no-scrollbar scroll-smooth p-3 md:p-6 pb-24 md:pb-20" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-6xl mx-auto py-3 md:py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-5 md:p-6" variant="elevated">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1A1A1A', color: '#FAFAFA' }}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold" style={{ color: '#1A1A1A' }}>Anubhav Ledger</h1>
                    <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: '#666' }}>Historical Research Records</p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: '#666', maxWidth: '400px' }}>
                  Your journey through the collective consciousness. Every realization is indexed for future wisdom.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="px-5 py-3 rounded-lg" style={{ backgroundColor: '#F5F5F5', border: '1px solid #E0E0E0' }}>
                  <p className="text-[9px] uppercase font-bold tracking-widest mb-1" style={{ color: '#666' }}>Completed</p>
                  <p className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>{stats.completed}</p>
                </div>
                <div className="px-5 py-3 rounded-lg" style={{ backgroundColor: '#F5F5F5', border: '1px solid #E0E0E0' }}>
                  <p className="text-[9px] uppercase font-bold tracking-widest mb-1" style={{ color: '#666' }}>Failed</p>
                  <p className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>{stats.failed}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Filters */}
        <div className="grid lg:grid-cols-[1fr_auto] gap-3 md:gap-4 mb-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#666' }} />
            <Input
              type="text"
              placeholder="Search the ledger of realizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4"
            />
          </div>

          <div className="flex gap-2">
            {['all', 'completed', 'failed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-4 md:px-6 min-h-[44px] py-3 rounded-lg font-medium text-sm transition-all",
                  filterStatus === status
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                )}
              >
                {status === 'all' ? 'All' : status === 'completed' ? 'Completed' : 'Failed'}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <p className="text-sm" style={{ color: '#666' }}>Loading sessions...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-20 text-center rounded-xl flex flex-col items-center" style={{ backgroundColor: '#F5F5F5' }}>
              <BookOpen className="w-12 h-12 mb-6" style={{ color: '#CCC' }} />
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>The Ledger is Empty</h3>
              <p className="text-sm" style={{ color: '#666', maxWidth: '300px' }}>No research matching your filters was found in this dimension.</p>
            </div>
          ) : (
            Object.entries(groupedByDate).map(([dateGroup, groupSessions]) => (
              <div key={dateGroup} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-[10px] uppercase tracking-[0.4em] font-bold" style={{ color: '#999' }}>{dateGroup}</span>
                  <div className="h-px flex-1 bg-gray-200" />
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
        window.dispatchEvent(new CustomEvent('arros:research', { detail: { query: session.query } }));
      }}
    >
      <Card className="p-5 transition-all cursor-pointer h-full flex flex-col" variant="elevated">
        <div className="flex justify-between items-start mb-4">
          <Badge
            variant={session.status === 'completed' ? 'success' : 'warning'}
            className="text-[9px] px-2"
          >
            {session.status === 'completed' ? 'Completed' : 'Failed'}
          </Badge>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all" style={{ borderColor: '#E0E0E0', color: '#666' }}>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all" style={{ borderColor: '#E0E0E0', color: '#666' }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <h3 className="text-base font-semibold mb-2 leading-snug line-clamp-2" style={{ color: '#1A1A1A' }}>
          {session.title || session.query}
        </h3>

        <div className="mt-auto pt-4 flex items-center justify-between border-t" style={{ borderColor: '#E0E0E0' }}>
          <div className="flex items-center gap-2" style={{ color: '#666' }}>
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-bold tracking-widest">{timeAgo}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#1A1A1A' }}>
            View <ArrowRight className="w-3 h-3" />
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
