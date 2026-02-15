import type { CritiqueResult, SynthesisResult, ActionItem } from '../types';
import { prisma } from '../services/prisma';
import { llmService } from '../services/llm';
import { wsService } from '../services/websocket';
import { z } from 'zod';

const ActionItemSchema = z.object({
  type: z.enum(['prd', 'architecture', 'ticket', 'code', 'decision']),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
});

const SynthesisResultSchema = z.object({
  summary: z.string(),
  deepDive: z.string(),
  keyFindings: z.array(z.string()),
  actionableOutputs: z.array(ActionItemSchema).optional(),
  confidence: z.number(),
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
      .map((c, i) => `${i + 1}. ${c.statement}`)
      .join('\n');

    const contradictionsText = critiqueResult.contradictions.length > 0
      ? `Contradictions found:\n${critiqueResult.contradictions.map(c => `- ${c.claimA} vs ${c.claimB} (${c.severity})`).join('\n')}`
      : 'No contradictions found.';

    const messages = [
      {
        role: 'system' as const,
        content: `You are a research synthesis agent. Combine verified research findings into a coherent, well-structured answer.

For the summary:
- Start with a clear, direct answer to the query
- Use bullet points for key findings
- Keep it concise but informative

For the deep dive:
- Provide detailed analysis
- Include nuance and caveats
- Address uncertainties
- Explain implications

For key findings:
- List the most important verified facts
- Each should be a complete, factual statement

For actionable outputs (if requested):
- Generate PRDs, architecture plans, tickets, code scaffolds, or decision matrices
- Be specific and practical`,
      },
      {
        role: 'user' as const,
        content: `Query: "${query}"

Verified Claims:
${claimsText}

${contradictionsText}

Overall Confidence: ${(critiqueResult.overallConfidence * 100).toFixed(0)}%

Raw Research Content:
${researchRawContent.substring(0, 8000)}

${generateActions ? 'Also generate actionable outputs like PRDs, architecture plans, or code scaffolds.' : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 3000,
        temperature: 0.5,
        model: 'gpt-4o-mini',
        responseFormat: SynthesisResultSchema,
      });

      const synthesis: SynthesisResult = {
        ...SynthesisResultSchema.parse(JSON.parse(response.content)),
        taskId: this.taskId,
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
      console.error('LLM synthesis failed, using fallback:', error);
      return this.fallbackSynthesis(critiqueResult, query, generateActions);
    }
  }

  private fallbackSynthesis(
    critiqueResult: CritiqueResult,
    query: string,
    generateActions: boolean
  ): SynthesisResult {
    const summary = `Based on verified sources, here are the key findings for "${query}":\n\n${
      critiqueResult.acceptedClaims
        .slice(0, 5)
        .map((c) => `- ${c.statement}`)
        .join('\n')
    }`;

    const deepDive = `## Detailed Analysis\n\n### Verified Information\n\n${
      critiqueResult.acceptedClaims
        .map((c) => `**${c.statement}**\nConfidence: ${(c.confidence * 100).toFixed(0)}%`)
        .join('\n\n')
    }\n\n### Areas of Uncertainty\n\n${
      critiqueResult.contradictions.length > 0
        ? `${critiqueResult.contradictions.length} contradiction(s) detected.`
        : 'No significant contradictions found.'
    }`;

    const keyFindings = critiqueResult.acceptedClaims
      .filter((c) => c.confidence >= 0.7)
      .slice(0, 7)
      .map((c) => c.statement);

    let actionableOutputs: ActionItem[] = [];
    if (generateActions) {
      actionableOutputs = [
        {
          type: 'prd',
          title: 'PRD Document',
          description: 'Create product requirements based on research',
          priority: 'medium',
        },
      ];
    }

    return {
      taskId: this.taskId,
      summary,
      deepDive,
      keyFindings,
      actionableOutputs: actionableOutputs.length > 0 ? actionableOutputs : undefined,
      confidence: critiqueResult.overallConfidence,
    };
  }
}
