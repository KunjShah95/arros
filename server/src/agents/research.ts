import { toolExecutor } from '../tools/executor';
import type { ResearchResult, SourceResult, Claim, SubTask } from '../types';
import { prisma } from '../services/prisma';
import { Prisma } from '@prisma/client';

export class ResearchAgent {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  async research(subtask: SubTask, query: string): Promise<ResearchResult> {
    const sources: SourceResult[] = [];
    const claims: Claim[] = [];

    const primaryTools = subtask.toolStrategy.primary;
    const fallbackTools = subtask.toolStrategy.fallback;
    const maxSources = subtask.toolStrategy.maxSources;

    for (const toolName of primaryTools) {
      if (sources.length >= maxSources) break;
      
      const result = await toolExecutor.execute(toolName, {
        query,
        numResults: Math.ceil(maxSources / primaryTools.length),
      }, this.taskId);

      if (result.success && result.data) {
        const toolSources = this.parseSources(toolName, result.data);
        sources.push(...toolSources);
      }
    }

    for (const source of sources) {
      const fetchResult = await toolExecutor.execute('web_fetch', {
        url: source.url,
      }, this.taskId);

      if (fetchResult.success && fetchResult.data) {
        source.content = this.extractContent(fetchResult.data);
        const extractedClaims = this.extractClaims(source.content);
        claims.push(...extractedClaims.map((statement, idx) => ({
          id: `claim_${source.id}_${idx}`,
          statement,
          evidence: [source.id],
          confidence: source.reliability,
        })));
      }
    }

    await prisma.source.createMany({
      data: sources.map(s => ({
        sessionId: this.sessionId,
        type: s.type,
        title: s.title,
        url: s.url,
        content: s.content,
        reliability: s.reliability,
        bias: s.bias,
        metadata: s.metadata as Prisma.InputJsonValue,
      })),
    });

    const researchResult: ResearchResult = {
      taskId: this.taskId,
      sources,
      claims,
      rawContent: sources.map(s => s.content).join('\n\n'),
    };

    await prisma.agentTask.update({
      where: { id: this.taskId },
      data: {
        status: 'completed',
        output: researchResult as unknown as Prisma.InputJsonValue,
      },
    });

    return researchResult;
  }

  private parseSources(toolName: string, data: unknown): SourceResult[] {
    if (!Array.isArray(data)) return [];
    
    return data.map((item: unknown, idx: number) => {
      const source = item as Record<string, unknown>;
      return {
        id: `source_${Date.now()}_${idx}`,
        type: this.getSourceType(toolName),
        title: (source.title as string) || 'Untitled',
        url: (source.url as string) || '',
        content: (source.content as string) || '',
        reliability: (source.reliability as number) ?? 0.7,
        bias: (source.bias as number) ?? 0,
        metadata: source,
      };
    });
  }

  private getSourceType(toolName: string): SourceResult['type'] {
    switch (toolName) {
      case 'paper_search': return 'paper';
      case 'github_search': return 'github';
      default: return 'web';
    }
  }

  private extractContent(data: unknown): string {
    if (typeof data === 'string') return data;
    if (typeof data === 'object' && data !== null) {
      return (data as Record<string, unknown>).content as string || '';
    }
    return '';
  }

  private extractClaims(content: string): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 10).map(s => s.trim());
  }
}
