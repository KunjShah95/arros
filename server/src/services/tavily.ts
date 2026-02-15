import axios from 'axios';

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

export class TavilyClient {
  private apiKey: string;
  private baseUrl = 'https://api.tavily.com';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TAVILY_API_KEY || '';
  }

  async search(query: string, maxResults: number = 10): Promise<TavilyResult[]> {
    if (!this.apiKey) {
      console.warn('TAVILY_API_KEY not configured, returning mock data');
      return this.getMockResults(query, maxResults);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/search`,
        {
          query,
          max_results: maxResults,
          include_answer: true,
          include_raw_content: false,
          include_images: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          params: {
            api_key: this.apiKey,
          },
        }
      );

      return (response.data.results || []).map((result: { title: string; url: string; content: string; score: string; published_date?: string }) => ({
        title: result.title,
        url: result.url,
        content: result.content,
        score: parseFloat(result.score) || 0.5,
        published_date: result.published_date,
      }));
    } catch (error) {
      console.error('Tavily search error:', error);
      return this.getMockResults(query, maxResults);
    }
  }

  private getMockResults(query: string, maxResults: number): TavilyResult[] {
    return Array.from({ length: maxResults }, (_, i) => ({
      title: `${query} - Result ${i + 1}`,
      url: `https://example.com/result-${i + 1}`,
      content: `This is mock content for "${query}". Configure TAVILY_API_KEY for real results.`,
      score: 0.9 - i * 0.05,
    }));
  }
}

export const tavilyClient = new TavilyClient();
