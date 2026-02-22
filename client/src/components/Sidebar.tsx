import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Settings,
  Plus,
  Clock,
  GraduationCap,
  LayoutDashboard,
  Search,
  Brain,
  Mic,
  Eye,
  BookMarked,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from './ui';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onNewResearch: () => void;
}

const mainNavItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'workspace', icon: Search, label: 'Research' },
  { id: 'graph', icon: Brain, label: 'Knowledge Graph' },
  { id: 'history', icon: Clock, label: 'History' },
  { id: 'sources', icon: BookOpen, label: 'Sources' },
];

const toolsNavItems = [
  { id: 'voice', icon: Mic, label: 'Voice Studio' },
  { id: 'scanner', icon: Eye, label: 'Document Scanner' },
  { id: 'studyos', icon: BookMarked, label: 'StudyOS' },
  { id: 'learningos', icon: Brain, label: 'Learning OS' },
  { id: 'learningos2', icon: Sparkles, label: 'AI+ Features' },
];

export function Sidebar({ activeView, onViewChange, onNewResearch }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);

  const mobileItems = useMemo(
    () => [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
      { id: 'workspace', icon: Search, label: 'Research' },
      { id: 'graph', icon: Brain, label: 'Graph' },
      { id: 'history', icon: Clock, label: 'History' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
    []
  );

  return (
    <>
      <aside
        className={cn(
          'hidden md:flex h-full bg-void/95 border-r border-smoke/40 flex-col py-4 px-2 relative overflow-hidden z-20 transition-[width] duration-300 ease-out',
          expanded ? 'w-64' : 'w-[4.75rem]'
        )}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-12 -left-10 h-36 w-36 rounded-full bg-saffron/10 blur-2xl" />
          <div className="absolute bottom-8 -right-8 h-40 w-40 rounded-full bg-peacock/10 blur-2xl" />
        </div>

        <div className="relative z-10 flex items-center gap-2 mb-4 px-1">
          <Link
            to="/"
            className="h-11 w-11 shrink-0 bg-gradient-to-br from-saffron to-gold text-void flex items-center justify-center cut-card shadow-xl shadow-saffron/20"
            title="ARROS — Academic Research OS"
          >
            <GraduationCap className="w-5 h-5" />
          </Link>

          <div className={cn('overflow-hidden transition-all', expanded ? 'w-full opacity-100' : 'w-0 opacity-0')}>
            <p className="text-sm font-semibold text-chalk leading-none">ARROS OS</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-ash mt-1">Research cockpit</p>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="h-10 w-10 min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center rounded-xl border border-smoke/60 text-ash hover:text-chalk hover:border-saffron/40 transition-colors"
            title={expanded ? 'Collapse navigation' : 'Expand navigation'}
            aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
          >
            {expanded ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewResearch}
          className="h-12 min-h-[44px] w-full mb-4 bg-gradient-to-r from-saffron to-gold text-void flex items-center justify-center gap-2 cut-card shadow-lg shadow-saffron/20"
          title="Initialize New Realization"
        >
          <Plus className="w-4 h-4" />
          <span className={cn('text-xs uppercase tracking-[0.15em] font-semibold transition-opacity', !expanded && 'hidden')}>
            New Research
          </span>
        </motion.button>

        <nav className="flex-1 flex flex-col gap-1.5 relative z-10">
          {mainNavItems.map((item) => {
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'w-full min-h-[44px] px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all relative text-left',
                  isActive
                    ? 'bg-saffron/14 text-saffron border border-saffron/30'
                    : 'text-ash hover:text-chalk hover:bg-smoke/20 border border-transparent hover:border-smoke/30'
                )}
                title={item.label}
              >
                <item.icon className={cn('w-4 h-4 shrink-0', isActive && 'scale-105')} />
                <span className={cn('text-sm whitespace-nowrap', !expanded && 'hidden')}>{item.label}</span>
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-saffron rounded-full" />}
              </button>
            );
          })}
        </nav>

        <div className="mt-4 pt-4 border-t border-smoke/30 space-y-1.5">
          {toolsNavItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'w-full min-h-[44px] px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all relative text-left',
                  isActive
                    ? 'bg-peacock/14 text-peacock border border-peacock/30'
                    : 'text-ash hover:text-chalk hover:bg-smoke/20 border border-transparent hover:border-smoke/30'
                )}
                title={item.label}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className={cn('text-sm whitespace-nowrap', !expanded && 'hidden')}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-2 pb-2 pt-1 bg-void/90 backdrop-blur-xl border-t border-smoke/40">
        <div className="grid grid-cols-5 gap-1">
          {mobileItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'min-h-[44px] rounded-xl flex flex-col items-center justify-center gap-1 transition-colors',
                  isActive ? 'bg-saffron/15 text-saffron' : 'text-ash hover:bg-smoke/30'
                )}
                title={item.label}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-[0.08em]">{item.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onNewResearch}
          className="absolute -top-5 right-4 h-12 w-12 min-h-[44px] min-w-[44px] rounded-2xl bg-gradient-to-r from-saffron to-gold text-void flex items-center justify-center shadow-[0_12px_30px_rgba(255,107,53,0.35)]"
          aria-label="Start new research"
          title="New research"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}

export default Sidebar;
