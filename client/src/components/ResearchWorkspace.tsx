import { motion } from 'framer-motion';
import { Send, Sparkles, Lightbulb, CheckCircle2, Clock, Zap, Search, Hexagon } from 'lucide-react';
import { Button, Card, Badge, ProgressBar } from './ui';
import { AgentTimeline } from './AgentTimeline';
import type { ResearchResponse, AgentTask, Source } from '../types';

interface ResearchWorkspaceProps {
  query: string;
  setQuery: (query: string) => void;
  onSubmit: (query: string) => void;
  isResearching: boolean;
  result: ResearchResponse | null;
  tasks: AgentTask[];
  sources: Source[];
}

export function ResearchWorkspace({
  query,
  setQuery,
  onSubmit,
  isResearching,
  result,
  tasks,
  sources: _sources,
}: ResearchWorkspaceProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isResearching) {
      onSubmit(query);
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div className="flex h-full gap-6">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search bar */}
        <div className="mb-6">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ash" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What would you like to research?"
                className="w-full pl-12 pr-24 py-4 bg-slate border border-smoke rounded-2xl text-chalk placeholder:text-ash text-base focus:outline-none focus:border-flame focus:ring-2 focus:ring-flame-10 transition-all"
                disabled={isResearching}
              />
            </div>
            <Button
              type="submit"
              variant="electric"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              loading={isResearching}
              disabled={!query.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* Research in progress */}
        {isResearching && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card variant="glass" className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-flame/20 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-5 h-5 text-flame" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-chalk">Research in progress</span>
                  <div className="flex items-center gap-2 mt-1">
                    <ProgressBar progress={progress} variant="flame" />
                    <span className="text-xs text-ash">{progress.toFixed(0)}%</span>
                  </div>
                </div>
                <Badge variant="flame">{completedTasks}/{tasks.length}</Badge>
              </div>
              <p className="text-xs text-ash">
                {completedTasks} of {tasks.length} agents completed
              </p>
            </Card>
          </motion.div>
        )}

        {/* Results or empty state */}
        <div className="flex-1 overflow-y-auto">
          {result ? (
            <ResearchResults result={result} />
          ) : !isResearching ? (
            <EmptyWorkspace onSubmit={onSubmit} />
          ) : null}
        </div>
      </div>

      {/* Agent Timeline Sidebar */}
      <div className="w-80 flex-shrink-0">
        <Card className="h-full p-4 overflow-hidden flex flex-col border-smoke/50">
          <AgentTimeline tasks={tasks} />
        </Card>
      </div>
    </div>
  );
}

function ResearchResults({ result }: { result: ResearchResponse }) {
  const avgConfidence = result.synthesis.confidence * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Summary Card */}
      <Card variant="elevated" className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Hexagon className="w-5 h-5 text-flame" />
            <h2 className="text-lg font-display font-semibold text-chalk">Summary</h2>
          </div>
          <ConfidenceBadge score={avgConfidence} />
        </div>
        <p className="text-silver whitespace-pre-wrap leading-relaxed">{result.synthesis.summary}</p>
      </Card>

      {/* Key Findings */}
      {result.synthesis.keyFindings.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-display font-semibold text-chalk">Key Findings</h2>
          </div>
          <ul className="space-y-3">
            {result.synthesis.keyFindings.map((finding, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-mint flex-shrink-0 mt-0.5" />
                <span className="text-silver">{finding}</span>
              </motion.li>
            ))}
          </ul>
        </Card>
      )}

      {/* Actionable Outputs */}
      {result.synthesis.actionableOutputs && result.synthesis.actionableOutputs.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-flame" />
            <h2 className="text-lg font-display font-semibold text-chalk">Actionable Outputs</h2>
          </div>
          <div className="grid gap-3">
            {result.synthesis.actionableOutputs.map((action, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-graphite border border-smoke hover:border-flame/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-chalk">{action.title}</span>
                  <PriorityBadge priority={action.priority} />
                </div>
                <p className="text-sm text-ash">{action.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Deep Dive */}
      {result.synthesis.deepDive && (
        <Card className="p-6">
          <h2 className="text-lg font-display font-semibold text-chalk mb-4">Deep Dive</h2>
          <div className="text-silver whitespace-pre-wrap text-sm leading-relaxed">{result.synthesis.deepDive}</div>
        </Card>
      )}

      {/* Meta info */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-ash">
              <Clock className="w-4 h-4 inline mr-1" />
              {result.totalTime}ms
            </span>
            <span className="text-ash">
              ${result.totalCost.toFixed(4)}
            </span>
          </div>
          <div className="flex gap-2">
            {result.evaluations.map((eval_) => (
              <Badge
                key={eval_.type}
                variant={eval_.passed ? 'success' : 'warning'}
              >
                {eval_.type}: {Math.round(eval_.score * 100)}%
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  const variant = score >= 70 ? 'success' : score >= 50 ? 'warning' : 'error';
  return (
    <Badge variant={variant}>
      {score.toFixed(0)}% confidence
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const variants: Record<string, 'success' | 'warning' | 'error'> = {
    high: 'error',
    medium: 'warning',
    low: 'success',
  };
  return <Badge variant={variants[priority]}>{priority}</Badge>;
}

function EmptyWorkspace({ onSubmit }: { onSubmit: (q: string) => void }) {
  const suggestions = [
    'Compare React vs Vue for enterprise apps',
    'How does GPT-4 work under the hood?',
    'Best practices for API design in 2025',
    'Explain quantum computing for beginners',
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12">
      <div className="text-center max-w-md">
        {/* Animated icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-flame to-flame-glow flex items-center justify-center mx-auto mb-6 shadow-lg shadow-flame-20"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>
        
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-display font-bold text-chalk mb-3"
        >
          Start Your Research
        </motion.h2>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-silver mb-8"
        >
          Enter a topic and our AI agents will research, verify, and synthesize the information for you.
        </motion.p>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid gap-2"
        >
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              onClick={() => onSubmit(suggestion)}
              className="p-4 text-left rounded-xl border border-smoke bg-slate/50 hover:bg-graphite hover:border-flame/30 transition-all group"
            >
              <span className="text-sm text-silver group-hover:text-chalk transition-colors">
                {suggestion}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
