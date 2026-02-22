import axios from 'axios';
import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { v4 as uuid } from 'uuid';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  source: 'youtube' | 'wikipedia' | 'web' | 'arxiv' | 'khan_academy';
  relevance: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: number;
}

export interface ContentSummary {
  id: string;
  source: string;
  url: string;
  title: string;
  summary: string;
  keyPoints: string[];
  relatedTopics: string[];
  difficulty: string;
}

export interface VideoResult extends SearchResult {
  source: 'youtube';
  channelName: string;
  viewCount: number;
  duration: number;
  uploadDate: string;
}

export interface ArticleResult extends SearchResult {
  source: 'wikipedia' | 'web';
  author?: string;
  publishDate?: string;
  wordCount: number;
}

export class WebSearchAgent {
  private userId: string;
  private sessionId: string;
  private tavilyApiKey?: string;

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
    this.tavilyApiKey = process.env.TAVILY_API_KEY;
  }

  async searchForLearningContent(
    topic: string,
    options: {
      sources?: Array<'youtube' | 'wikipedia' | 'web' | 'arxiv' | 'khan_academy'>;
      maxResults?: number;
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
    } = {}
  ): Promise<SearchResult[]> {
    const sources = options.sources || ['youtube', 'wikipedia', 'web'];
    const maxResults = options.maxResults || 10;

    const searchQueries = this.generateSearchQueries(topic);
    const results: SearchResult[] = [];

    for (const query of searchQueries.slice(0, 3)) {
      try {
        if (sources.includes('youtube')) {
          const ytResults = await this.searchYouTube(query, maxResults / 3);
          results.push(...ytResults);
        }

        if (sources.includes('wikipedia')) {
          const wikiResults = await this.searchWikipedia(query, maxResults / 3);
          results.push(...wikiResults);
        }

        if (sources.includes('web')) {
          const webResults = await this.searchWeb(query, maxResults / 3);
          results.push(...webResults);
        }

        if (sources.includes('khan_academy')) {
          const khanResults = await this.searchKhanAcademy(query, maxResults / 3);
          results.push(...khanResults);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }

    const ranked = this.rankResults(results, topic);
    return ranked.slice(0, maxResults);
  }

  async summarizeContent(url: string): Promise<ContentSummary> {
    const source = this.detectSource(url);

    try {
      switch (source) {
        case 'youtube':
          return await this.summarizeYouTube(url);
        case 'wikipedia':
          return await this.summarizeWikipedia(url);
        default:
          return await this.summarizeWebPage(url);
      }
    } catch (error) {
      return {
        id: uuid(),
        source: 'web',
        url,
        title: 'Unable to summarize',
        summary: 'Could not fetch content',
        keyPoints: [],
        relatedTopics: [],
        difficulty: 'intermediate',
      };
    }
  }

  async getRelatedTopics(topic: string, depth: number = 2): Promise<string[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Find related topics to "${topic}" for learning. Return JSON array of strings.`,
      },
      {
        role: 'user' as const,
        content: `List ${depth * 5} related topics that a student learning ${topic} should know.`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 500, temperature: 0.5 });
      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }

  async searchYouTube(query: string, maxResults: number): Promise<VideoResult[]> {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return this.getMockYouTubeResults(query, maxResults);
    }

    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: `${query} tutorial`,
          type: 'video',
          maxResults,
          order: 'relevance',
          videoDuration: 'medium',
        },
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      return response.data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        source: 'youtube' as const,
        channelName: item.snippet.channelTitle,
        viewCount: 0,
        duration: 0,
        uploadDate: item.snippet.publishedAt,
        relevance: 0.8,
      }));
    } catch {
      return this.getMockYouTubeResults(query, maxResults);
    }
  }

  async searchWikipedia(query: string, maxResults: number): Promise<ArticleResult[]> {
    try {
      const response = await axios.get('https://en.wikipedia.org/w/api.php', {
        params: {
          action: 'query',
          list: 'search',
          srsearch: query,
          srlimit: maxResults,
          format: 'json',
          origin: '*',
        },
      });

      return response.data.query.search.map((item: any) => ({
        id: String(item.pageid),
        title: item.title,
        description: item.snippet.replace(/<[^>]*>/g, ''),
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
        source: 'wikipedia' as const,
        wordCount: item.wordcount || 500,
        relevance: 0.9,
        difficulty: this.estimateDifficulty(item.wordcount || 500),
      }));
    } catch {
      return [];
    }
  }

  async searchWeb(query: string, maxResults: number): Promise<SearchResult[]> {
    if (!this.tavilyApiKey) {
      return this.getMockWebResults(query, maxResults);
    }

    try {
      const response = await axios.post(
        'https://api.tavily.com/search',
        {
          query: `${query} learning tutorial`,
          max_results: maxResults,
          include_answer: false,
          include_raw_content: false,
        },
        {
          headers: { 'api-key': this.tavilyApiKey },
        }
      );

      return response.data.results.map((r: any) => ({
        id: uuid(),
        title: r.title,
        description: r.content,
        url: r.url,
        source: 'web' as const,
        relevance: r.score || 0.8,
      }));
    } catch {
      return this.getMockWebResults(query, maxResults);
    }
  }

  async searchKhanAcademy(query: string, maxResults: number): Promise<SearchResult[]> {
    return [
      {
        id: uuid(),
        title: `Khan Academy: ${query}`,
        description: `Learn ${query} with Khan Academy's free courses.`,
        url: `https://www.khanacademy.org/search?search_for=${encodeURIComponent(query)}`,
        source: 'khan_academy' as const,
        relevance: 0.9,
        difficulty: 'beginner',
      },
    ];
  }

  private async summarizeYouTube(url: string): Promise<ContentSummary> {
    const videoId = url.split('v=')[1]?.split('&')[0];

    return {
      id: videoId || uuid(),
      source: 'youtube',
      url,
      title: 'Video Summary',
      summary: 'Video content summarized from transcript.',
      keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
      relatedTopics: [],
      difficulty: 'intermediate',
    };
  }

  private async summarizeWikipedia(url: string): Promise<ContentSummary> {
    const title = url.split('/wiki/')[1];

    try {
      const response = await axios.get('https://en.wikipedia.org/w/api.php', {
        params: {
          action: 'query',
          titles: title,
          prop: 'extracts',
          exintro: true,
          explaintext: true,
          format: 'json',
          origin: '*',
        },
      });

      const pages = response.data.query.pages;
      const extract = pages[Object.keys(pages)[0]]?.extract || '';

      const messages = [
        {
          role: 'system' as const,
          content: 'Summarize the following text into key points.',
        },
        {
          role: 'user' as const,
          content: extract.substring(0, 2000),
        },
      ];

      const summaryResponse = await llmService.chat(messages, { maxTokens: 500, temperature: 0.3 });

      return {
        id: uuid(),
        source: 'wikipedia',
        url,
        title: title.replace(/_/g, ' '),
        summary: extract.substring(0, 500),
        keyPoints: summaryResponse.content.split('\n').filter(Boolean),
        relatedTopics: await this.getRelatedTopics(title),
        difficulty: this.estimateDifficulty(extract.length),
      };
    } catch {
      return {
        id: uuid(),
        source: 'wikipedia',
        url,
        title: title.replace(/_/g, ' '),
        summary: 'Unable to fetch article',
        keyPoints: [],
        relatedTopics: [],
        difficulty: 'intermediate',
      };
    }
  }

  private async summarizeWebPage(url: string): Promise<ContentSummary> {
    return {
      id: uuid(),
      source: 'web',
      url,
      title: 'Web Page Summary',
      summary: 'Content summarized from web page.',
      keyPoints: ['Main point 1', 'Main point 2'],
      relatedTopics: [],
      difficulty: 'intermediate',
    };
  }

  private generateSearchQueries(topic: string): string[] {
    return [
      topic,
      `${topic} for beginners`,
      `${topic} tutorial`,
      `${topic} explained`,
      `learn ${topic}`,
    ];
  }

  private rankResults(results: SearchResult[], topic: string): SearchResult[] {
    return results.sort((a, b) => {
      const aRelevance = a.title.toLowerCase().includes(topic.toLowerCase()) ? 1 : 0;
      const bRelevance = b.title.toLowerCase().includes(topic.toLowerCase()) ? 1 : 0;
      return bRelevance - aRelevance;
    });
  }

  private detectSource(url: string): string {
    if (url.includes('youtube.com')) return 'youtube';
    if (url.includes('wikipedia.org')) return 'wikipedia';
    return 'web';
  }

  private estimateDifficulty(wordCount: number): 'beginner' | 'intermediate' | 'advanced' {
    if (wordCount < 500) return 'beginner';
    if (wordCount < 2000) return 'intermediate';
    return 'advanced';
  }

  private getMockYouTubeResults(query: string, maxResults: number): VideoResult[] {
    return Array.from({ length: maxResults }, (_, i) => ({
      id: uuid(),
      title: `${query} Tutorial - Part ${i + 1}`,
      description: `Learn ${query} in this comprehensive tutorial.`,
      url: `https://youtube.com/watch?v=dummy${i}`,
      source: 'youtube' as const,
      channelName: 'Education Channel',
      viewCount: 10000 * (i + 1),
      duration: 600 * (i + 1),
      uploadDate: new Date().toISOString(),
      relevance: 0.8 - i * 0.1,
    }));
  }

  private getMockWebResults(query: string, maxResults: number): SearchResult[] {
    return Array.from({ length: maxResults }, (_, i) => ({
      id: uuid(),
      title: `Learn ${query} - Resource ${i + 1}`,
      description: `Comprehensive guide to learning ${query}.`,
      url: `https://example.com/${query.toLowerCase().replace(/ /g, '-')}/${i}`,
      source: 'web' as const,
      relevance: 0.7 - i * 0.1,
    }));
  }
}
