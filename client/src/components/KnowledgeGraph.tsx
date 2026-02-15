import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Network, ZoomIn, ZoomOut, RotateCcw, Hexagon, Circle, Square, Triangle } from 'lucide-react';
import { Card, Button } from './ui';
import type { KnowledgeNode, KnowledgeEdge } from '../types';

const nodeIcons: Record<string, React.ElementType> = {
  concept: Hexagon,
  fact: Circle,
  entity: Square,
  claim: Triangle,
};

const nodeColors: Record<string, string> = {
  concept: 'bg-flame/20 border-flame/50 text-flame',
  fact: 'bg-mint/20 border-mint/50 text-mint',
  entity: 'bg-electric/20 border-electric/50 text-electric',
  claim: 'bg-warning/20 border-warning/50 text-warning',
};

interface KnowledgeGraphProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export function KnowledgeGraph({ nodes, edges }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.4));
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  if (nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-graphite flex items-center justify-center mx-auto mb-4">
            <Network className="w-8 h-8 text-ash" />
          </div>
          <p className="text-ash mb-1">No knowledge graph data yet</p>
          <p className="text-sm text-ash/60">
            Complete research to build your knowledge graph
          </p>
        </div>
      </div>
    );
  }

  const centerX = 400;
  const centerY = 300;
  const radius = Math.min(200, nodes.length * 30);

  return (
    <Card className="h-full p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-flame/10 flex items-center justify-center">
            <Network className="w-4 h-4 text-flame" />
          </div>
          <h3 className="text-sm font-medium text-silver">Knowledge Graph</h3>
          <span className="text-xs text-ash">• {nodes.length} nodes</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-ash w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-void rounded-xl border border-smoke"
        style={{ 
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
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

            return (
              <line
                key={edge.id}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(255, 61, 0, 0.2)"
                strokeWidth={edge.strength * 2}
              />
            );
          })}
        </svg>

        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {nodes.map((node, index) => {
            const angle = (index / nodes.length) * 2 * Math.PI;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            const Icon = nodeIcons[node.type] || Circle;
            const colorClass = nodeColors[node.type] || nodeColors.concept;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="absolute cursor-pointer"
                style={{
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className={`px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm ${colorClass}`}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <p className="text-sm font-medium text-chalk whitespace-nowrap max-w-[150px] truncate">
                      {node.name.length > 20 ? node.name.slice(0, 20) + '...' : node.name}
                    </p>
                  </div>
                  <p className="text-xs text-ash/60 mt-1 capitalize text-center">
                    {node.type}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
