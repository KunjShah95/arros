import type { SynthesisResult, CritiqueResult, AcademicCitation } from '../../types';
import { prisma } from '../../services/prisma';
import { llmService } from '../../services/llm';
import { z } from 'zod';

export interface ContentSection {
  title: string;
  content: string;
  keyPoints: string[];
}

export class ContentGeneratorAgent {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  async generateIntroduction(query: string, claims: string[]): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Write a concise academic introduction for a research paper. Set context, explain why the topic matters, and outline the scope.',
      },
      {
        role: 'user' as const,
        content: `Write an introduction for: "${query}"

Key claims to incorporate:
${claims.slice(0, 5).join('\n')}`,
      },
    ];

    const response = await llmService.chat(messages, {
      maxTokens: 500,
      temperature: 0.4,
      model: 'gpt-4o-mini',
    });

    return response.content;
  }

  async generateConceptDefinitions(claims: string[]): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Extract and define key concepts from research claims. Write in clear academic prose.',
      },
      {
        role: 'user' as const,
        content: `Define key concepts from these claims:\n${claims.join('\n')}`,
      },
    ];

    const response = await llmService.chat(messages, {
      maxTokens: 800,
      temperature: 0.4,
      model: 'gpt-4o-mini',
    });

    return response.content;
  }

  async generateKeyFindings(claims: string[]): Promise<string[]> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Extract the most important findings from research claims. Format as bullet points. Each finding should be a single concise statement.',
      },
      {
        role: 'user' as const,
        content: `Extract key findings from:\n${claims.join('\n')}`,
      },
    ];

    const response = await llmService.chat(messages, {
      maxTokens: 600,
      temperature: 0.3,
      model: 'gpt-4o-mini',
    });

    return response.content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .slice(0, 7);
  }

  async generateApplications(claims: string[]): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Describe real-world applications based on research findings. Be specific and practical.',
      },
      {
        role: 'user' as const,
        content: `What are the applications of:\n${claims.join('\n')}`,
      },
    ];

    const response = await llmService.chat(messages, {
      maxTokens: 600,
      temperature: 0.4,
      model: 'gpt-4o-mini',
    });

    return response.content;
  }

  async generateChallenges(claims: string[], contradictions: number): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Identify challenges, limitations, and controversies from research. Be objective and balanced.',
      },
      {
        role: 'user' as const,
        content: `What are the challenges and limitations of:\n${claims.join('\n')}

Note: ${contradictions} contradiction(s) were found in the research.`,
      },
    ];

    const response = await llmService.chat(messages, {
      maxTokens: 600,
      temperature: 0.4,
      model: 'gpt-4o-mini',
    });

    return response.content;
  }

  async generateFutureDirections(claims: string[]): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Suggest future research directions based on current findings. Be specific about gaps and opportunities.',
      },
      {
        role: 'user' as const,
        content: `What are future research directions for:\n${claims.join('\n')}`,
      },
    ];

    const response = await llmService.chat(messages, {
      maxTokens: 500,
      temperature: 0.4,
      model: 'gpt-4o-mini',
    });

    return response.content;
  }

  async generateConclusion(claims: string[], confidence: number): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Write a concise academic conclusion that summarizes key findings and acknowledges limitations.',
      },
      {
        role: 'user' as const,
        content: `Write a conclusion based on ${claims.length} claims with ${(confidence * 100).toFixed(0)}% confidence.

Key points:
${claims.slice(0, 5).join('\n')}`,
      },
    ];

    const response = await llmService.chat(messages, {
      maxTokens: 400,
      temperature: 0.4,
      model: 'gpt-4o-mini',
    });

    return response.content;
  }
}

export class CitationFormatterAgent {
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async formatSources(
    sources: Array<{ title: string; url: string; type: string; metadata?: any }>,
    style: 'apa' | 'mla' | 'chicago' | 'ieee' | 'harvard' = 'apa'
  ): Promise<AcademicCitation[]> {
    const sourcesText = sources.map((s, i) => 
      `${i + 1}. ${s.title} | ${s.url} | ${s.type}`
    ).join('\n');

    const messages = [
      {
        role: 'system' as const,
        content: `Format citations in ${style.toUpperCase()} style. Extract author names, years, and format properly.`,
      },
      {
        role: 'user' as const,
        content: `Format these sources as citations:\n${sourcesText}`,
      },
    ];

    const CitationArraySchema = z.object({
      citations: z.array(z.object({
        index: z.number(),
        title: z.string(),
        authors: z.string().optional(),
        year: z.number().optional(),
        venue: z.string().optional(),
        url: z.string().optional(),
        citationText: z.string(),
      })),
    });

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 1500,
        temperature: 0.2,
        model: 'gpt-4o-mini',
        responseFormat: CitationArraySchema,
      });

      return CitationArraySchema.parse(JSON.parse(response.content)).citations;
    } catch (error) {
      return this.fallbackFormat(sources, style);
    }
  }

  private fallbackFormat(
    sources: Array<{ title: string; url: string; type: string; metadata?: any }>,
    style: string
  ): AcademicCitation[] {
    return sources.map((source, idx) => ({
      index: idx + 1,
      title: source.title,
      authors: source.metadata?.authors as string | undefined,
      year: source.metadata?.year as number | undefined,
      venue: source.metadata?.venue as string | undefined,
      url: source.url,
      citationText: this.formatSingle(source, style, idx + 1),
    }));
  }

  private formatSingle(source: any, style: string, index: number): string {
    const authors = source.metadata?.authors || 'Unknown Author';
    const year = source.metadata?.year || 'n.d.';
    const title = source.title;
    const url = source.url;

    switch (style) {
      case 'apa':
        return `${authors} (${year}). ${title}. ${url}`;
      case 'mla':
        return `${authors}. "${title}." ${url}.`;
      case 'ieee':
        return `[${index}] ${authors}, "${title}," ${url}.`;
      case 'harvard':
        return `${authors} (${year}) '${title}', ${url}.`;
      default:
        return `${authors}. ${title}. ${url}`;
    }
  }

  generateInTextCitations(count: number, style: string): string[] {
    const citations: string[] = [];
    
    for (let i = 1; i <= count; i++) {
      switch (style) {
        case 'apa':
        case 'harvard':
          citations.push(`(${i})`);
          break;
        case 'ieee':
          citations.push(`[${i}]`);
          break;
        case 'mla':
          citations.push(`(ref ${i})`);
          break;
        default:
          citations.push(`[${i}]`);
      }
    }
    
    return citations;
  }
}

export class StructureBuilderAgent {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  buildAcademicStructure(sections: ContentSection[]): string {
    const output: string[] = [];

    for (const section of sections) {
      output.push(`## ${section.title}\n`);
      output.push(section.content);
      output.push('\n');
      
      if (section.keyPoints.length > 0) {
        output.push('**Key Points:**\n');
        for (const point of section.keyPoints) {
          output.push(`- ${point}\n`);
        }
        output.push('\n');
      }
    }

    return output.join('');
  }

  buildKeyTakeaways(findings: string[]): string[] {
    return findings
      .filter(f => f.length > 20 && f.length < 150)
      .slice(0, 7)
      .map(f => f.replace(/^[•\-*]\s*/, '').trim());
  }

  buildFurtherReading(topic: string, findings: string[]): string[] {
    const suggestions = [
      `Systematic review on ${topic}`,
      `Recent advances in ${topic.split(' ').slice(0, 2).join(' ')}`,
      `Applications of ${topic.split(' ').slice(0, 2).join(' ')}`,
      `Challenges in ${topic.split(' ').slice(0, 2).join(' ')} research`,
      `${topic}: A comprehensive survey`,
    ];

    return suggestions.slice(0, 5);
  }

  buildSummary(intro: string, findings: string[], confidence: number): string {
    const summary = [
      `This research on "${intro.split('\n')[0].substring(0, 50)}..." examines key findings and implications.`,
      `\n**Summary:**`,
      ...findings.slice(0, 3).map(f => `- ${f}`),
      `\n**Confidence:** ${(confidence * 100).toFixed(0)}%`,
    ];

    return summary.join('\n');
  }
}

export class SynthesizerFleet {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  async synthesize(
    critiqueResult: CritiqueResult,
    researchContent: string,
    query: string
  ): Promise<SynthesisResult> {
    const generator = new ContentGeneratorAgent(this.sessionId, this.taskId);
    const formatter = new CitationFormatterAgent(this.sessionId);
    const builder = new StructureBuilderAgent(this.sessionId, this.taskId);

    const acceptedClaims = critiqueResult.acceptedClaims.map(c => c.statement);
    const rejectedCount = critiqueResult.rejectedClaims.length;

    const [introduction, concepts, findingsArray, applications, challenges, future, conclusion] = await Promise.all([
      generator.generateIntroduction(query, acceptedClaims),
      generator.generateConceptDefinitions(acceptedClaims),
      generator.generateKeyFindings(acceptedClaims),
      generator.generateApplications(acceptedClaims),
      generator.generateChallenges(acceptedClaims, critiqueResult.contradictions.length),
      generator.generateFutureDirections(acceptedClaims),
      generator.generateConclusion(acceptedClaims, critiqueResult.overallConfidence),
    ]);

    const sources = critiqueResult.acceptedClaims
      .flatMap(c => c.evidence)
      .map(id => ({ title: 'Source', url: id, type: 'web' }));

    const citations = await formatter.formatSources(sources.slice(0, 10), 'apa');
    const takeaways = builder.buildKeyTakeaways(findingsArray);
    const furtherReading = builder.buildFurtherReading(query, findingsArray);

    const synthesis: SynthesisResult = {
      taskId: this.taskId,
      introduction,
      conceptsAndDefinitions: concepts,
      keyFindings: findingsArray,
      applications,
      challenges,
      futureDirections: future,
      conclusion,
      keyTakeaways: takeaways,
      furtherReading,
      citations,
      summary: builder.buildSummary(introduction, findingsArray, critiqueResult.overallConfidence),
      deepDive: builder.buildAcademicStructure([
        { title: 'Introduction', content: introduction, keyPoints: [] },
        { title: 'Concepts & Definitions', content: concepts, keyPoints: [] },
        { title: 'Applications', content: applications, keyPoints: [] },
        { title: 'Challenges', content: challenges, keyPoints: [] },
        { title: 'Future Directions', content: future, keyPoints: [] },
        { title: 'Conclusion', content: conclusion, keyPoints: [] },
      ]),
      confidence: critiqueResult.overallConfidence,
      verifiedSources: acceptedClaims.length,
      contradictionsFound: critiqueResult.contradictions.length,
    };

    return synthesis;
  }
}
