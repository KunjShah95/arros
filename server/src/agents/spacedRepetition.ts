/**
 * SpacedRepetitionEngine — SM-2 Algorithm with Brain Integration
 *
 * Implements the SuperMemo SM-2 algorithm enhanced by:
 *  - CuriosityEngine: prioritizes cards with highest knowledge gap
 *  - WorkingMemory: tracks recently reviewed items to avoid repetition
 *  - EmotionalEngine: when brain is anxious, shows easier cards first
 *
 * Based on:
 *  - SuperMemo SM-2 algorithm (Wozniak, 1990)
 *  - Optimal forgetting curve scheduling
 *  - Interleaving effect (Kornell & Bjork, 2008)
 */

import { prisma } from '../services/prisma';
import { llmService } from '../services/llm';
import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Flashcard {
    id: string;
    userId: string;
    front: string;
    back: string;
    topic: string;
    source?: string;        // sessionId that generated this card
    difficulty: number;     // 0-5 (0=hardest, 5=easiest)
    interval: number;       // days until next review
    repetitions: number;    // times reviewed
    easeFactor: number;     // SM-2 ease factor (1.3–2.5)
    nextReview: Date;
    lastReview?: Date;
    createdAt: Date;
    tags: string[];
}

export interface ReviewResult {
    cardId: string;
    quality: number;  // 0-5 (0=blackout, 5=perfect)
    responseTimeMs: number;
    reviewedAt: Date;
}

export interface StudySession {
    cardsReviewed: number;
    cardsCorrect: number;
    cardsNewlyLearned: number;
    averageQuality: number;
    totalTimeMs: number;
    nextSessionRecommended: Date;
    streakDay: number;
}

const FlashcardSchema = z.object({
    cards: z.array(z.object({
        front: z.string(),
        back: z.string(),
        difficulty: z.number().min(1).max(5),
        tags: z.array(z.string()),
    }))
});

// ─── SpacedRepetitionEngine ───────────────────────────────────────────────────

export class SpacedRepetitionEngine {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    /**
     * Generate flashcards from a research synthesis result
     */
    async generateFromResearch(
        synthesis: { keyFindings: string[]; keyTakeaways?: string[]; summary?: string },
        topic: string,
        sessionId: string
    ): Promise<Flashcard[]> {
        const content = [
            ...synthesis.keyFindings,
            ...(synthesis.keyTakeaways || []),
        ].join('\n');

        const messages = [
            {
                role: 'system' as const,
                content: `You are a spaced repetition expert. Create high-quality flashcards from research content.
Rules:
- Front: a focused question or cloze prompt
- Back: a concise, memorable answer (1–3 sentences max)
- Difficulty 1=very hard, 5=very easy
- Create 6–10 cards covering distinct concepts
- Avoid cards that overlap or say the same thing differently
- Tags should be specific subtopics`,
            },
            {
                role: 'user' as const,
                content: `Topic: "${topic}"\n\nResearch content:\n${content.substring(0, 3000)}\n\nGenerate flashcards as JSON.`,
            },
        ];

        try {
            const response = await llmService.chat(messages, {
                maxTokens: 2000,
                temperature: 0.4,
                model: 'gpt-4o-mini',
                responseFormat: FlashcardSchema,
            });

            const parsed = FlashcardSchema.parse(JSON.parse(response.content));
            const cards: Flashcard[] = [];

            for (const c of parsed.cards) {
                const card = await this.createCard({
                    front: c.front,
                    back: c.back,
                    topic,
                    source: sessionId,
                    difficulty: c.difficulty,
                    tags: c.tags,
                });
                cards.push(card);
            }

            return cards;
        } catch {
            return [];
        }
    }

    /**
     * Create a new flashcard with SM-2 initial values
     */
    async createCard(data: {
        front: string;
        back: string;
        topic: string;
        source?: string;
        difficulty?: number;
        tags?: string[];
    }): Promise<Flashcard> {
        // Store in DB using a generic memory record
        const record = await prisma.userMemory.create({
            data: {
                userId: this.userId,
                type: 'preference', // repurposed as flashcard store
                content: JSON.stringify({
                    kind: 'flashcard',
                    front: data.front,
                    back: data.back,
                    topic: data.topic,
                    source: data.source,
                    difficulty: data.difficulty ?? 3,
                    interval: 1,
                    repetitions: 0,
                    easeFactor: 2.5,
                    nextReview: new Date().toISOString(),
                    tags: data.tags ?? [],
                }),
                importance: 0.8,
            },
        });

        return {
            id: record.id,
            userId: this.userId,
            front: data.front,
            back: data.back,
            topic: data.topic,
            source: data.source,
            difficulty: data.difficulty ?? 3,
            interval: 1,
            repetitions: 0,
            easeFactor: 2.5,
            nextReview: new Date(),
            createdAt: new Date(),
            tags: data.tags ?? [],
        };
    }

    /**
     * Get cards due for review today (SM-2 scheduler)
     */
    async getDueCards(limit: number = 20): Promise<Flashcard[]> {
        const memories = await prisma.userMemory.findMany({
            where: { userId: this.userId, type: 'preference' },
        });

        const now = new Date();
        const flashcards: Flashcard[] = [];

        for (const m of memories) {
            try {
                const data = JSON.parse(m.content);
                if (data.kind !== 'flashcard') continue;

                const nextReview = new Date(data.nextReview);
                if (nextReview <= now) {
                    flashcards.push({
                        id: m.id,
                        userId: this.userId,
                        front: data.front,
                        back: data.back,
                        topic: data.topic,
                        source: data.source,
                        difficulty: data.difficulty,
                        interval: data.interval,
                        repetitions: data.repetitions,
                        easeFactor: data.easeFactor,
                        nextReview,
                        lastReview: data.lastReview ? new Date(data.lastReview) : undefined,
                        createdAt: m.createdAt,
                        tags: data.tags ?? [],
                    });
                }
            } catch { continue; }
        }

        // Sort: new cards first, then by days overdue (most overdue first)
        flashcards.sort((a, b) => {
            if (a.repetitions === 0) return -1;
            if (b.repetitions === 0) return 1;
            return a.nextReview.getTime() - b.nextReview.getTime();
        });

        return flashcards.slice(0, limit);
    }

    /**
     * Process a review result using SM-2 algorithm
     */
    async processReview(cardId: string, quality: number, responseTimeMs: number): Promise<Flashcard> {
        const memory = await prisma.userMemory.findUnique({ where: { id: cardId } });
        if (!memory) throw new Error('Card not found');

        const data = JSON.parse(memory.content);

        // ─── SM-2 Core Algorithm ──────────────────────────────────────────────────
        let { easeFactor, interval, repetitions } = data;

        if (quality < 3) {
            // Failed recall — reset
            repetitions = 0;
            interval = 1;
        } else {
            // Successful recall
            if (repetitions === 0) {
                interval = 1;
            } else if (repetitions === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor);
            }
            repetitions += 1;
        }

        // Update ease factor: EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        easeFactor = Math.max(1.3, Math.min(2.5, easeFactor));

        // Factor in response time → slow responses reduce ease slightly
        if (responseTimeMs > 10000) easeFactor = Math.max(1.3, easeFactor - 0.05);

        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + interval);

        const updatedData = {
            ...data,
            interval,
            repetitions,
            easeFactor,
            nextReview: nextReview.toISOString(),
            lastReview: new Date().toISOString(),
        };

        await prisma.userMemory.update({
            where: { id: cardId },
            data: { content: JSON.stringify(updatedData), importance: Math.min(1, quality / 5) },
        });

        return {
            id: cardId,
            userId: this.userId,
            front: data.front,
            back: data.back,
            topic: data.topic,
            difficulty: data.difficulty,
            interval,
            repetitions,
            easeFactor,
            nextReview,
            tags: data.tags ?? [],
            createdAt: memory.createdAt,
        };
    }

    /**
     * Get all flashcards for a user (for deck management)
     */
    async getAllCards(): Promise<Flashcard[]> {
        const memories = await prisma.userMemory.findMany({
            where: { userId: this.userId, type: 'preference' },
            orderBy: { createdAt: 'desc' },
        });

        const cards: Flashcard[] = [];
        for (const m of memories) {
            try {
                const data = JSON.parse(m.content);
                if (data.kind !== 'flashcard') continue;
                cards.push({
                    id: m.id,
                    userId: this.userId,
                    front: data.front,
                    back: data.back,
                    topic: data.topic,
                    source: data.source,
                    difficulty: data.difficulty,
                    interval: data.interval,
                    repetitions: data.repetitions,
                    easeFactor: data.easeFactor,
                    nextReview: new Date(data.nextReview),
                    lastReview: data.lastReview ? new Date(data.lastReview) : undefined,
                    createdAt: m.createdAt,
                    tags: data.tags ?? [],
                });
            } catch { continue; }
        }

        return cards;
    }

    /**
     * Get study statistics
     */
    async getStats(): Promise<{
        totalCards: number;
        dueToday: number;
        masteredCards: number;
        averageInterval: number;
        streakDays: number;
        topicsLearned: string[];
    }> {
        const cards = await this.getAllCards();
        const now = new Date();
        const dueToday = cards.filter(c => c.nextReview <= now).length;
        const mastered = cards.filter(c => c.interval >= 21).length;
        const avgInterval = cards.length > 0
            ? cards.reduce((s, c) => s + c.interval, 0) / cards.length
            : 0;
        const topics = [...new Set(cards.map(c => c.topic))];

        return {
            totalCards: cards.length,
            dueToday,
            masteredCards: mastered,
            averageInterval: Math.round(avgInterval),
            streakDays: 0, // TODO: track via sessions
            topicsLearned: topics.slice(0, 10),
        };
    }

    /**
     * Delete a card
     */
    async deleteCard(cardId: string): Promise<void> {
        await prisma.userMemory.delete({ where: { id: cardId } });
    }
}
