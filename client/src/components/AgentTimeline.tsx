import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Brain,
  FileCheck,
  Database,
  Zap,
  Gauge,
  Hexagon
} from 'lucide-react';
import { cn } from './ui';
import type { AgentTask } from '../types';

const agentConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  planner: { icon: Brain, color: 'text-flame', bgColor: 'bg-flame/10', label: 'Planning' },
  research: { icon: Search, color: 'text-electric', bgColor: 'bg-electric/10', label: 'Researching' },
  critic: { icon: FileCheck, color: 'text-mint', bgColor: 'bg-mint/10', label: 'Verifying' },
  synthesizer: { icon: Hexagon, color: 'text-flame', bgColor: 'bg-flame/10', label: 'Synthesizing' },
  memory: { icon: Database, color: 'text-electric', bgColor: 'bg-electric/10', label: 'Storing' },
  action: { icon: Zap, color: 'text-warning', bgColor: 'bg-warning/10', label: 'Actions' },
  meta: { icon: Gauge, color: 'text-silver', bgColor: 'bg-smoke', label: 'Evaluating' },
};

interface AgentTimelineProps {
  tasks: AgentTask[];
  currentProgress?: number;
}

export function AgentTimeline({ tasks, currentProgress: _currentProgress }: AgentTimelineProps) {
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length || 6;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-flame animate-pulse" />
          <h3 className="text-sm font-medium text-silver uppercase tracking-[0.2em]">Agent Progress</h3>
        </div>
        <span className="text-xs text-ash">
          {completedTasks}/{totalTasks}
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
        <AnimatePresence>
          {tasks.length === 0 ? (
            <EmptyState />
          ) : (
            tasks.map((task, index) => (
              <TaskItem key={task.id || task.type} task={task} index={index} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TaskItem({ task, index }: { task: AgentTask; index: number }) {
  const config = agentConfig[task.type] || { icon: Brain, color: 'text-ash', bgColor: 'bg-smoke', label: task.type };
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'flex items-center gap-3 p-3 border transition-all duration-300 cut-card',
        task.status === 'completed' && 'border-mint/20 bg-mint/5',
        task.status === 'running' && 'border-flame/30 bg-flame/5',
        task.status === 'failed' && 'border-error/30 bg-error/5',
        task.status === 'pending' && 'border-smoke bg-graphite/50'
      )}
    >
      {/* Icon */}
      <div className={cn(
        'w-9 h-9 cut-card flex items-center justify-center',
        config.bgColor,
        task.status === 'running' && 'animate-pulse'
      )}>
        {task.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-mint" />}
        {task.status === 'running' && <Loader2 className="w-5 h-5 text-flame animate-spin" />}
        {task.status === 'failed' && <AlertCircle className="w-5 h-5 text-error" />}
        {task.status === 'pending' && <Icon className={cn('w-5 h-5', config.color)} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          task.status === 'completed' && 'text-mint',
          task.status === 'running' && 'text-flame',
          task.status === 'failed' && 'text-error',
          task.status === 'pending' && 'text-ash'
        )}>
          {config.label}
        </p>
        {task.output && (
          <p className="text-xs text-ash truncate mt-0.5">
            {getTaskSummary(task)}
          </p>
        )}
      </div>

      {/* Tokens */}
      {task.tokens && (
        <span className="text-xs text-ash">
          {task.tokens.toLocaleString()}
        </span>
      )}
    </motion.div>
  );
}

function getTaskSummary(task: AgentTask): string {
  if (!task.output) return '';
  
  const output = task.output as Record<string, unknown>;
  
  switch (task.type) {
    case 'research':
      if (output.sources) return `${(output.sources as unknown[]).length} sources`;
      return 'Searching...';
    case 'critic':
      if (output.acceptedClaims) {
        const accepted = (output.acceptedClaims as unknown[]).length;
        const rejected = (output.rejectedClaims as unknown[]).length;
        return `${accepted} ✓ ${rejected} ✗`;
      }
      return 'Verifying...';
    case 'synthesizer':
      if (output.keyFindings) return `${(output.keyFindings as string[]).length} findings`;
      return 'Synthesizing...';
    case 'memory':
      return `${output.memoriesStored || 0} stored`;
    case 'action':
      return `${(output.actionsGenerated as number) || 0} actions`;
    default:
      return '';
  }
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center cut-card cut-border bg-slate/60">
      <div className="w-14 h-14 cut-card bg-graphite flex items-center justify-center mb-4">
        <Brain className="w-7 h-7 text-ash" />
      </div>
      <p className="text-sm text-ash mb-1">No research in progress</p>
      <p className="text-xs text-ash/60">Start a new research to see agent progress</p>
    </div>
  );
}
