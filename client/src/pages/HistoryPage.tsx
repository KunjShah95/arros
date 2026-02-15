import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Trash2,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { Card, Button, Badge, Input } from '../components/ui';
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
    try {
      const mockSessions: Session[] = [
        {
          id: '1',
          userId: '1',
          title: 'Compare React vs Vue for enterprise apps',
          query: 'Compare React vs Vue for enterprise apps',
          status: 'completed',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: '2',
          userId: '1',
          title: 'How does GPT-4 work under the hood',
          query: 'How does GPT-4 work under the hood',
          status: 'completed',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: '3',
          userId: '1',
          title: 'Best practices for API design in 2025',
          query: 'Best practices for API design in 2025',
          status: 'completed',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
        {
          id: '4',
          userId: '1',
          title: 'Explain quantum computing for beginners',
          query: 'Explain quantum computing for beginners',
          status: 'completed',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        },
        {
          id: '5',
          userId: '1',
          title: 'Rust vs Go for microservices',
          query: 'Rust vs Go for microservices',
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
    .filter(session => {
      const matchesSearch = (session.title || session.query || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    failed: sessions.filter(s => s.status === 'failed').length,
  };

  const groupedByDate = filteredSessions.reduce((groups, session) => {
    const date = new Date(session.updatedAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else {
      key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(session);
    return groups;
  }, {} as Record<string, Session[]>);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">History</h2>
          <p className="text-text-muted">Your past research sessions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
              <p className="text-sm text-text-muted">Total Research</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.completed}</p>
              <p className="text-sm text-text-muted">Completed</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.failed}</p>
              <p className="text-sm text-text-muted">Failed</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'completed', 'failed'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Search className="w-12 h-12 text-text-muted mb-4" />
            <p className="text-text-muted">No research sessions found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDate).map(([dateGroup, groupSessions]) => (
              <div key={dateGroup}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-text-muted" />
                  <h3 className="text-sm font-medium text-text-muted">{dateGroup}</h3>
                </div>
                <div className="space-y-2">
                  {groupSessions.map((session, index) => (
                    <SessionCard key={session.id} session={session} index={index} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({ session, index }: { session: Session; index: number }) {
  const timeAgo = formatTimeAgo(new Date(session.updatedAt));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="p-4 hover:border-primary/30 transition-colors group">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {session.status === 'completed' ? (
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
              )}
              <h3 className="font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                {session.title || session.query}
              </h3>
            </div>
            <p className="text-sm text-text-muted">{timeAgo}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={session.status === 'completed' ? 'success' : 'error'}>
              {session.status}
            </Badge>
            <Button variant="ghost" size="sm">
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Trash2 className="w-4 h-4" />
            </Button>
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
