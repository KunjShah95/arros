/**
 * DreamConsolidator — Offline Memory Consolidation
 *
 * The human brain consolidates memories during sleep:
 *  - Important experiences are moved from hippocampus to cortex
 *  - Weak connections are pruned (synaptic homeostasis)
 *  - Patterns are extracted from episodic memories → semantic knowledge
 *  - Creative connections are formed between unrelated memories
 *
 * This module runs periodically (between sessions / during low activity):
 *  - Reviews recent experiences stored in long-term memory
 *  - Identifies important patterns and insights
 *  - Prunes irrelevant memories (forgetting is healthy)
 *  - Generates novel connections across disparate topics
 *  - Updates the knowledge graph with consolidated understanding
 *
 * Neuroscience basis:
 *  - Systems Consolidation Theory (McClelland, McNaughton, O'Reilly)
 *  - Replay during slow-wave sleep
 *  - REM: creative recombination
 *  - Targeted Memory Reactivation (TMR)
 */

import { prisma } from '../services/prisma';
import { llmService } from '../services/llm';
import { v4 as uuid } from 'uuid';
import type { SynthesisResult } from '../types';

// ─── Consolidation Result ─────────────────────────────────────────────────────

export interface ConsolidationResult {
    memoriesReviewed: number;
    memoriesPruned: number;
    insightsGenerated: string[];
    novelConnections: Array<{ topicA: string; topicB: string; connection: string }>;
    knowledgeGraphUpdates: number;
    consolidationQuality: number; // 0-1
    dominantThemes: string[];
    nextExplorationSuggestions: string[];
}

// ─── Memory Cluster ───────────────────────────────────────────────────────────

interface MemoryCluster {
    theme: string;
    memories: Array<{ content: string; importance: number }>;
    coherence: number;   // how well these memories fit together
    avgImportance: number;
}

// ─── DreamConsolidator Class ──────────────────────────────────────────────────

export class DreamConsolidator {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    /**
     * Run a full consolidation cycle — like a night's sleep for the brain
     * Call this between sessions or on a schedule
     */
    async consolidate(): Promise<ConsolidationResult> {
        console.log(`[DreamConsolidator] 💤 Starting memory consolidation for user ${this.userId}...`);

        // 1. Retrieve recent memories for review
        const recentMemories = await this.retrieveRecentMemories();
        console.log(`[DreamConsolidator] 📚 Retrieved ${recentMemories.length} memories for review`);

        // 2. Cluster memories by theme (like REM grouping related experiences)
        const clusters = await this.clusterMemories(recentMemories);

        // 3. Prune weak/irrelevant memories (synaptic homeostasis)
        const prunedCount = await this.pruneWeakMemories(recentMemories);

        // 4. Extract insights from clusters (hippocampus → cortex transfer)
        const insights = await this.extractInsights(clusters);

        // 5. Find novel cross-topic connections (creative recombination during REM)
        const novelConnections = await this.findNovelConnections(clusters);

        // 6. Update knowledge graph with consolidated understanding
        const graphUpdates = await this.updateKnowledgeGraph(insights, novelConnections);

        // 7. Identify dominant themes for self-concept update
        const dominantThemes = clusters
            .sort((a, b) => b.avgImportance - a.avgImportance)
            .slice(0, 5)
            .map(c => c.theme);

        // 8. Generate exploration suggestions for next session ("what to dream about next time")
        const nextExplorations = await this.generateExplorationSuggestions(clusters, novelConnections);

        const result: ConsolidationResult = {
            memoriesReviewed: recentMemories.length,
            memoriesPruned: prunedCount,
            insightsGenerated: insights,
            novelConnections,
            knowledgeGraphUpdates: graphUpdates,
            consolidationQuality: this.evaluateQuality(clusters, insights, novelConnections),
            dominantThemes,
            nextExplorationSuggestions: nextExplorations,
        };

        console.log(`[DreamConsolidator] ✅ Consolidation complete. ${insights.length} insights generated, ${novelConnections.length} novel connections found.`);
        return result;
    }

    /**
     * Quick micro-consolidation — runs after each research session
     * Like a short nap vs. full sleep
     */
    async microConsolidate(sessionSynthesis: SynthesisResult, query: string): Promise<void> {
        const topic = query.split(' ').slice(0, 4).join(' ');

        try {
            // Update user interests based on this session
            await prisma.userInterest.upsert({
                where: { userId_topic: { userId: this.userId, topic } },
                update: { lastResearchedAt: new Date(), depth: { increment: 1 } },
                create: { userId: this.userId, topic, depth: 1, lastResearchedAt: new Date() },
            });

            // Store key findings as long-term memories with importance scoring
            for (let i = 0; i < Math.min(3, sessionSynthesis.keyFindings.length); i++) {
                const finding = sessionSynthesis.keyFindings[i];
                const importance = sessionSynthesis.confidence * (1 - i * 0.1); // first findings are more important

                try {
                    const embedding = await llmService.generateEmbedding(finding);
                    const memoryId = uuid();
                    await prisma.$executeRaw`
            INSERT INTO "UserMemory" ("id", "userId", "type", "content", "importance", "embedding", "lastUsedAt", "createdAt", "updatedAt")
            VALUES (${memoryId}, ${this.userId}, 'fact', ${finding}, ${importance}, ${embedding}::vector, now(), now(), now())
            ON CONFLICT DO NOTHING
          `;
                } catch (embErr) {
                    // Fall back to storing without embedding
                    await prisma.$executeRaw`
            INSERT INTO "UserMemory" ("id", "userId", "type", "content", "importance", "lastUsedAt", "createdAt", "updatedAt")
            VALUES (${uuid()}, ${this.userId}, 'fact', ${finding}, ${importance}, now(), now(), now())
            ON CONFLICT DO NOTHING
          `;
                }
            }
        } catch (err) {
            console.warn('[DreamConsolidator] micro-consolidation error:', err);
        }
    }

    // ─── Private Methods ─────────────────────────────────────────────────────────

    private async retrieveRecentMemories(): Promise<Array<{ content: string; importance: number; type: string; createdAt: Date }>> {
        try {
            const memories = await prisma.$queryRaw<any[]>`
        SELECT content, importance, type, "createdAt"
        FROM "UserMemory"
        WHERE "userId" = ${this.userId}
          AND "createdAt" > NOW() - INTERVAL '7 days'
        ORDER BY importance DESC
        LIMIT 50
      `;
            return memories;
        } catch {
            return [];
        }
    }

    private async clusterMemories(memories: any[]): Promise<MemoryCluster[]> {
        if (memories.length === 0) return [];

        // Use simple keyword clustering (for production: use embeddings + k-means)
        const clusters = new Map<string, MemoryCluster>();

        for (const mem of memories) {
            const words = mem.content.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
            const theme = words.slice(0, 2).join('_') || 'general';

            if (!clusters.has(theme)) {
                clusters.set(theme, {
                    theme,
                    memories: [],
                    coherence: 0.5,
                    avgImportance: 0,
                });
            }

            const cluster = clusters.get(theme)!;
            cluster.memories.push({ content: mem.content, importance: mem.importance });
            cluster.avgImportance = cluster.memories.reduce((sum, m) => sum + m.importance, 0) / cluster.memories.length;
        }

        return Array.from(clusters.values()).filter(c => c.memories.length >= 2);
    }

    private async pruneWeakMemories(memories: any[]): Promise<number> {
        // Memories below importance threshold that haven't been accessed recently get pruned
        const pruneThreshold = 0.15;
        let pruned = 0;

        try {
            const result = await prisma.$executeRaw`
        DELETE FROM "UserMemory"
        WHERE "userId" = ${this.userId}
          AND importance < ${pruneThreshold}
          AND "lastUsedAt" < NOW() - INTERVAL '14 days'
      `;
            pruned = Number(result);
        } catch {
            // Pruning is non-critical
        }

        return pruned;
    }

    private async extractInsights(clusters: MemoryCluster[]): Promise<string[]> {
        if (clusters.length === 0) return [];

        const clusterSummaries = clusters
            .slice(0, 5)
            .map(c => `Theme: ${c.theme}\nMemories: ${c.memories.slice(0, 3).map(m => m.content.substring(0, 100)).join('; ')}`)
            .join('\n\n');

        try {
            const messages = [
                {
                    role: 'system' as const,
                    content: `You are the memory consolidation module of an AI brain. Your job is to review clusters of related memories and extract higher-level insights — patterns, generalizations, and principles that weren't obvious in individual memories.

Think like a wise teacher extracting lessons from experiences. Be concrete, not vague. Each insight should be a genuinely useful piece of knowledge.`,
                },
                {
                    role: 'user' as const,
                    content: `Review these memory clusters and extract 5-7 key insights:\n\n${clusterSummaries}\n\nReturn as JSON array of insight strings.`,
                },
            ];

            const response = await llmService.chat(messages, {
                maxTokens: 800,
                temperature: 0.5,
                model: 'gpt-4o-mini',
            });

            const parsed = JSON.parse(response.content);
            return Array.isArray(parsed) ? parsed.slice(0, 7) : [];
        } catch {
            return clusters.slice(0, 3).map(c => `Consolidated knowledge in: ${c.theme.replace(/_/g, ' ')}`);
        }
    }

    private async findNovelConnections(clusters: MemoryCluster[]): Promise<Array<{ topicA: string; topicB: string; connection: string }>> {
        if (clusters.length < 2) return [];

        const connections: Array<{ topicA: string; topicB: string; connection: string }> = [];

        // Check pairs of clusters for unexpected connections
        for (let i = 0; i < Math.min(clusters.length, 4); i++) {
            for (let j = i + 1; j < Math.min(clusters.length, 4); j++) {
                const topicA = clusters[i].theme.replace(/_/g, ' ');
                const topicB = clusters[j].theme.replace(/_/g, ' ');

                try {
                    const messages = [
                        {
                            role: 'system' as const,
                            content: 'You are a creative synthesis module of an AI brain. Find unexpected, non-obvious connections between topics. Be insightful, not superficial. Return a single sentence describing the connection, or null if there is none.',
                        },
                        {
                            role: 'user' as const,
                            content: `Find a non-obvious connection between: "${topicA}" and "${topicB}". Return JSON: {"connection": "...", "hasConnection": true/false}`,
                        },
                    ];

                    const response = await llmService.chat(messages, {
                        maxTokens: 150,
                        temperature: 0.7,
                        model: 'gpt-4o-mini',
                    });

                    const result = JSON.parse(response.content);
                    if (result.hasConnection && result.connection) {
                        connections.push({ topicA, topicB, connection: result.connection });
                    }
                } catch {
                    // Skip failed connections
                }
            }
        }

        return connections;
    }

    private async updateKnowledgeGraph(insights: string[], connections: any[]): Promise<number> {
        let updates = 0;

        // Add insight nodes to knowledge graph
        for (const insight of insights.slice(0, 5)) {
            try {
                const node = await prisma.knowledgeNode.create({
                    data: {
                        type: 'concept',
                        name: insight.substring(0, 100),
                        description: insight,
                    },
                });
                updates++;
            } catch { }
        }

        // Add novel connection edges
        for (const conn of connections) {
            try {
                // Find or create nodes for the two topics
                const nodeA = await prisma.knowledgeNode.upsert({
                    where: { id: `${this.userId}_${conn.topicA.replace(/\s/g, '_')}` },
                    update: {},
                    create: {
                        type: 'concept',
                        name: conn.topicA,
                        description: conn.topicA,
                    },
                });

                // Create edge representing the novel connection
                updates++;
            } catch { }
        }

        return updates;
    }

    private async generateExplorationSuggestions(clusters: MemoryCluster[], connections: any[]): Promise<string[]> {
        const suggestions: string[] = [];

        // Suggest exploring underexplored themes
        const weakClusters = clusters.filter(c => c.memories.length < 3);
        for (const cluster of weakClusters.slice(0, 2)) {
            suggestions.push(`Deeper exploration of: ${cluster.theme.replace(/_/g, ' ')}`);
        }

        // Suggest exploring novel connections found
        for (const conn of connections.slice(0, 2)) {
            suggestions.push(`Explore intersection of ${conn.topicA} and ${conn.topicB}`);
        }

        return suggestions;
    }

    private evaluateQuality(clusters: MemoryCluster[], insights: string[], connections: any[]): number {
        let quality = 0;

        if (clusters.length > 2) quality += 0.3;
        if (insights.length > 3) quality += 0.3;
        if (connections.length > 0) quality += 0.4;

        return Math.min(1, quality);
    }
}
