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
exports.MetaEvaluatorAgent = void 0;
const prisma_1 = require("../services/prisma");
const llm_1 = require("../services/llm");
const zod_1 = require("zod");
class MetaEvaluatorAgent {
    constructor(sessionId, taskId) {
        this.sessionId = sessionId;
        this.taskId = taskId;
    }
    evaluate(synthesisResult, critiqueResult, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const messages = [
                {
                    role: 'system',
                    content: `You are a Meta-Evaluator Agent for ARROS. Your task is to evaluate the quality of an autonomous research synthesis.
Evaluate based on:
1. completeness: Does it answer all parts of the query?
2. agreement: Do the synthesis and critique align? Are there unresolved contradictions?
3. confidence: Is the confidence score justified by the evidence?
4. hallucination: Are there any claims that seem unfounded or contradicted by the critique?
5. bias: Is the summary balanced or does it lean too much on one source type?

Critique Details:
- Accepted Claims: ${critiqueResult.acceptedClaims.length}
- Rejected Claims: ${critiqueResult.rejectedClaims.length}
- Contradictions Found: ${critiqueResult.contradictions.join(', ')}
- Source Reliability: ${critiqueResult.overallConfidence}

Synthesis Summary:
${synthesisResult.summary}

Return JSON with overallScore (0-1), passed (boolean), type ('meta'), details (object with completeness, agreement, hallucination, bias scores), and recommendations (array).`,
                },
                {
                    role: 'user',
                    content: `Query: "${query}"\n\nEvaluate the research quality and provide specific recommendations for improvement if it failed.`,
                },
            ];
            try {
                const response = yield llm_1.llmService.chat(messages, {
                    temperature: 0.1,
                    model: 'gpt-4o-mini',
                    responseFormat: zod_1.z.object({
                        overallScore: zod_1.z.number(),
                        passed: zod_1.z.boolean(),
                        type: zod_1.z.string(),
                        details: zod_1.z.object({
                            completeness: zod_1.z.number(),
                            agreement: zod_1.z.number(),
                            hallucination: zod_1.z.number(),
                            bias: zod_1.z.number(),
                        }),
                        recommendations: zod_1.z.array(zod_1.z.string()),
                    }),
                });
                const finalEvaluation = JSON.parse(response.content);
                yield prisma_1.prisma.evaluation.create({
                    data: {
                        sessionId: this.sessionId,
                        type: 'meta',
                        score: finalEvaluation.overallScore,
                        details: finalEvaluation.details,
                        passed: finalEvaluation.passed,
                    },
                });
                yield prisma_1.prisma.agentTask.update({
                    where: { id: this.taskId },
                    data: { status: 'completed', output: finalEvaluation },
                });
                return {
                    type: 'meta',
                    score: finalEvaluation.overallScore,
                    details: finalEvaluation.details,
                    passed: finalEvaluation.passed,
                    recommendations: finalEvaluation.recommendations,
                };
            }
            catch (error) {
                console.error('LLM evaluation failed, falling back to deterministic:', error);
                return this.fallbackEvaluate(synthesisResult, critiqueResult, query);
            }
        });
    }
    fallbackEvaluate(synthesisResult, critiqueResult, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const evaluations = [];
            evaluations.push(this.evaluateCompleteness(synthesisResult, query));
            evaluations.push(this.evaluateAgreement(critiqueResult));
            evaluations.push(this.evaluateConfidence(synthesisResult, critiqueResult));
            const overallScore = evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length;
            const passed = overallScore >= 0.7;
            return {
                type: 'meta',
                score: overallScore,
                details: {
                    evaluations: evaluations.map(e => ({ type: e.type, score: e.score, passed: e.passed })),
                    query,
                },
                passed,
                recommendations: passed ? undefined : ['Improve source quality', 'Add more verification', 'Resolve contradictions'],
            };
        });
    }
    evaluateCompleteness(synthesisResult, query) {
        const hasSummary = synthesisResult.summary.length > 50;
        const hasDeepDive = synthesisResult.deepDive.length > 100;
        const hasKeyFindings = synthesisResult.keyFindings.length >= 3;
        const hasActions = synthesisResult.actionableOutputs && synthesisResult.actionableOutputs.length > 0;
        const score = (Number(hasSummary) + Number(hasDeepDive) + Number(hasKeyFindings) + Number(hasActions)) / 4;
        return {
            type: 'completeness',
            score,
            details: { hasSummary, hasDeepDive, hasKeyFindings, hasActions },
            passed: score >= 0.75,
        };
    }
    evaluateAgreement(critiqueResult) {
        const totalClaims = critiqueResult.acceptedClaims.length + critiqueResult.rejectedClaims.length;
        const acceptanceRate = totalClaims > 0 ? critiqueResult.acceptedClaims.length / totalClaims : 0;
        const contradictionPenalty = critiqueResult.contradictions.length * 0.15;
        const score = Math.max(0, acceptanceRate - contradictionPenalty);
        return {
            type: 'agreement',
            score,
            details: {
                accepted: critiqueResult.acceptedClaims.length,
                rejected: critiqueResult.rejectedClaims.length,
                contradictions: critiqueResult.contradictions.length,
            },
            passed: score >= 0.5,
        };
    }
    evaluateConfidence(synthesisResult, critiqueResult) {
        const confidenceMatch = Math.abs(synthesisResult.confidence - critiqueResult.overallConfidence);
        const score = 1 - confidenceMatch;
        return {
            type: 'hallucination',
            score,
            details: {
                synthesisConfidence: synthesisResult.confidence,
                critiqueConfidence: critiqueResult.overallConfidence,
                difference: confidenceMatch,
            },
            passed: score >= 0.8,
        };
    }
}
exports.MetaEvaluatorAgent = MetaEvaluatorAgent;
