/**
 * CognitiveCore — The Prefrontal Cortex of the AI Brain
 *
 * This module coordinates all cognitive subsystems and implements human-like
 * executive function: deliberate decision-making, goal management, attention
 * regulation, and cognitive flexibility.
 *
 * Inspired by:
 *  - Dual Process Theory (Kahneman's System 1 & System 2)
 *  - Global Workspace Theory (Baars)
 *  - Predictive Processing (Clark & Friston)
 *  - Somatic Marker Hypothesis (Damasio)
 */

import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { EmotionalEngine, type EmotionalState } from './emotionalEngine';
import { WorkingMemory } from './workingMemory';
import { IntuitionEngine } from './intuitionEngine';
import { CuriosityEngine } from './curiosityEngine';
import { SelfAwarenessModule } from './selfAwareness';
import { z } from 'zod';

// ─── Cognitive Decision Output ────────────────────────────────────────────────

export interface CognitiveDecision {
    action: string;
    confidence: number;
    reasoning: string;
    emotionalInfluence: number; // 0-1 how much emotion influenced this
    intuitionInfluence: number; // 0-1 how much intuition influenced this
    rationalWeight: number;     // 0-1 deliberate rational analysis weight
    alternatives: string[];
    cognitiveLoad: number;      // 0-1 mental effort required
    arousalLevel: number;       // 0-1 activation level
}

// ─── Cognitive State ──────────────────────────────────────────────────────────

export interface CognitiveState {
    attention: {
        focus: string;
        distractors: string[];
        breadth: 'narrow' | 'broad';
    };
    goals: Array<{ goal: string; priority: number; progress: number }>;
    processingMode: 'fast_intuitive' | 'slow_deliberate' | 'creative' | 'critical';
    cognitiveLoad: number;        // 0-1 mental load
    fatigue: number;              // 0-1 decision fatigue
    confidence: number;           // 0-1 overall system confidence
}

// ─── Thought Schema ───────────────────────────────────────────────────────────

const ThoughtSchema = z.object({
    primaryThought: z.string(),
    subthoughts: z.array(z.string()),
    assumptions: z.array(z.string()),
    uncertainties: z.array(z.string()),
    emotionalResonance: z.number().min(0).max(1),
    curiositySpike: z.boolean(),
    confidence: z.number().min(0).max(1),
    suggestedAction: z.string(),
    alternatives: z.array(z.string()),
});

// ─── CognitiveCore Class ─────────────────────────────────────────────────────

export class CognitiveCore {
    private userId: string;
    private sessionId: string;
    private emotionalEngine: EmotionalEngine;
    private workingMemory: WorkingMemory;
    private intuitionEngine: IntuitionEngine;
    private curiosityEngine: CuriosityEngine;
    private selfAwareness: SelfAwarenessModule;

    private cognitiveState: CognitiveState = {
        attention: { focus: '', distractors: [], breadth: 'broad' },
        goals: [],
        processingMode: 'slow_deliberate',
        cognitiveLoad: 0,
        fatigue: 0,
        confidence: 0.7,
    };

    constructor(userId: string, sessionId: string) {
        this.userId = userId;
        this.sessionId = sessionId;
        this.emotionalEngine = new EmotionalEngine(userId, sessionId);
        this.workingMemory = new WorkingMemory(sessionId);
        this.intuitionEngine = new IntuitionEngine(userId);
        this.curiosityEngine = new CuriosityEngine(userId);
        this.selfAwareness = new SelfAwarenessModule(userId, sessionId);
    }

    /**
     * The primary cognitive loop — how the brain "thinks" about a query.
     * This is the most human-like function in the entire system.
     */
    async think(query: string, context?: string): Promise<CognitiveDecision> {
        console.log(`[CognitiveCore] 🧠 Initiating thought process for: "${query.substring(0, 60)}..."`);

        // --- Step 1: Attend to the input ---
        this.updateAttention(query);

        // --- Step 2: Quick intuitive check (System 1) ---
        const intuition = await this.intuitionEngine.assess(query);

        // --- Step 3: Load emotional context —-- emotions color cognition ---
        const emotionalState = await this.emotionalEngine.getCurrentState();

        // --- Step 4: Retrieve relevant working memory ---
        const memoryContext = this.workingMemory.retrieve(query);

        // --- Step 5: Check curiosity — what's interesting about this? ---
        const curiosityScore = await this.curiosityEngine.evaluate(query);
        if (curiosityScore > 0.7) {
            await this.curiosityEngine.registerInterest(query);
        }

        // --- Step 6: Determine processing mode based on cognitive state ---
        const mode = this.selectProcessingMode(intuition.confidence, curiosityScore, emotionalState);
        this.cognitiveState.processingMode = mode;

        // --- Step 7: Deliberate reasoning (System 2) for complex/important queries ---
        let thought;
        if (mode === 'slow_deliberate' || mode === 'critical') {
            thought = await this.deliberateThinking(query, emotionalState, memoryContext, context);
        } else {
            // Fast intuitive path — trust pattern recognition
            thought = {
                primaryThought: intuition.pattern,
                subthoughts: [],
                assumptions: intuition.assumptions,
                uncertainties: [],
                emotionalResonance: emotionalState.valence * 0.5,
                curiositySpike: curiosityScore > 0.7,
                confidence: intuition.confidence,
                suggestedAction: intuition.suggestedAction,
                alternatives: intuition.alternatives,
            };
        }

        // --- Step 8: Self-monitor for cognitive biases and errors ---
        const selfCheck = await this.selfAwareness.monitor(thought, emotionalState);
        if (selfCheck.biasDetected) {
            console.log(`[CognitiveCore] ⚠️ Cognitive bias detected: ${selfCheck.biasType}. Correcting...`);
            thought.confidence *= 0.85; // reduce confidence when bias detected
            thought.uncertainties.push(`Possible ${selfCheck.biasType} bias detected`);
        }

        // --- Step 9: Somatic marker integration (Damasio) ---
        // Emotional memory of similar past situations influences current decision
        const somaticMarker = await this.emotionalEngine.getSomaticMarker(query);
        const emotionalInfluence = Math.min(1, somaticMarker.strength * (1 - emotionalState.regulation));

        // --- Step 10: Compute final decision weights ---
        const rationalWeight = this.computeRationalWeight(mode, emotionalState, selfCheck);
        const intuitionInfluence = mode === 'fast_intuitive' ? 0.7 : 0.3;

        // --- Step 11: Update cognitive load and fatigue ---
        const cognitiveLoad = this.computeCognitiveLoad(query, mode, memoryContext.length);
        this.cognitiveState.cognitiveLoad = cognitiveLoad;
        this.cognitiveState.fatigue = Math.min(1, this.cognitiveState.fatigue + cognitiveLoad * 0.1);

        // --- Step 12: Store this thought in working memory ---
        this.workingMemory.store({
            key: `thought_${Date.now()}`,
            content: thought.primaryThought,
            importance: thought.confidence,
            timestamp: new Date(),
            tags: ['thought', 'cognitive'],
        });

        // --- Step 13: Update emotional state based on processing ---
        await this.emotionalEngine.update({
            trigger: query,
            outcome: thought.confidence > 0.7 ? 'success' : 'uncertainty',
            intensity: curiosityScore,
        });

        // --- Step 14: Build and return the cognitive decision ---
        const decision: CognitiveDecision = {
            action: thought.suggestedAction,
            confidence: thought.confidence * rationalWeight + intuition.confidence * intuitionInfluence * (1 - rationalWeight),
            reasoning: this.buildReasoningChain(thought, emotionalState, selfCheck),
            emotionalInfluence,
            intuitionInfluence,
            rationalWeight,
            alternatives: thought.alternatives,
            cognitiveLoad,
            arousalLevel: emotionalState.arousal,
        };

        // Persist cognitive event
        await this.persistCognitiveEvent(query, decision, emotionalState);

        return decision;
    }

    /**
     * Deliberate, slow System 2 thinking — complex multi-step reasoning
     */
    private async deliberateThinking(
        query: string,
        emotionalState: EmotionalState,
        memoryContext: any[],
        context?: string
    ) {
        const emotionLabel = this.emotionalEngine.labelEmotion(emotionalState);
        const memorySnippets = memoryContext.map(m => `• ${m.content}`).slice(0, 5).join('\n');

        const messages = [
            {
                role: 'system' as const,
                content: `You are the deliberate thinking module of a human-like AI brain. You simulate System 2 cognition — slow, effortful, logical reasoning that can override intuitions.

Your current emotional state: ${emotionLabel} (arousal: ${emotionalState.arousal.toFixed(2)}, valence: ${emotionalState.valence.toFixed(2)})
Your working memory context:
${memorySnippets || 'No relevant memories loaded'}

Think step by step like a curious, self-aware human would. Consider:
1. What is actually being asked and what's the underlying intent?
2. What do you already know vs what you need to find out?
3. What assumptions are you making?
4. What could go wrong with your first instinct?
5. What is the best action given all constraints?

Be honest about uncertainty. Acknowledge when something is genuinely hard.`,
            },
            {
                role: 'user' as const,
                content: `Think deeply about this: "${query}"${context ? `\n\nAdditional context: ${context}` : ''}

Return JSON with: primaryThought, subthoughts (array), assumptions (array), uncertainties (array), emotionalResonance (0-1), curiositySpike (boolean), confidence (0-1), suggestedAction, alternatives (array of 2-3 alternative actions)`,
            },
        ];

        try {
            const response = await llmService.chat(messages, {
                maxTokens: 1500,
                temperature: 0.6,
                model: 'gpt-4o-mini',
                responseFormat: ThoughtSchema,
            });
            return ThoughtSchema.parse(JSON.parse(response.content));
        } catch {
            return {
                primaryThought: `Processing query: ${query}`,
                subthoughts: ['Analyzing intent', 'Checking prior knowledge'],
                assumptions: ['User wants comprehensive answer'],
                uncertainties: ['Scope of query unclear'],
                emotionalResonance: 0.5,
                curiositySpike: false,
                confidence: 0.65,
                suggestedAction: 'comprehensive_research',
                alternatives: ['quick_search', 'memory_recall'],
            };
        }
    }

    /**
     * Selects which mode to process in (fast/slow/creative/critical)
     */
    private selectProcessingMode(
        intuitionConfidence: number,
        curiosityScore: number,
        emotion: EmotionalState
    ): CognitiveState['processingMode'] {
        // Fear/anxiety → more careful deliberate thinking
        if (emotion.secondary === 'anxiety' && emotion.arousal > 0.7) return 'critical';

        // Novel, interesting query + high curiosity → creative exploration
        if (curiosityScore > 0.8 && intuitionConfidence < 0.5) return 'creative';

        // High intuition confidence + low stakes → fast System 1
        if (intuitionConfidence > 0.8) return 'fast_intuitive';

        // Default: careful deliberate reasoning
        return 'slow_deliberate';
    }

    /**
     * Compute how much rational vs. emotional thinking should weigh in
     */
    private computeRationalWeight(
        mode: CognitiveState['processingMode'],
        emotion: EmotionalState,
        selfCheck: any
    ): number {
        let weight = 0.7; // default: 70% rational

        if (mode === 'fast_intuitive') weight = 0.4;
        if (mode === 'creative') weight = 0.5;
        if (mode === 'critical') weight = 0.85;

        // High arousal reduces rational thinking (fight-or-flight degrades PFC)
        weight -= emotion.arousal * 0.2;

        // Self-awareness correction: if bias detected, force more rationality
        if (selfCheck.biasDetected) weight += 0.1;

        return Math.max(0.2, Math.min(0.95, weight));
    }

    /**
     * Estimate how much mental effort this query requires
     */
    private computeCognitiveLoad(query: string, mode: string, memoryItems: number): number {
        let load = 0.3; // baseline

        // Longer queries are more demanding
        load += Math.min(0.3, query.length / 500);

        // Slow deliberate is more demanding
        if (mode === 'slow_deliberate' || mode === 'critical') load += 0.2;

        // More working memory items = more load
        load += Math.min(0.2, memoryItems * 0.03);

        return Math.min(1, load);
    }

    /**
     * Build a human-readable reasoning chain
     */
    private buildReasoningChain(thought: any, emotion: EmotionalState, selfCheck: any): string {
        const parts: string[] = [];
        parts.push(`Primary analysis: ${thought.primaryThought}`);
        if (thought.assumptions.length) parts.push(`Assumptions: ${thought.assumptions.join('; ')}`);
        if (thought.uncertainties.length) parts.push(`Uncertainties: ${thought.uncertainties.join('; ')}`);
        const emotionLabel = this.emotionalEngine.labelEmotion(emotion);
        parts.push(`Emotional context: ${emotionLabel}`);
        if (selfCheck.biasDetected) parts.push(`⚠️ Bias correction applied: ${selfCheck.biasType}`);
        return parts.join(' | ');
    }

    /**
     * Update attentional focus — the brain's spotlight of consciousness
     */
    private updateAttention(query: string) {
        this.cognitiveState.attention.focus = query;
        this.cognitiveState.attention.breadth = query.length > 100 ? 'broad' : 'narrow';
    }

    /**
     * Persist cognitive event to database for learning over time
     */
    private async persistCognitiveEvent(
        query: string,
        decision: CognitiveDecision,
        emotion: EmotionalState
    ) {
        try {
            await prisma.agentTask.create({
                data: {
                    sessionId: this.sessionId,
                    type: 'planner',
                    agentName: 'CognitiveCore',
                    status: 'completed',
                    input: { query, mode: this.cognitiveState.processingMode } as any,
                    output: {
                        decision: decision.action,
                        confidence: decision.confidence,
                        emotionalInfluence: decision.emotionalInfluence,
                        cognitiveLoad: decision.cognitiveLoad,
                        arousalLevel: decision.arousalLevel,
                        emotionalState: emotion,
                    } as any,
                    cost: 0.0001,
                },
            });
        } catch (err) {
            // Non-critical — don't fail the main flow
            console.warn('[CognitiveCore] Could not persist cognitive event:', err);
        }
    }

    /**
     * Get current cognitive state snapshot
     */
    getCognitiveState(): CognitiveState {
        return { ...this.cognitiveState };
    }

    /**
     * Rest and recover — reduce fatigue, like sleep
     */
    async rest() {
        this.cognitiveState.fatigue = Math.max(0, this.cognitiveState.fatigue - 0.3);
        this.cognitiveState.cognitiveLoad = 0;
        this.workingMemory.consolidate();
        console.log('[CognitiveCore] 😴 Cognitive rest complete. Fatigue reduced.');
    }
}
