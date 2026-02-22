import type { ActionItem, SynthesisResult } from '../../types';
import { prisma } from '../../services/prisma';
import { llmService } from '../../services/llm';
import { z } from 'zod';

const PRDSchema = z.object({
  productName: z.string(),
  problemStatement: z.string(),
  targetUsers: z.string(),
  keyFeatures: z.array(z.string()),
  successMetrics: z.array(z.string()),
  timeline: z.string(),
  risks: z.array(z.string()),
});

const TicketSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  type: z.enum(['task', 'bug', 'feature', 'improvement']),
  acceptanceCriteria: z.array(z.string()),
  estimatedEffort: z.string(),
});

const CodeScaffoldSchema = z.object({
  language: z.string(),
  framework: z.string().optional(),
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
    purpose: z.string(),
  })),
  dependencies: z.array(z.string()),
  setupInstructions: z.string(),
});

const DecisionMatrixSchema = z.object({
  decision: z.string(),
  options: z.array(z.object({
    name: z.string(),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    scores: z.record(z.string(), z.number()),
  })),
  recommendation: z.string(),
  reasoning: z.string(),
});

export class PRDAgent {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  async generate(topic: string, synthesis: SynthesisResult): Promise<ActionItem> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a Product Requirements Document (PRD) generator. Create detailed, actionable PRDs based on research findings.

Include:
- Product name and vision
- Problem statement
- Target user personas
- Key features with priorities
- Success metrics
- Timeline estimates
- Risk assessment`,
      },
      {
        role: 'user' as const,
        content: `Generate a PRD for: "${topic}"

Research findings:
${synthesis.keyFindings.join('\n')}

Applications: ${synthesis.applications || 'N/A'}
Challenges: ${synthesis.challenges || 'N/A'}
Future directions: ${synthesis.futureDirections || 'N/A'}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 2000,
        temperature: 0.3,
        model: 'gpt-4o-mini',
        responseFormat: PRDSchema,
      });

      const prd = PRDSchema.parse(JSON.parse(response.content));

      return {
        type: 'prd',
        title: prd.productName,
        description: `Problem: ${prd.problemStatement}\n\nTarget: ${prd.targetUsers}\n\nFeatures: ${prd.keyFeatures.join(', ')}`,
        priority: 'high',
      };
    } catch (error) {
      return this.fallbackPRD(topic, synthesis);
    }
  }

  private fallbackPRD(topic: string, synthesis: SynthesisResult): ActionItem {
    return {
      type: 'prd',
      title: `${topic} Product`,
      description: `PRD based on research about ${topic}. Key findings: ${synthesis.keyFindings.slice(0, 3).join('; ')}`,
      priority: 'medium',
    };
  }
}

export class TicketAgent {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  async generateFromResearch(topic: string, synthesis: SynthesisResult): Promise<ActionItem[]> {
    const challenges = synthesis.challenges?.split('\n').filter(Boolean) || [];
    const findings = synthesis.keyFindings || [];

    const tickets: ActionItem[] = [];

    if (challenges.length > 0) {
      const messages = [
        {
          role: 'system' as const,
          content: 'Generate Jira-style tickets from research challenges. Include title, description, priority, and acceptance criteria.',
        },
        {
          role: 'user' as const,
          content: `Create tickets for: "${topic}"

Challenges:
${challenges.join('\n')}`,
        },
      ];

      try {
        const response = await llmService.chat(messages, {
          maxTokens: 1500,
          temperature: 0.3,
          model: 'gpt-4o-mini',
          responseFormat: z.object({ tickets: z.array(TicketSchema) }),
        });

        const { tickets: generatedTickets } = z.object({ tickets: z.array(TicketSchema) }).parse(JSON.parse(response.content));

        tickets.push(...generatedTickets.map(t => ({
          type: 'ticket' as const,
          title: t.title,
          description: `${t.description}\n\nAcceptance Criteria:\n${t.acceptanceCriteria.join('\n')}`,
          priority: t.priority === 'critical' ? 'high' : t.priority,
        })));
      } catch (error) {
        tickets.push(...this.fallbackTickets(topic, challenges));
      }
    }

    return tickets;
  }

  private fallbackTickets(topic: string, challenges: string[]): ActionItem[] {
    return challenges.slice(0, 3).map((challenge, idx) => ({
      type: 'ticket',
      title: `Address: ${challenge.substring(0, 50)}`,
      description: `Research challenge from ${topic}: ${challenge}`,
      priority: 'medium',
    }));
  }
}

export class CodeScaffoldAgent {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  async generate(requirement: string, synthesis: SynthesisResult): Promise<ActionItem> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a code scaffold generator. Create minimal, working code scaffolds based on requirements.

Generate:
- Language and framework selection
- File structure with placeholder code
- Dependencies list
- Setup instructions

Keep code minimal but functional.`,
      },
      {
        role: 'user' as const,
        content: `Generate code scaffold for: "${requirement}"

Context:
${synthesis.keyFindings.join('\n')}
${synthesis.applications || ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 3000,
        temperature: 0.3,
        model: 'gpt-4o-mini',
        responseFormat: CodeScaffoldSchema,
      });

      const scaffold = CodeScaffoldSchema.parse(JSON.parse(response.content));

      return {
        type: 'code',
        title: `${scaffold.language} ${scaffold.framework || 'Application'}`,
        description: `Files: ${scaffold.files.map(f => f.path).join(', ')}\n\nSetup: ${scaffold.setupInstructions}`,
        priority: 'medium',
      };
    } catch (error) {
      return this.fallbackCode(requirement);
    }
  }

  private fallbackCode(requirement: string): ActionItem {
    return {
      type: 'code',
      title: `${requirement} Implementation`,
      description: `Code scaffold for ${requirement}. Research required to determine optimal implementation.`,
      priority: 'low',
    };
  }
}

export class DecisionMatrixAgent {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  async generate(decision: string, options: string[]): Promise<ActionItem> {
    const optionsText = options.map((opt, i) => `${i + 1}. ${opt}`).join('\n');

    const messages = [
      {
        role: 'system' as const,
        content: `You are a decision matrix generator. Create structured comparisons with scoring.

For each option, include:
- Pros and cons
- Scores on relevant criteria (cost, complexity, scalability, etc.)
- Final recommendation with reasoning`,
      },
      {
        role: 'user' as const,
        content: `Create decision matrix for: "${decision}"

Options to compare:
${optionsText}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 2000,
        temperature: 0.3,
        model: 'gpt-4o-mini',
        responseFormat: DecisionMatrixSchema,
      });

      const matrix = DecisionMatrixSchema.parse(JSON.parse(response.content));

      return {
        type: 'decision',
        title: matrix.decision,
        description: `Recommendation: ${matrix.recommendation}\n\nReasoning: ${matrix.reasoning}\n\nOptions analyzed: ${matrix.options.map(o => o.name).join(', ')}`,
        priority: 'high',
      };
    } catch (error) {
      return this.fallbackDecision(decision, options);
    }
  }

  private fallbackDecision(decision: string, options: string[]): ActionItem {
    return {
      type: 'decision',
      title: decision,
      description: `Options: ${options.join(' vs ')}. Further analysis required.`,
      priority: 'medium',
    };
  }
}

export class ActionFleet {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  async generateAll(topic: string, synthesis: SynthesisResult): Promise<ActionItem[]> {
    const actions: ActionItem[] = [];

    const [prd, ticket] = await Promise.all([
      new PRDAgent(this.sessionId, `${this.taskId}_prd`).generate(topic, synthesis),
      new TicketAgent(this.sessionId, `${this.taskId}_ticket`).generateFromResearch(topic, synthesis),
    ]);

    actions.push(prd);
    actions.push(...ticket);

    return actions;
  }

  async generateSpecific(
    type: ActionItem['type'],
    topic: string,
    synthesis: SynthesisResult,
    options?: string[]
  ): Promise<ActionItem> {
    switch (type) {
      case 'prd':
        return new PRDAgent(this.sessionId, `${this.taskId}_prd`).generate(topic, synthesis);
      case 'ticket':
        const tickets = await new TicketAgent(this.sessionId, `${this.taskId}_ticket`).generateFromResearch(topic, synthesis);
        return tickets[0] || { type: 'ticket', title: 'No tickets generated', description: '', priority: 'low' };
      case 'code':
        return new CodeScaffoldAgent(this.sessionId, `${this.taskId}_code`).generate(topic, synthesis);
      case 'decision':
        return new DecisionMatrixAgent(this.sessionId, `${this.taskId}_decision`).generate(topic, options || []);
      default:
        return { type: 'ticket', title: 'Unknown action', description: '', priority: 'low' };
    }
  }
}
