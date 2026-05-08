import { prisma } from '../services/prisma';
import { llmService } from '../services/llm';
import type { AcademicCitation, SourceResult } from '../types';
import { z } from 'zod';

export interface CitationStyle {
  format: 'apa' | 'mla' | 'chicago' | 'ieee' | 'harvard' | 'bibtex' | 'vancouver';
  includeDOILinks: boolean;
}

export interface CitationManagerResult {
  citations: AcademicCitation[];
  bibliography: string;
  inTextCitations: string[];
  formattedSources: SourceResult[];
  bibtexEntries?: string[];
}

const CitationStyleSchema = z.object({
  format: z.enum(['apa', 'mla', 'chicago', 'ieee', 'harvard', 'bibtex', 'vancouver']),
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
    bibtex: z.string().optional(),
  })),
  bibliography: z.string(),
  inTextCitations: z.array(z.string()),
  bibtexEntries: z.array(z.string()).optional(),
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
    style: CitationStyle['format'] = 'ieee'
  ): Promise<CitationManagerResult> {
    if (sources.length === 0) {
      return this.emptyResult();
    }

    const sourcesText = sources
      .map((s, i) => `${i + 1}. Title: ${s.title}\n   URL: ${s.url}\n   Type: ${s.type}\n   Authors: ${s.metadata?.authors || 'Unknown'}\n   Year: ${s.metadata?.year || 'n.d.'}\n   Venue: ${s.metadata?.venue || 'n/a'}`)
      .join('\n\n');

    const messages = [
      {
        role: 'system' as const,
        content: `You are a citation management agent for ARROS (Academic Research OS). Your role is to format citations and generate bibliographies in various academic styles.

Supported citation styles:
- IEEE: [1] A. Author, "Title," Journal, vol. X, no. Y, pp. Z-Z, Month Year.
- APA (7th edition): Author, A. A. (Year). Title. Source. DOI
- MLA (9th edition): Author. "Title." Source, Year.
- Chicago (17th edition): Author. "Title." Source (Year).
- Harvard: Author (Year) 'Title', Source.
- BibTeX:
  @article{key,
    author={Author Name},
    title={Paper Title},
    journal={Journal Name},
    year={2024},
    volume={X},
    pages={Y--Z}
  }
- Vancouver: Author AA. Title. Journal. Year;X(Y):Z-Z.

For each source, generate:
1. Full citation in the requested style
2. In-text citation format
3. DOI link if available
4. BibTeX entry (if requesting bibtex style or always include)

Return JSON with:
- citations: Array of citation objects with index, title, authors, year, venue, url, citationText, bibtex
- bibliography: Complete bibliography formatted in the requested style
- inTextCitations: Array of in-text citation strings
- bibtexEntries: Array of BibTeX entries`,
      },
      {
        role: 'user' as const,
        content: `Format citations for these sources in ${style.toUpperCase()} style:

${sourcesText}

Generate proper citations with:
- Authors (format: Last, F. M. for IEEE, Vancouver; full names for others)
- Year of publication (if available)
- Title
- Source/Venue
- URL/DOI
- In-text citation format
- BibTeX entry`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 4000,
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
    const citations: AcademicCitation[] = sources.map((source, index) => {
      const bibtex = this.generateBibTeX(source, index + 1);
      return {
        index: index + 1,
        title: source.title,
        authors: source.metadata?.authors as string | undefined,
        year: source.metadata?.year as number | undefined,
        venue: source.metadata?.venue as string | undefined,
        url: source.url,
        citationText: this.formatCitationFallback(source, style, index + 1),
        bibtex,
      };
    });

    return {
      citations,
      bibliography: citations.map(c => c.citationText).join('\n\n'),
      inTextCitations: citations.map((_, i) => this.formatInTextFallback(i + 1, style)),
      formattedSources: sources,
      bibtexEntries: citations.map(c => c.bibtex || ''),
    };
  }

  private generateBibTeX(source: SourceResult, index: number): string {
    const authors = source.metadata?.authors as string | undefined || 'Unknown Author';
    const year = source.metadata?.year as number | undefined || new Date().getFullYear();
    const title = source.title;
    const venue = source.metadata?.venue as string | undefined || 'Journal';
    const url = source.url || '';
    const doi = source.metadata?.doi as string | undefined || '';

    const key = `ref${index}${authors.split(' ')[0] || 'author'}${year}`.replace(/[^a-zA-Z0-9]/g, '');

    return `@article{${key},
  author={${authors}},
  title={${title}},
  journal={${venue}},
  year={${year}},
  url={${url}}${doi ? `,\n  doi={${doi}}` : ''}
}`;
  }

  private formatCitationFallback(source: SourceResult, style: string, index: number): string {
    const authors = source.metadata?.authors as string | undefined || 'Unknown Author';
    const year = source.metadata?.year as number | undefined || 'n.d.';
    const title = source.title;
    const venue = source.metadata?.venue as string | undefined || '';
    const url = source.url || '';

    switch (style) {
      case 'ieee':
        return `[${index}] ${authors}, "${title}," ${venue || 'Source'}, ${year}.`;
      case 'apa':
        return `${authors} (${year}). ${title}. ${venue || url}.`;
      case 'mla':
        return `${authors}. "${title}." ${venue || url}, ${year}.`;
      case 'chicago':
        return `${authors}. "${title}." ${venue || 'Source'} (${year}).`;
      case 'harvard':
        return `${authors} (${year}) '${title}', ${venue || url}.`;
      case 'bibtex':
        return this.generateBibTeX(source, index);
      case 'vancouver':
        return `${this.formatAuthorsVancouver(authors)}. ${title}. ${venue || 'Source'}. ${year};${index}(${index}):${100 + index}-${105 + index}.`;
      default:
        return `${authors}. ${title}. ${url}`;
    }
  }

  private formatAuthorsVancouver(authors: string): string {
    const authorList = authors.split(/,|and/);
    if (authorList.length <= 6) {
      return authorList.map((a, i) => {
        const parts = a.trim().split(' ');
        if (parts.length >= 2) {
          return parts[parts.length - 1] + ' ' + parts.slice(0, -1).map(p => p[0] + '.').join(' ');
        }
        return a.trim();
      }).join(', ');
    }
    return `${authorList[0].trim()} et al.`;
  }

  private formatInTextFallback(index: number, style: string): string {
    switch (style) {
      case 'ieee':
        return `[${index}]`;
      case 'apa':
        return `(${index})`;
      case 'mla':
        return `(ref. ${index})`;
      case 'harvard':
        return `(ref. ${index})`;
      case 'vancouver':
        return `${index}`;
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
      bibtexEntries: [],
    };
  }

  async exportBibTeX(sources: SourceResult[]): Promise<string> {
    return sources
      .map((source, index) => this.generateBibTeX(source, index + 1))
      .join('\n\n');
  }
}
