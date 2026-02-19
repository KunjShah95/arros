import type { CritiqueResult, SynthesisResult, ActionItem } from '../types';
import { prisma } from '../services/prisma';
import { llmService } from '../services/llm';
import { wsService } from '../services/websocket';
import { z } from 'zod';

const CitationSchema = z.object({
  index: z.number(),
  title: z.string(),
  authors: z.string().optional(),
  year: z.number().optional(),
  venue: z.string().optional(),
  url: z.string().optional(),
  citationText: z.string(), // e.g., [1]
});

const AcademicSynthesisSchema = z.object({
  // Core academic structure
  introduction: z.string(),
  conceptsAndDefinitions: z.string(),
  keyFindings: z.array(z.string()),
  applications: z.string().optional(),
  challenges: z.string().optional(),
  futureDirections: z.string().optional(),
  conclusion: z.string(),

  // Study aids
  keyTakeaways: z.array(z.string()),
  furtherReading: z.array(z.string()),

  // Summary fields for backward compat
  summary: z.string(),
  deepDive: z.string(),

  // Citations
  citations: z.array(CitationSchema).optional(),

  // Confidence
  confidence: z.number(),
  verifiedSources: z.number(),
  contradictionsFound: z.number(),
});

export type AcademicSynthesis = z.infer<typeof AcademicSynthesisSchema>;

// Keep backward compatibility with existing SynthesisResult interface
const SynthesisResultSchema = AcademicSynthesisSchema.extend({
  actionableOutputs: z.array(z.object({
    type: z.enum(['prd', 'architecture', 'ticket', 'code', 'decision']),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
  })).optional(),
});

export class SynthesizerAgent {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  async synthesize(
    critiqueResult: CritiqueResult,
    researchRawContent: string,
    query: string,
    generateActions: boolean = false
  ): Promise<SynthesisResult> {
    const claimsText = critiqueResult.acceptedClaims
      .map((c, i) => `${i + 1}. ${c.statement} (confidence: ${(c.confidence * 100).toFixed(0)}%)`)
      .join('\n');

    const contradictionsText = critiqueResult.contradictions.length > 0
      ? `⚠️ Contradictions Found:\n${critiqueResult.contradictions.map(c => `- Conflict (${c.severity}): ${c.claimA} vs ${c.claimB}`).join('\n')}`
      : 'No significant contradictions found.';

    const messages = [
      {
        role: 'system' as const,
        content: `You are ARROS — an Academic Research OS synthesizer. Your job is to produce structured, citation-backed academic reports for students and researchers.

OUTPUT STRUCTURE (follow exactly):
1. **Introduction** — clear context, scope, and why this topic matters
2. **Concepts & Definitions** — define key terms, frameworks, and foundational concepts  
3. **Key Findings** — bullet list of the most important verified facts from research
4. **Applications** — how is this topic applied in the real world?
5. **Challenges** — current limitations, open problems, controversies
6. **Future Directions** — emerging trends, research gaps, what's next
7. **Conclusion** — concise academic summary tying everything together
8. **Key Takeaways** — 5-7 exam-ready bullet points a student should remember
9. **Further Reading** — 3-5 specific recommended topics/papers for deeper study
10. **Citations** — numbered list of sources used in the report

STYLE RULES:
- Write in formal but readable academic English
- Use concrete claims backed by the provided verified evidence
- Cite sources inline using [1], [2], etc. notation
- Never use placeholder text like "As mentioned earlier"
- Each section should be substantive (not a single sentence)
- Key Takeaways should be concise, memorable, exam-ready statements
- Further Reading should be specific topics or paper titles, not generic suggestions

WHAT TO AVOID:
- Do NOT invent statistics or facts not in the source material
- Do NOT use filler phrases like "it is worth noting that"
- Do NOT be vague — be specific with examples and evidence`,
      },
      {
        role: 'user' as const,
        content: `Research Query: "${query}"

Verified Claims (${critiqueResult.acceptedClaims.length} accepted, ${critiqueResult.rejectedClaims.length} rejected):
${claimsText}

${contradictionsText}

Overall Confidence: ${(critiqueResult.overallConfidence * 100).toFixed(0)}%
Verified Sources: ${critiqueResult.acceptedClaims.length}

Raw Research Content (use this to extract citations, paper titles, authors):
${researchRawContent.substring(0, 10000)}

Now produce a complete academic research report with all sections filled in. Extract and number all citations from the sources above.

Return a JSON with all fields: introduction, conceptsAndDefinitions, keyFindings (array), applications, challenges, futureDirections, conclusion, keyTakeaways (array of 5-7 bullet points), furtherReading (array of 3-5 reading suggestions), citations (array with index, title, authors, year, venue, url, citationText), summary (one-paragraph overview), deepDive (full detailed text), confidence (0-1), verifiedSources (number), contradictionsFound (number).`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 4000,
        temperature: 0.4,
        model: 'gpt-4o-mini',
        responseFormat: SynthesisResultSchema,
      });

      const rawSynthesis = SynthesisResultSchema.parse(JSON.parse(response.content));

      const synthesis: SynthesisResult = {
        ...rawSynthesis,
        taskId: this.taskId,
        // Build summary and deepDive from academic sections if not directly provided
        summary: rawSynthesis.summary || `${rawSynthesis.introduction}\n\n**Key Findings:**\n${rawSynthesis.keyFindings.map(f => `• ${f}`).join('\n')}`,
        deepDive: rawSynthesis.deepDive || this.buildDeepDive(rawSynthesis),
        keyFindings: rawSynthesis.keyFindings,
      };

      await prisma.agentOutput.create({
        data: {
          sessionId: this.sessionId,
          taskId: this.taskId,
          type: 'synthesis',
          content: synthesis as unknown as object,
          confidence: synthesis.confidence,
        },
      });

      await prisma.agentTask.update({
        where: { id: this.taskId },
        data: {
          status: 'completed',
          output: synthesis as unknown as object,
          tokens: response.usage.totalTokens,
          cost: llmService.calculateCost(response.usage, 'gpt-4o-mini'),
        },
      });

      wsService.emitTaskCompleted(this.sessionId, this.taskId, synthesis);

      return synthesis;
    } catch (error) {
      console.error('LLM synthesis failed, using academic fallback:', error);
      return this.fallbackAcademicSynthesis(critiqueResult, query);
    }
  }

  private buildDeepDive(synthesis: AcademicSynthesis): string {
    const sections = [];

    if (synthesis.introduction) sections.push(`## Introduction\n\n${synthesis.introduction}`);
    if (synthesis.conceptsAndDefinitions) sections.push(`## Concepts & Definitions\n\n${synthesis.conceptsAndDefinitions}`);
    if (synthesis.applications) sections.push(`## Applications\n\n${synthesis.applications}`);
    if (synthesis.challenges) sections.push(`## Challenges\n\n${synthesis.challenges}`);
    if (synthesis.futureDirections) sections.push(`## Future Directions\n\n${synthesis.futureDirections}`);
    if (synthesis.conclusion) sections.push(`## Conclusion\n\n${synthesis.conclusion}`);

    if (synthesis.keyTakeaways && synthesis.keyTakeaways.length > 0) {
      sections.push(`## Key Takeaways\n\n${synthesis.keyTakeaways.map(t => `• ${t}`).join('\n')}`);
    }

    if (synthesis.furtherReading && synthesis.furtherReading.length > 0) {
      sections.push(`## Further Reading\n\n${synthesis.furtherReading.map((r, i) => `${i + 1}. ${r}`).join('\n')}`);
    }

    return sections.join('\n\n');
  }

  private fallbackAcademicSynthesis(
    critiqueResult: CritiqueResult,
    query: string,
  ): SynthesisResult {
    const acceptedFacts = critiqueResult.acceptedClaims
      .slice(0, 8)
      .map(c => c.statement);

    const summary = `**Research Report: ${query}**\n\nBased on verified academic sources, this report summarizes key findings on the topic:\n\n${acceptedFacts.slice(0, 3).map(f => `• ${f}`).join('\n')}\n\nConfidence Score: ${(critiqueResult.overallConfidence * 100).toFixed(0)}%`;

    const introduction = `This report examines "${query}" based on verified academic sources. The research draws from peer-reviewed papers and authoritative web sources to provide a comprehensive overview.`;

    const conceptsAndDefinitions = `The following key concepts are central to understanding this topic:\n\n${acceptedFacts.slice(0, 3).map(f => `• ${f}`).join('\n')}`;

    const keyFindings = acceptedFacts.filter(f => f.length > 30).slice(0, 6);

    const conclusion = `${critiqueResult.contradictions.length > 0
      ? `Note: ${critiqueResult.contradictions.length} contradiction(s) were identified in the research, suggesting areas of ongoing debate. `
      : ''}The research achieves an overall confidence score of ${(critiqueResult.overallConfidence * 100).toFixed(0)}%, based on ${critiqueResult.acceptedClaims.length} verified claims from multiple sources.`;

    const keyTakeaways = acceptedFacts.filter(f => f.length > 20).slice(0, 5);
    const furtherReading = [
      `Recent systematic reviews on "${query}"`,
      `Applications of ${query.split(' ').slice(0, 3).join(' ')} in industry`,
      `Challenges and open problems in ${query.split(' ').slice(0, 2).join(' ')} research`,
    ];

    const deepDive = this.buildDeepDive({
      introduction,
      conceptsAndDefinitions,
      keyFindings,
      applications: 'See the verified sources for specific application domains.',
      challenges: critiqueResult.contradictions.length > 0
        ? `${critiqueResult.contradictions.length} contradiction(s) were found among research claims.`
        : 'No major challenges identified in the verified sources.',
      futureDirections: 'Continued research is recommended for the latest developments.',
      conclusion,
      keyTakeaways,
      furtherReading,
      summary,
      deepDive: '',
      confidence: critiqueResult.overallConfidence,
      verifiedSources: critiqueResult.acceptedClaims.length,
      contradictionsFound: critiqueResult.contradictions.length,
    });

    return {
      taskId: this.taskId,
      summary,
      deepDive,
      keyFindings,
      confidence: critiqueResult.overallConfidence,
    } as unknown as SynthesisResult;
  }
}
