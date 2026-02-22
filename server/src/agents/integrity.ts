import { z } from 'zod';
import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { v4 as uuid } from 'uuid';

export interface OriginalityReport {
  id: string;
  overallSimilarity: number;
  aiGenerationProbability: number;
  flaggedSections: Array<{
    text: string;
    startIndex: number;
    endIndex: number;
    similarity: number;
    source?: string;
    type: 'plagiarism' | 'ai_generated' | 'self_plagiarism' | 'unmarked_quote';
  }>;
  assessment: 'original' | 'likely_original' | 'possibly_assisted' | 'likely_ai_generated';
  confidence: number;
  recommendations: string[];
}

export interface CitationCheck {
  id: string;
  totalCitations: number;
  properCitations: number;
  missingCitations: number;
  incorrectFormat: number;
  citationStyle: 'APA' | 'MLA' | 'Chicago' | 'IEEE' | 'Harvard' | 'Unknown';
  issues: Array<{
    text: string;
    issue: 'missing' | 'incorrect_format' | 'incomplete' | 'unverified';
    suggestion: string;
  }>;
  suggestions: string[];
}

export interface AIUsageReport {
  id: string;
  probability: number;
  indicators: string[];
  patterns: Array<{
    pattern: string;
    confidence: number;
    examples: string[];
  }>;
  humanScore: number;
  analysis: string;
}

export interface Reference {
  id: string;
  title: string;
  authors: string[];
  year: number;
  source: string;
  type: 'book' | 'journal' | 'website' | 'conference' | 'thesis' | 'other';
  url?: string;
  doi?: string;
  relevance: number;
}

export interface Citation {
  id: string;
  type: 'apa' | 'mla' | 'chicago' | 'ieee' | 'harvard';
  authors: string[];
  title: string;
  year: number;
  source: string;
  url?: string;
  doi?: string;
  pages?: string;
  volume?: string;
  issue?: string;
  formatted: string;
}

const OriginalitySchema = z.object({
  overallSimilarity: z.number().min(0).max(100),
  aiGenerationProbability: z.number().min(0).max(100),
  flaggedSections: z.array(z.object({
    text: z.string(),
    startIndex: z.number(),
    endIndex: z.number(),
    similarity: z.number(),
    source: z.string().optional(),
    type: z.string(),
  })),
  assessment: z.string(),
  confidence: z.number(),
  recommendations: z.array(z.string()),
});

const CitationCheckSchema = z.object({
  totalCitations: z.number(),
  properCitations: z.number(),
  missingCitations: z.number(),
  incorrectFormat: z.number(),
  citationStyle: z.string(),
  issues: z.array(z.object({
    text: z.string(),
    issue: z.string(),
    suggestion: z.string(),
  })),
  suggestions: z.array(z.string()),
});

export class IntegrityAgent {
  private userId: string;
  private sessionId: string;

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
  }

  async checkOriginality(content: string): Promise<OriginalityReport> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are an academic integrity checker. Analyze text for:
1. Plagiarism indicators (exact matches, suspicious phrasing)
2. AI generation patterns (uniformity, specific markers)
3. Self-plagiarism (repetitive content from same user)
4. Unmarked quotes

Return JSON:
{
  "overallSimilarity": 0-100,
  "aiGenerationProbability": 0-100,
  "flaggedSections": [
    {
      "text": "flagged text",
      "startIndex": 0,
      "endIndex": 100,
      "similarity": 0-100,
      "source": "optional source URL",
      "type": "plagiarism|ai_generated|self_plagiarism|unmarked_quote"
    }
  ],
  "assessment": "original|likely_original|possibly_assisted|likely_ai_generated",
  "confidence": 0-100,
  "recommendations": ["recommendation"]
}`,
      },
      {
        role: 'user' as const,
        content: `Content to analyze:\n\n${content.substring(0, 6000)}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.2 });
      const parsed = OriginalitySchema.parse(JSON.parse(response.content));
      
      const report: OriginalityReport = {
        id: uuid(),
        overallSimilarity: parsed.overallSimilarity,
        aiGenerationProbability: parsed.aiGenerationProbability,
        flaggedSections: parsed.flaggedSections.map((f: any) => ({
          ...f,
          type: f.type as OriginalityReport['flaggedSections'][0]['type'],
        })),
        assessment: parsed.assessment as OriginalityReport['assessment'],
        confidence: parsed.confidence,
        recommendations: parsed.recommendations,
      };

      await this.saveReport('originality', report);
      return report;
    } catch {
      return this.getFallbackOriginalityReport();
    }
  }

  async detectAIUsage(content: string): Promise<AIUsageReport> {
    const messages = [
      {
        role: 'system' as const,
        content: `Analyze text for AI generation indicators. Look for:
- Uniform sentence structures
- Generic phrasing
- Overly formal or inconsistent tone
- Certain patterns common in AI writing
- Lack of personal anecdotes or specific details

Return JSON:
{
  "probability": 0-100,
  "indicators": ["observed indicator"],
  "patterns": [
    {
      "pattern": "pattern name",
      "confidence": 0-100,
      "examples": ["example from text"]
    }
  ],
  "humanScore": 0-100,
  "analysis": "detailed analysis"
}`,
      },
      {
        role: 'user' as const,
        content: `Analyze for AI usage:\n\n${content.substring(0, 6000)}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1500, temperature: 0.2 });
      const parsed = JSON.parse(response.content);
      
      const report: AIUsageReport = {
        id: uuid(),
        ...parsed,
      };

      await this.saveReport('ai_usage', report);
      return report;
    } catch {
      return {
        id: uuid(),
        probability: 0,
        indicators: [],
        patterns: [],
        humanScore: 100,
        analysis: 'Analysis unavailable',
      };
    }
  }

  async checkCitations(
    content: string,
    style: 'APA' | 'MLA' | 'Chicago' | 'IEEE' | 'Harvard' = 'APA'
  ): Promise<CitationCheck> {
    const messages = [
      {
        role: 'system' as const,
        content: `Analyze citations in academic text. Check for:
- Missing in-text citations or references
- Incorrect formatting per ${style} style
- Incomplete citations
- Unverified sources

Return JSON:
{
  "totalCitations": number,
  "properCitations": number,
  "missingCitations": number,
  "incorrectFormat": number,
  "citationStyle": "${style}",
  "issues": [
    {
      "text": "problematic text",
      "issue": "missing|incorrect_format|incomplete|unverified",
      "suggestion": "how to fix"
    }
  ],
  "suggestions": ["improvement suggestion"]
}`,
      },
      {
        role: 'user' as const,
        content: `Check citations in:\n\n${content.substring(0, 6000)}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1500, temperature: 0.2 });
      const parsed = CitationCheckSchema.parse(JSON.parse(response.content));
      
      const check: CitationCheck = {
        id: uuid(),
        totalCitations: parsed.totalCitations,
        properCitations: parsed.properCitations,
        missingCitations: parsed.missingCitations,
        incorrectFormat: parsed.incorrectFormat,
        citationStyle: parsed.citationStyle as CitationCheck['citationStyle'],
        issues: parsed.issues.map((i: any) => ({
          ...i,
          issue: i.issue as CitationCheck['issues'][0]['issue'],
        })),
        suggestions: parsed.suggestions,
      };

      await this.saveReport('citation_check', check);
      return check;
    } catch {
      return this.getFallbackCitationCheck();
    }
  }

  async generateCitations(
    sources: Array<{
      title: string;
      authors: string[];
      year: number;
      source: string;
      url?: string;
      doi?: string;
      type?: 'book' | 'journal' | 'website' | 'conference' | 'thesis';
    }>,
    format: Citation['type'] = 'apa'
  ): Promise<Citation[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Format citations in ${format.toUpperCase()} style. Return JSON array:
[
  {
    "authors": ["Author Name"],
    "title": "Title",
    "year": 2024,
    "source": "Publication/Source",
    "url": "optional url",
    "doi": "optional doi",
    "formatted": "fully formatted citation"
  }
]`,
      },
      {
        role: 'user' as const,
        content: `Generate citations for:\n${JSON.stringify(sources)}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1500, temperature: 0.3 });
      const parsed = JSON.parse(response.content);
      
      return parsed.map((c: any) => ({
        id: uuid(),
        ...c,
        type: format,
      }));
    } catch {
      return sources.map(s => ({
        id: uuid(),
        type: format,
        authors: s.authors,
        title: s.title,
        year: s.year,
        source: s.source,
        url: s.url,
        doi: s.doi,
        formatted: `${s.authors.join(', ')} (${s.year}). ${s.title}. ${s.source}.`,
      }));
    }
  }

  async suggestReferences(
    topic: string,
    count: number = 5
  ): Promise<Reference[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Find relevant academic references for a research paper on: "${topic}"
Return JSON array (${count} references):
[
  {
    "title": "Paper/Book Title",
    "authors": ["Author 1", "Author 2"],
    "year": 2024,
    "source": "Journal/Conference/Book",
    "type": "journal|conference|book|website|thesis",
    "url": "optional link",
    "doi": "optional doi",
    "relevance": 0-100
  }
]`,
      },
      {
        role: 'user' as const,
        content: `Find references for: ${topic}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.4 });
      const parsed = JSON.parse(response.content);
      
      return parsed.map((r: any) => ({
        id: uuid(),
        ...r,
      }));
    } catch {
      return [];
    }
  }

  async teachCitationProper(
    example: string,
    targetStyle: Citation['type'] = 'apa'
  ): Promise<{
    currentErrors: string[];
    correctFormat: string;
    examples: string[];
    explanation: string;
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a citation tutor. Analyze the citation and teach proper ${targetStyle.toUpperCase()} format.

Return JSON:
{
  "currentErrors": ["error 1", "error 2"],
  "correctFormat": "how it should look",
  "examples": ["proper examples"],
  "explanation": "why this is correct"
}`,
      },
      {
        role: 'user' as const,
        content: `Analyze and teach: ${example}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 800, temperature: 0.3 });
      return JSON.parse(response.content);
    } catch {
      return {
        currentErrors: ['Unable to analyze'],
        correctFormat: 'N/A',
        examples: [],
        explanation: 'Please try again',
      };
    }
  }

  async detectWeakArguments(content: string): Promise<{
    weakPoints: Array<{
      text: string;
      issue: string;
      suggestion: string;
    }>;
    overallStrength: number;
    recommendations: string[];
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `Analyze academic arguments for logical weaknesses. Identify:
- Unsupported claims
- Logical fallacies
- Missing evidence
- Circular reasoning
- Overgeneralizations

Return JSON:
{
  "weakPoints": [
    {
      "text": "problematic text",
      "issue": "type of weakness",
      "suggestion": "how to strengthen"
    }
  ],
  "overallStrength": 0-100,
  "recommendations": ["improvement recommendation"]
}`,
      },
      {
        role: 'user' as const,
        content: `Analyze arguments in:\n\n${content.substring(0, 5000)}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1500, temperature: 0.3 });
      return JSON.parse(response.content);
    } catch {
      return {
        weakPoints: [],
        overallStrength: 50,
        recommendations: ['Unable to analyze. Please try again.'],
      };
    }
  }

  private async saveReport(type: string, report: any): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: `integrity_${type}` as any,
        content: {
          userId: this.userId,
          ...report,
        } as unknown as object,
        confidence: 0.9,
      },
    });
  }

  private getFallbackOriginalityReport(): OriginalityReport {
    return {
      id: uuid(),
      overallSimilarity: 0,
      aiGenerationProbability: 0,
      flaggedSections: [],
      assessment: 'original',
      confidence: 0,
      recommendations: ['Unable to analyze. Please try again.'],
    };
  }

  private getFallbackCitationCheck(): CitationCheck {
    return {
      id: uuid(),
      totalCitations: 0,
      properCitations: 0,
      missingCitations: 0,
      incorrectFormat: 0,
      citationStyle: 'Unknown',
      issues: [],
      suggestions: ['Unable to analyze. Please try again.'],
    };
  }
}

export class TransparencyLogger {
  private userId: string;
  private sessionId: string;

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
  }

  async logAIAssistance(
    content: string,
    assistanceType: 'generated' | 'edited' | 'proofread' | 'researched'
  ): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'transparency_log' as any,
        content: {
          userId: this.userId,
          content: content.substring(0, 1000),
          assistanceType,
          timestamp: new Date(),
          disclosureText: this.generateDisclosureText(content, assistanceType),
        } as unknown as object,
        confidence: 1,
      },
    });
  }

  private generateDisclosureText(content: string, type: string): string {
    return `This content was ${type} with AI assistance. The ideas and analysis are my own.`;
  }

  async generateTransparencyStatement(
    originalContent: string,
    aiContributions: string[]
  ): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: 'Generate a proper AI disclosure statement for academic work.',
      },
      {
        role: 'user' as const,
        content: `Original work: ${originalContent.substring(0, 1000)}\nAI contributions: ${aiContributions.join(', ')}`,
      },
    ];

    const response = await llmService.chat(messages, { maxTokens: 300, temperature: 0.3 });
    return response.content;
  }
}
