import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Github,
  BookOpen,
  Globe,
  Search,
  Star,
  TrendingUp,
  Filter,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Card, Button, Badge, Input, cn } from '../components/ui';
import type { Source } from '../types';

const sourceTypeIcons: Record<string, React.ElementType> = {
  web: Globe,
  paper: FileText,
  github: Github,
  blog: BookOpen,
};

const sourceTypeColors: Record<string, string> = {
  web: 'text-peacock',
  paper: 'text-saffron',
  github: 'text-silver',
  blog: 'text-gold',
};

export function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'reliability'>('recent');

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    setLoading(true);
    try {
      const mockSources: Source[] = [
        {
          id: '1',
          sessionId: '1',
          type: 'paper',
          title: 'Foundational Principles of Vedic Robotics',
          url: 'https://arxiv.org/abs/2303.08774',
          content: 'A comprehensive study on the integration of dharma-based decision making in autonomous systems...',
          reliability: 0.98,
          bias: 0.05,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          sessionId: '1',
          type: 'paper',
          title: 'Attention in Ancient Linguistic Structures',
          url: 'https://arxiv.org/abs/1706.03762',
          content: 'Analyzing recursive parsing techniques in Paninian grammar as a precursor to modern self-attention...',
          reliability: 0.99,
          bias: 0,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          sessionId: '1',
          type: 'github',
          title: 'arros-core/veda-engine',
          url: 'https://github.com/arros-core/veda-engine',
          content: 'State-of-the-art multilingual knowledge synthesis engine for Indian languages...',
          reliability: 0.94,
          bias: 0,
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          sessionId: '1',
          type: 'blog',
          title: 'The Future of AI is Multimodal and Indic',
          url: 'https://dev.arros.ai/blog/multimodal-indic',
          content: 'How Sarvam AI and ARROS are rebuilding the digital architecture of India...',
          reliability: 0.91,
          bias: 0.1,
          createdAt: new Date().toISOString(),
        },
      ];
      setSources(mockSources);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSources = sources
    .filter((source) => {
      const matchesSearch = source.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.content?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || source.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'reliability') {
        return (b.reliability || 0) - (a.reliability || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const avgReliability = sources.length > 0
    ? sources.reduce((sum, s) => sum + (s.reliability || 0), 0) / sources.length
    : 0;

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
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold" style={{ color: '#1A1A1A' }}>Evidence Ledger</h1>
                    <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: '#666' }}>Verified Knowledge Sources</p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: '#666', maxWidth: '400px' }}>
                  Every realization in ARROS is backed by verified evidence. Review the foundations of your synthesized insights.
                </p>
              </div>

              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-[9px] uppercase font-bold tracking-widest mb-1" style={{ color: '#666' }}>Satya Index</p>
                  <p className="text-2xl font-semibold" style={{ color: '#1A1A1A' }}>{(avgReliability * 100).toFixed(0)}%</p>
                </div>
                <div className="w-px h-10 bg-gray-200 my-auto" />
                <div className="text-center">
                  <p className="text-[9px] uppercase font-bold tracking-widest mb-1" style={{ color: '#666' }}>Evidence Depth</p>
                  <p className="text-2xl font-semibold" style={{ color: '#1A1A1A' }}>{sources.length}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Filters */}
        <div className="grid lg:grid-cols-[1fr_auto_auto] gap-3 md:gap-4 mb-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#666' }} />
            <Input
              type="text"
              placeholder="Search across the evidence matrix..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 md:px-6 min-h-[44px] py-3 rounded-lg border text-sm"
            style={{ backgroundColor: '#FAFAFA', borderColor: '#E0E0E0', color: '#1A1A1A' }}
          >
            <option value="all">All Sources</option>
            <option value="web">Web</option>
            <option value="paper">Papers</option>
            <option value="github">Code</option>
            <option value="blog">Blogs</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 md:px-6 min-h-[44px] py-3 rounded-lg border text-sm"
            style={{ backgroundColor: '#FAFAFA', borderColor: '#E0E0E0', color: '#1A1A1A' }}
          >
            <option value="recent">Recent</option>
            <option value="reliability">Trust</option>
          </select>
        </div>

        {/* Sources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
              <p className="text-sm" style={{ color: '#666' }}>Loading sources...</p>
            </div>
          ) : filteredSources.length === 0 ? (
            <div className="col-span-full py-20 text-center rounded-xl" style={{ backgroundColor: '#F5F5F5' }}>
              <FileText className="w-12 h-12 mx-auto mb-6" style={{ color: '#CCC' }} />
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>No evidence found</h3>
              <p className="text-sm" style={{ color: '#666' }}>The requested knowledge capsule does not exist in our indices.</p>
            </div>
          ) : (
            filteredSources.map((source, index) => (
              <SourceCard key={source.id} source={source} index={index} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SourceCard({ source, index }: { source: Source; index: number }) {
  const [copied, setCopied] = useState(false);
  const Icon = sourceTypeIcons[source.type] || Globe;
  const colorClass = sourceTypeColors[source.type] || 'text-gray-500';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(source.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="group h-full"
    >
      <Card className="p-6 flex flex-col h-full" variant="elevated">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorClass)} style={{ backgroundColor: '#F5F5F5', border: '1px solid #E0E0E0' }}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="neutral" className="text-[9px] px-2 py-0.5">
              {Math.round((source.reliability || 0) * 100)}% Reliable
            </Badge>
            {source.bias && source.bias > 0.3 && (
              <Badge variant="warning" className="text-[9px] px-2 py-0.5">Bias Alert</Badge>
            )}
          </div>
        </div>

        <h3 className="text-base font-semibold mb-2 line-clamp-2 leading-tight" style={{ color: '#1A1A1A' }}>
          {source.title}
        </h3>

        <p className="text-xs font-mono truncate mb-4" style={{ color: '#888' }}>
          {source.url.replace('https://', '')}
        </p>

        <div className="p-3 rounded-lg mb-6 flex-1" style={{ backgroundColor: '#F5F5F5' }}>
          <p className="text-xs leading-relaxed line-clamp-3" style={{ color: '#666' }}>
            "{source.content?.slice(0, 150)}..."
          </p>
        </div>

        <div className="mt-auto pt-4 border-t flex items-center justify-between" style={{ borderColor: '#E0E0E0' }}>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="p-2 rounded-lg border transition-all"
              style={{ borderColor: '#E0E0E0', color: '#666' }}
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={source.url}
              target="_blank"
              className="p-2 rounded-lg border transition-all"
              style={{ borderColor: '#E0E0E0', color: '#666' }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <Button variant="ghost" size="sm" className="px-3 py-1.5 h-auto text-[9px] gap-2">
            Explore <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

const Spinner = ({ className, size = 'md', variant = 'peacock' }: { className?: string, size?: 'sm' | 'md' | 'lg', variant?: string }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';

  return (
    <div className={cn("animate-spin rounded-full border-2 border-t-transparent", sizeClass, className)} style={{ borderColor: '#1A1A1A' }} />
  );
};
