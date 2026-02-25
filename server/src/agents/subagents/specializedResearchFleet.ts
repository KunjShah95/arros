/**
 * Specialized Research Fleet - Multiple Research Agents for Different Domains
 *
 * This module extends the research capabilities with domain-specific agents:
 *
 * - WebResearchAgent: General web search for broad information
 * - AcademicResearchAgent: Peer-reviewed papers and scholarly sources
 * - CodeResearchAgent: GitHub repositories and code examples
 * - NewsResearchAgent: Current events and breaking news
 * - PatentResearchAgent: Technical patents and innovations
 * - VideoResearchAgent: Educational videos and tutorials
 * - BookResearchAgent: Books and long-form literature
 * - ForumResearchAgent: StackOverflow, Reddit discussions
 */

import { toolExecutor } from '../../tools/executor';
import type { SourceResult, Claim } from '../../types';
import { prisma } from '../../services/prisma';
import { v4 as uuid } from 'uuid';
import { llmService } from '../../services/llm';

// ─── Search Result Interface ───────────────────────────────────────────────────

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  relevance: number;
  source: string;
  author?: string;
  publicationDate?: string;
  citationCount?: number;
}

// ─── Abstract Base Class ──────────────────────────────────────────────────────

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
        author: result.author,
        publicationDate: result.publicationDate,
        citationCount: result.citationCount,
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
      skipDuplicates: true,
    });

    return { sources, claims };
  }

  protected calculateReliability(result: SearchResult): number {
    const highAuthorityDomains = ['edu', 'gov', 'org', 'arxiv', 'scholar.google', 'ncbi.nlm.gov'];
    const url = result.url.toLowerCase();

    for (const domain of highAuthorityDomains) {
      if (url.includes(domain)) {
        return 0.95;
      }
    }

    // Check for known reliable sources
    const trustedSources = ['wikipedia.org', 'britannica.com', 'plato.stanford.edu'];
    for (const source of trustedSources) {
      if (url.includes(source)) {
        return 0.85;
      }
    }

    return result.relevance > 0.7 ? 0.7 : 0.5;
  }

  protected calculateBias(result: SearchResult): number {
    const biasedTerms = ['opinion', 'blog', 'commentary', 'analysis', 'subjective'];
    const content = (result.title + result.content).toLowerCase();

    for (const term of biasedTerms) {
      if (content.includes(term)) {
        return 0.3;
      }
    }

    // News source bias detection
    const url = result.url.toLowerCase();
    const leftBiasSources = ['msnbc', 'theonion', 'huffpost'];
    const rightBiasSources = ['fox', 'dailywire', 'nationalreview'];

    for (const source of leftBiasSources) {
      if (url.includes(source)) return -0.2;
    }
    for (const source of rightBiasSources) {
      if (url.includes(source)) return 0.2;
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

// ─── Web Research Agent ───────────────────────────────────────────────────────

export class WebResearchAgent extends BaseResearchAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'WebResearchAgent');
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

// ─── Academic Research Agent ──────────────────────────────────────────────────

export class AcademicResearchAgent extends BaseResearchAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'AcademicResearchAgent');
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
      author: item.authors?.join(', ') || item.author || undefined,
      publicationDate: item.publicationDate || item.year || undefined,
      citationCount: item.citationCount,
    }));
  }

  getSourceType(): SourceResult['type'] {
    return 'paper';
  }

  protected calculateReliability(result: SearchResult): number {
    const baseReliability = super.calculateReliability(result);

    // arXiv and PubMed are extremely reliable
    if (result.url.includes('arxiv.org') || result.url.includes('pubmed')) {
      return 0.95;
    }

    // DOI-based sources are reliable
    if (result.url.includes('doi.org') || result.url.includes('dx.doi.org')) {
      return 0.92;
    }

    return Math.min(0.9, baseReliability + 0.2);
  }
}

// ─── Code Research Agent ──────────────────────────────────────────────────────

export class CodeResearchAgent extends BaseResearchAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'CodeResearchAgent');
  }

  async search(query: string, numResults: number): Promise<SearchResult[]> {
    // Enhance query for code search
    const codeQuery = `${query} code example implementation`;
    const result = await toolExecutor.execute('web_search', { query: codeQuery, numResults }, this.taskId);

    if (!result.success || !Array.isArray(result.data)) {
      return [];
    }

    return result.data
      .filter((item: any) =>
        item.url?.toLowerCase().includes('github.com') ||
        item.url?.toLowerCase().includes('stackoverflow.com') ||
        item.url?.toLowerCase().includes('gitlab.com')
      )
      .map((item: any) => ({
        title: item.title || 'Code Resource',
        url: item.url || '',
        content: item.content || item.snippet || '',
        relevance: 0.8,
        source: 'code',
      }));
  }

  getSourceType(): SourceResult['type'] {
    return 'github';
  }

  protected calculateReliability(result: SearchResult): number {
    const url = result.url.toLowerCase();

    // GitHub repos with stars are more reliable
    if (url.includes('github.com')) {
      // This would need additional API call to get star count
      return 0.75;
    }

    // StackOverflow answers
    if (url.includes('stackoverflow.com')) {
      return 0.7;
    }

    return 0.6;
  }
}

// ─── News Research Agent ──────────────────────────────────────────────────────

export class NewsResearchAgent extends BaseResearchAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'NewsResearchAgent');
  }

  async search(query: string, numResults: number): Promise<SearchResult[]> {
    // Add time-sensitive terms for news
    const currentYear = new Date().getFullYear();
    const newsQuery = `${query} ${currentYear} latest updates news`;
    const result = await toolExecutor.execute('web_search', { query: newsQuery, numResults }, this.taskId);

    if (!result.success || !Array.isArray(result.data)) {
      return [];
    }

    const newsDomains = ['news', 'bloomberg', 'reuters', 'wsj', 'nytimes', 'techcrunch', 'cnn', 'bbc', 'npr'];

    return result.data
      .filter((item: any) =>
        newsDomains.some(d => item.url?.toLowerCase().includes(d)) ||
        item.content?.toLowerCase().includes(currentYear.toString()) ||
        item.content?.toLowerCase().includes('2024') ||
        item.content?.toLowerCase().includes('breaking')
      )
      .map((item: any) => ({
        title: item.title || 'News Article',
        url: item.url || '',
        content: item.content || item.snippet || '',
        relevance: 0.6,
        source: 'news',
        publicationDate: this.extractDate(item),
      }));
  }

  getSourceType(): SourceResult['type'] {
    return 'web';
  }

  protected calculateReliability(result: SearchResult): number {
    const trustedNewsSources = ['reuters', 'bloomberg', 'apnews', 'npr', 'bbc', 'cnn'];
    const url = result.url.toLowerCase();

    for (const source of trustedNewsSources) {
      if (url.includes(source)) {
        return 0.85;
      }
    }

    return 0.65;
  }

  private extractDate(item: any): string | undefined {
    // Try to extract date from content or metadata
    const content = (item.content || item.snippet || '').toLowerCase();
    const dateMatch = content.match(/\b(202[0-9]|202[0-9])\b/);
    return dateMatch ? dateMatch[0] : undefined;
  }
}

// ─── Patent Research Agent ────────────────────────────────────────────────────

export class PatentResearchAgent extends BaseResearchAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'PatentResearchAgent');
  }

  async search(query: string, numResults: number): Promise<SearchResult[]> {
    const patentQuery = `${query} patent filing application`;
    const result = await toolExecutor.execute('web_search', { query: patentQuery, numResults }, this.taskId);

    if (!result.success || !Array.isArray(result.data)) {
      return [];
    }

    return result.data
      .filter((item: any) =>
        item.url?.toLowerCase().includes('google.com/patents') ||
        item.url?.toLowerCase().includes('patents.google.com') ||
        item.url?.toLowerCase().includes('uspto.gov') ||
        item.url?.toLowerCase().includes('worldwide.espacenet.com')
      )
      .map((item: any) => ({
        title: item.title || 'Patent Document',
        url: item.url || '',
        content: item.content || item.snippet || '',
        relevance: 0.75,
        source: 'patent',
        author: this.extractInventors(item.title),
      }));
  }

  getSourceType(): SourceResult['type'] {
    return 'patent';
  }

  protected calculateReliability(result: SearchResult): number {
    const url = result.url.toLowerCase();
    if (url.includes('uspto.gov')) return 0.95;
    if (url.includes('google.com/patents')) return 0.9;
    return 0.7;
  }

  private extractInventors(title: string): string | undefined {
    // Patents often have inventor names in the title
    const match = title.match(/Inventors?:\s*([^\n]+)/i);
    return match ? match[1].trim() : undefined;
  }
}

// ─── Video Research Agent ─────────────────────────────────────────────────────

export class VideoResearchAgent extends BaseResearchAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'VideoResearchAgent');
  }

  async search(query: string, numResults: number): Promise<SearchResult[]> {
    const videoQuery = `${query} tutorial video explanation`;
    const result = await toolExecutor.execute('web_search', { query: videoQuery, numResults }, this.taskId);

    if (!result.success || !Array.isArray(result.data)) {
      return [];
    }

    return result.data
      .filter((item: any) =>
        item.url?.toLowerCase().includes('youtube.com') ||
        item.url?.toLowerCase().includes('vimeo.com') ||
        item.url?.toLowerCase().includes('youtu.be')
      )
      .map((item: any) => ({
        title: item.title || 'Educational Video',
        url: item.url || '',
        content: item.content || item.snippet || '',
        relevance: 0.65,
        source: 'video',
      }));
  }

  getSourceType(): SourceResult['type'] {
    return 'video';
  }

  protected calculateReliability(result: SearchResult): number {
    const url = result.url.toLowerCase();

    // Educational channels are more reliable
    if (url.includes('youtube.com') && (
      url.includes('khanacademy') ||
      url.includes('mitocw') ||
      url.includes('stanford') ||
      url.includes('harvard')
    )) {
      return 0.85;
    }

    return 0.6;
  }
}

// ─── Book Research Agent ──────────────────────────────────────────────────────

export class BookResearchAgent extends BaseResearchAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'BookResearchAgent');
  }

  async search(query: string, numResults: number): Promise<SearchResult[]> {
    const bookQuery = `${query} book PDF download free`;
    const result = await toolExecutor.execute('web_search', { query: bookQuery, numResults }, this.taskId);

    if (!result.success || !Array.isArray(result.data)) {
      return [];
    }

    return result.data
      .filter((item: any) =>
        item.url?.toLowerCase().includes('amazon.com') ||
        item.url?.toLowerCase().includes('goodreads.com') ||
        item.url?.toLowerCase().includes('librarygenesis') ||
        item.url?.toLowerCase().includes('epdf.pub')
      )
      .map((item: any) => ({
        title: item.title || 'Book',
        url: item.url || '',
        content: item.content || item.snippet || '',
        relevance: 0.7,
        source: 'book',
      }));
  }

  getSourceType(): SourceResult['type'] {
    return 'book';
  }

  protected calculateReliability(result: SearchResult): number {
    // Academic books from publishers are reliable
    const trustedPublishers = ['springer', 'elsevier', 'oup', 'cambridge.org', 'princeton.edu'];
    const url = result.url.toLowerCase();

    for (const publisher of trustedPublishers) {
      if (url.includes(publisher)) return 0.85;
    }

    return 0.65;
  }
}

// ─── Forum Research Agent ─────────────────────────────────────────────────────

export class ForumResearchAgent extends BaseResearchAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'ForumResearchAgent');
  }

  async search(query: string, numResults: number): Promise<SearchResult[]> {
    const forumQuery = `${query} discussion forum question answer`;
    const result = await toolExecutor.execute('web_search', { query: forumQuery, numResults }, this.taskId);

    if (!result.success || !Array.isArray(result.data)) {
      return [];
    }

    return result.data
      .filter((item: any) =>
        item.url?.toLowerCase().includes('stackoverflow.com') ||
        item.url?.toLowerCase().includes('reddit.com') ||
        item.url?.toLowerCase().includes('discourse') ||
        item.url?.toLowerCase().includes('quora.com')
      )
      .map((item: any) => ({
        title: item.title || 'Forum Discussion',
        url: item.url || '',
        content: item.content || item.snippet || '',
        relevance: 0.6,
        source: 'forum',
      }));
  }

  getSourceType(): SourceResult['type'] {
    return 'forum';
  }

  protected calculateReliability(result: SearchResult): number {
    const url = result.url.toLowerCase();

    // StackOverflow has high-quality answers
    if (url.includes('stackoverflow.com')) {
      return 0.65;
    }

    // Reddit varies widely by subreddit
    if (url.includes('reddit.com')) {
      return 0.5;
    }

    return 0.4;
  }
}

// ─── ResearchAgentFleet - Main Fleet Coordinator ──────────────────────────────

export class ResearchAgentFleet {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  /**
   * Run all research agents and aggregate results
   */
  async runAll(query: string): Promise<{ sources: SourceResult[], claims: Claim[] }> {
    const agents = [
      new WebResearchAgent(this.sessionId, `${this.taskId}_web`),
      new AcademicResearchAgent(this.sessionId, `${this.taskId}_academic`),
      new CodeResearchAgent(this.sessionId, `${this.taskId}_code`),
      new NewsResearchAgent(this.sessionId, `${this.taskId}_news`),
      new PatentResearchAgent(this.sessionId, `${this.taskId}_patent`),
      new VideoResearchAgent(this.sessionId, `${this.taskId}_video`),
      new BookResearchAgent(this.sessionId, `${this.taskId}_book`),
      new ForumResearchAgent(this.sessionId, `${this.taskId}_forum`),
    ];

    // Run all agents in parallel
    const results = await Promise.all(
      agents.map(agent =>
        agent.execute(query, 3).catch((err) => {
          console.warn(`[${agent.constructor.name}] Search failed:`, err.message);
          return { sources: [], claims: [] };
        })
      )
    );

    const allSources = results.flatMap(r => r.sources);
    const allClaims = results.flatMap(r => r.claims);

    // Deduplicate sources by URL
    const uniqueSources = allSources.filter((s, index, self) =>
      index === self.findIndex((t) => t.url === s.url)
    );

    return { sources: uniqueSources, claims: allClaims };
  }

  /**
   * Run targeted research agents based on query type
   */
  async runTargeted(query: string, types: string[]): Promise<{ sources: SourceResult[], claims: Claim[] }> {
    const agentMap: Record<string, new (sessionId: string, taskId: string) => BaseResearchAgent> = {
      web: WebResearchAgent,
      academic: AcademicResearchAgent,
      code: CodeResearchAgent,
      news: NewsResearchAgent,
      patent: PatentResearchAgent,
      video: VideoResearchAgent,
      book: BookResearchAgent,
      forum: ForumResearchAgent,
    };

    // If no types specified, infer from query
    const effectiveTypes = types.length > 0 ? types : this.inferQueryTypes(query);

    const agents = effectiveTypes.map(type => {
      const AgentClass = agentMap[type];
      return AgentClass ? new AgentClass(this.sessionId, `${this.taskId}_${type}`) : null;
    }).filter(Boolean) as BaseResearchAgent[];

    if (agents.length === 0) {
      return { sources: [], claims: [] };
    }

    const results = await Promise.all(
      agents.map(agent =>
        agent.execute(query, 4).catch((err) => {
          console.warn(`[${agent.constructor.name}] Search failed:`, err.message);
          return { sources: [], claims: [] };
        })
      )
    );

    return {
      sources: results.flatMap(r => r.sources),
      claims: results.flatMap(r => r.claims),
    };
  }

  /**
   * Infer query types based on keywords
   */
  private inferQueryTypes(query: string): string[] {
    const lower = query.toLowerCase();
    const types: string[] = [];

    if (lower.includes('paper') || lower.includes('study') || lower.includes('research') || lower.includes('academic')) {
      types.push('academic');
    }
    if (lower.includes('code') || lower.includes('implementation') || lower.includes('github') || lower.includes('program')) {
      types.push('code');
    }
    if (lower.includes('news') || lower.includes('latest') || lower.includes('recent') || lower.includes('breaking')) {
      types.push('news');
    }
    if (lower.includes('patent') || lower.includes('invention') || lower.includes('technology')) {
      types.push('patent');
    }
    if (lower.includes('video') || lower.includes('tutorial') || lower.includes('course')) {
      types.push('video');
    }
    if (lower.includes('book') || lower.includes('literature') || lower.includes('textbook')) {
      types.push('book');
    }
    if (lower.includes('forum') || lower.includes('discussion') || lower.includes('stackoverflow')) {
      types.push('forum');
    }

    // Default to web if no specific type detected
    if (types.length === 0) {
      types.push('web');
    }

    return types;
  }

  /**
   * Search for specific information types
   */
  async searchDefinitions(query: string): Promise<{ sources: SourceResult[], claims: Claim[] }> {
    return this.runTargeted(query, ['web', 'book', 'academic']);
  }

  async searchTechnicalDetails(query: string): Promise<{ sources: SourceResult[], claims: Claim[] }> {
    return this.runTargeted(query, ['code', 'patent', 'paper']);
  }

  async searchCurrentEvents(query: string): Promise<{ sources: SourceResult[], claims: Claim[] }> {
    return this.runTargeted(query, ['news', 'web', 'video']);
  }
}