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
  Hexagon,
  Sparkles
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
  return (
    <aside className="w-16 h-full bg-void border-r border-smoke/30 flex flex-col items-center py-4 relative overflow-hidden z-20">
      {/* Subtle Vedic Glow */}
      <div className="absolute top-0 left-0 w-full h-[200px] bg-gradient-to-b from-saffron/10 to-transparent pointer-events-none opacity-50" />

      {/* ARROS Logo */}
      <div className="mb-6 relative z-10">
        <Link
          to="/"
          className="w-11 h-11 bg-gradient-to-br from-saffron to-gold text-void flex items-center justify-center hover:opacity-90 transition-opacity cut-card shadow-xl shadow-saffron/20 group"
          title="ARROS — Academic Research OS"
        >
          <GraduationCap className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Link>
      </div>

      {/* New Research Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNewResearch}
        className="w-11 h-11 bg-graphite border border-saffron/40 text-saffron flex items-center justify-center hover:bg-saffron hover:text-void transition-all cut-card shadow-lg shadow-saffron/10 mb-6"
        title="Initialize New Realization"
      >
        <Plus className="w-4 h-4" />
      </motion.button>

      {/* Main Nav */}
      <nav className="flex-1 flex flex-col gap-1.5 relative z-10 w-full px-2">
        {mainNavItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'w-full aspect-square flex items-center justify-center transition-all relative group',
              activeView === item.id
                ? 'bg-saffron/10 text-saffron cut-card'
                : 'text-ash hover:text-saffron hover:bg-smoke/20 cut-card'
            )}
            title={item.label}
          >
            <item.icon className={cn(
              "w-4 h-4 transition-all",
              activeView === item.id && "scale-110"
            )} />
            {activeView === item.id && (
              <motion.div
                layoutId="active-nav-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-saffron rounded-full"
              />
            )}
            {/* Hover shadow */}
            <div className="absolute inset-0 rounded-xl bg-saffron/5 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
          </motion.button>
        ))}
      </nav>

      {/* Tools Section */}
      <div className="flex flex-col gap-1.5 relative z-10 w-full px-2 mt-4">
        <div className="w-full h-px bg-smoke/20 mb-2" />
        {toolsNavItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'w-full aspect-square flex items-center justify-center transition-all relative group',
              activeView === item.id
                ? 'bg-peacock/10 text-peacock cut-card'
                : 'text-ash hover:text-peacock hover:bg-smoke/20 cut-card'
            )}
            title={item.label}
          >
            <item.icon className={cn(
              "w-4 h-4 transition-all",
              activeView === item.id && "scale-110"
            )} />
            {activeView === item.id && (
              <motion.div
                layoutId="active-tool-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-peacock rounded-full"
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto flex flex-col gap-2 w-full px-2">
        <div className="w-full h-px bg-smoke/20 my-2" />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewChange('settings')}
          className={cn(
            'w-full aspect-square flex items-center justify-center transition-all relative group',
            activeView === 'settings'
              ? 'bg-gold/10 text-gold cut-card'
              : 'text-ash hover:text-gold hover:bg-smoke/20 cut-card'
          )}
          title="Universal Settings"
        >
          <Settings className={cn(
            "w-4 h-4 transition-all",
            activeView === 'settings' && "animate-[spin_10s_linear_infinite]"
          )} />
          {activeView === 'settings' && (
            <motion.div
              layoutId="active-settings-indicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gold rounded-full"
            />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full aspect-square flex items-center justify-center text-ash/40 hover:text-saffron transition-all"
          title="Vedic Engine v1.0"
        >
          <Hexagon className="w-4 h-4" />
        </motion.button>
      </div>
    </aside>
  );
}

export default Sidebar;
