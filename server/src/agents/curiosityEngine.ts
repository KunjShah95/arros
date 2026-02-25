/**
 * CuriosityEngine — The Drive to Explore and Learn
 *
 * Implements Information Gap Theory (Loewenstein, 1994):
 * Curiosity is the gap between what is known and what one wants to know.
 *
 * Also implements:
 *  - Berlyne's Arousal Theory: novelty and complexity drive curiosity
 *  - Optimal Stimulation Level: too familiar = boring, too unfamiliar = anxiety
 *  - Intrinsic motivation and self-directed learning
 *
 * Functions:
 *  - Evaluate query novelty and generate a curiosity score
 *  - Track what the brain is curious about
 *  - Proactively suggest related topics to explore
 *  - Generate "spontaneous" questions (like a curious mind naturally does)
 */

import { prisma } from '../services/prisma';
import { llmService } from '../services/llm';

// ─── Topic Interest ───────────────────────────────────────────────────────────

export interface TopicInterest {
    topic: string;
    curiosityScore: number;    // 0-1
    knowledgeLevel: number;    // 0-1 (how much brain knows about this)
    lastExplored?: Date;
    openQuestions: string[];   // unresolved questions
    explorationDepth: number;  // how many layers deep we've gone
}

// ─── Curiosity Assessment ─────────────────────────────────────────────────────

export interface CuriosityAssessment {
    score: number;           // 0-1 overall curiosity
    noveltyScore: number;    // how new is this?
    complexityScore: number; // how complex/interesting?
    informationGap: number;  // how much is unknown?
    relatedQuestions: string[]; // what questions does this spark?
    explorationPath: string[];  // suggested next topics to explore
}

// ─── CuriosityEngine Class ────────────────────────────────────────────────────

export class CuriosityEngine {
    private userId: string;
    private interests: Map<string, TopicInterest> = new Map();
    private explorationHistory: string[] = [];
    private openQuestions: string[] = [];

    // Curiosity sweet spot: approximately 0.4-0.7 knowledge level
    // Too little knowledge = anxiety; too much = boredom
    private readonly OPTIMAL_KNOWLEDGE_LEVEL = 0.55;
    private readonly OPTIMAL_COMPLEXITY = 0.65;

    constructor(userId: string) {
        this.userId = userId;
        this.loadInterestsFromStorage();
    }

    /**
     * Evaluate curiosity for a given query
     * Returns 0-1 curiosity score
     */
    async evaluate(query: string): Promise<number> {
        const topic = this.extractCoreTopic(query);
        const assessment = await this.assess(query);
        return assessment.score;
    }

    /**
     * Full curiosity assessment — what makes this interesting?
     */
    async assess(query: string): Promise<CuriosityAssessment> {
        const topic = this.extractCoreTopic(query);
        const interest = this.interests.get(topic);

        // 1. Novelty score — have we explored this before?
        const noveltyScore = interest
            ? Math.max(0, 1 - interest.explorationDepth * 0.2)
            : 0.9; // brand new = maximum novelty

        // 2. Knowledge gap — how much do we NOT know?
        const knowledgeLevel = interest?.knowledgeLevel ?? 0.1;
        const informationGap = 1 - knowledgeLevel;

        // 3. Complexity score — complex topics are more interesting
        const complexityScore = this.estimateComplexity(query);

        // 4. Optimal stimulation — interest is highest at medium knowledge level
        const optimalityBonus = this.computeOptimalityBonus(knowledgeLevel, complexityScore);

        // 5. Open questions from related topics
        const relatedOpenQuestions = this.findRelatedOpenQuestions(topic);

        // Combined curiosity score
        const score = Math.min(1,
            noveltyScore * 0.3 +
            informationGap * 0.25 +
            complexityScore * 0.25 +
            optimalityBonus * 0.2
        );

        // Generate what questions this sparks
        const relatedQuestions = await this.generateSpontaneousQuestions(query, topic);

        // Suggest exploration path
        const explorationPath = this.suggestExplorationPath(topic, interest);

        return {
            score,
            noveltyScore,
            complexityScore,
            informationGap,
            relatedQuestions,
            explorationPath,
        };
    }

    /**
     * Register interest in a topic — the brain is getting curious about this
     */
    async registerInterest(query: string): Promise<void> {
        const topic = this.extractCoreTopic(query);
        const existing = this.interests.get(topic);

        if (existing) {
            existing.curiosityScore = Math.min(1, existing.curiosityScore + 0.1);
            existing.explorationDepth++;
            existing.lastExplored = new Date();
        } else {
            this.interests.set(topic, {
                topic,
                curiosityScore: 0.8,
                knowledgeLevel: 0.1,
                lastExplored: new Date(),
                openQuestions: await this.generateSpontaneousQuestions(query, topic),
                explorationDepth: 1,
            });
        }

        this.explorationHistory.push(topic);
        if (this.explorationHistory.length > 100) this.explorationHistory.shift();
    }

    /**
     * Mark a topic as learned — knowledge increases, curiosity decreases slightly
     */
    updateKnowledge(topic: string, knowledgeGained: number): void {
        const interest = this.interests.get(topic);
        if (interest) {
            interest.knowledgeLevel = Math.min(1, interest.knowledgeLevel + knowledgeGained);
            // Curiosity dips slightly as knowledge gap closes (but not fully)
            interest.curiosityScore = Math.max(0.2, interest.curiosityScore - knowledgeGained * 0.3);
        }
    }

    /**
     * "What am I curious about right now?" — human-like introspection
     */
    getTopCuriosities(n: number = 5): TopicInterest[] {
        return Array.from(this.interests.values())
            .sort((a, b) => b.curiosityScore - a.curiosityScore)
            .slice(0, n);
    }

    /**
     * Add a question that arose during thinking (open questions accumulate)
     */
    addOpenQuestion(question: string): void {
        this.openQuestions.push(question);
        if (this.openQuestions.length > 20) this.openQuestions.shift();
    }

    /**
     * Get all unresolved questions — the brain's "TODO" for curiosity
     */
    getOpenQuestions(): string[] {
        return [...this.openQuestions];
    }

    // ─── Private Methods ─────────────────────────────────────────────────────────

    private extractCoreTopic(query: string): string {
        const stopWords = new Set(['what', 'how', 'why', 'when', 'where', 'who', 'is', 'are', 'the', 'a', 'an', 'to', 'for', 'of', 'in', 'on', 'at']);
        const words = query.toLowerCase()
            .replace(/[?!.,]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopWords.has(w));

        return words.slice(0, 3).join(' ');
    }

    private estimateComplexity(query: string): number {
        let complexity = 0.3; // baseline

        // Long queries are often more complex
        complexity += Math.min(0.2, query.length / 200);

        // Technical keywords add complexity
        const techKeywords = ['algorithm', 'mechanism', 'system', 'architecture', 'relationship', 'process', 'framework', 'theory', 'model'];
        for (const kw of techKeywords) {
            if (query.toLowerCase().includes(kw)) complexity += 0.07;
        }

        // Questions starting with "why" or "how" are typically harder
        if (query.toLowerCase().startsWith('why') || query.toLowerCase().startsWith('how')) {
            complexity += 0.15;
        }

        return Math.min(1, complexity);
    }

    private computeOptimalityBonus(knowledgeLevel: number, complexity: number): number {
        // Curiosity peaks at optimal stimulation (Berlyne's inverted-U)
        const knowledgeDistance = Math.abs(knowledgeLevel - this.OPTIMAL_KNOWLEDGE_LEVEL);
        const complexityDistance = Math.abs(complexity - this.OPTIMAL_COMPLEXITY);
        return Math.max(0, 1 - knowledgeDistance * 2 - complexityDistance);
    }

    private findRelatedOpenQuestions(topic: string): string[] {
        return this.openQuestions.filter(q => {
            const topicWords = topic.split(' ');
            return topicWords.some(w => q.toLowerCase().includes(w));
        }).slice(0, 3);
    }

    private async generateSpontaneousQuestions(query: string, topic: string): Promise<string[]> {
        // Generate "what does this make me wonder?" questions
        const knownInterests = this.getTopCuriosities(3).map(i => i.topic);

        try {
            const messages = [
                {
                    role: 'system' as const,
                    content: `You are a curious, intellectually engaged AI. When you encounter a query, you naturally wonder about related things — like a human mind that can't help asking follow-up questions.

My current active interests: ${knownInterests.join(', ') || 'still forming'}

Generate 3 short, genuinely interesting follow-up questions this topic sparks. These should be things a curious person naturally wonders about — not just paraphrases. Be specific, intellectually provocative. Return as JSON array.`,
                },
                { role: 'user' as const, content: `Topic: "${query}"` },
            ];

            const response = await llmService.chat(messages, {
                maxTokens: 300,
                temperature: 0.8,
                model: 'gpt-4o-mini',
            });

            const parsed = JSON.parse(response.content);
            return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
        } catch {
            return [
                `What are the underlying assumptions in "${topic}"?`,
                `How does ${topic} connect to real-world applications?`,
                `What would challenge the conventional wisdom about ${topic}?`,
            ];
        }
    }

    private suggestExplorationPath(topic: string, interest?: TopicInterest): string[] {
        const path: string[] = [];

        if (!interest || interest.explorationDepth < 2) {
            path.push(`${topic} fundamentals`);
            path.push(`${topic} real-world examples`);
        } else if (interest.explorationDepth < 5) {
            path.push(`${topic} advanced concepts`);
            path.push(`${topic} recent developments`);
            path.push(`${topic} open problems`);
        } else {
            path.push(`frontier research in ${topic}`);
            path.push(`cross-domain applications of ${topic}`);
        }

        return path;
    }

    private async loadInterestsFromStorage(): Promise<void> {
        // Non-blocking background load — like subconscious interest retrieval
        try {
            const interests = await prisma.userInterest.findMany({
                where: { userId: this.userId },
                orderBy: { depth: 'desc' },
                take: 20,
            });

            for (const interest of interests) {
                this.interests.set(interest.topic, {
                    topic: interest.topic,
                    curiosityScore: Math.min(1, interest.depth * 0.1),
                    knowledgeLevel: Math.min(1, interest.depth * 0.15),
                    explorationDepth: interest.depth,
                    lastExplored: interest.lastResearchedAt ?? undefined,
                    openQuestions: [],
                });
            }
        } catch {
            // Fail silently — can work without persistent interests
        }
    }
}
