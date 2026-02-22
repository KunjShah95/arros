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
import { Card, Button, Badge, Input, SanskritButton, Mandala, cn } from '../components/ui';
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
    <div className="h-full overflow-y-auto no-scrollbar scroll-smooth p-3 md:p-6 pb-24 md:pb-20 aurora-surface">
      <div className="max-w-6xl mx-auto py-3 md:py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="cut-card cut-border glass-premium p-5 md:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 -mr-16 -mt-16 opacity-5 pointer-events-none">
              <Mandala size="md" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 cut-card bg-gold/10 flex items-center justify-center border border-gold/20 text-gold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-display font-bold text-white tracking-tight">Evidence Ledger</h1>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Verified Knowledge Sources</p>
                  </div>
                </div>
                <p className="text-sm text-silver max-w-xl leading-relaxed">
                  Every realization in ARROS is backed by verified evidence. Review the foundations of your synthesized insights.
                </p>
              </div>

              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-[9px] uppercase font-bold text-ash tracking-widest mb-1">Satya Index</p>
                  <p className="text-2xl font-display font-bold text-gold">{(avgReliability * 100).toFixed(0)}%</p>
                </div>
                <div className="w-px h-10 bg-smoke/20 my-auto" />
                <div className="text-center">
                  <p className="text-[9px] uppercase font-bold text-ash tracking-widest mb-1">Evidence Depth</p>
                  <p className="text-2xl font-display font-bold text-peacock">{sources.length}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="grid lg:grid-cols-[1fr_auto_auto] gap-3 md:gap-4 mb-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ash group-focus-within:text-gold transition-colors" />
            <input
              type="text"
              placeholder="Search across the evidence matrix..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] pl-12 pr-4 py-4 bg-slate/40 border border-smoke/30 rounded-xl text-chalk placeholder:text-ash/40 focus:outline-none focus:border-gold/50 transition-all font-body text-sm"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 md:px-6 min-h-[44px] py-3 bg-void border border-smoke/30 rounded-xl text-chalk text-[10px] uppercase font-bold tracking-widest focus:border-gold/50 transition-all"
          >
            <option value="all">Universal Source</option>
            <option value="web">Loka (Web)</option>
            <option value="paper">Grantha (Papers)</option>
            <option value="github">Kriti (Code)</option>
            <option value="blog">Varta (Blogs)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 md:px-6 min-h-[44px] py-3 bg-void border border-smoke/30 rounded-xl text-chalk text-[10px] uppercase font-bold tracking-widest focus:border-gold/50 transition-all"
          >
            <option value="recent">Navya (Recent)</option>
            <option value="reliability">Vishvasya (Trust)</option>
          </select>
        </div>

        {/* Sources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
              <Spinner variant="gold" size="md" />
              <p className="text-[10px] uppercase font-bold text-ash tracking-[0.3em]">Querying the Akasha...</p>
            </div>
          ) : filteredSources.length === 0 ? (
            <div className="col-span-full py-20 text-center cut-card cut-border bg-graphite/20">
              <FileText className="w-12 h-12 text-ash/30 mx-auto mb-6" />
              <h3 className="text-xl font-display font-bold text-ash mb-2">No evidence found</h3>
              <p className="text-sm text-ash/60">The requested knowledge capsule does not exist in our indices.</p>
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
  const colorClass = sourceTypeColors[source.type] || 'text-silver';

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
      <Card className="p-6 cut-card border-smoke/30 bg-graphite/40 hover:border-gold/40 transition-all flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("w-10 h-10 cut-card bg-void border border-smoke/30 flex items-center justify-center", colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="gold" className="text-[9px] px-2 py-0.5">
              {Math.round((source.reliability || 0) * 100)}% RELIABLE
            </Badge>
            {source.bias && source.bias > 0.3 && (
              <Badge variant="saffron" className="text-[9px] px-2 py-0.5">BIAS ALERT</Badge>
            )}
          </div>
        </div>

        <h3 className="text-base font-display font-bold text-white group-hover:text-gold transition-colors mb-2 line-clamp-2 leading-tight">
          {source.title}
        </h3>

        <p className="text-xs text-ash font-mono truncate mb-4 opacity-60">
          {source.url.replace('https://', '')}
        </p>

        <div className="bg-void/40 p-3 rounded-lg border border-smoke/10 mb-6 flex-1">
          <p className="text-xs text-silver leading-relaxed line-clamp-3 italic">
            "{source.content?.slice(0, 150)}..."
          </p>
        </div>

        <div className="mt-auto pt-4 border-t border-smoke/10 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="p-2 rounded-lg bg-void border border-smoke/30 text-ash hover:text-gold hover:border-gold/40 transition-all"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={source.url}
              target="_blank"
              className="p-2 rounded-lg bg-void border border-smoke/30 text-ash hover:text-peacock hover:border-peacock/40 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <SanskritButton variant="ghost" className="px-3 py-1.5 h-auto text-[9px] gap-2 border-none">
            Explore Depth <ArrowRight className="w-3 h-3" />
          </SanskritButton>
        </div>
      </Card>
    </motion.div>
  );
}

const Spinner = ({ className, size = 'md', variant = 'peacock' }: { className?: string, size?: 'sm' | 'md' | 'lg', variant?: string }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  const colorClass = variant === 'saffron' ? 'border-saffron' : variant === 'gold' ? 'border-gold' : 'border-peacock';

  return (
    <div className={cn("animate-spin rounded-full border-2 border-t-transparent", sizeClass, colorClass, className)} />
  );
};
