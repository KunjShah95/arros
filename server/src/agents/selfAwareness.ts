/**
 * SelfAwarenessModule — Metacognition & Self-Monitoring
 *
 * Implements:
 *  - Flavell's Metacognition Theory (thinking about thinking)
 *  - Dunning-Kruger Effect detection (overconfidence in low-knowledge domains)
 *  - Cognitive Bias Detection (confirmation bias, availability heuristic, etc.)
 *  - Error monitoring (anterior cingulate cortex analog)
 *  - Self-correction mechanisms
 *
 * This is what makes the system genuinely self-aware vs just executing tasks.
 * A human can catch themselves making mistakes — so can this brain.
 */

import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import type { EmotionalState } from './emotionalEngine';

// ─── Bias Types ───────────────────────────────────────────────────────────────

export type CognitiveBias =
    | 'confirmation_bias'    // seeking info that confirms existing beliefs
    | 'availability_heuristic'  // overweighting easily recalled examples
    | 'anchoring_bias'       // over-relying on first piece of information
    | 'dunning_kruger'       // overconfidence in unfamiliar domains
    | 'recency_bias'         // overweighting recent events
    | 'sunk_cost_fallacy'    // continuing despite evidence of failure
    | 'framing_effect'       // being influenced by how info is presented
    | 'bandwagon_effect'     // following popular opinion uncritically
    | 'none';

// ─── Self-Check Result ────────────────────────────────────────────────────────

export interface SelfCheckResult {
    biasDetected: boolean;
    biasType: CognitiveBias;
    biasStrength: number;    // 0-1
    correctionApplied: string;
    metacognitiveInsights: string[];
    confidenceCalibration: number; // adjustment to apply to confidence (-0.3 to +0.3)
    errorFlags: string[];
    selfReflection: string;  // what the brain "thinks" about its own thinking
}

// ─── Performance History ──────────────────────────────────────────────────────

interface PerformanceRecord {
    query: string;
    predictedConfidence: number;
    actualOutcome: number;
    biasesDetected: CognitiveBias[];
    timestamp: Date;
}

// ─── SelfAwarenessModule Class ────────────────────────────────────────────────

export class SelfAwarenessModule {
    private userId: string;
    private sessionId: string;
    private performanceHistory: PerformanceRecord[] = [];
    private knownWeaknesses: Set<CognitiveBias> = new Set();
    private calibrationError: number = 0; // tracks over/underconfidence patterns
    private sessionThoughtCount: number = 0;
    private errorCount: number = 0;

    constructor(userId: string, sessionId: string) {
        this.userId = userId;
        this.sessionId = sessionId;
    }

    /**
     * Monitor a thought for cognitive biases and errors
     * The "error monitoring" circuit of the anterior cingulate cortex
     */
    async monitor(thought: any, emotionalState: EmotionalState): Promise<SelfCheckResult> {
        this.sessionThoughtCount++;

        const detectedBias = this.detectBias(thought, emotionalState);
        const errorFlags = this.checkForErrors(thought);
        const calibration = this.calibrateConfidence(thought.confidence, detectedBias);
        const metacognitiveInsights = this.generateMetacognitiveInsights(thought, detectedBias, emotionalState);
        const selfReflection = this.introspect(thought, detectedBias, emotionalState);

        if (detectedBias !== 'none') {
            this.knownWeaknesses.add(detectedBias);
            this.errorCount++;
        }

        const result: SelfCheckResult = {
            biasDetected: detectedBias !== 'none',
            biasType: detectedBias,
            biasStrength: detectedBias !== 'none' ? this.estimateBiasStrength(thought, detectedBias) : 0,
            correctionApplied: this.getCorrectionStrategy(detectedBias),
            metacognitiveInsights,
            confidenceCalibration: calibration,
            errorFlags,
            selfReflection,
        };

        return result;
    }

    /**
     * Reflect on current performance — how am I doing?
     */
    reflect(): {
        overallAccuracy: number;
        commonBiases: CognitiveBias[];
        calibrationStatus: 'overconfident' | 'underconfident' | 'well_calibrated';
        improvements: string[];
        sessionStats: { thoughts: number; errors: number; errorRate: number };
    } {
        const errorRate = this.sessionThoughtCount > 0
            ? this.errorCount / this.sessionThoughtCount
            : 0;

        const calibrationStatus =
            this.calibrationError > 0.1 ? 'overconfident' :
                this.calibrationError < -0.1 ? 'underconfident' :
                    'well_calibrated';

        const improvements: string[] = [];
        if (this.knownWeaknesses.has('confirmation_bias')) {
            improvements.push('Actively seek disconfirming evidence for strong beliefs');
        }
        if (this.knownWeaknesses.has('dunning_kruger')) {
            improvements.push('Reduce confidence when entering unfamiliar domains');
        }
        if (calibrationStatus === 'overconfident') {
            improvements.push('Apply stronger uncertainty penalties to confidence scores');
        }

        return {
            overallAccuracy: Math.max(0, 1 - errorRate),
            commonBiases: Array.from(this.knownWeaknesses),
            calibrationStatus,
            improvements,
            sessionStats: {
                thoughts: this.sessionThoughtCount,
                errors: this.errorCount,
                errorRate,
            },
        };
    }

    /**
     * Record actual outcome vs predicted — enables calibration over time
     */
    recordOutcome(predictedConfidence: number, actualOutcome: number, query: string): void {
        this.performanceHistory.push({
            query,
            predictedConfidence,
            actualOutcome,
            biasesDetected: Array.from(this.knownWeaknesses),
            timestamp: new Date(),
        });

        // Update calibration error tracking
        const predictionError = predictedConfidence - actualOutcome;
        this.calibrationError = this.calibrationError * 0.9 + predictionError * 0.1;

        if (this.performanceHistory.length > 50) this.performanceHistory.shift();
    }

    /**
     * Ask the system: "What are you uncertain about?"
     * Human-like acknowledgment of limitations
     */
    async acknowledgeUncertainties(thoughts: any[]): Promise<string[]> {
        const uncertainties: string[] = [];

        for (const thought of thoughts) {
            if (thought.confidence < 0.6) {
                uncertainties.push(`Low confidence on: ${thought.primaryThought?.substring(0, 80)}`);
            }
            if (thought.uncertainties?.length) {
                uncertainties.push(...thought.uncertainties.slice(0, 2));
            }
        }

        return uncertainties;
    }

    // ─── Private Methods ─────────────────────────────────────────────────────────

    private detectBias(thought: any, emotion: EmotionalState): CognitiveBias {
        // Confirmation bias: high confidence + one-sided evidence
        if (thought.confidence > 0.85 && (!thought.alternatives || thought.alternatives.length === 0)) {
            return 'confirmation_bias';
        }

        // Availability heuristic: very short processing time + high confidence on complex topic
        if (thought.subthoughts?.length === 0 && thought.confidence > 0.8 && thought.primaryThought?.length > 100) {
            return 'availability_heuristic';
        }

        // Dunning-Kruger: high confidence but many uncertainties  
        if (thought.confidence > 0.8 && (thought.uncertainties?.length ?? 0) > 3) {
            return 'dunning_kruger';
        }

        // Emotional bias: very high arousal influencing reasoning
        if (emotion.arousal > 0.85 && emotion.valence < -0.3 && thought.confidence < 0.5) {
            return 'framing_effect'; // anxiety is framing the assessment negatively
        }

        // Recency bias: only considering very recent information
        if (thought.assumptions?.some((a: string) => a.toLowerCase().includes('recent'))) {
            return 'recency_bias';
        }

        // Anchoring: first thought dominates all subthoughts
        if (thought.subthoughts?.every((st: string) => st.includes(thought.primaryThought?.split(' ')[0]))) {
            return 'anchoring_bias';
        }

        return 'none';
    }

    private checkForErrors(thought: any): string[] {
        const flags: string[] = [];

        if (thought.confidence < 0 || thought.confidence > 1) {
            flags.push('Invalid confidence range');
        }

        if (!thought.primaryThought || thought.primaryThought.length < 10) {
            flags.push('Incomplete primary thought');
        }

        if (thought.assumptions?.length > 5) {
            flags.push('Too many assumptions — high risk of errors');
        }

        if (this.calibrationError > 0.2) {
            flags.push('System is systematically overconfident — apply correction');
        }

        return flags;
    }

    private calibrateConfidence(rawConfidence: number, bias: CognitiveBias): number {
        let adjustment = -this.calibrationError * 0.5; // correct historical over/under confidence

        switch (bias) {
            case 'dunning_kruger': adjustment -= 0.2; break;
            case 'confirmation_bias': adjustment -= 0.1; break;
            case 'availability_heuristic': adjustment -= 0.15; break;
            case 'anchoring_bias': adjustment -= 0.1; break;
            default: break;
        }

        return Math.max(-0.3, Math.min(0.3, adjustment));
    }

    private estimateBiasStrength(thought: any, bias: CognitiveBias): number {
        switch (bias) {
            case 'dunning_kruger':
                return Math.min(1, (thought.uncertainties?.length ?? 0) * 0.15 + (thought.confidence - 0.7) * 2);
            case 'confirmation_bias':
                return thought.alternatives?.length === 0 ? 0.8 : 0.4;
            default:
                return 0.5;
        }
    }

    private getCorrectionStrategy(bias: CognitiveBias): string {
        const strategies: Record<CognitiveBias, string> = {
            confirmation_bias: 'Explicitly searching for disconfirming evidence',
            availability_heuristic: 'Slowing down to consider base rates and statistics',
            anchoring_bias: 'Resetting analysis from multiple starting points',
            dunning_kruger: 'Reducing confidence, seeking external validation',
            recency_bias: 'Weighting historical evidence equally with recent data',
            sunk_cost_fallacy: 'Evaluating future value only, ignoring past investment',
            framing_effect: 'Reframing problem from neutral perspective',
            bandwagon_effect: 'Independently evaluating evidence regardless of consensus',
            none: 'No correction needed',
        };
        return strategies[bias];
    }

    private generateMetacognitiveInsights(thought: any, bias: CognitiveBias, emotion: EmotionalState): string[] {
        const insights: string[] = [];

        // Calibration insight
        if (Math.abs(this.calibrationError) > 0.15) {
            insights.push(`Historically ${this.calibrationError > 0 ? 'overconfident' : 'underconfident'} — adjusting confidence scores`);
        }

        // Emotional insight
        if (emotion.arousal > 0.7) {
            insights.push('High arousal may be narrowing analytical breadth — broadening perspective');
        }

        // Complexity insight
        if (thought.uncertainties?.length > 2) {
            insights.push(`${thought.uncertainties.length} unresolved uncertainties — this is genuinely complex, not just unfamiliar`);
        }

        // Bias insight
        if (bias !== 'none') {
            insights.push(`${bias.replace(/_/g, ' ')} pattern detected — actively correcting`);
        }

        // Session fatigue
        if (this.sessionThoughtCount > 20) {
            insights.push('Extended session — cognitive fatigue may be affecting quality');
        }

        return insights;
    }

    private introspect(thought: any, bias: CognitiveBias, emotion: EmotionalState): string {
        const parts: string[] = [];

        const certaintyLabel = thought.confidence > 0.8 ? 'quite confident'
            : thought.confidence > 0.6 ? 'moderately confident'
                : 'uncertain';

        parts.push(`I am ${certaintyLabel} about this analysis`);

        if (bias !== 'none') {
            parts.push(`but I notice myself potentially falling into ${bias.replace(/_/g, ' ')}`);
        }

        if (emotion.arousal > 0.6) {
            parts.push(`My current arousal (${emotion.arousal.toFixed(2)}) may be influencing how I'm approaching this`);
        }

        if (thought.uncertainties?.length > 0) {
            parts.push(`There are genuine unknowns here: ${thought.uncertainties[0]}`);
        }

        return parts.join('. ') + '.';
    }
}
