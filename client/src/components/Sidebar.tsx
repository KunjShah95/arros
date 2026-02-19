import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { cn } from './ui';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onNewResearch: () => void;
}

const mainNavItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'workspace', icon: Search, label: 'Research' },
  { id: 'history', icon: Clock, label: 'History' },
  { id: 'sources', icon: BookOpen, label: 'Sources' },
];

const toolsNavItems = [
  { id: 'voice', icon: Mic, label: 'Voice Studio' },
  { id: 'scanner', icon: Eye, label: 'Document Scanner' },
];

export function Sidebar({ activeView, onViewChange, onNewResearch }: SidebarProps) {
  return (
    <aside className="w-16 h-full bg-void border-r border-smoke/30 flex flex-col items-center py-3">
      {/* ARROS Logo */}
      <div className="mb-4">
        <Link
          to="/"
          className="w-11 h-11 bg-gradient-to-br from-saffron via-peacock to-gold text-void flex items-center justify-center hover:opacity-90 transition-opacity cut-card"
          title="ARROS — Academic Research OS"
        >
          <GraduationCap className="w-5 h-5" />
        </Link>
      </div>

      {/* New Research Button */}
      <button
        onClick={onNewResearch}
        className="w-11 h-11 bg-graphite border border-peacock/40 text-peacock flex items-center justify-center hover:bg-peacock hover:text-void transition-colors cut-card"
        title="New Research"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-8 h-px bg-smoke mb-4" />

      {/* Main Nav */}
      <nav className="flex-1 flex flex-col gap-1">
        {mainNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'w-11 h-11 flex items-center justify-center transition-all relative group',
              activeView === item.id
                ? 'bg-graphite text-chalk cut-card'
                : 'text-ash hover:text-silver hover:bg-graphite/50 cut-card'
            )}
            title={item.label}
          >
            <item.icon className="w-4 h-4" />
            {activeView === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-peacock" />
            )}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="w-8 h-px bg-smoke my-2" />

      {/* Tools Section */}
      <div className="flex flex-col gap-1">
        {toolsNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'w-11 h-11 flex items-center justify-center transition-all relative group',
              activeView === item.id
                ? 'bg-graphite text-chalk cut-card'
                : 'text-ash hover:text-gold hover:bg-graphite/50 cut-card'
            )}
            title={item.label}
          >
            <item.icon className="w-4 h-4" />
            {activeView === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gold" />
            )}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-smoke my-2" />

      {/* Memory indicator */}
      <button
        onClick={() => onViewChange('workspace')}
        className="w-11 h-11 flex items-center justify-center text-ash hover:text-peacock hover:bg-graphite/50 cut-card transition-all mb-1"
        title="Memory Layer"
      >
        <Brain className="w-4 h-4" />
      </button>

      {/* Settings */}
      <button
        onClick={() => onViewChange('settings')}
        className={cn(
          'w-11 h-11 flex items-center justify-center transition-all relative',
          activeView === 'settings'
            ? 'bg-graphite text-chalk cut-card'
            : 'text-ash hover:text-silver hover:bg-graphite/50 cut-card'
        )}
        title="Settings"
      >
        <Settings className="w-4 h-4" />
      </button>
    </aside>
  );
}
