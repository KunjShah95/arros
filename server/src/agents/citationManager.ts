import { prisma } from '../services/prisma';
import { llmService } from '../services/llm';
import type { AcademicCitation, SourceResult } from '../types';
import { z } from 'zod';

export interface CitationStyle {
  format: 'apa' | 'mla' | 'chicago' | 'ieee' | 'harvard';
  includeDOILinks: boolean;
}

export interface CitationManagerResult {
  citations: AcademicCitation[];
  bibliography: string;
  inTextCitations: string[];
  formattedSources: SourceResult[];
}

const CitationStyleSchema = z.object({
  format: z.enum(['apa', 'mla', 'chicago', 'ieee', 'harvard']),
  includeDOILinks: z.boolean(),
});

const CitationManagerResultSchema = z.object({
  citations: z.array(z.object({
    index: z.number(),
    title: z.string(),
    authors: z.string().optional(),
    year: z.number().optional(),
    venue: z.string().optional(),
    url: z.string().optional(),
    citationText: z.string(),
  })),
  bibliography: z.string(),
  inTextCitations: z.array(z.string()),
});

export class CitationManagerAgent {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  async manageCitations(
    sources: SourceResult[],
    style: CitationStyle['format'] = 'apa'
  ): Promise<CitationManagerResult> {
    if (sources.length === 0) {
      return this.emptyResult();
    }

    const sourcesText = sources
      .map((s, i) => `${i + 1}. Title: ${s.title}\n   URL: ${s.url}\n   Type: ${s.type}`)
      .join('\n\n');

    const messages = [
      {
        role: 'system' as const,
        content: `You are a citation management agent for ARROS (Academic Research OS). Your role is to format citations and generate bibliographies in various academic styles.

Supported citation styles:
- APA (7th edition): Author, A. A. (Year). Title. Source. DOI
- MLA (9th edition): Author. "Title." Source, Year.
- Chicago (17th edition): Author. "Title." Source (Year).
- IEEE: [1] A. Author, "Title," Source, Year.
- Harvard: Author (Year) 'Title', Source.

For each source, generate:
1. Full citation in the requested style
2. In-text citation format
3. DOI link if available

Return JSON with:
- citations: Array of citation objects with index, title, authors, year, venue, url, citationText
- bibliography: Complete bibliography formatted in the requested style
- inTextCitations: Array of in-text citation strings
- formattedSources: The original sources formatted`,
      },
      {
        role: 'user' as const,
        content: `Format citations for these sources in ${style.toUpperCase()} style:

${sourcesText}

Generate proper citations with:
- Authors (format: Last, F. M.)
- Year of publication (if available)
- Title
- Source/Venue
- URL/DOI
- In-text citation format`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 3000,
        temperature: 0.3,
        model: 'gpt-4o-mini',
        responseFormat: CitationManagerResultSchema,
      });

      const result = CitationManagerResultSchema.parse(JSON.parse(response.content));

      await prisma.agentTask.update({
        where: { id: this.taskId },
        data: {
          status: 'completed',
          output: result as unknown as object,
          tokens: response.usage.totalTokens,
          cost: llmService.calculateCost(response.usage, 'gpt-4o-mini'),
        },
      });

      return {
        ...result,
        formattedSources: sources,
      };
    } catch (error) {
      console.error('Citation management failed, using fallback:', error);
      return this.fallbackFormat(sources, style);
    }
  }

  private fallbackFormat(sources: SourceResult[], style: CitationStyle['format']): CitationManagerResult {
    const citations: AcademicCitation[] = sources.map((source, index) => ({
      index: index + 1,
      title: source.title,
      authors: source.metadata?.authors as string | undefined,
      year: source.metadata?.year as number | undefined,
      venue: source.metadata?.venue as string | undefined,
      url: source.url,
      citationText: this.formatCitationFallback(source, style, index + 1),
    }));

    return {
      citations,
      bibliography: citations.map(c => c.citationText).join('\n\n'),
      inTextCitations: citations.map((_, i) => this.formatInTextFallback(i + 1, style)),
      formattedSources: sources,
    };
  }

  private formatCitationFallback(source: SourceResult, style: string, index: number): string {
    const authors = source.metadata?.authors as string | undefined || 'Unknown Author';
    const year = source.metadata?.year as number | undefined || 'n.d.';
    const title = source.title;
    const url = source.url;

    switch (style) {
      case 'apa':
        return `${authors} (${year}). ${title}. ${url}`;
      case 'mla':
        return `${authors}. "${title}." ${url}.`;
      case 'chicago':
        return `${authors}. "${title}." Accessed ${new Date().toISOString().split('T')[0]}. ${url}.`;
      case 'ieee':
        return `[${index}] ${authors}, "${title}," ${url}.`;
      case 'harvard':
        return `${authors} (${year}) '${title}', ${url}.`;
      default:
        return `${authors}. ${title}. ${url}`;
    }
  }

  private formatInTextFallback(index: number, style: string): string {
    switch (style) {
      case 'apa':
        return `(${index})`;
      case 'mla':
        return `(ref. ${index})`;
      case 'ieee':
        return `[${index}]`;
      case 'harvard':
        return `(ref. ${index})`;
      default:
        return `(${index})`;
    }
  }

  private emptyResult(): CitationManagerResult {
    return {
      citations: [],
      bibliography: '',
      inTextCitations: [],
      formattedSources: [],
    };
  }
}
