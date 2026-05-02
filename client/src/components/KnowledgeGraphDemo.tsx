import { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface GraphNode {
  id: string;
  name: string;
  val: number;
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const SAMPLE_DATA: GraphData = {
  nodes: [
    { id: 'consciousness', name: 'Consciousness', val: 20, color: '#ff7b00' },
    { id: 'artificial-systems', name: 'Artificial Systems', val: 15, color: '#ff7b00' },
    { id: 'quantum', name: 'Quantum Mechanics', val: 12, color: '#00e5c9' },
    { id: 'neural-networks', name: 'Neural Networks', val: 10, color: '#00e5c9' },
    { id: 'panpsychism', name: 'Panpsychism', val: 8, color: '#d4af37' },
    { id: 'hard-problem', name: 'Hard Problem', val: 8, color: '#d4af37' },
    { id: 'integrated-info', name: 'Integrated Information', val: 7, color: '#d4af37' },
    { id: 'global-workspace', name: 'Global Workspace', val: 6, color: '#d4af37' },
  ],
  links: [
    { source: 'consciousness', target: 'artificial-systems' },
    { source: 'consciousness', target: 'quantum' },
    { source: 'consciousness', target: 'panpsychism' },
    { source: 'consciousness', target: 'hard-problem' },
    { source: 'artificial-systems', target: 'neural-networks' },
    { source: 'artificial-systems', target: 'integrated-info' },
    { source: 'quantum', target: 'neural-networks' },
    { source: 'quantum', target: 'integrated-info' },
    { source: 'hard-problem', target: 'integrated-info' },
    { source: 'hard-problem', target: 'global-workspace' },
    { source: 'panpsychism', target: 'quantum' },
    { source: 'integrated-info', target: 'global-workspace' },
  ]
};

export function KnowledgeGraphDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-[400px] bg-[#121214] border border-white/10 rounded-lg overflow-hidden">
      <ForceGraph2D
        graphData={SAMPLE_DATA}
        nodeLabel="name"
        nodeColor={(node) => (node as GraphNode).color}
        nodeVal={(node) => (node as GraphNode).val}
        linkColor={() => '#ffffff20'}
        backgroundColor="#121214"
        width={dimensions.width}
        height={dimensions.height}
        cooldownTicks={100}
      />
    </div>
  );
}