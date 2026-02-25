/**
 * Research Specialist Agent - Human-Like Research with Curiosity and Exploration
 *
 * This agent simulates how a human researcher works:
 *  - Starts with curiosity and a question in mind
 *  - Searches systematically but adapts when findings are unexpected
 *  - Makes connections between disparate ideas
 *  - Tracks what was learned vs. what remains unknown
 *  - Knows when to stop searching (satisficing)
 *
 * Inspired by:
 *  - Information Foraging Theory (Pirolli & Card)
 *  - Browsing vs. Searching behavior
 *  - Serendipity in scientific discovery
 */

import { llmService } from '../../services/llm';
import { toolExecutor } from '../../tools/executor';
import { prisma } from '../../services/prisma';
import { v4 as uuid } from 'uuid';

// ─── Research State Types ───────────────────────────────────────────────────────

export type ResearchPhase = 'exploring' | 'focusing' | 'deepening' | 'synthesizing' | 'satisficing';

export interface ResearchState {
  phase: ResearchPhase;
  curiosityLevel: number;      // 0-1, how much does brain want to know?
  informationSufficiency: number; // 0-1, is enough known?
  searchPattern: 'broad' | 'targeted' | 'deep';
  openQuestions: string[];
  interestingFindings: string[];
  satisficingThreshold: number; // when to stop searching
}

export interface ResearchResult {
  findings: ResearchFinding[];
  state: ResearchState;
  synthesis: string;
  knowledgeGaps: string[];
  suggestedNextSteps: string[];
}

export interface ResearchFinding {
  id: string;
  source: string;
  content: string;
  relevance: number;
  unexpectedConnection?: string; // if this finding led to an unexpected insight
  confidence: number;
}

// ─── ResearchSpecialist Class ──────────────────────────────────────────────────

export class ResearchSpecialist {
  private userId: string;
  private sessionId: string;
  private taskId: string;

  constructor(userId: string, sessionId: string, taskId: string) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  /**
   * Main research function - simulates human research behavior
   */
  async research(query: string, context?: string): Promise<ResearchResult> {
    console.log(`[ResearchSpecialist] 🔍 Starting human-like research on: "${query.substring(0, 60)}..."`);

    // Initialize research state
    const initialState: ResearchState = {
      phase: 'exploring',
      curiosityLevel: 0.7,
      informationSufficiency: 0.1,
      searchPattern: 'broad',
      openQuestions: [],
      interestingFindings: [],
      satisficingThreshold: 0.85,
    };

    let currentState = { ...initialState };

    // Phase 1: Exploratory search (broad)
    console.log('[ResearchSpecialist] Phase 1: Exploring broadly...');
    const exploratoryFindings = await this.conductSearch(query, currentState, 5);
    currentState = this.updateState(currentState, exploratoryFindings, 'broad');
    currentState.phase = 'focusing';

    // Phase 2: Focused search (narrower)
    console.log('[ResearchSpecialist] Phase 2: Focusing on key themes...');
    const focusedFindings = await this.conductSearch(
      await this.extractKeyThemes(exploratoryFindings),
      currentState,
      8
    );
    currentState = this.updateState(currentState, focusedFindings, 'targeted');
    currentState.phase = 'deepening';

    // Phase 3: Deep dive (specific questions)
    console.log('[ResearchSpecialist] Phase 3: Deepening with specific questions...');
    const deepFindings = await Promise.all(
      currentState.openQuestions.slice(0, 3).map(q =>
        this.conductSearch(q, currentState, 3).then(results => ({ query: q, results }))
      )
    );
    currentState.phase = 'synthesizing';

    // Phase 4: Synthesis and reflection
    console.log('[ResearchSpecialist] Phase 4: Synthesizing findings...');
    const allFindings = [...exploratoryFindings, ...focusedFindings, ...deepFindings.flatMap(d => d.results)];
    const synthesis = await this.generateSynthesis(allFindings, query, context);

    // Phase 5: Satisficing decision
    console.log('[ResearchSpecialist] Phase 5: Evaluating sufficiency...');
    currentState.phase = 'satisficing';
    currentState.informationSufficiency = await this.assessSufficiency(allFindings, query);
    currentState.searchPattern = currentState.informationSufficiency > currentState.satisficingThreshold
      ? 'deep'
      : 'broad';

    // Determine if more research is needed
    const suggestedNextSteps = this.generateNextSteps(allFindings, currentState);

    // Store research in memory
    await this.storeResearchMemory(allFindings, currentState, query);

    return {
      findings: allFindings,
      state: currentState,
      synthesis,
      knowledgeGaps: this.identifyGaps(allFindings),
      suggestedNextSteps,
    };
  }

  /**
   * Conduct a search using appropriate tools
   */
  private async conductSearch(query: string, state: ResearchState, maxResults: number): Promise<ResearchFinding[]> {
    try {
      // Use web search for exploratory, targeted search for focused
      const toolName = state.phase === 'exploring' ? 'web_search' : 'paper_search';
      const result = await toolExecutor.execute(toolName, { query, numResults: maxResults }, this.taskId);

      if (!result.success || !Array.isArray(result.data)) {
        return [];
      }

      return (result.data as any[]).map((item, idx) => ({
        id: `finding_${this.taskId}_${idx}_${Date.now()}`,
        source: item.url || 'unknown',
        content: item.content || item.snippet || '',
        relevance: item.relevance || 0.7,
        confidence: this.calculateFindingConfidence(item),
      }));
    } catch (err) {
      console.warn(`[ResearchSpecialist] Search failed for "${query.substring(0, 30)}...":`, err);
      return [];
    }
  }

  /**
   * Update research state based on findings
   */
  private updateState(state: ResearchState, findings: ResearchFinding[], pattern: 'broad' | 'targeted' | 'deep'): ResearchState {
    // Increase information sufficiency
    const newSufficiency = Math.min(1, state.informationSufficiency + findings.length * 0.05);
    const avgRelevance = findings.reduce((sum, f) => sum + f.relevance, 0) / (findings.length || 1);

    // Detect interesting findings (high relevance)
    const newInteresting = findings
      .filter(f => f.relevance > 0.8)
      .map(f => f.content.substring(0, 100));

    // Extract new open questions
    const newQuestions = this.extractQuestions(findings);

    return {
      ...state,
      informationSufficiency: newSufficiency,
      interestingFindings: [...new Set([...state.interestingFindings, ...newInteresting])],
      openQuestions: [...new Set([...state.openQuestions, ...newQuestions])],
      searchPattern: pattern,
      curiosityLevel: newSufficiency < 0.8 ? Math.min(1, state.curiosityLevel + 0.1) : Math.max(0.2, state.curiosityLevel - 0.1),
    };
  }

  /**
   * Generate synthesis from findings
   */
  private async generateSynthesis(findings: ResearchFinding[], query: string, context?: string): Promise<string> {
    const topFindings = findings
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5)
      .map(f => `Source: ${f.source.substring(0, 50)}\nContent: ${f.content.substring(0, 300)}`)
      .join('\n\n---\n\n');

    const messages = [
      {
        role: 'system' as const,
        content: `You are a research synthesizer. Given multiple findings about a topic, create a coherent summary.

Follow the structure:
1. Core answer to the original question
2. Key findings (3-5 bullet points)
3. Supporting evidence from sources
4. Limitations and uncertainties

Be honest about what is known vs. unknown.`,
      },
      {
        role: 'user' as const,
        content: `Original question: "${query}"

${context ? `Additional context: ${context}` : ''}

Findings:
${topFindings}

Provide a comprehensive synthesis.`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 1500,
        temperature: 0.5,
        model: 'gpt-4o-mini',
      });
      return response.content;
    } catch {
      return `Synthesis of findings for: ${query.substring(0, 50)}...`;
    }
  }

  /**
   * Assess if information is sufficient to stop searching
   */
  private async assessSufficiency(findings: ResearchFinding[], query: string): Promise<number> {
    if (findings.length === 0) return 0;

    const avgRelevance = findings.reduce((s, f) => s + f.relevance, 0) / findings.length;
    const diversity = new Set(findings.map(f => f.source)).size / findings.length;

    const messages = [
      {
        role: 'system' as const,
        content: `Assess whether the provided information is sufficient to answer the question.

Return JSON with:
- sufficiencyScore (0-1): How complete is the information?
- confidence: How certain are you about sufficiency?
- missingPieces: What's still missing?`,
      },
      {
        role: 'user' as const,
        content: `Question: "${query}"

Number of findings: ${findings.length}
Average relevance: ${avgRelevance.toFixed(2)}
Source diversity: ${diversity.toFixed(2)}

Sufficient information has: clear answers, multiple supporting sources, understanding of limitations.`,
      },
    ];

    try {
      const response = await llmService.chat(messages, {
        maxTokens: 300,
        temperature: 0.2,
        model: 'gpt-4o-mini',
      });
      const result = JSON.parse(response.content);
      return result.sufficiencyScore || 0.5;
    } catch {
      return Math.min(1, avgRelevance * diversity * findings.length * 0.1);
    }
  }

  /**
   * Identify knowledge gaps from findings
   */
  private identifyGaps(findings: ResearchFinding[]): string[] {
    const avgConfidence = findings.reduce((s, f) => s + f.confidence, 0) / findings.length;

    if (avgConfidence > 0.7) return [];

    return [
      'More primary source verification needed',
      'Conflicting information requires resolution',
      'Contextual background may be incomplete',
    ];
  }

  /**
   * Generate suggested next steps
   */
  private generateNextSteps(findings: ResearchFinding[], state: ResearchState): string[] {
    const steps: string[] = [];

    if (state.phase === 'satisficing' && state.informationSufficiency < 0.8) {
      steps.push('Continue research with more specific queries');
      steps.push('Verify conflicting information from multiple sources');
    }

    if (state.interestingFindings.length > 0) {
      steps.push(`Explore: ${state.interestingFindings[0].substring(0, 40)}...`);
    }

    if (state.openQuestions.length > 0) {
      steps.push(`Answer: ${state.openQuestions[0]}`);
    }

    if (steps.length === 0) {
      steps.push('Ready to apply findings to decision-making');
    }

    return steps;
  }

  /**
   * Store research in long-term memory
   */
  private async storeResearchMemory(findings: ResearchFinding[], state: ResearchState, query: string): Promise<void> {
    try {
      // Create knowledge nodes for key findings
      for (let i = 0; i < Math.min(3, findings.length); i++) {
        const finding = findings[i];
        await prisma.knowledgeNode.upsert({
          where: { id: `knowledge_${this.userId}_${finding.id}` },
          update: {},
          create: {
            id: `knowledge_${this.userId}_${finding.id}`,
            type: 'fact',
            name: finding.content.substring(0, 50),
            description: finding.content,
            properties: { source: finding.source, relevance: finding.relevance } as any,
          },
        });
      }

      // Update user interests
      const topic = query.split(' ').slice(0, 3).join(' ');
      await prisma.userInterest.upsert({
        where: { userId_topic: { userId: this.userId, topic } },
        update: { lastResearchedAt: new Date(), depth: { increment: 1 } },
        create: { userId: this.userId, topic, depth: 1, lastResearchedAt: new Date() },
      });
    } catch (err) {
      console.warn('[ResearchSpecialist] Could not store memory:', err);
    }
  }

  /**
   * Extract key themes from findings
   */
  private async extractKeyThemes(findings: ResearchFinding[]): Promise<string> {
    const content = findings.map(f => f.content).join(' ');
    const messages = [
      {
        role: 'system' as const,
        content: 'Extract 2-3 key themes from the text. Return as comma-separated string.',
      },
      { role: 'user' as const, content: content.substring(0, 1000) },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 100, temperature: 0.3 });
      return response.content;
    } catch {
      return findings[0]?.content.substring(0, 50) || '';
    }
  }

  /**
   * Extract open questions from findings
   */
  private extractQuestions(findings: ResearchFinding[]): string[] {
    const questions: string[] = [];
    for (const finding of findings) {
      const content = finding.content.toLowerCase();
      if (content.includes('why') || content.includes('how') || content.includes('what if')) {
        const match = content.match(/(why|how|what if)[^?]*\?/i);
        if (match) questions.push(match[0]);
      }
    }
    return questions.slice(0, 3);
  }

  /**
   * Calculate confidence in a finding
   */
  private calculateFindingConfidence(item: any): number {
    const highAuthorityDomains = ['edu', 'gov', 'arxiv', 'ncbi'];
    const url = (item.url || '').toLowerCase();

    let confidence = 0.5;
    for (const domain of highAuthorityDomains) {
      if (url.includes(domain)) {
        confidence += 0.2;
        break;
      }
    }

    confidence += (item.relevance || 0) * 0.2;
    return Math.min(1, Math.max(0.3, confidence));
  }
}
