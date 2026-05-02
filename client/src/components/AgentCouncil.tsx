import { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, Globe, BookOpen, Scale, Layers } from 'lucide-react';

interface Agent {
  name: string;
  icon: React.ElementType;
  status: string;
  color: string;
}

const AGENTS: Agent[] = [
  { name: 'The Planner', icon: Compass, status: 'Mapping query topology...', color: '#ff7b00' },
  { name: 'Web Sage', icon: Globe, status: 'Scanning 14,203 sources...', color: '#00e5c9' },
  { name: 'The Scholar', icon: BookOpen, status: 'Cross-referencing 3 citations...', color: '#d4af37' },
  { name: 'The Critic', icon: Scale, status: 'Flagging 2 potential biases...', color: '#ff4d4d' },
  { name: 'The Weaver', icon: Layers, status: 'Weaving consensus narrative...', color: '#9b59b6' }
];

export function AgentCouncil() {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
      {AGENTS.map((agent, i) => (
        <motion.div
          key={agent.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className="relative p-6 bg-[#121214] border border-white/10 hover:border-white/20 transition-all cursor-pointer"
          onMouseEnter={() => setHoveredAgent(agent.name)}
          onMouseLeave={() => setHoveredAgent(null)}
        >
          {/* Animated glow */}
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{ background: agent.color, opacity: 0.1 }}
            animate={{ opacity: hoveredAgent === agent.name ? 0.15 : 0.05 }}
          />
          
          <div className="relative">
            <motion.div
              className="w-12 h-12 flex items-center justify-center mb-4"
              style={{ 
                background: `${agent.color}20`,
                border: `1px solid ${agent.color}40`
              }}
              animate={{ 
                scale: hoveredAgent === agent.name ? 1.1 : 1,
                boxShadow: hoveredAgent === agent.name ? `0 0 20px ${agent.color}40` : 'none'
              }}
            >
              <agent.icon className="w-5 h-5" style={{ color: agent.color }} />
            </motion.div>
            
            <h3 className="text-base font-semibold text-[#e8e6e1] mb-2">{agent.name}</h3>
            
            <motion.p
              className="text-sm font-mono"
              style={{ color: agent.color }}
              animate={{ opacity: hoveredAgent === agent.name ? 1 : 0.7 }}
            >
              {agent.status}
            </motion.p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}