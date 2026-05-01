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
import { Card, Button, Badge, cn } from '../components/ui';
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
        <div className="h-full flex flex-col p-6 overflow-hidden" style={{ backgroundColor: '#FAFAFA' }}>
            {/* Header Area */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1A1A1A', color: '#FAFAFA' }}>
                        <Network className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-semibold" style={{ color: '#1A1A1A' }}>Knowledge Graph</h1>
                        <p className="text-[10px] uppercase tracking-[0.4em]" style={{ color: '#666' }}>Universal Knowledge Graph</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="h-11 px-6 text-[10px]">
                        <Share2 className="w-3.5 h-3.5 mr-2" />
                        Share
                    </Button>
                    <Button variant="primary" className="h-11 px-6 text-[10px]">
                        <Download className="w-3.5 h-3.5 mr-2" />
                        Export
                    </Button>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_380px] gap-8 min-h-0">
                {/* Graph Visualization */}
                <div className="relative flex-1 min-h-[400px]">
                    {isLoading ? (
                        <Card className="h-full flex flex-col items-center justify-center" variant="elevated">
                            <p className="text-sm" style={{ color: '#666' }}>Loading...</p>
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
                    <Card className="p-6 space-y-6" variant="elevated">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#666' }} />
                            <input
                                type="text"
                                placeholder="Search the graph..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl border placeholder:text-gray-400 focus:outline-none focus:border-gray-400 text-sm"
                                style={{ backgroundColor: '#FAFAFA', borderColor: '#E0E0E0', color: '#1A1A1A' }}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {['Concept', 'Fact', 'Entity', 'Claim'].map(type => (
                                <Badge
                                    key={type}
                                    variant="neutral"
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
                                <Card className="p-6 relative overflow-hidden group" variant="elevated">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F5F5F5', border: '1px solid #E0E0E0', color: '#1A1A1A' }}>
                                            <Dna className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold tracking-widest leading-none mb-1" style={{ color: '#666' }}>{selectedNode.type}</p>
                                            <h3 className="text-lg font-semibold truncate max-w-[180px]" style={{ color: '#1A1A1A' }}>
                                                {selectedNode.name}
                                            </h3>
                                        </div>
                                    </div>
                                    <p className="text-sm leading-relaxed mb-6" style={{ color: '#666' }}>
                                        {selectedNode.description || 'This node represents a foundational realization within your knowledge base.'}
                                    </p>
                                    <div className="flex gap-3">
                                        <Button variant="primary" className="h-10 text-[9px] flex-1">
                                            Explore
                                        </Button>
                                        <button
                                            onClick={() => setSelectedNode(null)}
                                            className="px-4 py-2 rounded-lg text-[9px] font-bold uppercase hover:bg-gray-100 transition-all"
                                            style={{ backgroundColor: '#F5F5F5', color: '#666' }}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </Card>
                            </motion.div>
                        ) : (
                            <Card className="p-10 flex flex-col items-center justify-center text-center" variant="elevated">
                                <Info className="w-8 h-8 mb-4" style={{ color: '#CCC' }} />
                                <p className="text-xs uppercase font-bold tracking-widest" style={{ color: '#666' }}>Select a node to view details</p>
                            </Card>
                        )}
                    </AnimatePresence>

                    {/* Insights Hub */}
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-4 h-4" style={{ color: '#1A1A1A' }} />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: '#666' }}>Insights</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
                            {[
                                { type: 'blue', title: 'Dense Cluster', desc: 'Your research on "Decentralized Systems" shows high synergy with "Privacy Protocols".' },
                                { type: 'orange', title: 'Gap Found', desc: 'Missing connections between "Ethics" and "Automation".' },
                                { type: 'green', title: 'Contextual Evolution', desc: 'Your understanding has evolved during the last session.' },
                            ].map((insight, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + (i * 0.1) }}
                                    className="p-4 rounded-lg border transition-colors"
                                    style={{ backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' }}
                                >
                                    <h4 className="text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>{insight.title}</h4>
                                    <p className="text-[11px] leading-relaxed" style={{ color: '#666' }}>{insight.desc}</p>
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
