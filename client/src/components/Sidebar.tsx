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
  Layers,
  Youtube,
  Trophy,
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
  { id: 'flashcards', icon: Layers, label: 'Flashcards' },
  { id: 'media', icon: Youtube, label: 'Media Research' },
  { id: 'xp', icon: Trophy, label: 'Progress' },
  { id: 'voice', icon: Mic, label: 'Voice Studio' },
  { id: 'scanner', icon: Eye, label: 'Scanner' },
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
      { id: 'flashcards', icon: Layers, label: 'Cards' },
      { id: 'xp', icon: Trophy, label: 'XP' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
    []
  );

  return (
    <>
      <aside
        className={cn(
          'hidden md:flex h-full bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] flex-col py-4 px-3 relative overflow-hidden z-20 transition-[width] duration-200 ease-out',
          expanded ? 'w-[240px]' : 'w-[72px]'
        )}
      >
        <div className="flex items-center gap-2.5 mb-6">
          <Link
            to="/"
            className="h-10 w-10 shrink-0 bg-[var(--color-accent)] text-white flex items-center justify-center"
            title="ARROS — Academic Research OS"
          >
            <GraduationCap className="w-5 h-5" />
          </Link>

          <div className={cn('overflow-hidden transition-all', expanded ? 'w-full opacity-100' : 'w-0 opacity-0')}>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-none">ARROS OS</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] mt-0.5">Research cockpit</p>
          </div>
        </div>

        <motion.button
          whileHover={{ opacity: 0.9 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewResearch}
          className="h-10 w-full mb-5 bg-[var(--color-accent)] text-white flex items-center justify-center gap-2"
          title="New Research"
        >
          <Plus className="w-4 h-4" />
          <span className={cn('text-xs font-medium', !expanded && 'hidden')}>
            New Research
          </span>
        </motion.button>

        <nav className="flex-1 flex flex-col gap-1">
          {mainNavItems.map((item) => {
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'w-full h-10 px-3 flex items-center gap-3 transition-all relative text-left rounded',
                  isActive
                    ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]/50'
                )}
                title={item.label}
              >
                <item.icon className={cn('w-4 h-4 shrink-0', isActive && 'text-[var(--color-accent)]')} />
                <span className={cn('text-sm whitespace-nowrap', !expanded && 'hidden')}>{item.label}</span>
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 bg-[var(--color-accent)]" />}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-[var(--color-border)] space-y-1">
          {toolsNavItems.slice(0, 4).map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'w-full h-10 px-3 flex items-center gap-3 transition-all relative text-left rounded',
                  isActive
                    ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]/50'
                )}
                title={item.label}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className={cn('text-sm whitespace-nowrap', !expanded && 'hidden')}>{item.label}</span>
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 bg-[var(--color-accent)]" />}
              </button>
            );
          })}
        </div>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-2 pb-2 pt-1 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)]">
        <div className="grid grid-cols-5 gap-1">
          {mobileItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'h-11 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors',
                  isActive ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'
                )}
                title={item.label}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-[9px] uppercase tracking-[0.05em]">{item.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onNewResearch}
          className="absolute -top-5 right-4 h-11 w-11 bg-[var(--color-accent)] text-white flex items-center justify-center"
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