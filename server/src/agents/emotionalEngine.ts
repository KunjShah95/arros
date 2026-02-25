/**
 * EmotionalEngine — The Limbic System of the AI Brain
 *
 * Implements Plutchik's Wheel of Emotions, Russell's Circumplex Model, 
 * and Damasio's Somatic Marker Hypothesis.
 *
 * Emotions are not decorative — they serve critical cognitive functions:
 *  - They prioritize attention (fear focuses on threats)
 *  - They guide decisions under uncertainty (gut feeling)
 *  - They create memory salience (emotional events are remembered better)
 *  - They shape communication style (enthusiasm vs. caution)
 */

import { prisma } from '../services/prisma';
import { llmService } from '../services/llm';

// ─── Core Emotion Types ───────────────────────────────────────────────────────

export type PrimaryEmotion = 'joy' | 'trust' | 'fear' | 'surprise' | 'sadness' | 'disgust' | 'anger' | 'anticipation';
export type SecondaryEmotion = 'curiosity' | 'anxiety' | 'enthusiasm' | 'doubt' | 'satisfaction' | 'frustration' | 'wonder' | 'caution';

// ─── Emotional State ──────────────────────────────────────────────────────────

export interface EmotionalState {
    primary: PrimaryEmotion;
    secondary: SecondaryEmotion;
    valence: number;     // -1 to 1 (negative to positive)
    arousal: number;     // 0 to 1 (calm to excited)
    regulation: number;  // 0 to 1 (dysregulated to fully regulated)
    confidence: number;  // how certain the emotion classification is
    timestamp: Date;
}

// ─── Somatic Marker ───────────────────────────────────────────────────────────

export interface SomaticMarker {
    pattern: string;         // the situation pattern that triggers this
    emotion: PrimaryEmotion;
    valence: number;
    strength: number;        // 0-1
    outcomeHistory: Array<{ outcome: string; reward: number }>;
}

// ─── Emotional Update Trigger ─────────────────────────────────────────────────

export interface EmotionalTrigger {
    trigger: string;
    outcome: 'success' | 'failure' | 'uncertainty' | 'discovery' | 'conflict';
    intensity: number;
}

// ─── Default Resting State ────────────────────────────────────────────────────

const DEFAULT_STATE: EmotionalState = {
    primary: 'anticipation',
    secondary: 'curiosity',
    valence: 0.2,
    arousal: 0.4,
    regulation: 0.8,
    confidence: 0.7,
    timestamp: new Date(),
};

// ─── EmotionalEngine Class ────────────────────────────────────────────────────

export class EmotionalEngine {
    private userId: string;
    private sessionId: string;
    private currentState: EmotionalState = { ...DEFAULT_STATE };
    private somaticMarkers: Map<string, SomaticMarker> = new Map();
    private emotionalHistory: EmotionalState[] = [];

    constructor(userId: string, sessionId: string) {
        this.userId = userId;
        this.sessionId = sessionId;
        this.initializeSomaticMarkers();
    }

    /**
     * Get the current emotional state
     */
    async getCurrentState(): Promise<EmotionalState> {
        return { ...this.currentState };
    }

    /**
     * Update emotional state based on a trigger event
     * This is how emotions change in response to experiences
     */
    async update(trigger: EmotionalTrigger): Promise<EmotionalState> {
        const prev = { ...this.currentState };
        const newState = this.computeNewState(prev, trigger);

        // Emotional inertia — emotions don't change instantaneously
        this.currentState = this.blendStates(prev, newState, 0.35);
        this.currentState.timestamp = new Date();

        // Save to history
        this.emotionalHistory.push({ ...this.currentState });
        if (this.emotionalHistory.length > 50) this.emotionalHistory.shift();

        // Update somatic marker for this pattern
        this.updateSomaticMarker(trigger);

        return { ...this.currentState };
    }

    /**
     * Get the somatic marker for a query — emotional "gut feeling" about similar past situations
     */
    async getSomaticMarker(query: string): Promise<{ strength: number; emotion: PrimaryEmotion; valence: number }> {
        const keywords = this.extractKeywords(query);
        let bestMatch = { strength: 0, emotion: 'anticipation' as PrimaryEmotion, valence: 0 };

        for (const [pattern, marker] of this.somaticMarkers.entries()) {
            const matchScore = this.computePatternMatch(keywords, pattern);
            if (matchScore > bestMatch.strength) {
                bestMatch = {
                    strength: matchScore * marker.strength,
                    emotion: marker.emotion,
                    valence: marker.valence,
                };
            }
        }

        return bestMatch;
    }

    /**
     * Label the current emotional state as a human-readable string
     */
    labelEmotion(state: EmotionalState): string {
        const emotionMap: Record<SecondaryEmotion, string> = {
            curiosity: '🔍 Curious and engaged',
            anxiety: '😰 Cautious and alert',
            enthusiasm: '⚡ Enthusiastic and energized',
            doubt: '🤔 Uncertain and questioning',
            satisfaction: '✅ Confident and satisfied',
            frustration: '😤 Frustrated with obstacles',
            wonder: '✨ Filled with wonder',
            caution: '⚠️ Proceeding carefully',
        };
        return emotionMap[state.secondary] || `${state.primary} (v=${state.valence.toFixed(2)}, a=${state.arousal.toFixed(2)})`;
    }

    /**
     * Check if system is in a high-stress state that degrades cognitive performance
     */
    isUnderStress(): boolean {
        return this.currentState.arousal > 0.8 && this.currentState.valence < -0.3;
    }

    /**
     * Get emotional memory — how past emotional experiences shape current decisions
     */
    getEmotionalMemory(n: number = 5): EmotionalState[] {
        return this.emotionalHistory.slice(-n);
    }

    /**
     * Assess the emotional tone of text input (for understanding user)
     */
    async assessUserEmotion(text: string): Promise<{ emotion: string; intensity: number; needsSupport: boolean }> {
        try {
            const messages = [
                {
                    role: 'system' as const,
                    content: 'You are an emotion recognition module. Detect the emotional tone in the text. Return JSON with: emotion (string), intensity (0-1), needsSupport (boolean for frustrated/distressed users).',
                },
                { role: 'user' as const, content: text },
            ];
            const response = await llmService.chat(messages, {
                maxTokens: 200,
                temperature: 0.2,
                model: 'gpt-4o-mini',
                responseFormat: undefined,
            });
            return JSON.parse(response.content);
        } catch {
            return { emotion: 'neutral', intensity: 0.3, needsSupport: false };
        }
    }

    // ─── Private Methods ─────────────────────────────────────────────────────────

    private computeNewState(prev: EmotionalState, trigger: EmotionalTrigger): EmotionalState {
        let valence = prev.valence;
        let arousal = prev.arousal;
        let primary = prev.primary;
        let secondary = prev.secondary;

        switch (trigger.outcome) {
            case 'success':
                valence += 0.15 * trigger.intensity;
                arousal = Math.max(0.2, arousal - 0.05);
                primary = 'joy';
                secondary = 'satisfaction';
                break;

            case 'failure':
                valence -= 0.2 * trigger.intensity;
                arousal += 0.1 * trigger.intensity;
                primary = valence < -0.5 ? 'anger' : 'sadness';
                secondary = 'frustration';
                break;

            case 'uncertainty':
                arousal += 0.15 * trigger.intensity;
                primary = 'fear';
                secondary = arousal > 0.6 ? 'anxiety' : 'caution';
                break;

            case 'discovery':
                valence += 0.25 * trigger.intensity;
                arousal += 0.2 * trigger.intensity;
                primary = 'surprise';
                secondary = 'wonder';
                break;

            case 'conflict':
                valence -= 0.1 * trigger.intensity;
                arousal += 0.15 * trigger.intensity;
                primary = 'anger';
                secondary = 'doubt';
                break;
        }

        // Natural regulation — system tends toward homeostasis
        const regulation = Math.min(1, prev.regulation + 0.05);
        const regulatedValence = valence * (0.7 + regulation * 0.3);
        const regulatedArousal = Math.min(1, arousal) * (1 - regulation * 0.1);

        return {
            primary,
            secondary,
            valence: Math.max(-1, Math.min(1, regulatedValence)),
            arousal: Math.max(0, Math.min(1, regulatedArousal)),
            regulation,
            confidence: 0.75,
            timestamp: new Date(),
        };
    }

    /**
     * Blend two emotional states (emotional inertia — gradual transitions)
     */
    private blendStates(prev: EmotionalState, next: EmotionalState, rate: number): EmotionalState {
        return {
            primary: rate > 0.5 ? next.primary : prev.primary,
            secondary: rate > 0.5 ? next.secondary : prev.secondary,
            valence: prev.valence * (1 - rate) + next.valence * rate,
            arousal: prev.arousal * (1 - rate) + next.arousal * rate,
            regulation: prev.regulation * (1 - rate) + next.regulation * rate,
            confidence: (prev.confidence + next.confidence) / 2,
            timestamp: new Date(),
        };
    }

    private initializeSomaticMarkers() {
        // Pre-built somatic markers from "experience"
        this.somaticMarkers.set('error_failure_wrong', {
            pattern: 'error_failure_wrong',
            emotion: 'fear',
            valence: -0.4,
            strength: 0.6,
            outcomeHistory: [{ outcome: 'need more verification', reward: -0.3 }],
        });

        this.somaticMarkers.set('new_discover_novel', {
            pattern: 'new_discover_novel',
            emotion: 'surprise',
            valence: 0.6,
            strength: 0.7,
            outcomeHistory: [{ outcome: 'interesting finding', reward: 0.7 }],
        });

        this.somaticMarkers.set('research_analyze_study', {
            pattern: 'research_analyze_study',
            emotion: 'anticipation',
            valence: 0.3,
            strength: 0.5,
            outcomeHistory: [{ outcome: 'knowledge gained', reward: 0.5 }],
        });
    }

    private updateSomaticMarker(trigger: EmotionalTrigger) {
        const keywords = this.extractKeywords(trigger.trigger).slice(0, 3).join('_');
        const existing = this.somaticMarkers.get(keywords);

        const reward = trigger.outcome === 'success' ? trigger.intensity
            : trigger.outcome === 'failure' ? -trigger.intensity
                : 0;

        if (existing) {
            existing.strength = Math.min(1, existing.strength + 0.05);
            existing.valence = existing.valence * 0.8 + this.currentState.valence * 0.2;
            existing.outcomeHistory.push({ outcome: trigger.outcome, reward });
            if (existing.outcomeHistory.length > 10) existing.outcomeHistory.shift();
        } else {
            this.somaticMarkers.set(keywords, {
                pattern: keywords,
                emotion: this.currentState.primary,
                valence: this.currentState.valence,
                strength: 0.2,
                outcomeHistory: [{ outcome: trigger.outcome, reward }],
            });
        }
    }

    private extractKeywords(text: string): string[] {
        const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'and', 'or', 'i', 'my', 'me']);
        return text.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
    }

    private computePatternMatch(queryKeywords: string[], pattern: string): number {
        const patternWords = pattern.split('_');
        let matches = 0;
        for (const kw of queryKeywords) {
            for (const pw of patternWords) {
                if (kw.includes(pw) || pw.includes(kw)) matches++;
            }
        }
        return matches / Math.max(patternWords.length, queryKeywords.length);
    }
}
