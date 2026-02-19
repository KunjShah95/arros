import { prisma } from '../services/prisma';
import type { SourceResult } from '../types';
import { Prisma } from '@prisma/client';
import { serperClient, tavilyClient, firecrawlClient, semanticScholarClient } from '../services';

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  duration: number;
  cost: number;
}

export interface Tool {
  name: string;
  description: string;
  execute: (input: Record<string, unknown>) => Promise<ToolResult>;
}

class WebSearchTool implements Tool {
  name = 'web_search';
  description = 'Search the web for information using Serper and Tavily';

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const { query, numResults = 10 } = input;

      const [serperResults, tavilyResults] = await Promise.all([
        serperClient.search(query as string, Math.ceil((numResults as number) / 2)),
        tavilyClient.search(query as string, Math.ceil((numResults as number) / 2)),
      ]);

      interface MergedResult {
        title: string;
        url: string;
        snippet?: string;
        content?: string;
        score?: number;
      }

      const allResults: MergedResult[] = [
        ...serperResults.map(r => ({ ...r, score: 0.8 })),
        ...tavilyResults,
      ];

      const mergedResults = allResults
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, numResults as number);

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
        cost: 0.001 * (numResults as number),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        cost: 0,
      };
    }
  }
}

class WebFetchTool implements Tool {
  name = 'web_fetch';
  description = 'Fetch content from a specific URL using Firecrawl';

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const { url } = input;

      const firecrawlResult = await firecrawlClient.scrape(url as string);

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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        cost: 0,
      };
    }
  }
}

class PaperSearchTool implements Tool {
  name = 'paper_search';
  description = 'Search academic papers using Semantic Scholar API';

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const { query, maxResults = 8 } = input;

      // Search Semantic Scholar for real academic papers
      const papers = await semanticScholarClient.searchPapers(query as string, maxResults as number);

      const results = papers.map((paper) => ({
        title: paper.title,
        url: paper.url || (paper.externalIds?.ArXiv ? `https://arxiv.org/abs/${paper.externalIds.ArXiv}` : ''),
        snippet: paper.tldr?.text || paper.abstract?.substring(0, 300) || '',
        reliability: Math.min(0.98, 0.75 + (paper.citationCount || 0) / 1000),
        bias: 0,
        type: 'paper',
        metadata: {
          paperId: paper.paperId,
          year: paper.year,
          citationCount: paper.citationCount,
          authors: paper.authors?.map(a => a.name).join(', '),
          venue: paper.venue,
          doi: paper.externalIds?.DOI,
          arxivId: paper.externalIds?.ArXiv,
          openAccessUrl: paper.openAccessPdf?.url,
          fieldsOfStudy: paper.fieldsOfStudy,
          publicationDate: paper.publicationDate,
        },
      }));

      return {
        success: true,
        data: results,
        duration: Date.now() - startTime,
        cost: 0.001,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        cost: 0,
      };
    }
  }
}

class ArXivSearchTool implements Tool {
  name = 'arxiv_search';
  description = 'Search specifically for arXiv preprints and open-access papers';

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const { query, maxResults = 5 } = input;

      const papers = await semanticScholarClient.searchArXiv(query as string, maxResults as number);

      const results = papers.map((paper) => ({
        title: paper.title,
        url: paper.openAccessPdf?.url || paper.url || `https://arxiv.org/abs/${paper.externalIds?.ArXiv || ''}`,
        snippet: paper.tldr?.text || paper.abstract?.substring(0, 300) || '',
        reliability: Math.min(0.95, 0.80 + (paper.citationCount || 0) / 800),
        bias: 0,
        type: 'paper',
        metadata: {
          paperId: paper.paperId,
          year: paper.year,
          citationCount: paper.citationCount,
          authors: paper.authors?.map(a => a.name).join(', '),
          venue: paper.venue || 'arXiv preprint',
          arxivId: paper.externalIds?.ArXiv,
          openAccessUrl: paper.openAccessPdf?.url,
          isOpenAccess: true,
        },
      }));

      return {
        success: true,
        data: results,
        duration: Date.now() - startTime,
        cost: 0.001,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        cost: 0,
      };
    }
  }
}

class GitHubSearchTool implements Tool {
  name = 'github_search';
  description = 'Search GitHub repositories using Serper';

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const { query, type = 'repositories' } = input;

      const githubQuery = `${query} site:github.com`;
      const results = await serperClient.search(githubQuery, 10);

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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        cost: 0,
      };
    }
  }
}

class BlogSearchTool implements Tool {
  name = 'blog_search';
  description = 'Search blog posts and articles';

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const { query, maxResults = 10 } = input;

      const blogQuery = `${query} blog post`;
      const results = await serperClient.search(blogQuery, maxResults as number);

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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        cost: 0,
      };
    }
  }
}

class VectorStoreTool implements Tool {
  name = 'vector_store';
  description = 'Store and query vector embeddings (placeholder for Pinecone/Weaviate)';

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
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
      } else if (action === 'search') {
        console.log('Vector search: searching for', query);
        return {
          success: true,
          data: { results: [], query },
          duration: Date.now() - startTime,
          cost: 0.0002,
        };
      }

      return { success: false, error: 'Unknown action', duration: 0, cost: 0 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        cost: 0,
      };
    }
  }
}

class KnowledgeGraphTool implements Tool {
  name = 'knowledge_graph';
  description = 'Query and update knowledge graph in PostgreSQL';

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const { action, nodes, edges, query, userId } = input;

      if (action === 'add_nodes' && nodes) {
        const createdNodes = await Promise.all(
          (nodes as Array<{ name: string; type: string; description?: string }>).map(async (node) => {
            return prisma.knowledgeNode.create({
              data: {
                type: node.type,
                name: node.name,
                description: node.description,
              },
            });
          })
        );
        return {
          success: true,
          data: { added: createdNodes.length },
          duration: Date.now() - startTime,
          cost: 0.0002,
        };
      } else if (action === 'add_edges' && edges) {
        const createdEdges = await Promise.all(
          (edges as Array<{ fromNodeId: string; toNodeId: string; relation: string }>).map(async (edge) => {
            return prisma.knowledgeEdge.upsert({
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
          })
        );
        return {
          success: true,
          data: { added: createdEdges.length },
          duration: Date.now() - startTime,
          cost: 0.0002,
        };
      } else if (action === 'query' && query) {
        const foundNodes = await prisma.knowledgeNode.findMany({
          where: {
            OR: [
              { name: { contains: query as string, mode: 'insensitive' } },
              { description: { contains: query as string, mode: 'insensitive' } },
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        cost: 0,
      };
    }
  }
}

class ToolExecutor {
  private tools: Map<string, Tool> = new Map();
  private executionHistory: Map<string, unknown> = new Map();

  constructor() {
    this.registerTool(new WebSearchTool());
    this.registerTool(new WebFetchTool());
    this.registerTool(new PaperSearchTool());
    this.registerTool(new ArXivSearchTool());
    this.registerTool(new GitHubSearchTool());
    this.registerTool(new BlogSearchTool());
    this.registerTool(new VectorStoreTool());
    this.registerTool(new KnowledgeGraphTool());
  }

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  async execute(toolName: string, input: Record<string, unknown>, taskId?: string): Promise<ToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${toolName}`,
        duration: 0,
        cost: 0,
      };
    }

    const result = await tool.execute(input);

    if (taskId) {
      await prisma.toolExecution.create({
        data: {
          taskId,
          toolName,
          input: input as Prisma.InputJsonValue,
          output: result.data as Prisma.InputJsonValue | undefined,
          status: result.success ? 'success' : 'failed',
          error: result.error,
          duration: result.duration,
          cost: result.cost,
        },
      });
    }

    return result;
  }

  async executeMultiple(
    toolCalls: Array<{ tool: string; input: Record<string, unknown> }>,
    taskId?: string
  ): Promise<ToolResult[]> {
    return Promise.all(
      toolCalls.map(({ tool, input }) => this.execute(tool, input, taskId))
    );
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }
}

export const toolExecutor = new ToolExecutor();
