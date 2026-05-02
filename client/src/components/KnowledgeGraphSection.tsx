import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const GRAPH_DATA = {
  nodes: [
    { id: 'consciousness', name: 'Consciousness', val: 20 },
    { id: 'ai-systems', name: 'AI Systems', val: 15 },
    { id: 'quantum', name: 'Quantum', val: 12 },
    { id: 'neural-nets', name: 'Neural Nets', val: 10 },
    { id: 'panpsychism', name: 'Panpsychism', val: 8 },
    { id: 'hard-problem', name: 'Hard Problem', val: 8 },
    { id: 'integrated-info', name: 'Integrated Info', val: 7 },
    { id: 'global-workspace', name: 'Global Workspace', val: 6 },
  ],
  links: [
    { source: 'consciousness', target: 'ai-systems' },
    { source: 'consciousness', target: 'quantum' },
    { source: 'consciousness', target: 'panpsychism' },
    { source: 'consciousness', target: 'hard-problem' },
    { source: 'ai-systems', target: 'neural-nets' },
    { source: 'ai-systems', target: 'integrated-info' },
    { source: 'quantum', target: 'neural-nets' },
    { source: 'quantum', target: 'integrated-info' },
    { source: 'hard-problem', target: 'integrated-info' },
    { source: 'hard-problem', target: 'global-workspace' },
    { source: 'panpsychism', target: 'quantum' },
    { source: 'integrated-info', target: 'global-workspace' },
  ]
};

export function KnowledgeGraphSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 400
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <section id="atman" className="py-24 lg:py-32 px-6 lg:px-12 bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <span className="text-xs font-mono text-[#C45A3B]">03 — Atman</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-4xl lg:text-5xl font-medium text-white mb-4"
        >
          Your Second Brain, Fully Realized.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[#6B7B6B] text-lg mb-8 max-w-lg"
        >
          Every idea connected. Every source traceable. Your knowledge as you've always imagined it.
        </motion.p>

        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="w-full h-[400px] border border-white/10 rounded overflow-hidden"
        >
          <ForceGraph2D
            graphData={GRAPH_DATA}
            nodeLabel="name"
            nodeColor={() => '#FFFFFF'}
            nodeVal="val"
            linkColor={() => '#FFFFFF20'}
            backgroundColor="#1A1A1A"
            width={dimensions.width}
            height={dimensions.height}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-xs font-mono text-[#6B7B6B] mt-4"
        >
          Sample: Consciousness in Artificial Systems — 47 interconnected concepts
        </motion.p>
      </div>
    </section>
  );
}