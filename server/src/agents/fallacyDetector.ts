import { z } from 'zod';
import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { v4 as uuid } from 'uuid';

export interface Fallacy {
  id: string;
  type: FallacyType;
  description: string;
  evidence: string;
  location: {
    startIndex: number;
    endIndex: number;
  };
  severity: 'minor' | 'moderate' | 'severe';
  suggestion: string;
}

export type FallacyType =
  | 'ad_hominem'
  | 'straw_man'
  | 'appeal_to_authority'
  | 'false_dilemma'
  | 'slippery_slope'
  | 'circular_reasoning'
  | 'hasty_generalization'
  | 'red_herring'
  | 'appeal_to_emotion'
  | 'bandwagon'
  | 'false_cause'
  | 'no_true_scotsman'
  | 'appeal_to_nature'
  | 'tu_quoque'
  | 'sunk_cost'
  | 'loaded_question'
  | 'equivocation'
  | 'composition_divISION'
  | 'genetic_fallacy'
  | 'middle_ground';

export interface ArgumentAnalysis {
  id: string;
  thesis: string;
  claims: string[];
  evidence: string[];
  fallacies: Fallacy[];
  logicalStrength: number;
  coherence: number;
  overallAssessment: string;
  improvements: string[];
}

export interface DebateFeedback {
  id: string;
  argument: string;
  opponentResponse: string;
  yourWeaknesses: string[];
  opponentStrengths: string[];
  counterStrategies: string[];
  improvedArgument: string;
}

export interface CriticalThinkingScore {
  overall: number;
  clarity: number;
  relevance: number;
  logic: number;
  evidence: number;
  bias: number;
  feedback: string;
}

export interface SocraticChallenge {
  id: string;
  question: string;
  type: 'clarification' | 'assumption' | 'evidence' | 'implication' | 'perspective';
  purpose: string;
  followUp?: string;
}

export class LogicalFallacyDetectorAgent {
  private userId: string;
  private sessionId: string;

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || uuid();
  }

  async detectFallacies(text: string): Promise<Fallacy[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Detect logical fallacies in the text. Identify:
- Ad hominem attacks
- Straw man arguments
- False dilemmas
- Slippery slopes
- Circular reasoning
- Hasty generalizations
- Red herrings
- Appeals to emotion
- Bandwagon arguments
- False causes
- And other logical fallacies

Return JSON array:
[
  {
    "id": "1",
    "type": "fallacy_type",
    "description": "what the fallacy is",
    "evidence": "specific text showing fallacy",
    "location": {"startIndex": 0, "endIndex": 100},
    "severity": "minor|moderate|severe",
    "suggestion": "how to fix"
  }
]`,
      },
      {
        role: 'user' as const,
        content: `Analyze:\n\n${text}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 2500, temperature: 0.2 });
      const parsed = JSON.parse(response.content);
      
      const fallacies: Fallacy[] = parsed.map((f: any) => ({
        id: uuid(),
        ...f,
      }));

      await this.saveFallacies(fallacies);
      return fallacies;
    } catch {
      return [];
    }
  }

  async analyzeArgument(
    argument: string,
    context?: string
  ): Promise<ArgumentAnalysis> {
    const messages = [
      {
        role: 'system' as const,
        content: `Analyze this argument comprehensively. Return JSON:
{
  "thesis": "main claim",
  "claims": ["supporting claim 1", "supporting claim 2"],
  "evidence": ["evidence used"],
  "fallacies": [
    {
      "type": "fallacy type",
      "description": "description",
      "evidence": "text",
      "location": {"startIndex": 0, "endIndex": 50},
      "severity": "minor|moderate|severe",
      "suggestion": "fix"
    }
  ],
  "logicalStrength": 0-100,
  "coherence": 0-100,
  "overallAssessment": "summary",
  "improvements": ["improvement suggestion"]
}`,
      },
      {
        role: 'user' as const,
        content: `${context ? `Context: ${context}\n\n` : ''}Argument:\n${argument}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 2000, temperature: 0.2 });
      const parsed = JSON.parse(response.content);
      
      const analysis: ArgumentAnalysis = {
        id: uuid(),
        ...parsed,
        fallacies: parsed.fallacies?.map((f: any) => ({ id: uuid(), ...f })) || [],
      };

      await this.saveAnalysis(analysis);
      return analysis;
    } catch {
      return this.getFallbackAnalysis(argument);
    }
  }

  async evaluateDebatePerformance(
    yourArgument: string,
    opponentResponse: string,
    isProponent: boolean = true
  ): Promise<DebateFeedback> {
    const messages = [
      {
        role: 'system' as const,
        content: `Evaluate debate performance. Return JSON:
{
  "argument": "your argument",
  "opponentResponse": "their response",
  "yourWeaknesses": ["weakness in your argument"],
  "opponentStrengths": ["strong points in opponent's argument"],
  "counterStrategies": ["how to counter"],
  "improvedArgument": "better version of your argument"
}`,
      },
      {
        role: 'user' as const,
        content: `Your argument:\n${yourArgument}\n\nOpponent response:\n${opponentResponse}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1500, temperature: 0.3 });
      const parsed = JSON.parse(response.content);
      
      return {
        id: uuid(),
        ...parsed,
      };
    } catch {
      return {
        id: uuid(),
        argument: yourArgument,
        opponentResponse,
        yourWeaknesses: ['Unable to analyze'],
        opponentStrengths: [],
        counterStrategies: ['Try again'],
        improvedArgument: yourArgument,
      };
    }
  }

  async assessCriticalThinking(
    text: string
  ): Promise<CriticalThinkingScore> {
    const messages = [
      {
        role: 'system' as const,
        content: `Assess critical thinking quality. Return JSON:
{
  "overall": 0-100,
  "clarity": 0-100,
  "relevance": 0-100,
  "logic": 0-100,
  "evidence": 0-100,
  "bias": 0-100,
  "feedback": "detailed feedback"
}`,
      },
      {
        role: 'user' as const,
        content: `Assess:\n\n${text.substring(0, 3000)}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1000, temperature: 0.2 });
      return JSON.parse(response.content);
    } catch {
      return {
        overall: 50,
        clarity: 50,
        relevance: 50,
        logic: 50,
        evidence: 50,
        bias: 50,
        feedback: 'Unable to analyze',
      };
    }
  }

  async generateSocraticChallenges(
    argument: string,
    count: number = 3
  ): Promise<SocraticChallenge[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `Generate Socratic questions to challenge this argument. Return JSON array (${count} questions):
[
  {
    "id": "1",
    "question": "Socratic question",
    "type": "clarification|assumption|evidence|implication|perspective",
    "purpose": "why this questions",
    "followUp": "optional follow-up"
  }
]`,
      },
      {
        role: 'user' as const,
        content: `Challenge:\n\n${argument}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1000, temperature: 0.5 });
      const parsed = JSON.parse(response.content);
      
      return parsed.map((q: any) => ({
        id: uuid(),
        ...q,
      }));
    } catch {
      return [];
    }
  }

  async improveArgument(
    argument: string,
    identifiedWeaknesses: string[]
  ): Promise<{
    improvedArgument: string;
    changes: string[];
    explanation: string;
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `Improve this argument by addressing weaknesses. Return JSON:
{
  "improvedArgument": "better argument",
  "changes": ["change 1", "change 2"],
  "explanation": "why these changes help"
}`,
      },
      {
        role: 'user' as const,
        content: `Argument:\n${argument}\n\nWeaknesses to fix:\n${identifiedWeaknesses.join(', ')}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1500, temperature: 0.3 });
      return JSON.parse(response.content);
    } catch {
      return {
        improvedArgument: argument,
        changes: [],
        explanation: 'Unable to improve',
      };
    }
  }

  async detectBias(text: string): Promise<{
    biases: Array<{
      type: string;
      evidence: string;
      severity: string;
    }>;
    overallBiasScore: number;
    recommendations: string[];
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `Detect bias in text. Return JSON:
{
  "biases": [
    {
      "type": "bias type",
      "evidence": "text showing bias",
      "severity": "low|medium|high"
    }
  ],
  "overallBiasScore": 0-100,
  "recommendations": ["how to address"]
}`,
      },
      {
        role: 'user' as const,
        content: `Analyze:\n\n${text}`,
      },
    ];

    try {
      const response = await llmService.chat(messages, { maxTokens: 1000, temperature: 0.2 });
      return JSON.parse(response.content);
    } catch {
      return {
        biases: [],
        overallBiasScore: 0,
        recommendations: [],
      };
    }
  }

  async teachFallacy(
    fallacyType: FallacyType
  ): Promise<{
    name: string;
    definition: string;
    examples: string[];
    howToAvoid: string;
    exercises: string[];
  }> {
    const fallacyDefinitions: Record<FallacyType, string> = {
      'ad_hominem': 'Attacking the person making the argument rather than the argument itself',
      'straw_man': 'Misrepresenting an argument to make it easier to attack',
      'appeal_to_authority': 'Using an authority figure as evidence rather than valid reasoning',
      'false_dilemma': 'Presenting only two options when more exist',
      'slippery_slope': 'Claiming one event will lead to extreme consequences without evidence',
      'circular_reasoning': 'Using the conclusion as a premise',
      'hasty_generalization': 'Making broad conclusions from limited examples',
      'red_herring': 'Introducing irrelevant information to distract',
      'appeal_to_emotion': 'Using emotions rather than logic',
      'bandwagon': 'Arguing something is true because many believe it',
      'false_cause': 'Assuming correlation implies causation',
      'no_true_scotsman': 'Dismissing counterexamples with exceptions',
      'appeal_to_nature': 'Arguing something is good because natural',
      'tu_quoque': 'Answering criticism with criticism',
      'sunk_cost': 'Continuing because of past investment',
      'loaded_question': 'Question containing assumptions',
      'equivocation': 'Using word ambiguities',
      'composition_divISION': 'Assuming parts have same properties as whole',
      'genetic_fallacy': 'Judging based on origin rather than content',
      'middle_ground': 'Assuming compromise is always correct',
    };

    return {
      name: fallacyType.replace(/_/g, ' '),
      definition: fallacyDefinitions[fallacyType] || 'Unknown fallacy',
      examples: [`Example of ${fallacyType}`],
      howToAvoid: `To avoid ${fallacyType}, ensure your arguments are based on evidence and logical reasoning`,
      exercises: [`Identify ${fallacyType} in news articles`, `Practice constructing arguments without ${fallacyType}`],
    };
  }

  private async saveFallacies(fallacies: Fallacy[]): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'fallacy_detection' as any,
        content: {
          userId: this.userId,
          fallacies,
          timestamp: new Date(),
        } as unknown as object,
        confidence: 0.9,
      },
    });
  }

  private async saveAnalysis(analysis: ArgumentAnalysis): Promise<void> {
    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: uuid(),
        type: 'argument_analysis' as any,
        content: analysis as unknown as object,
        confidence: analysis.logicalStrength / 100,
      },
    });
  }

  private getFallbackAnalysis(argument: string): ArgumentAnalysis {
    return {
      id: uuid(),
      thesis: argument.substring(0, 100),
      claims: [],
      evidence: [],
      fallacies: [],
      logicalStrength: 50,
      coherence: 50,
      overallAssessment: 'Unable to analyze',
      improvements: ['Try again with more context'],
    };
  }
}
