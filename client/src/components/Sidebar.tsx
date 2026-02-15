import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Network, 
  Settings, 
  Plus,
  Clock,
  BarChart3,
  Mic,
  Volume2,
  FileText,
  Home
} from 'lucide-react';
import { cn } from './ui';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onNewResearch: () => void;
}

const mainNavItems = [
  { id: 'workspace', icon: Home, label: 'Home' },
  { id: 'sources', icon: BookOpen, label: 'Sources' },
  { id: 'graph', icon: Network, label: 'Graph' },
  { id: 'history', icon: Clock, label: 'History' },
  { id: 'analytics', icon: BarChart3, label: 'Stats' },
];

const toolItems = [
  { id: 'ocr', icon: FileText, label: 'OCR' },
  { id: 'tts', icon: Volume2, label: 'TTS' },
  { id: 'stt', icon: Mic, label: 'STT' },
];

export function Sidebar({ activeView, onViewChange, onNewResearch }: SidebarProps) {
  return (
    <aside className="w-16 h-full bg-void border-r border-smoke/30 flex flex-col items-center py-3">
      {/* Logo */}
      <div className="mb-4">
        <Link 
          to="/" 
          className="w-10 h-10 bg-chalk text-void flex items-center justify-center font-bold text-sm hover:bg-white transition-colors"
        >
          NX
        </Link>
      </div>

      {/* New Button */}
      <button
        onClick={onNewResearch}
        className="w-10 h-10 bg-flame text-white flex items-center justify-center hover:bg-orange-600 transition-colors mb-4"
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
              'w-10 h-10 flex items-center justify-center transition-all relative group',
              activeView === item.id
                ? 'bg-graphite text-chalk'
                : 'text-ash hover:text-silver hover:bg-graphite/50'
            )}
            title={item.label}
          >
            <item.icon className="w-4 h-4" />
            {activeView === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-flame" />
            )}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="w-8 h-px bg-smoke my-2" />

      {/* Tools */}
      <nav className="flex flex-col gap-1 mb-2">
        {toolItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'w-10 h-10 flex items-center justify-center transition-all relative group',
              activeView === item.id
                ? 'bg-graphite text-chalk'
                : 'text-ash hover:text-silver hover:bg-graphite/50'
            )}
            title={item.label}
          >
            <item.icon className="w-4 h-4" />
            {activeView === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-flame" />
            )}
          </button>
        ))}
      </nav>

      {/* Settings */}
      <button
        onClick={() => onViewChange('settings')}
        className={cn(
          'w-10 h-10 flex items-center justify-center transition-all relative group',
          activeView === 'settings'
            ? 'bg-graphite text-chalk'
            : 'text-ash hover:text-silver hover:bg-graphite/50'
        )}
        title="Settings"
      >
        <Settings className="w-4 h-4" />
      </button>
    </aside>
  );
}
