import { toolExecutor } from '../../tools/executor';
import type { SourceResult, Claim } from '../../types';
import { prisma } from '../../services/prisma';
import { v4 as uuid } from 'uuid';

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  relevance: number;
  source: string;
}

export abstract class BaseResearchAgent {
  protected sessionId: string;
  protected taskId: string;
  protected agentName: string;

  constructor(sessionId: string, taskId: string, agentName: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
    this.agentName = agentName;
  }

  abstract search(query: string, numResults: number): Promise<SearchResult[]>;
  abstract getSourceType(): SourceResult['type'];

  async execute(query: string, numResults: number = 5): Promise<{ sources: SourceResult[], claims: Claim[] }> {
    const searchResults = await this.search(query, numResults);
    
    const sources: SourceResult[] = searchResults.map((result, idx) => ({
      id: `source_${this.agentName}_${Date.now()}_${idx}`,
      type: this.getSourceType(),
      title: result.title,
      url: result.url,
      content: result.content,
      reliability: this.calculateReliability(result),
      bias: this.calculateBias(result),
      metadata: {
        agent: this.agentName,
        relevance: result.relevance,
        source: result.source,
      },
    }));

    const claims = this.extractClaims(sources);

    await prisma.source.createMany({
      data: sources.map(s => ({
        sessionId: this.sessionId,
        type: s.type,
        title: s.title,
        url: s.url,
        content: s.content,
        reliability: s.reliability,
        bias: s.bias,
        metadata: s.metadata as any,
      })),
    });

    return { sources, claims };
  }

  protected calculateReliability(result: SearchResult): number {
    const highAuthorityDomains = ['edu', 'gov', 'org', 'arxiv', 'scholar.google'];
    const url = result.url.toLowerCase();
    
    for (const domain of highAuthorityDomains) {
      if (url.includes(domain)) {
        return 0.9;
      }
    }
    
    return result.relevance > 0.7 ? 0.7 : 0.5;
  }

  protected calculateBias(result: SearchResult): number {
    const biasedTerms = ['opinion', 'blog', 'commentary', 'analysis'];
    const content = (result.title + result.content).toLowerCase();
    
    for (const term of biasedTerms) {
      if (content.includes(term)) {
        return 0.3;
      }
    }
    
    return 0;
  }

  protected extractClaims(sources: SourceResult[]): Claim[] {
    const claims: Claim[] = [];
    
    for (const source of sources) {
      const sentences = source.content
        .split(/[.!?]+/)
        .filter(s => s.trim().length > 30 && s.trim().length < 300)
        .slice(0, 3);
      
      for (let i = 0; i < sentences.length; i++) {
        claims.push({
          id: `claim_${source.id}_${i}`,
          statement: sentences[i].trim(),
          evidence: [source.id],
          confidence: source.reliability,
        });
      }
    }
    
    return claims;
  }
}

export class WebSearchAgent extends BaseResearchAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'WebSearchAgent');
  }

  async search(query: string, numResults: number): Promise<SearchResult[]> {
    const result = await toolExecutor.execute('web_search', { query, numResults }, this.taskId);
    
    if (!result.success || !Array.isArray(result.data)) {
      return [];
    }

    return result.data.map((item: any) => ({
      title: item.title || 'Untitled',
      url: item.url || '',
      content: item.content || item.snippet || '',
      relevance: item.relevance || 0.7,
      source: 'web',
    }));
  }

  getSourceType(): SourceResult['type'] {
    return 'web';
  }
}

export class AcademicSearchAgent extends BaseResearchAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'AcademicSearchAgent');
  }

  async search(query: string, numResults: number): Promise<SearchResult[]> {
    const result = await toolExecutor.execute('paper_search', { query, numResults }, this.taskId);
    
    if (!result.success || !Array.isArray(result.data)) {
      return [];
    }

    return result.data.map((item: any) => ({
      title: item.title || 'Untitled Paper',
      url: item.url || item.pdfUrl || '',
      content: item.abstract || item.summary || item.content || '',
      relevance: item.citationCount ? Math.min(1, item.citationCount / 100) : 0.7,
      source: 'academic',
    }));
  }

  getSourceType(): SourceResult['type'] {
    return 'paper';
  }

  protected calculateReliability(result: SearchResult): number {
    const baseReliability = super.calculateReliability(result);
    if (result.url.includes('arxiv.org') || result.url.includes('pubmed')) {
      return 0.95;
    }
    return Math.min(0.9, baseReliability + 0.2);
  }
}

export class CodeSearchAgent extends BaseResearchAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'CodeSearchAgent');
  }

  async search(query: string, numResults: number): Promise<SearchResult[]> {
    const codeQuery = `${query} github site:github.com`;
    const result = await toolExecutor.execute('web_search', { query: codeQuery, numResults }, this.taskId);
    
    if (!result.success || !Array.isArray(result.data)) {
      return [];
    }

    return result.data
      .filter((item: any) => 
        item.url?.includes('github.com') || 
        item.url?.includes('stackoverflow.com')
      )
      .map((item: any) => ({
        title: item.title || 'Code Resource',
        url: item.url || '',
        content: item.content || item.snippet || '',
        relevance: 0.7,
        source: 'code',
      }));
  }

  getSourceType(): SourceResult['type'] {
    return 'github';
  }
}

export class NewsSearchAgent extends BaseResearchAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'NewsSearchAgent');
  }

  async search(query: string, numResults: number): Promise<SearchResult[]> {
    const newsQuery = `${query} latest news`;
    const result = await toolExecutor.execute('web_search', { query: newsQuery, numResults }, this.taskId);
    
    if (!result.success || !Array.isArray(result.data)) {
      return [];
    }

    const newsDomains = ['news', 'bloomberg', 'reuters', 'wsj', 'nytimes', 'techcrunch'];
    
    return result.data
      .filter((item: any) => 
        newsDomains.some(d => item.url?.toLowerCase().includes(d)) ||
        item.content?.toLowerCase().includes('2024') ||
        item.content?.toLowerCase().includes('2025')
      )
      .map((item: any) => ({
        title: item.title || 'News Article',
        url: item.url || '',
        content: item.content || item.snippet || '',
        relevance: 0.6,
        source: 'news',
      }));
  }

  getSourceType(): SourceResult['type'] {
    return 'web';
  }

  protected calculateReliability(result: SearchResult): number {
    const trustedNewsSources = ['reuters', 'bloomberg', 'apnews', 'npr'];
    const url = result.url.toLowerCase();
    
    for (const source of trustedNewsSources) {
      if (url.includes(source)) {
        return 0.85;
      }
    }
    
    return 0.6;
  }
}

export class ResearchAgentFleet {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  async runAll(query: string): Promise<{ sources: SourceResult[], claims: Claim[] }> {
    const agents = [
      new WebSearchAgent(this.sessionId, `${this.taskId}_web`),
      new AcademicSearchAgent(this.sessionId, `${this.taskId}_academic`),
      new CodeSearchAgent(this.sessionId, `${this.taskId}_code`),
      new NewsSearchAgent(this.sessionId, `${this.taskId}_news`),
    ];

    const results = await Promise.all(
      agents.map(agent => agent.execute(query, 3).catch(() => ({ sources: [], claims: [] })))
    );

    const allSources = results.flatMap(r => r.sources);
    const allClaims = results.flatMap(r => r.claims);

    return { sources: allSources, claims: allClaims };
  }

  async runTargeted(query: string, types: ('web' | 'academic' | 'code' | 'news')[]): Promise<{ sources: SourceResult[], claims: Claim[] }> {
    const agentMap = {
      web: WebSearchAgent,
      academic: AcademicSearchAgent,
      code: CodeSearchAgent,
      news: NewsSearchAgent,
    };

    const agents = types.map(type => 
      new agentMap[type](this.sessionId, `${this.taskId}_${type}`)
    );

    const results = await Promise.all(
      agents.map(agent => agent.execute(query, 4).catch(() => ({ sources: [], claims: [] })))
    );

    return {
      sources: results.flatMap(r => r.sources),
      claims: results.flatMap(r => r.claims),
    };
  }
}
