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
} from 'lucide-react';
import { Card, Button, Badge, Input } from '../components/ui';
import type { Source } from '../types';

const sourceTypeIcons: Record<string, React.ElementType> = {
  web: Globe,
  paper: FileText,
  github: Github,
  blog: BookOpen,
};

const sourceTypeColors: Record<string, string> = {
  web: 'bg-electric/10 text-electric',
  paper: 'bg-flame/10 text-flame',
  github: 'bg-graphite text-chalk',
  blog: 'bg-mint/10 text-mint',
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
    try {
      const mockSources: Source[] = [
        {
          id: '1',
          sessionId: '1',
          type: 'web',
          title: 'Introduction to Large Language Models',
          url: 'https://arxiv.org/abs/2303.08774',
          content: 'This paper provides a comprehensive introduction to LLMs...',
          reliability: 0.95,
          bias: 0.05,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          sessionId: '1',
          type: 'paper',
          title: 'Attention Is All You Need',
          url: 'https://arxiv.org/abs/1706.03762',
          content: 'The Transformer architecture has revolutionized NLP...',
          reliability: 0.98,
          bias: 0,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          sessionId: '1',
          type: 'github',
          title: 'transformers - Hugging Face',
          url: 'https://github.com/huggingface/transformers',
          content: 'State-of-the-art machine learning for PyTorch and TensorFlow...',
          reliability: 0.92,
          bias: 0,
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          sessionId: '1',
          type: 'blog',
          title: 'How GPT-4 Works',
          url: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/overview',
          content: 'GPT-4 is a large multimodal model...',
          reliability: 0.88,
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

  const biasDistribution = sources.reduce((acc, s) => {
    const bias = s.bias || 0;
    if (bias < -0.3) acc.negative++;
    else if (bias > 0.3) acc.positive++;
    else acc.neutral++;
    return acc;
  }, { positive: 0, negative: 0, neutral: 0 });

  return (
    <div className="h-full flex flex-col">
      <div className="cut-card cut-border bg-graphite/60 p-5 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Badge variant="flame" className="mb-2">Sources</Badge>
          <h2 className="text-2xl font-display text-chalk">Evidence Ledger</h2>
          <p className="text-sm text-ash">{sources.length} sources across verified sessions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="cut-card bg-slate/70 px-4 py-3 text-xs text-ash uppercase tracking-[0.2em]">
            Avg reliability
            <span className="block text-chalk text-sm tracking-normal mt-1">{(avgReliability * 100).toFixed(0)}%</span>
          </div>
          <div className="cut-card bg-slate/70 px-4 py-3 text-xs text-ash uppercase tracking-[0.2em]">
            Bias alerts
            <span className="block text-chalk text-sm tracking-normal mt-1">{biasDistribution.positive + biasDistribution.negative}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 cut-card cut-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 cut-card bg-electric/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-electric" />
            </div>
            <div>
              <p className="text-2xl font-display text-chalk">{sources.length}</p>
              <p className="text-sm text-ash">Total sources</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 cut-card cut-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 cut-card bg-mint/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-mint" />
            </div>
            <div>
              <p className="text-2xl font-display text-chalk">{(avgReliability * 100).toFixed(0)}%</p>
              <p className="text-sm text-ash">Avg reliability</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 cut-card cut-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 cut-card bg-flame/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-flame" />
            </div>
            <div>
              <p className="text-2xl font-display text-chalk">{biasDistribution.neutral}</p>
              <p className="text-sm text-ash">Neutral sources</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 cut-card cut-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 cut-card bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-display text-chalk">{biasDistribution.positive + biasDistribution.negative}</p>
              <p className="text-sm text-ash">Bias flags</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="cut-card cut-border bg-slate/70 p-4 mb-6 flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search sources or summaries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-xs text-ash uppercase tracking-[0.2em]">
            <Filter className="w-4 h-4" />
            Filters
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-graphite border border-smoke rounded-lg text-chalk text-sm"
          >
            <option value="all">All types</option>
            <option value="web">Web</option>
            <option value="paper">Papers</option>
            <option value="github">GitHub</option>
            <option value="blog">Blogs</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'reliability')}
            className="px-4 py-2 bg-graphite border border-smoke rounded-lg text-chalk text-sm"
          >
            <option value="recent">Most recent</option>
            <option value="reliability">Highest reliability</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-flame border-t-transparent rounded-full" />
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center cut-card cut-border bg-slate/60">
            <FileText className="w-12 h-12 text-ash mb-4" />
            <p className="text-ash">No sources found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSources.map((source, index) => (
              <SourceCard key={source.id} source={source} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SourceCard({ source, index }: { source: Source; index: number }) {
  const [copied, setCopied] = useState(false);
  const Icon = sourceTypeIcons[source.type] || Globe;
  const typeColor = sourceTypeColors[source.type] || 'bg-graphite text-chalk';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(source.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="p-4 cut-card cut-border hover:border-flame/30 transition-colors">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 cut-card flex items-center justify-center flex-shrink-0 ${typeColor}`}>
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-chalk line-clamp-1">{source.title}</h3>
                <p className="text-sm text-ash truncate">{source.url}</p>
              </div>
              <div className="flex items-center gap-2">
                <ReliabilityBadge score={source.reliability || 0} />
                {source.bias !== 0 && (
                  <BiasIndicator bias={source.bias || 0} />
                )}
              </div>
            </div>

            {source.content && (
              <p className="mt-2 text-sm text-silver line-clamp-2">
                {source.content}
              </p>
            )}

            <div className="mt-3 flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
              </Button>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-electric hover:underline"
              >
                Open <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ReliabilityBadge({ score }: { score: number }) {
  const variant = score >= 0.8 ? 'success' : score >= 0.6 ? 'warning' : 'error';
  return (
    <Badge variant={variant}>
      <Star className="w-3 h-3 mr-1" />
      {(score * 100).toFixed(0)}%
    </Badge>
  );
}

function BiasIndicator({ bias }: { bias: number }) {
  const variant = bias > 0 ? 'error' : 'warning';
  const label = bias > 0 ? 'Positive Bias' : 'Negative Bias';
  return (
    <Badge variant={variant}>
      <AlertTriangle className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}
