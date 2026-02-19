"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolExecutor = void 0;
const prisma_1 = require("../services/prisma");
const services_1 = require("../services");
class WebSearchTool {
    constructor() {
        this.name = 'web_search';
        this.description = 'Search the web for information using Serper and Tavily';
    }
    execute(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const { query, numResults = 10 } = input;
                const [serperResults, tavilyResults] = yield Promise.all([
                    services_1.serperClient.search(query, Math.ceil(numResults / 2)),
                    services_1.tavilyClient.search(query, Math.ceil(numResults / 2)),
                ]);
                const allResults = [
                    ...serperResults.map(r => (Object.assign(Object.assign({}, r), { score: 0.8 }))),
                    ...tavilyResults,
                ];
                const mergedResults = allResults
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .slice(0, numResults);
                const results = mergedResults.map((item) => ({
                    title: item.title,
                    url: item.url,
                    snippet: item.snippet || item.content || '',
                    reliability: (item.score || 0.7) + Math.random() * 0.2,
                    bias: (Math.random() - 0.5) * 0.3,
                }));
                return {
                    success: true,
                    data: results,
                    duration: Date.now() - startTime,
                    cost: 0.001 * numResults,
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: Date.now() - startTime,
                    cost: 0,
                };
            }
        });
    }
}
class WebFetchTool {
    constructor() {
        this.name = 'web_fetch';
        this.description = 'Fetch content from a specific URL using Firecrawl';
    }
    execute(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const { url } = input;
                const firecrawlResult = yield services_1.firecrawlClient.scrape(url);
                let content = '';
                let title = '';
                if (firecrawlResult.success && firecrawlResult.data) {
                    content = firecrawlResult.data.markdown || firecrawlResult.data.content;
                    title = firecrawlResult.data.title;
                }
                return {
                    success: true,
                    data: {
                        content,
                        title,
                        url,
                        metadata: {},
                    },
                    duration: Date.now() - startTime,
                    cost: 0.0005,
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: Date.now() - startTime,
                    cost: 0,
                };
            }
        });
    }
}
class PaperSearchTool {
    constructor() {
        this.name = 'paper_search';
        this.description = 'Search academic papers using Semantic Scholar API';
    }
    execute(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const { query, maxResults = 8 } = input;
                // Search Semantic Scholar for real academic papers
                const papers = yield services_1.semanticScholarClient.searchPapers(query, maxResults);
                const results = papers.map((paper) => {
                    var _a, _b, _c, _d, _e, _f, _g;
                    return ({
                        title: paper.title,
                        url: paper.url || (((_a = paper.externalIds) === null || _a === void 0 ? void 0 : _a.ArXiv) ? `https://arxiv.org/abs/${paper.externalIds.ArXiv}` : ''),
                        snippet: ((_b = paper.tldr) === null || _b === void 0 ? void 0 : _b.text) || ((_c = paper.abstract) === null || _c === void 0 ? void 0 : _c.substring(0, 300)) || '',
                        reliability: Math.min(0.98, 0.75 + (paper.citationCount || 0) / 1000),
                        bias: 0,
                        type: 'paper',
                        metadata: {
                            paperId: paper.paperId,
                            year: paper.year,
                            citationCount: paper.citationCount,
                            authors: (_d = paper.authors) === null || _d === void 0 ? void 0 : _d.map(a => a.name).join(', '),
                            venue: paper.venue,
                            doi: (_e = paper.externalIds) === null || _e === void 0 ? void 0 : _e.DOI,
                            arxivId: (_f = paper.externalIds) === null || _f === void 0 ? void 0 : _f.ArXiv,
                            openAccessUrl: (_g = paper.openAccessPdf) === null || _g === void 0 ? void 0 : _g.url,
                            fieldsOfStudy: paper.fieldsOfStudy,
                            publicationDate: paper.publicationDate,
                        },
                    });
                });
                return {
                    success: true,
                    data: results,
                    duration: Date.now() - startTime,
                    cost: 0.001,
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: Date.now() - startTime,
                    cost: 0,
                };
            }
        });
    }
}
class ArXivSearchTool {
    constructor() {
        this.name = 'arxiv_search';
        this.description = 'Search specifically for arXiv preprints and open-access papers';
    }
    execute(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const { query, maxResults = 5 } = input;
                const papers = yield services_1.semanticScholarClient.searchArXiv(query, maxResults);
                const results = papers.map((paper) => {
                    var _a, _b, _c, _d, _e, _f, _g;
                    return ({
                        title: paper.title,
                        url: ((_a = paper.openAccessPdf) === null || _a === void 0 ? void 0 : _a.url) || paper.url || `https://arxiv.org/abs/${((_b = paper.externalIds) === null || _b === void 0 ? void 0 : _b.ArXiv) || ''}`,
                        snippet: ((_c = paper.tldr) === null || _c === void 0 ? void 0 : _c.text) || ((_d = paper.abstract) === null || _d === void 0 ? void 0 : _d.substring(0, 300)) || '',
                        reliability: Math.min(0.95, 0.80 + (paper.citationCount || 0) / 800),
                        bias: 0,
                        type: 'paper',
                        metadata: {
                            paperId: paper.paperId,
                            year: paper.year,
                            citationCount: paper.citationCount,
                            authors: (_e = paper.authors) === null || _e === void 0 ? void 0 : _e.map(a => a.name).join(', '),
                            venue: paper.venue || 'arXiv preprint',
                            arxivId: (_f = paper.externalIds) === null || _f === void 0 ? void 0 : _f.ArXiv,
                            openAccessUrl: (_g = paper.openAccessPdf) === null || _g === void 0 ? void 0 : _g.url,
                            isOpenAccess: true,
                        },
                    });
                });
                return {
                    success: true,
                    data: results,
                    duration: Date.now() - startTime,
                    cost: 0.001,
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: Date.now() - startTime,
                    cost: 0,
                };
            }
        });
    }
}
class GitHubSearchTool {
    constructor() {
        this.name = 'github_search';
        this.description = 'Search GitHub repositories using Serper';
    }
    execute(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const { query, type = 'repositories' } = input;
                const githubQuery = `${query} site:github.com`;
                const results = yield services_1.serperClient.search(githubQuery, 10);
                const repos = results
                    .filter(r => r.url.includes('github.com'))
                    .map((result, idx) => ({
                    title: result.title,
                    url: result.url,
                    snippet: result.snippet,
                    reliability: 0.85,
                    bias: 0,
                    type: 'github',
                    metadata: {},
                }));
                return {
                    success: true,
                    data: repos,
                    duration: Date.now() - startTime,
                    cost: 0.001,
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: Date.now() - startTime,
                    cost: 0,
                };
            }
        });
    }
}
class BlogSearchTool {
    constructor() {
        this.name = 'blog_search';
        this.description = 'Search blog posts and articles';
    }
    execute(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const { query, maxResults = 10 } = input;
                const blogQuery = `${query} blog post`;
                const results = yield services_1.serperClient.search(blogQuery, maxResults);
                const blogs = results.map((result, idx) => ({
                    title: result.title,
                    url: result.url,
                    snippet: result.snippet,
                    reliability: 0.6 + Math.random() * 0.2,
                    bias: (Math.random() - 0.5) * 0.4,
                    type: 'blog',
                    metadata: {},
                }));
                return {
                    success: true,
                    data: blogs,
                    duration: Date.now() - startTime,
                    cost: 0.0008,
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: Date.now() - startTime,
                    cost: 0,
                };
            }
        });
    }
}
class VectorStoreTool {
    constructor() {
        this.name = 'vector_store';
        this.description = 'Store and query vector embeddings (placeholder for Pinecone/Weaviate)';
    }
    execute(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const { action, query, embedding, topK = 5 } = input;
                if (action === 'store') {
                    console.log('Vector store: storing embedding for', query);
                    return {
                        success: true,
                        data: { stored: true, query },
                        duration: Date.now() - startTime,
                        cost: 0.0001,
                    };
                }
                else if (action === 'search') {
                    console.log('Vector search: searching for', query);
                    return {
                        success: true,
                        data: { results: [], query },
                        duration: Date.now() - startTime,
                        cost: 0.0002,
                    };
                }
                return { success: false, error: 'Unknown action', duration: 0, cost: 0 };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: Date.now() - startTime,
                    cost: 0,
                };
            }
        });
    }
}
class KnowledgeGraphTool {
    constructor() {
        this.name = 'knowledge_graph';
        this.description = 'Query and update knowledge graph in PostgreSQL';
    }
    execute(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const { action, nodes, edges, query, userId } = input;
                if (action === 'add_nodes' && nodes) {
                    const createdNodes = yield Promise.all(nodes.map((node) => __awaiter(this, void 0, void 0, function* () {
                        return prisma_1.prisma.knowledgeNode.create({
                            data: {
                                type: node.type,
                                name: node.name,
                                description: node.description,
                            },
                        });
                    })));
                    return {
                        success: true,
                        data: { added: createdNodes.length },
                        duration: Date.now() - startTime,
                        cost: 0.0002,
                    };
                }
                else if (action === 'add_edges' && edges) {
                    const createdEdges = yield Promise.all(edges.map((edge) => __awaiter(this, void 0, void 0, function* () {
                        return prisma_1.prisma.knowledgeEdge.upsert({
                            where: {
                                fromNodeId_toNodeId_relation: {
                                    fromNodeId: edge.fromNodeId,
                                    toNodeId: edge.toNodeId,
                                    relation: edge.relation,
                                },
                            },
                            update: {},
                            create: edge,
                        });
                    })));
                    return {
                        success: true,
                        data: { added: createdEdges.length },
                        duration: Date.now() - startTime,
                        cost: 0.0002,
                    };
                }
                else if (action === 'query' && query) {
                    const foundNodes = yield prisma_1.prisma.knowledgeNode.findMany({
                        where: {
                            OR: [
                                { name: { contains: query, mode: 'insensitive' } },
                                { description: { contains: query, mode: 'insensitive' } },
                            ],
                        },
                        include: {
                            edgesFrom: true,
                            edgesTo: true,
                        },
                        take: 10,
                    });
                    return {
                        success: true,
                        data: { results: foundNodes },
                        duration: Date.now() - startTime,
                        cost: 0.0003,
                    };
                }
                return { success: false, error: 'Unknown action or missing parameters', duration: 0, cost: 0 };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: Date.now() - startTime,
                    cost: 0,
                };
            }
        });
    }
}
class ToolExecutor {
    constructor() {
        this.tools = new Map();
        this.executionHistory = new Map();
        this.registerTool(new WebSearchTool());
        this.registerTool(new WebFetchTool());
        this.registerTool(new PaperSearchTool());
        this.registerTool(new ArXivSearchTool());
        this.registerTool(new GitHubSearchTool());
        this.registerTool(new BlogSearchTool());
        this.registerTool(new VectorStoreTool());
        this.registerTool(new KnowledgeGraphTool());
    }
    registerTool(tool) {
        this.tools.set(tool.name, tool);
    }
    execute(toolName, input, taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tool = this.tools.get(toolName);
            if (!tool) {
                return {
                    success: false,
                    error: `Tool not found: ${toolName}`,
                    duration: 0,
                    cost: 0,
                };
            }
            const result = yield tool.execute(input);
            if (taskId) {
                yield prisma_1.prisma.toolExecution.create({
                    data: {
                        taskId,
                        toolName,
                        input: input,
                        output: result.data,
                        status: result.success ? 'success' : 'failed',
                        error: result.error,
                        duration: result.duration,
                        cost: result.cost,
                    },
                });
            }
            return result;
        });
    }
    executeMultiple(toolCalls, taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.all(toolCalls.map(({ tool, input }) => this.execute(tool, input, taskId)));
        });
    }
    getAvailableTools() {
        return Array.from(this.tools.keys());
    }
}
exports.toolExecutor = new ToolExecutor();
