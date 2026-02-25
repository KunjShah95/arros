/**
 * NightResearchScheduler — The Brain That Works While You Sleep
 *
 * This module implements autonomous overnight research. At 2:00 AM each night:
 *  1. Reads unresolved open questions from CuriosityEngine
 *  2. Reads highest-priority user interests from UserInterest table
 *  3. Selects 2–3 most promising topics via LLM prioritization
 *  4. Runs full HumanBrainOrchestrator research on each
 *  5. Runs DreamConsolidator.consolidate() to compress memories
 *  6. Stores "Morning Digest" for user to review on next login
 *
 * Design: Inspired by how the hippocampus replays memories during NREM sleep
 * and the prefrontal cortex reinforces long-term patterns during REM.
 */

import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { HumanBrainOrchestrator } from './humanBrainOrchestrator';
import { DreamConsolidator } from './dreamConsolidator';
import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NightDigest {
    userId: string;
    date: string;
    topicsResearched: string[];
    insightsGenerated: string[];
    memoriesConsolidated: number;
    novelConnections: string[];
    morningBriefing: string;
    readyForReview: boolean;
}

const TopicSelectionSchema = z.object({
    selectedTopics: z.array(z.object({
        topic: z.string(),
        reason: z.string(),
        priority: z.number().min(1).max(10),
    }))
});

// ─── NightResearchScheduler Class ─────────────────────────────────────────────

export class NightResearchScheduler {
    private isRunning = false;
    private schedulerInterval: NodeJS.Timeout | null = null;

    /**
     * Start the scheduler — checks every hour if it's time to run
     */
    start(): void {
        if (this.schedulerInterval) return;
        console.log('🌙 [NightScheduler] Autonomous research scheduler started');

        this.schedulerInterval = setInterval(async () => {
            await this.checkAndRun();
        }, 60 * 60 * 1000); // check every hour

        // Also check immediately on start
        this.checkAndRun().catch(console.error);
    }

    stop(): void {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
            console.log('⏹️  [NightScheduler] Scheduler stopped');
        }
    }

    /**
     * Check if it's time to run (2 AM local time window)
     */
    private async checkAndRun(): Promise<void> {
        const now = new Date();
        const hour = now.getHours();

        // Run between 2:00 AM and 3:00 AM
        if (hour !== 2) return;

        // Check if we already ran tonight
        const todayKey = now.toISOString().split('T')[0];
        const alreadyRan = await prisma.userMemory.findFirst({
            where: {
                type: 'fact',
                content: { contains: `night_research_ran_${todayKey}` },
            },
        });

        if (alreadyRan) return;

        console.log(`🌙 [NightScheduler] It's ${hour}:00 — starting autonomous research for all users`);
        await this.runForAllUsers();
    }

    /**
     * Run overnight research for ALL users with recent activity
     */
    async runForAllUsers(): Promise<void> {
        if (this.isRunning) {
            console.log('⏳ [NightScheduler] Already running, skip');
            return;
        }

        this.isRunning = true;

        try {
            // Get users with activity in the last 7 days
            const recentUsers = await prisma.session.findMany({
                where: {
                    updatedAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
                },
                select: { userId: true },
                distinct: ['userId'],
            });

            console.log(`🌙 [NightScheduler] Running for ${recentUsers.length} active users`);

            for (const { userId } of recentUsers) {
                try {
                    await this.runForUser(userId);
                } catch (err) {
                    console.error(`[NightScheduler] Failed for user ${userId}:`, err);
                }
            }
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Run overnight research for a single user
     */
    async runForUser(userId: string): Promise<NightDigest> {
        console.log(`\n🌙 [NightScheduler] Starting overnight research for user: ${userId}`);
        const startTime = Date.now();

        // ─── 1. Gather topic candidates ────────────────────────────────────────────
        const interests = await prisma.userInterest.findMany({
            where: { userId },
            orderBy: { depth: 'desc' },
            take: 10,
        });

        const recentSessions = await prisma.session.findMany({
            where: { userId, status: 'completed' },
            orderBy: { updatedAt: 'desc' },
            take: 5,
            select: { query: true },
        });

        if (interests.length === 0 && recentSessions.length === 0) {
            console.log(`[NightScheduler] No interests found for user ${userId}, skipping`);
            return this.emptyDigest(userId);
        }

        // ─── 2. AI selects best topics to research ────────────────────────────────
        const topicCandidates = [
            ...interests.map(i => `${i.topic} (depth: ${i.depth.toFixed(2)})`),
            ...recentSessions.map(s => s.query || '').filter(Boolean),
        ].slice(0, 15);

        const selectedTopics = await this.selectTopics(topicCandidates, userId);
        console.log(`[NightScheduler] Selected ${selectedTopics.length} topics:`, selectedTopics.map(t => t.topic));

        // ─── 3. Research each topic ───────────────────────────────────────────────
        const brain = new HumanBrainOrchestrator(userId, false); // no subagents for speed
        const researchedTopics: string[] = [];
        const allInsights: string[] = [];

        for (const { topic, reason } of selectedTopics.slice(0, 2)) {
            try {
                console.log(`  🔬 [NightScheduler] Researching: "${topic}" — ${reason}`);
                const result = await brain.research(`${topic} — focus on new developments and connections`);
                researchedTopics.push(topic);

                if (result.synthesis?.keyFindings) {
                    allInsights.push(...result.synthesis.keyFindings.slice(0, 3));
                }
                if (result.synthesis?.keyTakeaways) {
                    allInsights.push(...result.synthesis.keyTakeaways.slice(0, 2));
                }
            } catch (err) {
                console.error(`  [NightScheduler] Research failed for "${topic}":`, err);
            }
        }

        // ─── 4. Run DreamConsolidator ─────────────────────────────────────────────
        const consolidator = new DreamConsolidator(userId);
        const consolidation = await consolidator.consolidate();
        console.log(`  💤 [NightScheduler] Consolidated ${consolidation.memoriesPruned} memories, ${consolidation.insightsGenerated.length} insights`);

        // ─── 5. Generate morning briefing ─────────────────────────────────────────
        const morningBriefing = await this.generateMorningBriefing(
            userId,
            researchedTopics,
            allInsights,
            consolidation.insightsGenerated,
            consolidation.novelConnections
        );

        // ─── 6. Store digest ──────────────────────────────────────────────────────
        const todayKey = new Date().toISOString().split('T')[0];
        const digest: NightDigest = {
            userId,
            date: todayKey,
            topicsResearched: researchedTopics,
            insightsGenerated: allInsights.slice(0, 8),
            memoriesConsolidated: consolidation.memoriesPruned,
            novelConnections: consolidation.novelConnections.map((c: any) =>
                typeof c === 'string' ? c : `${c.topicA} ↔ ${c.topicB}: ${c.connection}`
            ).slice(0, 3),
            morningBriefing,
            readyForReview: true,
        };

        // Persist digest as memory
        await prisma.userMemory.create({
            data: {
                userId,
                type: 'fact',
                content: JSON.stringify({
                    kind: 'night_digest',
                    night_research_ran: `night_research_ran_${todayKey}`,
                    ...digest,
                }),
                importance: 0.9,
            },
        });

        console.log(`✅ [NightScheduler] Overnight research complete for ${userId} in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
        return digest;
    }

    /**
     * MANUAL TRIGGER — run for a specific user on demand (for testing / UI button)
     */
    async triggerManual(userId: string): Promise<NightDigest> {
        return this.runForUser(userId);
    }

    /**
     * Get today's morning digest for a user
     */
    async getMorningDigest(userId: string): Promise<NightDigest | null> {
        const todayKey = new Date().toISOString().split('T')[0];
        const record = await prisma.userMemory.findFirst({
            where: {
                userId,
                type: 'fact',
                content: { contains: `night_research_ran_${todayKey}` },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!record) return null;

        try {
            const data = JSON.parse(record.content);
            return data as NightDigest;
        } catch {
            return null;
        }
    }

    /**
     * Get past digests (last N days)
     */
    async getPastDigests(userId: string, days: number = 7): Promise<NightDigest[]> {
        const records = await prisma.userMemory.findMany({
            where: {
                userId,
                type: 'fact',
                content: { contains: 'night_digest' },
                createdAt: { gte: new Date(Date.now() - days * 24 * 3600 * 1000) },
            },
            orderBy: { createdAt: 'desc' },
        });

        const digests: NightDigest[] = [];
        for (const r of records) {
            try {
                const data = JSON.parse(r.content);
                if (data.kind === 'night_digest') digests.push(data);
            } catch { continue; }
        }

        return digests;
    }

    // ─── Private helpers ────────────────────────────────────────────────────────

    private async selectTopics(candidates: string[], userId: string) {
        try {
            const messages = [
                {
                    role: 'system' as const,
                    content: `You are an AI research assistant that selects which topics a user should explore overnight. 
Pick 2–3 topics that are: novel, likely to unlock new understanding, or form connections with other knowledge.
Avoid topics already very well known or too broad.`,
                },
                {
                    role: 'user' as const,
                    content: `User's topic candidates:\n${candidates.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nSelect 2–3 best topics for overnight autonomous research.`,
                },
            ];

            const response = await llmService.chat(messages, {
                maxTokens: 600,
                temperature: 0.4,
                model: 'gpt-4o-mini',
                responseFormat: TopicSelectionSchema,
            });

            return TopicSelectionSchema.parse(JSON.parse(response.content)).selectedTopics;
        } catch {
            // Fallback: just take top 2 candidates
            return candidates.slice(0, 2).map(t => ({ topic: t.split('(')[0].trim(), reason: 'High interest', priority: 7 }));
        }
    }

    private async generateMorningBriefing(
        userId: string,
        topics: string[],
        insights: string[],
        consolidatedInsights: string[],
        novelConnections: any[]
    ): Promise<string> {
        const connectionsStr = novelConnections.map((c: any) =>
            typeof c === 'string' ? c : `${c.topicA} ↔ ${c.topicB}`
        ).join('; ');
        if (topics.length === 0) {
            return 'Your brain rested well tonight. Explore a new topic to begin building knowledge.';
        }

        try {
            const messages = [
                {
                    role: 'system' as const,
                    content: `Write a warm, energizing 2–3 sentence morning briefing for a student/researcher. 
Summarize what their AI brain learned overnight. Be enthusiastic but brief. Address them as "your brain" or "while you slept".`,
                },
                {
                    role: 'user' as const,
                    content: `Topics researched: ${topics.join(', ')}
Key insights: ${insights.slice(0, 4).join(' | ')}
Novel connections found: ${connectionsStr}

Write a 2–3 sentence morning briefing.`,
                },
            ];

            const response = await llmService.chat(messages, { maxTokens: 200, temperature: 0.7 });
            return response.content;
        } catch {
            return `While you slept, your brain explored ${topics.join(' and ')} and uncovered ${insights.length} new insights. Ready for a productive day!`;
        }
    }

    private emptyDigest(userId: string): NightDigest {
        return {
            userId,
            date: new Date().toISOString().split('T')[0],
            topicsResearched: [],
            insightsGenerated: [],
            memoriesConsolidated: 0,
            novelConnections: [],
            morningBriefing: 'No recent activity to research. Start exploring to build your knowledge base.',
            readyForReview: false,
        };
    }
}

// ─── Singleton instance ───────────────────────────────────────────────────────
export const nightScheduler = new NightResearchScheduler();
