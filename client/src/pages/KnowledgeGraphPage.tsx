import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Network,
    Share2,
    Download,
    Search,
    Fingerprint,
    Zap,
    ShieldAlert,
    Dna,
    ArrowRight,
    Sparkles,
    Info
} from 'lucide-react';
import { Card, Button, Badge, SanskritButton, Mandala, cn } from '../components/ui';
import { KnowledgeGraph } from '../components/KnowledgeGraph';
import { memoryApi } from '../services/api';
import type { KnowledgeNode, KnowledgeEdge } from '../types';

export function KnowledgeGraphPage() {
    const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
    const [edges, setEdges] = useState<KnowledgeEdge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);

    const handleNodeClick = (node: KnowledgeNode) => {
        setSelectedNode(node);
    };

    useEffect(() => {
        const fetchGraph = async () => {
            setIsLoading(true);
            try {
                const userId = 'guest';
                const data = await memoryApi.getKnowledgeGraph(userId) as any;

                const allNodes: KnowledgeNode[] = data.map((n: any) => ({
                    id: n.id,
                    type: n.type,
                    name: n.name,
                    description: n.description,
                    properties: n.properties,
                }));

                const allEdges: KnowledgeEdge[] = [];
                data.forEach((n: any) => {
                    if (n.edgesFrom) {
                        n.edgesFrom.forEach((e: any) => {
                            if (!allEdges.find(existing => existing.id === e.id)) {
                                allEdges.push({
                                    id: e.id,
                                    fromNodeId: e.fromNodeId,
                                    toNodeId: e.toNodeId,
                                    relation: e.relation,
                                    strength: e.strength,
                                });
                            }
                        });
                    }
                });

                setNodes(allNodes);
                setEdges(allEdges);
            } catch (error) {
                console.error('Failed to fetch knowledge graph:', error);
                // Mock data for demo/fallback
                if (nodes.length === 0) {
                    const mockNodes: KnowledgeNode[] = [
                        { id: '1', type: 'concept', name: 'Federated Learning', description: 'A machine learning technique that trains models across decentralized data sources.' },
                        { id: '2', type: 'fact', name: 'Data Privacy', description: 'Differential privacy ensures individual data points cannot be reconstructed.' },
                        { id: '3', type: 'entity', name: 'Healthcare AI', description: 'Applying LLMs to clinical datasets while maintaining HIPAA compliance.' },
                        { id: '4', type: 'claim', name: 'Efficiency Gain', description: 'Reduced communication overhead by 40% compared to central training.' },
                    ];
                    setNodes(mockNodes);
                    setEdges([
                        { id: 'e1', fromNodeId: '1', toNodeId: '2', relation: 'uses', strength: 0.8 },
                        { id: 'e2', fromNodeId: '1', toNodeId: '3', relation: 'applies to', strength: 0.9 },
                        { id: 'e3', fromNodeId: '1', toNodeId: '4', relation: 'results in', strength: 0.7 },
                    ]);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchGraph();
    }, []);

    const filteredNodes = nodes.filter(n =>
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            {/* Header Area */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 cut-card bg-gold/10 flex items-center justify-center border border-gold/20 text-gold">
                        <Network className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white tracking-tight italic">Jnana Vriksha</h1>
                        <p className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold">Universal Knowledge Graph</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <SanskritButton variant="outline" className="h-11 px-6 text-[10px]">
                        <Share2 className="w-3.5 h-3.5 mr-2" />
                        Share Matrix
                    </SanskritButton>
                    <SanskritButton variant="primary" className="h-11 px-6 text-[10px]">
                        <Download className="w-3.5 h-3.5 mr-2" />
                        Export Sutra
                    </SanskritButton>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_380px] gap-8 min-h-0">
                {/* Graph Visualization */}
                <div className="relative flex-1 min-h-[400px]">
                    {isLoading ? (
                        <Card className="h-full flex flex-col items-center justify-center cut-card cut-border bg-graphite/40">
                            <Mandala className="w-16 h-16 animate-spin opacity-10 mb-4" />
                            <span className="text-[10px] uppercase font-bold text-ash tracking-[0.3em]">Materializing Connections...</span>
                        </Card>
                    ) : (
                        <KnowledgeGraph
                            nodes={filteredNodes}
                            edges={edges}
                            onNodeClick={handleNodeClick}
                            activeNodeId={selectedNode?.id}
                        />
                    )}
                </div>

                {/* Sidebar Info & Analysis */}
                <div className="flex flex-col gap-6 overflow-hidden">
                    {/* Search & Filter */}
                    <Card className="p-6 cut-card cut-border bg-slate/40 space-y-6">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ash group-focus-within:text-gold transition-colors" />
                            <input
                                type="text"
                                placeholder="Search the Akasha..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-void border border-smoke/30 rounded-xl text-chalk placeholder:text-ash/40 focus:outline-none focus:border-gold/50 transition-all font-body text-sm"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {['Concept', 'Fact', 'Entity', 'Claim'].map(type => (
                                <Badge
                                    key={type}
                                    variant={type.toLowerCase() as any}
                                    className="px-3 py-1 cursor-pointer transition-transform hover:scale-105"
                                >
                                    {type}
                                </Badge>
                            ))}
                        </div>
                    </Card>

                    {/* Node Detail */}
                    <AnimatePresence mode="wait">
                        {selectedNode ? (
                            <motion.div
                                key={selectedNode.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <Card className="p-6 cut-card border-gold/40 bg-gold/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Zap className="w-12 h-12 text-gold" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 cut-card bg-void border border-gold/30 flex items-center justify-center text-gold">
                                            <Dna className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-gold tracking-widest leading-none mb-1">{selectedNode.type}</p>
                                            <h3 className="text-lg font-display font-bold text-white group-hover:text-gold transition-colors truncate max-w-[180px]">
                                                {selectedNode.name}
                                            </h3>
                                        </div>
                                    </div>
                                    <p className="text-sm text-silver leading-relaxed mb-6 font-body">
                                        {selectedNode.description || 'This node represents a foundational realization within your knowledge base.'}
                                    </p>
                                    <div className="flex gap-3">
                                        <SanskritButton variant="primary" className="h-10 text-[9px] flex-1">
                                            Deep Realization
                                        </SanskritButton>
                                        <button
                                            onClick={() => setSelectedNode(null)}
                                            className="px-4 py-2 cut-card bg-void text-ash text-[9px] font-bold uppercase hover:text-white transition-all"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </Card>
                            </motion.div>
                        ) : (
                            <Card className="p-10 cut-card border-smoke/10 bg-graphite/20 flex flex-col items-center justify-center text-center">
                                <Info className="w-8 h-8 text-ash/30 mb-4" />
                                <p className="text-xs uppercase font-bold text-ash tracking-widest">Select a node to reveal its Essence</p>
                            </Card>
                        )}
                    </AnimatePresence>

                    {/* Insights Hub */}
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-4 h-4 text-peacock" />
                            <h3 className="text-[10px] font-bold text-ash uppercase tracking-[0.3em]">Insights Dispatch</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
                            {[
                                { type: 'peacock', title: 'Dense Realization Cluster', desc: 'Your research on "Decentralized Systems" shows high synergy with "Privacy Protocols".' },
                                { type: 'saffron', title: 'Jnana Gap Found', desc: 'Missing connections between "Vedic Ethics" and "Modern Automation". Consider bridging these.' },
                                { type: 'gold', title: 'Contextual Evolution', desc: 'Your understanding of "Linear Algebra" has evolved into "Quantum Tensors" during the last session.' },
                            ].map((insight, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + (i * 0.1) }}
                                    className={cn(
                                        "p-4 cut-card border transition-colors",
                                        insight.type === 'peacock' ? "bg-peacock/5 border-peacock/20" :
                                            insight.type === 'saffron' ? "bg-saffron/5 border-saffron/20" : "bg-gold/5 border-gold/20"
                                    )}
                                >
                                    <h4 className={cn("text-xs font-bold mb-1", `text-${insight.type}`)}>{insight.title}</h4>
                                    <p className="text-[11px] text-silver leading-relaxed">{insight.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default KnowledgeGraphPage;
