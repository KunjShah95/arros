import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Hexagon,
  Circle,
  Square,
  Triangle,
  Fingerprint,
  Zap,
  ShieldAlert,
  Dna
} from 'lucide-react';
import { Card, Button, cn, Mandala } from './ui';
import type { KnowledgeNode, KnowledgeEdge } from '../types';

const nodeIcons: Record<string, React.ElementType> = {
  concept: Hexagon,
  fact: Circle,
  entity: Square,
  claim: Triangle,
};

const nodeColors: Record<string, { bg: string, border: string, text: string, glow: string }> = {
  concept: {
    bg: 'bg-saffron/10',
    border: 'border-saffron/30',
    text: 'text-saffron',
    glow: 'shadow-[0_0_15px_rgba(255,107,53,0.2)]'
  },
  fact: {
    bg: 'bg-peacock/10',
    border: 'border-peacock/30',
    text: 'text-peacock',
    glow: 'shadow-[0_0_15px_rgba(0,168,107,0.2)]'
  },
  entity: {
    bg: 'bg-gold/10',
    border: 'border-gold/30',
    text: 'text-gold',
    glow: 'shadow-[0_0_15px_rgba(212,175,55,0.2)]'
  },
  claim: {
    bg: 'bg-silver/10',
    border: 'border-silver/30',
    text: 'text-silver',
    glow: 'shadow-[0_0_15px_rgba(192,192,192,0.2)]'
  },
};

interface KnowledgeGraphProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  onNodeClick?: (node: KnowledgeNode) => void;
  activeNodeId?: string;
}

export function KnowledgeGraph({ nodes, edges, onNodeClick, activeNodeId }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2.5));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.3));
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const centerX = 400;
  const centerY = 300;
  const radius = useMemo(() => Math.max(220, nodes.length * 15), [nodes.length]);

  if (nodes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-graphite/20 cut-card cut-border">
        <div className="relative mb-8">
          <Mandala className="w-24 h-24 animate-[spin_60s_linear_infinite] opacity-10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Network className="w-8 h-8 text-ash/40" />
          </div>
        </div>
        <h3 className="text-xl font-display font-bold text-ash mb-2">Jnana Void</h3>
        <p className="text-sm text-ash/60 max-w-xs">
          Start a research session to manifest connections in the Akasha.
        </p>
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col cut-card cut-border bg-void/50 border-smoke/30 relative overflow-hidden group">
      {/* HUD-style Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <div className="flex bg-void/80 backdrop-blur-md border border-smoke/30 rounded-xl p-1">
          <button onClick={handleZoomOut} className="p-2 text-ash hover:text-white transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-smoke/20 my-auto mx-1" />
          <span className="text-[10px] font-mono font-bold text-ash w-10 text-center my-auto">
            {Math.round(zoom * 100)}%
          </span>
          <div className="w-px h-4 bg-smoke/20 my-auto mx-1" />
          <button onClick={handleZoomIn} className="p-2 text-ash hover:text-white transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={handleReset}
          className="p-3 bg-void/80 backdrop-blur-md border border-smoke/30 rounded-xl text-ash hover:text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Graph Area */}
      <div
        ref={containerRef}
        className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(212, 175, 55, 0.05) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      >
        <motion.div
          className="absolute inset-0 origin-center"
          animate={{
            x: position.x,
            y: position.y,
            scale: zoom
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Edge Layer */}
          <svg className="absolute inset-0 w-[2000px] h-[2000px] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            {edges.map((edge) => {
              const fromIndex = nodes.findIndex(n => n.id === edge.fromNodeId);
              const toIndex = nodes.findIndex(n => n.id === edge.toNodeId);
              if (fromIndex === -1 || toIndex === -1) return null;

              const angleA = (fromIndex / nodes.length) * 2 * Math.PI;
              const angleB = (toIndex / nodes.length) * 2 * Math.PI;
              const x1 = centerX + radius * Math.cos(angleA);
              const y1 = centerY + radius * Math.sin(angleA);
              const x2 = centerX + radius * Math.cos(angleB);
              const y2 = centerY + radius * Math.sin(angleB);

              const isActive = activeNodeId === edge.fromNodeId || activeNodeId === edge.toNodeId;

              return (
                <motion.line
                  key={edge.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: isActive ? 0.6 : 0.15 }}
                  stroke={isActive ? '#D4AF37' : 'currentColor'}
                  strokeWidth={isActive ? 2 : 1}
                  className={cn("text-smoke transition-colors duration-500")}
                />
              );
            })}
          </svg>

          {/* Node Layer */}
          {nodes.map((node, index) => {
            const angle = (index / nodes.length) * 2 * Math.PI;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            const Icon = nodeIcons[node.type] || Circle;
            const colors = nodeColors[node.type] || nodeColors.concept;
            const isActive = activeNodeId === node.id;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1, zIndex: 10 }}
                className="absolute cursor-pointer group/node"
                style={{
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => onNodeClick?.(node)}
              >
                <div className={cn(
                  "relative p-3 border transition-all duration-300 cut-card backdrop-blur-md",
                  isActive ? "border-gold bg-gold/20 scale-110 shadow-[0_0_30px_rgba(212,175,55,0.3)]" : cn(colors.bg, colors.border, colors.glow),
                  "hover:border-white/40"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center transition-transform", isActive && "animate-pulse")}>
                      <Icon className={cn("w-4 h-4", isActive ? "text-gold" : colors.text)} />
                    </div>
                    <div>
                      <p className="text-[11px] font-display font-bold text-white whitespace-nowrap tracking-wide">
                        {node.name}
                      </p>
                      <p className={cn("text-[8px] uppercase font-bold tracking-[0.2em] opacity-60", isActive ? "text-gold" : colors.text)}>
                        {node.type}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Active Indicator Ring */}
                {isActive && (
                  <motion.div
                    layoutId="active-node-ring"
                    className="absolute inset-0 -m-2 border border-gold/40 rounded-xl"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Legend Footer */}
      <div className="p-4 border-t border-smoke/10 bg-void/80 flex items-center justify-between">
        <div className="flex gap-4">
          {Object.entries(nodeColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", color.bg.replace('/10', ''), color.glow)} />
              <span className="text-[9px] uppercase font-bold text-ash tracking-widest">{type}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-ash/40 group-hover:text-ash/70 transition-colors">
          <Fingerprint className="w-3.5 h-3.5" />
          <span className="text-[9px] uppercase font-bold tracking-[0.2em]">Universal Jnana Matrix</span>
        </div>
      </div>
    </Card>
  );
}
