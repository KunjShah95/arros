/**
 * IntuitionEngine — System 1 Thinking (Kahneman)
 *
 * Fast, automatic, unconscious pattern recognition. This is the "gut feeling"
 * module — it fires before deliberate reasoning and provides instant judgments
 * based on learned patterns.
 *
 * Neuroscience basis:
 *  - Basal ganglia: procedural memory and habit execution
 *  - Ventromedial prefrontal cortex: fast value estimation
 *  - Pattern completion in hippocampus
 *  - Klein's Recognition-Primed Decision (RPD) model
 *
 * The key insight: experts make most decisions intuitively because they have
 * vast pattern libraries. The same principle applies here.
 */

import { prisma } from '../services/prisma';
import { llmService } from '../services/llm';

// ─── Pattern Types ────────────────────────────────────────────────────────────

interface RecognizedPattern {
    id: string;
    template: string;
    action: string;
    successRate: number;
    triggerCount: number;
    avgConfidence: number;
    domain: string;
}

// ─── Intuition Assessment ─────────────────────────────────────────────────────

export interface IntuitionAssessment {
    pattern: string;
    confidence: number;
    suggestedAction: string;
    alternatives: string[];
    assumptions: string[];
    novelty: number;    // 0-1: how unfamiliar is this? (low novelty = high pattern match)
    domain: string;     // which domain of expertise applies
    processingTime: number; // ms - intuition is fast
}

// ─── Precompiled Domain Expertise ────────────────────────────────────────────

const DOMAIN_PATTERNS: RecognizedPattern[] = [
    {
        id: 'academic_research',
        template: 'explain|define|what is|how does|literature review|survey',
        action: 'comprehensive_research',
        successRate: 0.87,
        triggerCount: 500,
        avgConfidence: 0.75,
        domain: 'academia',
    },
    {
        id: 'comparative_analysis',
        template: 'compare|vs|versus|difference between|better|worse|contrast',
        action: 'comparative_research',
        successRate: 0.82,
        triggerCount: 300,
        avgConfidence: 0.8,
        domain: 'analysis',
    },
    {
        id: 'technical_implementation',
        template: 'code|implement|build|create|algorithm|architecture|system',
        action: 'technical_research',
        successRate: 0.79,
        triggerCount: 400,
        avgConfidence: 0.7,
        domain: 'engineering',
    },
    {
        id: 'current_events',
        template: 'latest|recent|today|2024|2025|news|current|now',
        action: 'news_search',
        successRate: 0.75,
        triggerCount: 200,
        avgConfidence: 0.65,
        domain: 'news',
    },
    {
        id: 'problem_solving',
        template: 'how to|solve|fix|troubleshoot|debug|error|issue|problem',
        action: 'problem_solving',
        successRate: 0.81,
        triggerCount: 350,
        avgConfidence: 0.72,
        domain: 'engineering',
    },
    {
        id: 'creative_exploration',
        template: 'brainstorm|ideas|creative|innovate|novel|unique|original',
        action: 'creative_research',
        successRate: 0.68,
        triggerCount: 150,
        avgConfidence: 0.6,
        domain: 'creativity',
    },
    {
        id: 'factual_recall',
        template: 'who|when|where|what year|how many|statistics|data',
        action: 'fact_retrieval',
        successRate: 0.85,
        triggerCount: 600,
        avgConfidence: 0.8,
        domain: 'factual',
    },
];

// ─── IntuitionEngine Class ────────────────────────────────────────────────────

export class IntuitionEngine {
    private userId: string;
    private patterns: RecognizedPattern[] = [...DOMAIN_PATTERNS];
    private recentActivations: Array<{ pattern: string; success: boolean }> = [];

    constructor(userId: string) {
        this.userId = userId;
    }

    /**
     * Rapidly assess a query using pattern recognition (< 50ms ideally)
     * This is System 1 — fast, parallel, automatic
     */
    async assess(query: string): Promise<IntuitionAssessment> {
        const startTime = Date.now();
        const normalized = query.toLowerCase();

        // Pattern matching — this is fast
        const matches = this.matchPatterns(normalized);

        if (matches.length === 0) {
            // Novel situation — no pattern recognized, flag as needing deliberate thought
            return {
                pattern: 'unrecognized',
                confidence: 0.3,
                suggestedAction: 'comprehensive_research',
                alternatives: ['web_search', 'ask_for_clarification'],
                assumptions: ['Query requires deliberate analysis'],
                novelty: 0.9,
                domain: 'unknown',
                processingTime: Date.now() - startTime,
            };
        }

        const best = matches[0];
        const alternatives = matches.slice(1, 3).map(m => m.action);

        // Confidence based on pattern success rate + recency
        const recentSuccessBonus = this.getRecentSuccessBonus(best.id);
        const confidence = Math.min(0.95, best.successRate + recentSuccessBonus);

        return {
            pattern: best.template,
            confidence,
            suggestedAction: best.action,
            alternatives,
            assumptions: this.generateAssumptions(best, normalized),
            novelty: 1 - (best.triggerCount / 1000),
            domain: best.domain,
            processingTime: Date.now() - startTime,
        };
    }

    /**
     * Learn from outcomes — reinforce successful patterns
     * This is how intuition improves over time
     */
    reinforce(patternId: string, success: boolean, confidenceActual: number): void {
        const pattern = this.patterns.find(p => p.id === patternId);
        if (!pattern) return;

        // Update success rate with exponential moving average
        pattern.successRate = pattern.successRate * 0.9 + (success ? 1 : 0) * 0.1;
        pattern.avgConfidence = pattern.avgConfidence * 0.9 + confidenceActual * 0.1;
        pattern.triggerCount++;

        this.recentActivations.push({ pattern: patternId, success });
        if (this.recentActivations.length > 20) this.recentActivations.shift();
    }

    /**
     * Add a learned pattern from experience
     */
    learnPattern(template: string, action: string, domain: string): void {
        const existing = this.patterns.find(p => p.template === template);
        if (existing) {
            existing.triggerCount++;
            return;
        }

        this.patterns.push({
            id: `learned_${Date.now()}`,
            template,
            action,
            successRate: 0.6, // conservative initial estimate
            triggerCount: 1,
            avgConfidence: 0.6,
            domain,
        });
    }

    /**
     * Check if the system has expertise in this domain
     */
    hasDomainExpertise(domain: string): boolean {
        return this.patterns.some(p => p.domain === domain && p.successRate > 0.75 && p.triggerCount > 100);
    }

    // ─── Private Methods ─────────────────────────────────────────────────────────

    private matchPatterns(query: string): RecognizedPattern[] {
        const scored: Array<{ pattern: RecognizedPattern; score: number }> = [];

        for (const pattern of this.patterns) {
            const keywords = pattern.template.split('|');
            let score = 0;

            for (const kw of keywords) {
                if (query.includes(kw)) {
                    score += 1 / keywords.length;
                }
            }

            if (score > 0) {
                scored.push({
                    pattern,
                    score: score * pattern.successRate,
                });
            }
        }

        return scored
            .sort((a, b) => b.score - a.score)
            .map(s => s.pattern);
    }

    private getRecentSuccessBonus(patternId: string): number {
        const recent = this.recentActivations.filter(a => a.pattern === patternId);
        if (recent.length === 0) return 0;
        const successRate = recent.filter(a => a.success).length / recent.length;
        return (successRate - 0.5) * 0.1; // ±0.05 bonus
    }

    private generateAssumptions(pattern: RecognizedPattern, query: string): string[] {
        const assumptions: string[] = [];

        if (pattern.domain === 'academia') {
            assumptions.push('Academic sources are preferred');
            assumptions.push('Citations are expected in output');
        } else if (pattern.domain === 'engineering') {
            assumptions.push('Technical depth is required');
            assumptions.push('Code examples may be helpful');
        } else if (pattern.domain === 'news') {
            assumptions.push('Recent information (< 1 year) is preferred');
        } else if (pattern.domain === 'analysis') {
            assumptions.push('Multiple perspectives needed');
            assumptions.push('Balanced comparison is expected');
        }

        if (query.length < 20) {
            assumptions.push('Short query — possible ambiguity, may need clarification');
        }

        return assumptions;
    }
}
