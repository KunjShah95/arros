"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CriticAgent = void 0;
const prisma_1 = require("../services/prisma");
const llm_1 = require("../services/llm");
const websocket_1 = require("../services/websocket");
const zod_1 = require("zod");
const ClaimSchema = zod_1.z.object({
    id: zod_1.z.string(),
    statement: zod_1.z.string(),
    evidence: zod_1.z.array(zod_1.z.string()),
    confidence: zod_1.z.number(),
    contradictedBy: zod_1.z.array(zod_1.z.string()).optional(),
});
const ContradictionSchema = zod_1.z.object({
    claimA: zod_1.z.string(),
    claimB: zod_1.z.string(),
    severity: zod_1.z.enum(['low', 'medium', 'high']),
});
const BiasIndicatorSchema = zod_1.z.object({
    claim: zod_1.z.string(),
    biasType: zod_1.z.string(),
    severity: zod_1.z.number(),
});
const CritiqueResultSchema = zod_1.z.object({
    acceptedClaims: zod_1.z.array(ClaimSchema),
    rejectedClaims: zod_1.z.array(ClaimSchema),
    contradictions: zod_1.z.array(ContradictionSchema),
    biasIndicators: zod_1.z.array(BiasIndicatorSchema),
    overallConfidence: zod_1.z.number(),
});
class CriticAgent {
    constructor(sessionId, taskId) {
        this.sessionId = sessionId;
        this.taskId = taskId;
    }
    critique(researchResults) {
        return __awaiter(this, void 0, void 0, function* () {
            const allClaims = researchResults.flatMap((r) => r.claims);
            const allSources = researchResults.flatMap((r) => r.sources);
            if (allClaims.length === 0) {
                return this.emptyCritique();
            }
            const claimsText = allClaims
                .map((c, i) => `${i + 1}. "${c.statement}" (confidence: ${c.confidence}, source: ${c.evidence[0]})`)
                .join('\n');
            const sourcesText = allSources
                .map((s, i) => `${i + 1}. ${s.title} - ${s.url} (reliability: ${s.reliability}, bias: ${s.bias})`)
                .join('\n');
            const messages = [
                {
                    role: 'system',
                    content: `You are a research critic agent. Verify claims, detect contradictions, and assess bias.

Evaluate each claim based on:
- Source reliability (0-1)
- Internal consistency
- Corroboration from multiple sources
- Potential bias

For each claim, decide:
- Accept if reliability >= 0.6 and confidence >= 0.5
- Reject otherwise

For contradictions:
- Find claims that contradict each other
- Rate severity as low/medium/high

For bias:
- Identify potential bias in sources
- Rate severity 0-1`,
                },
                {
                    role: 'user',
                    content: `Evaluate these claims and sources:

CLAIMS:
${claimsText}

SOURCES:
${sourcesText}

Return JSON with:
- acceptedClaims: Array of verified claims
- rejectedClaims: Array of rejected claims  
- contradictions: Array of contradictions found
- biasIndicators: Array of potential biases
- overallConfidence: Overall confidence score 0-1`,
                },
            ];
            try {
                const response = yield llm_1.llmService.chat(messages, {
                    maxTokens: 2000,
                    temperature: 0.3,
                    model: 'gpt-4o-mini',
                    responseFormat: CritiqueResultSchema,
                });
                const critique = Object.assign(Object.assign({}, CritiqueResultSchema.parse(JSON.parse(response.content))), { taskId: this.taskId });
                yield prisma_1.prisma.agentTask.update({
                    where: { id: this.taskId },
                    data: {
                        status: 'completed',
                        output: critique,
                        tokens: response.usage.totalTokens,
                        cost: llm_1.llmService.calculateCost(response.usage, 'gpt-4o-mini'),
                    },
                });
                yield prisma_1.prisma.evaluation.create({
                    data: {
                        sessionId: this.sessionId,
                        type: 'hallucination',
                        score: critique.overallConfidence,
                        details: {
                            acceptedClaims: critique.acceptedClaims.length,
                            rejectedClaims: critique.rejectedClaims.length,
                            contradictions: critique.contradictions.length,
                        },
                        passed: critique.overallConfidence >= 0.7,
                    },
                });
                websocket_1.wsService.emitTaskCompleted(this.sessionId, this.taskId, critique);
                return critique;
            }
            catch (error) {
                console.error('LLM critique failed, using fallback:', error);
                return this.fallbackCritique(allClaims, allSources);
            }
        });
    }
    fallbackCritique(claims, sources) {
        var _a;
        const acceptedClaims = [];
        const rejectedClaims = [];
        const contradictions = [];
        const biasIndicators = [];
        for (const claim of claims) {
            const source = sources.find((s) => s.id === claim.evidence[0]);
            const reliability = (_a = source === null || source === void 0 ? void 0 : source.reliability) !== null && _a !== void 0 ? _a : 0.5;
            if (reliability >= 0.6 && claim.confidence >= 0.5) {
                acceptedClaims.push(claim);
            }
            else {
                rejectedClaims.push(claim);
            }
        }
        for (let i = 0; i < acceptedClaims.length; i++) {
            for (let j = i + 1; j < acceptedClaims.length; j++) {
                const contra = this.detectContradiction(acceptedClaims[i], acceptedClaims[j]);
                if (contra)
                    contradictions.push(contra);
            }
        }
        for (const source of sources) {
            if (source.bias !== 0 && Math.abs(source.bias) > 0.3) {
                const claimsFromSource = claims.filter((c) => c.evidence.includes(source.id));
                for (const claim of claimsFromSource) {
                    biasIndicators.push({
                        claim: claim.statement,
                        biasType: source.bias > 0 ? 'positive' : 'negative',
                        severity: Math.abs(source.bias),
                    });
                }
            }
        }
        const overallConfidence = this.calculateOverallConfidence(acceptedClaims, contradictions, biasIndicators);
        return {
            taskId: this.taskId,
            acceptedClaims,
            rejectedClaims,
            contradictions,
            biasIndicators,
            overallConfidence,
        };
    }
    detectContradiction(claimA, claimB) {
        const negationWords = ['not', 'no', 'never', 'cannot', 'impossible', 'false'];
        const statementA = claimA.statement.toLowerCase();
        const statementB = claimB.statement.toLowerCase();
        const hasNegation = (s) => negationWords.some((w) => s.includes(w));
        const similar = this.calculateSimilarity(statementA, statementB);
        if (similar > 0.7 && hasNegation(statementA) !== hasNegation(statementB)) {
            return {
                claimA: claimA.id,
                claimB: claimB.id,
                severity: similar > 0.9 ? 'high' : 'medium',
            };
        }
        return null;
    }
    calculateSimilarity(a, b) {
        const wordsA = new Set(a.split(/\s+/));
        const wordsB = new Set(b.split(/\s+/));
        const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
        const union = new Set([...wordsA, ...wordsB]);
        return intersection.size / union.size;
    }
    calculateOverallConfidence(acceptedClaims, contradictions, biasIndicators) {
        if (acceptedClaims.length === 0)
            return 0;
        const baseConfidence = acceptedClaims.reduce((sum, c) => sum + c.confidence, 0) / acceptedClaims.length;
        const contradictionPenalty = contradictions.length * 0.1;
        const biasPenalty = (biasIndicators.reduce((sum, b) => sum + b.severity, 0) /
            (biasIndicators.length || 1)) *
            0.1;
        return Math.max(0, Math.min(1, baseConfidence - contradictionPenalty - biasPenalty));
    }
    emptyCritique() {
        return {
            taskId: this.taskId,
            acceptedClaims: [],
            rejectedClaims: [],
            contradictions: [],
            biasIndicators: [],
            overallConfidence: 0,
        };
    }
}
exports.CriticAgent = CriticAgent;
