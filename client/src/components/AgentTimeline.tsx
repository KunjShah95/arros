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
  Hexagon,
  Layout,
  Layers,
  Shield,
} from 'lucide-react';
import { cn } from './ui';
import type { AgentTask } from '../types';

const agentConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  planner: { icon: Layout, color: 'text-saffron', bgColor: 'bg-saffron/10', label: 'The Planner' },
  research: { icon: Search, color: 'text-peacock', bgColor: 'bg-peacock/10', label: 'Web Sage' },
  critic: { icon: Shield, color: 'text-gold', bgColor: 'bg-gold/10', label: 'The Critic' },
  synthesizer: { icon: Layers, color: 'text-peacock', bgColor: 'bg-peacock/10', label: 'The Weaver' },
  memory: { icon: Database, color: 'text-saffron', bgColor: 'bg-saffron/10', label: 'Apsara Memory' },
  action: { icon: Zap, color: 'text-gold', bgColor: 'bg-gold/10', label: 'Realization' },
  meta: { icon: Gauge, color: 'text-silver', bgColor: 'bg-smoke/20', label: 'The Observer' },
  debate: { icon: Hexagon, color: 'text-saffron', bgColor: 'bg-saffron/10', label: 'Council Debate' },
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-peacock animate-pulse" />
            <h3 className="text-[11px] font-bold text-ash uppercase tracking-[0.3em]">Council Protocol</h3>
          </div>
        </div>
        <span className="text-[10px] font-mono text-ash/80">
          {completedTasks}/{totalTasks} Realized
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
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
  const config = agentConfig[task.type] || { icon: Brain, color: 'text-ash', bgColor: 'bg-smoke/20', label: task.type };
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'flex items-center gap-4 p-4 transition-all duration-300 cut-card cut-border',
        task.status === 'completed' && 'border-peacock/20 bg-peacock/5',
        task.status === 'running' && 'border-saffron/30 bg-saffron/5',
        task.status === 'failed' && 'border-error/30 bg-error/5',
        task.status === 'pending' && 'border-smoke/20 bg-graphite/40 opacity-60'
      )}
    >
      {/* Icon */}
      <div className={cn(
        'w-10 h-10 cut-card flex items-center justify-center shrink-0 border border-smoke/30',
        config.bgColor,
        task.status === 'running' && 'animate-pulse border-saffron/30'
      )}>
        {task.status === 'completed' ? (
          <CheckCircle2 className="w-5 h-5 text-peacock" />
        ) : task.status === 'running' ? (
          <Loader2 className="w-5 h-5 text-saffron animate-spin" />
        ) : task.status === 'failed' ? (
          <AlertCircle className="w-5 h-5 text-error" />
        ) : (
          <Icon className={cn('w-4 h-4', config.color)} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-[11px] font-bold uppercase tracking-wider truncate',
          task.status === 'completed' && 'text-peacock',
          task.status === 'running' && 'text-saffron',
          task.status === 'failed' && 'text-error',
          task.status === 'pending' && 'text-ash'
        )}>
          {config.label}
        </p>
        <p className="text-[10px] text-ash/70 truncate mt-1 tracking-tight">
          {task.status === 'running' ? 'Active Reasoning...' : task.status === 'completed' ? (getTaskSummary(task) || 'Realization Complete') : 'Waiting for Protocol'}
        </p>
      </div>

      {/* Tokens / Resource Meta */}
      {(task.tokens || task.status === 'completed') && (
        <div className="text-[9px] font-mono text-ash/40 flex flex-col items-end">
          <span>{task.tokens ? `${(task.tokens / 1000).toFixed(1)}k` : '---'}</span>
          <span className="uppercase">{task.status === 'completed' ? 'Done' : ''}</span>
        </div>
      )}
    </motion.div>
  );
}

function getTaskSummary(task: AgentTask): string {
  if (!task.output) return '';

  const output = task.output as Record<string, unknown>;

  switch (task.type) {
    case 'research':
      if (output.sources) return `${(output.sources as unknown[]).length} sources woven`;
      return 'World traversed';
    case 'critic':
      if (output.acceptedClaims) {
        const accepted = (output.acceptedClaims as unknown[]).length;
        const rejected = (output.rejectedClaims as unknown[]).length;
        return `${accepted} Sutras verified`;
      }
      return 'Assurance complete';
    case 'synthesizer':
      if (output.keyFindings) return `${(output.keyFindings as string[]).length} core insights`;
      return 'Synthesis realized';
    case 'memory':
      return `${output.memoriesStored || 0} capsules stored`;
    case 'meta':
      return output.passed ? 'Observatory passed' : 'Refinement required';
    case 'debate':
      return output.commonGround ? `${(output.commonGround as string[]).length} agreed points` : 'Council reached unity';
    default:
      return '';
  }
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center cut-card cut-border bg-slate/20">
      <div className="w-16 h-16 cut-card bg-void border border-smoke/30 flex items-center justify-center mb-6">
        <Brain className="w-8 h-8 text-ash/30" />
      </div>
      <p className="text-xs font-bold text-ash uppercase tracking-widest mb-1">Silence in the Council</p>
      <p className="text-[10px] text-ash/60 px-6">Initialize a research protocol to activate the Council Agents.</p>
    </div>
  );
}
