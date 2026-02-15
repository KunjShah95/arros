import axios from 'axios';

export interface FirecrawlResult {
  content: string;
  markdown: string;
  title: string;
  description?: string;
  url: string;
  statusCode: number;
}

export interface FirecrawlResponse {
  success: boolean;
  data?: FirecrawlResult;
  error?: string;
}

export class FirecrawlClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FIRECRAWL_API_KEY || '';
    this.baseUrl = process.env.FIRECRAWL_BASE_URL || 'https://api.firecrawl.dev';
  }

  async scrape(url: string): Promise<FirecrawlResponse> {
    if (!this.apiKey) {
      console.warn('FIRECRAWL_API_KEY not configured, using fallback');
      return this.getMockScrape(url);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/scrape`,
        { url, formats: ['markdown', 'html', 'text'] },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data.success) {
        return {
          success: true,
          data: {
            content: response.data.data?.text || '',
            markdown: response.data.data?.markdown || '',
            title: response.data.data?.title || '',
            description: response.data.data?.description,
            url,
            statusCode: 200,
          },
        };
      }

      return { success: false, error: response.data.error };
    } catch (error) {
      console.error('Firecrawl scrape error:', error);
      return this.getMockScrape(url);
    }
  }

  async crawl(url: string, limit: number = 10): Promise<{ success: boolean; data?: FirecrawlResult[]; error?: string }> {
    if (!this.apiKey) {
      console.warn('FIRECRAWL_API_KEY not configured');
      return { success: false, error: 'API key not configured' };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/crawl`,
        { url, limit, formats: ['markdown', 'html', 'text'] },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data?.map((item: { markdown: string; title: string; url: string; statusCode: number }) => ({
            content: item.markdown || '',
            markdown: item.markdown || '',
            title: item.title || '',
            url: item.url,
            statusCode: item.statusCode,
          })),
        };
      }

      return { success: false, error: response.data.error };
    } catch (error) {
      console.error('Firecrawl crawl error:', error);
      return { success: false, error: 'Crawl failed' };
    }
  }

  private getMockScrape(url: string): FirecrawlResponse {
    return {
      success: true,
      data: {
        content: `This is mock scraped content from ${url}. Configure FIRECRAWL_API_KEY for real content.`,
        markdown: `# Mock Content\n\nThis is mock scraped content from ${url}.`,
        title: 'Mock Page Title',
        url,
        statusCode: 200,
      },
    };
  }
}

export const firecrawlClient = new FirecrawlClient();
