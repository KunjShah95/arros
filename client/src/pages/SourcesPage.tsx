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
  TrendingUp
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
  web: 'bg-blue-500/20 text-blue-400',
  paper: 'bg-purple-500/20 text-purple-400',
  github: 'bg-gray-500/20 text-gray-400',
  blog: 'bg-green-500/20 text-green-400',
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
    .filter(source => {
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Sources</h2>
          <p className="text-text-muted">{sources.length} sources across all research</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{sources.length}</p>
              <p className="text-sm text-text-muted">Total Sources</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{(avgReliability * 100).toFixed(0)}%</p>
              <p className="text-sm text-text-muted">Avg Reliability</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{biasDistribution.neutral}</p>
              <p className="text-sm text-text-muted">Neutral Sources</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{biasDistribution.positive + biasDistribution.negative}</p>
              <p className="text-sm text-text-muted">Biased Sources</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-surface border border-border rounded-lg text-text-primary"
          >
            <option value="all">All Types</option>
            <option value="web">Web</option>
            <option value="paper">Papers</option>
            <option value="github">GitHub</option>
            <option value="blog">Blogs</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'reliability')}
            className="px-4 py-2 bg-surface border border-border rounded-lg text-text-primary"
          >
            <option value="recent">Most Recent</option>
            <option value="reliability">Highest Reliability</option>
          </select>
        </div>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="w-12 h-12 text-text-muted mb-4" />
            <p className="text-text-muted">No sources found</p>
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
  const typeColor = sourceTypeColors[source.type] || 'bg-gray-500/20 text-gray-400';

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
      <Card className="p-4 hover:border-primary/30 transition-colors">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-text-primary line-clamp-1">{source.title}</h3>
                <p className="text-sm text-text-muted truncate">{source.url}</p>
              </div>
              <div className="flex items-center gap-2">
                <ReliabilityBadge score={source.reliability || 0} />
                {source.bias !== 0 && (
                  <BiasIndicator bias={source.bias || 0} />
                )}
              </div>
            </div>
            
            {source.content && (
              <p className="mt-2 text-sm text-text-secondary line-clamp-2">
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
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
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
