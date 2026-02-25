/**
 * Additional Specialized Agents for Comprehensive Brain Simulation
 *
 * This module provides additional specialized agents:
 *
 * - SynthesisAgent: Synthesize information from multiple sources
 * - DecisionAgent: Make informed decisions based on analysis
 * - CreativeAgent: Generate creative content and ideas
 * - LearningAgent: Learn from content and track knowledge progress
 * - MemoryAgent: Manage and retrieve memories
 * - ResearchSynthesisAgent: Specialized synthesis for research content
 */

import { llmService } from '../../services/llm';
import { prisma } from '../../services/prisma';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';

// ─── Result Interfaces ────────────────────────────────────────────────────────

export interface SynthesisResult {
  summary: string;
  keyPoints: string[];
  connections: string[];
  insights: string[];
  confidence: number;
  synthesisType: 'abstractive' | 'extractive' | 'hybrid';
}

export interface DecisionResult {
  decision: string;
  reasoning: string;
  alternatives: string[];
  confidence: number;
  risks: string[];
  benefits: string[];
}

export interface CreativeResult {
  output: string;
  style: string;
  variants: string[];
  creativeApproach: string;
  inspirationSources: string[];
}

export interface LearningResult {
  knowledgeGained: string[];
  understandingLevel: number; // 0-1
  connectionsMade: string[];
  areasForFurtherStudy: string[];
  confidence: number;
}

// ─── Abstract Base Class ──────────────────────────────────────────────────────

export abstract class BaseSpecializedAgent {
  protected sessionId: string;
  protected taskId: string;
  protected agentName: string;

  constructor(sessionId: string, taskId: string, agentName: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
    this.agentName = agentName;
  }

  abstract process(input: any): Promise<any>;

  protected async logTask(input: any, output: any) {
    try {
      await prisma.agentTask.create({
        data: {
          sessionId: this.sessionId,
          type: this.agentName.toLowerCase(),
          agentName: this.agentName,
          status: 'completed',
          input: input as any,
          output: output as any,
          cost: 0.0001,
        },
      });
    } catch {
      // Non-critical logging
    }
  }
}

// ─── Synthesis Agent ──────────────────────────────────────────────────────────

export class SynthesisAgent extends BaseSpecializedAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'SynthesisAgent');
  }

  async process(input: { content: string; context?: string; purpose?: string }): Promise<SynthesisResult> {
    const { content, context, purpose } = input;

    const messages = [
      {
        role: 'system' as const,
        content: `You are an information synthesis expert. Combine and distill information into a coherent whole.

Your task:
1. Identify key points across all content
2. Find connections between different pieces of information
3. Generate higher-level insights
4. Create a coherent summary

Return JSON with:
- summary: A concise overall summary
- keyPoints: Array of 5-10 key points
- connections: Array of connections found
- insights: Array of 3-5 insights
- confidence: 0-1 confidence score
- synthesisType: 'abstractive', 'extractive', or 'hybrid'`,
      },
      {
        role: 'user' as const,
        content: `Synthesize this content${purpose ? ` for ${purpose}` : ''}:

${content || ''}
${context ? `\n\nAdditional context:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 2000,
        temperature: 0.4,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logTask(input, { keyPoints: result.keyPoints?.length || 0, confidence: result.confidence });

      return {
        summary: result.summary || '',
        keyPoints: result.keyPoints || [],
        connections: result.connections || [],
        insights: result.insights || [],
        confidence: result.confidence || 0.7,
        synthesisType: result.synthesisType || 'hybrid',
      };
    } catch {
      return this.fallbackSynthesis(input);
    }
  }

  private fallbackSynthesis(input: { content: string; context?: string; purpose?: string }): SynthesisResult {
    const { content } = input;
    return {
      summary: content ? 'Content synthesis complete' : 'No content to synthesize',
      keyPoints: content ? [content.substring(0, 100) + '...'] : [],
      connections: [],
      insights: [],
      confidence: 0.6,
      synthesisType: 'extractive',
    };
  }
}

// ─── Decision Agent ───────────────────────────────────────────────────────────

export class DecisionAgent extends BaseSpecializedAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'DecisionAgent');
  }

  async process(input: { question: string; options?: string[]; context?: string }): Promise<DecisionResult> {
    const { question, options, context } = input;

    const messages = [
      {
        role: 'system' as const,
        content: `You are a decision-making expert. Make informed decisions based on analysis.

Analyze the question and:
1. Weigh pros and cons of each option
2. Consider long-term and short-term consequences
3. Identify potential risks and benefits
4. Consider stakeholder impacts
5. Make a clear recommendation

If options are provided, evaluate each one.
If no options provided, suggest reasonable alternatives.

Return JSON with:
- decision: The recommended decision
- reasoning: Detailed reasoning
- alternatives: Array of alternative decisions
- confidence: 0-1 confidence score
- risks: Array of identified risks
- benefits: Array of identified benefits`,
      },
      {
        role: 'user' as const,
        content: `Make a decision about: ${question}

Options: ${options?.join(', ') || 'Provide your own recommendations'}
${context ? `\n\nContext:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 1500,
        temperature: 0.3,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logTask(input, { decision: result.decision, confidence: result.confidence });

      return {
        decision: result.decision || 'No clear decision',
        reasoning: result.reasoning || 'Based on decision analysis',
        alternatives: result.alternatives || [],
        confidence: result.confidence || 0.7,
        risks: result.risks || [],
        benefits: result.benefits || [],
      };
    } catch {
      return this.fallbackDecision(input);
    }
  }

  private fallbackDecision(input: { question: string; options?: string[]; context?: string }): DecisionResult {
    return {
      decision: 'Gather more information',
      reasoning: 'Insufficient information to make a confident decision',
      alternatives: ['Seek expert advice', 'Conduct further research'],
      confidence: 0.5,
      risks: ['Making uninformed decision'],
      benefits: ['Learning opportunity', 'Better information later'],
    };
  }
}

// ─── Creative Agent ───────────────────────────────────────────────────────────

export class CreativeAgent extends BaseSpecializedAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'CreativeAgent');
  }

  async process(input: {
    prompt: string;
    format?: string;
    style?: string;
    constraints?: string[];
  }): Promise<CreativeResult> {
    const { prompt, format, style, constraints } = input;

    const messages = [
      {
        role: 'system' as const,
        content: `You are a creative generation expert. Create original content.

Generate creative content that:
1. Matches the requested format
2. Follows the specified style
3. Adheres to given constraints
4. Is original and engaging

Available formats: article, story, poem, code, song, speech, report, essay
Common styles: professional, casual, academic, technical, poetic, humorous

Return JSON with:
- output: The creative output
- style: The style used
- variants: Array of 2-3 alternative versions
- creativeApproach: Description of approach
- inspirationSources: Array of inspiration sources`,
      },
      {
        role: 'user' as const,
        content: `Create ${format || 'content'} about: ${prompt}

Style: ${style || 'professional'}
Constraints: ${constraints?.join(', ') || 'None specified'}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 4000,
        temperature: 0.7,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logTask(input, { outputLength: result.output?.length || 0, style: result.style });

      return {
        output: result.output || '',
        style: result.style || (style || 'professional'),
        variants: result.variants || [],
        creativeApproach: result.creativeApproach || 'Creative generation',
        inspirationSources: result.inspirationSources || [],
      };
    } catch {
      return this.fallbackCreative(input);
    }
  }

  private fallbackCreative(input: { prompt: string; format?: string; style?: string; constraints?: string[] }): CreativeResult {
    return {
      output: `// Creative content generation failed\n// Prompt: ${input.prompt}\n// Format: ${input.format || 'unknown'}`,
      style: input.style || 'professional',
      variants: [],
      creativeApproach: 'Fallback creative approach',
      inspirationSources: [],
    };
  }
}

// ─── Learning Agent ───────────────────────────────────────────────────────────

export class LearningAgent extends BaseSpecializedAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'LearningAgent');
  }

  async process(input: { content: string; previousKnowledge?: string[]; goal?: string }): Promise<LearningResult> {
    const { content, previousKnowledge, goal } = input;

    const messages = [
      {
        role: 'system' as const,
        content: `You are a learning assessment expert. Analyze learning outcomes from content.

Evaluate:
1. What new knowledge was gained
2. Understanding level (0-1 scale)
3. Connections to existing knowledge
4. Areas that need further study
5. Confidence in understanding

Compare with previous knowledge to identify what's new.

Return JSON with:
- knowledgeGained: Array of newly learned concepts
- understandingLevel: 0-1 score
- connectionsMade: Array of connections to prior knowledge
- areasForFurtherStudy: Array of topics needing more study
- confidence: 0-1 confidence score`,
      },
      {
        role: 'user' as const,
        content: `Assess learning from this content:

${content || ''}
${previousKnowledge ? `\n\nPrevious Knowledge:\n${previousKnowledge.join('\n')}` : ''}
${goal ? `\n\nLearning Goal: ${goal}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 1500,
        temperature: 0.3,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logTask(input, { knowledgeCount: result.knowledgeGained?.length || 0, understandingLevel: result.understandingLevel });

      return {
        knowledgeGained: result.knowledgeGained || [],
        understandingLevel: result.understandingLevel || 0.5,
        connectionsMade: result.connectionsMade || [],
        areasForFurtherStudy: result.areasForFurtherStudy || [],
        confidence: result.confidence || 0.6,
      };
    } catch {
      return this.fallbackLearning(input);
    }
  }

  private fallbackLearning(input: { content: string; previousKnowledge?: string[]; goal?: string }): LearningResult {
    return {
      knowledgeGained: ['Basic understanding of topic'],
      understandingLevel: 0.5,
      connectionsMade: [],
      areasForFurtherStudy: ['More detailed study', 'Practical application'],
      confidence: 0.5,
    };
  }
}

// ─── Research Synthesis Agent ─────────────────────────────────────────────────

export class ResearchSynthesisAgent extends BaseSpecializedAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'ResearchSynthesisAgent');
  }

  async process(input: {
    sources: Array<{ title: string; url: string; content: string; type: string }>;
    researchQuestion: string;
    context?: string;
  }): Promise<SynthesisResult> {
    const { sources, researchQuestion, context } = input;

    // Prepare sources for synthesis
    const sourcesText = sources
      .map((s, i) => `Source ${i + 1} (${s.type}):\nTitle: ${s.title}\nURL: ${s.url}\nContent: ${s.content.substring(0, 2000)}...`)
      .join('\n\n' + '='.repeat(50) + '\n\n');

    const messages = [
      {
        role: 'system' as const,
        content: `You are a research synthesis expert. Synthesize findings from multiple academic and research sources.

Your task:
1. Extract key findings from each source
2. Identify patterns and consistencies across sources
3. Resolve contradictions between sources
4. Identify research gaps
5. Synthesize into coherent summary

Focus on:
- Academic rigor
- Methodological quality
- Evidence strength
- Scholarly consensus

Return JSON with:
- summary: A comprehensive research summary
- keyPoints: Array of 5-10 key research findings
- connections: Array of connections between sources
- insights: Array of 3-5 research insights
- confidence: 0-1 confidence in synthesis
- synthesisType: 'abstractive', 'extractive', or 'hybrid'`,
      },
      {
        role: 'user' as const,
        content: `Synthesize research on: ${researchQuestion}

Sources:
${sourcesText}

${context ? `\n\nContext:\n${context}` : ''}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 3000,
        temperature: 0.3,
        model: 'gpt-4o-mini',
      });

      const result = JSON.parse(response.content);

      await this.logTask(input, { sourceCount: sources.length, confidence: result.confidence });

      return {
        summary: result.summary || '',
        keyPoints: result.keyPoints || [],
        connections: result.connections || [],
        insights: result.insights || [],
        confidence: result.confidence || 0.7,
        synthesisType: result.synthesisType || 'abstractive',
      };
    } catch {
      return this.fallbackResearchSynthesis(input);
    }
  }

  private fallbackResearchSynthesis(input: {
    sources: Array<{ title: string; url: string; content: string; type: string }>;
    researchQuestion: string;
    context?: string;
  }): SynthesisResult {
    return {
      summary: `Research synthesis: ${input.researchQuestion}`,
      keyPoints: input.sources.map(s => `Source: ${s.title}`),
      connections: [],
      insights: ['Multiple sources contribute to understanding'],
      confidence: 0.6,
      synthesisType: 'extractive',
    };
  }
}

// ─── Memory Agent ─────────────────────────────────────────────────────────────

export class MemoryAgent extends BaseSpecializedAgent {
  constructor(sessionId: string, taskId: string) {
    super(sessionId, taskId, 'MemoryAgent');
  }

  async process(input: {
    action: 'store' | 'retrieve' | 'delete';
    content: string;
    key?: string;
    tags?: string[];
    context?: string;
  }): Promise<{
    success: boolean;
    memoryId?: string;
    matchedMemories?: Array<{ key: string; content: string; confidence: number }>;
    message: string;
  }> {
    const { action, content, key, tags, context } = input;

    try {
      if (action === 'store') {
        const memoryId = uuid();

        await prisma.userMemory.create({
          data: {
            id: memoryId,
            userId: 'system',
            type: 'knowledge',
            content: tags && tags.length > 0 ? `${content} [tags: ${tags.join(', ')}]` : content,
            importance: 0.5,
            lastUsedAt: new Date(),
          },
        });

        await this.logTask({ action, key, tags }, { memoryId });

        return {
          success: true,
          memoryId,
          message: `Memory stored successfully`,
        };
      } else if (action === 'retrieve') {
        // Search for relevant memories
        const memories = await prisma.userMemory.findMany({
          where: {
            userId: 'system',
            content: { contains: content || (tags?.join(' ') ?? ''), mode: 'insensitive' },
          },
          orderBy: { lastUsedAt: 'desc' },
          take: 10,
        });

        const matchedMemories = memories.map(m => ({
          key: m.id,
          content: m.content,
          confidence: 0.7,
        }));

        await this.logTask({ action, content, tags }, { matchCount: matchedMemories.length });

        return {
          success: true,
          matchedMemories,
          message: `Retrieved ${matchedMemories.length} relevant memories`,
        };
      } else if (action === 'delete') {
        if (key) {
          await prisma.userMemory.deleteMany({
            where: { id: key, userId: 'system' },
          });

          await this.logTask({ action, key }, { success: true });

          return {
            success: true,
            message: `Memory deleted successfully`,
          };
        }

        return {
          success: false,
          message: 'Memory key required for deletion',
        };
      }

      return {
        success: false,
        message: `Unknown action: ${action}`,
      };
    } catch (error) {
      console.error('[MemoryAgent] Error:', error);
      return {
        success: false,
        message: `Error during ${action}: ${(error as Error).message}`,
      };
    }
  }
}

// ─── SpecializedAgentFleet - Main Coordinator ─────────────────────────────────

export class SpecializedAgentFleet {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  /**
   * Run different specialized agents based on input type
   */
  async process(input: any): Promise<any> {
    const { type } = input;

    const agentMap: Record<string, BaseSpecializedAgent> = {
      synthesis: new SynthesisAgent(this.sessionId, `${this.taskId}_synthesis`),
      decision: new DecisionAgent(this.sessionId, `${this.taskId}_decision`),
      creative: new CreativeAgent(this.sessionId, `${this.taskId}_creative`),
      learning: new LearningAgent(this.sessionId, `${this.taskId}_learning`),
      research: new ResearchSynthesisAgent(this.sessionId, `${this.taskId}_research`),
      memory: new MemoryAgent(this.sessionId, `${this.taskId}_memory`),
    };

    const agent = agentMap[type] || agentMap.synthesis;
    return agent.process(input);
  }

  /**
   * Synthesize information from multiple sources
   */
  async synthesize(input: { content: string; context?: string; purpose?: string }): Promise<SynthesisResult> {
    const agent = new SynthesisAgent(this.sessionId, `${this.taskId}_synthesis`);
    return agent.process(input);
  }

  /**
   * Make a decision based on analysis
   */
  async decide(input: { question: string; options?: string[]; context?: string }): Promise<DecisionResult> {
    const agent = new DecisionAgent(this.sessionId, `${this.taskId}_decision`);
    return agent.process(input);
  }

  /**
   * Generate creative content
   */
  async create(input: { prompt: string; format?: string; style?: string; constraints?: string[] }): Promise<CreativeResult> {
    const agent = new CreativeAgent(this.sessionId, `${this.taskId}_creative`);
    return agent.process(input);
  }

  /**
   * Assess learning from content
   */
  async learn(input: { content: string; previousKnowledge?: string[]; goal?: string }): Promise<LearningResult> {
    const agent = new LearningAgent(this.sessionId, `${this.taskId}_learning`);
    return agent.process(input);
  }

  /**
   * Synthesize research from multiple sources
   */
  async synthesizeResearch(input: {
    sources: Array<{ title: string; url: string; content: string; type: string }>;
    researchQuestion: string;
    context?: string;
  }): Promise<SynthesisResult> {
    const agent = new ResearchSynthesisAgent(this.sessionId, `${this.taskId}_research`);
    return agent.process(input);
  }

  /**
   * Store, retrieve, or delete memories
   */
  async memory(input: {
    action: 'store' | 'retrieve' | 'delete';
    content: string;
    key?: string;
    tags?: string[];
    context?: string;
  }): Promise<{
    success: boolean;
    memoryId?: string;
    matchedMemories?: Array<{ key: string; content: string; confidence: number }>;
    message: string;
  }> {
    const agent = new MemoryAgent(this.sessionId, `${this.taskId}_memory`);
    return agent.process(input);
  }
}
