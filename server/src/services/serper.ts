import axios from 'axios';

export interface SerperResult {
  title: string;
  url: string;
  snippet: string;
  rating?: number;
}

export interface SerperSearchResponse {
  results: SerperResult[];
}

export class SerperClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SERPER_API_KEY || '';
  }

  async search(query: string, numResults: number = 10): Promise<SerperResult[]> {
    if (!this.apiKey) {
      console.warn('SERPER_API_KEY not configured, returning mock data');
      return this.getMockResults(query, numResults);
    }

    try {
      const response = await axios.post(
        'https://google.serper.dev/search',
        {
          q: query,
          num: numResults,
        },
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      const organic = response.data.organic || [];
      return organic.map((item: { title: string; link: string; snippet: string }) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
      }));
    } catch (error) {
      console.error('Serper search error:', error);
      return this.getMockResults(query, numResults);
    }
  }

  async searchImages(query: string, numResults: number = 10): Promise<SerperResult[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await axios.post(
        'https://google.serper.dev/images',
        {
          q: query,
          num: numResults,
        },
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      return (response.data.images || []).map((item: { title: string; imageUrl: string; snippet: string }) => ({
        title: item.title,
        url: item.imageUrl,
        snippet: item.snippet,
      }));
    } catch (error) {
      console.error('Serper image search error:', error);
      return [];
    }
  }

  private getMockResults(query: string, numResults: number): SerperResult[] {
    return Array.from({ length: numResults }, (_, i) => ({
      title: `${query} - Result ${i + 1}`,
      url: `https://example.com/result-${i + 1}`,
      snippet: `This is a mock result for "${query}". Configure SERPER_API_KEY for real results.`,
    }));
  }
}

export const serperClient = new SerperClient();
