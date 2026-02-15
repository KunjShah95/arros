import { Link } from 'react-router-dom';
import { 
  Brain, 
  BookOpen, 
  Network, 
  Settings, 
  Plus,
  Clock,
  Hexagon,
  BarChart3
} from 'lucide-react';
import { cn } from './ui';
import { Button } from './ui';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onNewResearch: () => void;
}

const navItems = [
  { id: 'workspace', icon: Brain, label: 'Research' },
  { id: 'sources', icon: BookOpen, label: 'Sources' },
  { id: 'graph', icon: Network, label: 'Knowledge Graph' },
  { id: 'history', icon: Clock, label: 'History' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ activeView, onViewChange, onNewResearch }: SidebarProps) {
  return (
    <aside className="w-72 h-full bg-slate border-r border-smoke flex flex-col relative overflow-hidden">
      {/* Top pattern */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-flame/5 to-transparent" />
      
      {/* Logo */}
      <div className="p-5 border-b border-smoke/50 relative">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-flame flex items-center justify-center shadow-lg shadow-flame-20">
            <Hexagon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-chalk tracking-tight">NEXUS</h1>
            <p className="text-xs text-ash">Research OS</p>
          </div>
        </Link>
      </div>

      {/* New Research Button */}
      <div className="p-4 relative">
        <Button 
          variant="electric" 
          className="w-full justify-start gap-2.5 shadow-lg shadow-flame-10"
          onClick={onNewResearch}
        >
          <Plus className="w-5 h-5" />
          New Research
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                activeView === item.id
                  ? 'bg-flame/10 text-flame border border-flame/20'
                  : 'text-silver hover:text-chalk hover:bg-graphite'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {activeView === item.id && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-flame" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Links section */}
      <div className="p-3 border-t border-smoke/50">
        <Link
          to="/pricing"
          onClick={() => onViewChange('')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-silver hover:text-chalk hover:bg-graphite transition-all duration-200"
        >
          <div className="w-5 h-5 rounded bg-gradient-to-br from-flame to-electric" />
          Upgrade to Pro
        </Link>
      </div>

      {/* Bottom section */}
      <div className="p-4 border-t border-smoke/50">
        <div className="p-4 rounded-xl bg-graphite/50 border border-smoke/50">
          <p className="text-xs text-ash mb-2">API Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
            <span className="text-sm text-silver">Connected</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
