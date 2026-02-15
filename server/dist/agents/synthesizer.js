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
exports.SynthesizerAgent = void 0;
const prisma_1 = require("../services/prisma");
const llm_1 = require("../services/llm");
const websocket_1 = require("../services/websocket");
const zod_1 = require("zod");
const ActionItemSchema = zod_1.z.object({
    type: zod_1.z.enum(['prd', 'architecture', 'ticket', 'code', 'decision']),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    priority: zod_1.z.enum(['low', 'medium', 'high']),
});
const SynthesisResultSchema = zod_1.z.object({
    summary: zod_1.z.string(),
    deepDive: zod_1.z.string(),
    keyFindings: zod_1.z.array(zod_1.z.string()),
    actionableOutputs: zod_1.z.array(ActionItemSchema).optional(),
    confidence: zod_1.z.number(),
});
class SynthesizerAgent {
    constructor(sessionId, taskId) {
        this.sessionId = sessionId;
        this.taskId = taskId;
    }
    synthesize(critiqueResult_1, researchRawContent_1, query_1) {
        return __awaiter(this, arguments, void 0, function* (critiqueResult, researchRawContent, query, generateActions = false) {
            const claimsText = critiqueResult.acceptedClaims
                .map((c, i) => `${i + 1}. ${c.statement}`)
                .join('\n');
            const contradictionsText = critiqueResult.contradictions.length > 0
                ? `Contradictions found:\n${critiqueResult.contradictions.map(c => `- ${c.claimA} vs ${c.claimB} (${c.severity})`).join('\n')}`
                : 'No contradictions found.';
            const messages = [
                {
                    role: 'system',
                    content: `You are a research synthesis agent. Combine verified research findings into a coherent, well-structured answer.

For the summary:
- Start with a clear, direct answer to the query
- Use bullet points for key findings
- Keep it concise but informative

For the deep dive:
- Provide detailed analysis
- Include nuance and caveats
- Address uncertainties
- Explain implications

For key findings:
- List the most important verified facts
- Each should be a complete, factual statement

For actionable outputs (if requested):
- Generate PRDs, architecture plans, tickets, code scaffolds, or decision matrices
- Be specific and practical`,
                },
                {
                    role: 'user',
                    content: `Query: "${query}"

Verified Claims:
${claimsText}

${contradictionsText}

Overall Confidence: ${(critiqueResult.overallConfidence * 100).toFixed(0)}%

Raw Research Content:
${researchRawContent.substring(0, 8000)}

${generateActions ? 'Also generate actionable outputs like PRDs, architecture plans, or code scaffolds.' : ''}`,
                },
            ];
            try {
                const response = yield llm_1.llmService.chat(messages, {
                    maxTokens: 3000,
                    temperature: 0.5,
                    model: 'gpt-4o-mini',
                    responseFormat: SynthesisResultSchema,
                });
                const synthesis = Object.assign(Object.assign({}, SynthesisResultSchema.parse(JSON.parse(response.content))), { taskId: this.taskId });
                yield prisma_1.prisma.agentOutput.create({
                    data: {
                        sessionId: this.sessionId,
                        taskId: this.taskId,
                        type: 'synthesis',
                        content: synthesis,
                        confidence: synthesis.confidence,
                    },
                });
                yield prisma_1.prisma.agentTask.update({
                    where: { id: this.taskId },
                    data: {
                        status: 'completed',
                        output: synthesis,
                        tokens: response.usage.totalTokens,
                        cost: llm_1.llmService.calculateCost(response.usage, 'gpt-4o-mini'),
                    },
                });
                websocket_1.wsService.emitTaskCompleted(this.sessionId, this.taskId, synthesis);
                return synthesis;
            }
            catch (error) {
                console.error('LLM synthesis failed, using fallback:', error);
                return this.fallbackSynthesis(critiqueResult, query, generateActions);
            }
        });
    }
    fallbackSynthesis(critiqueResult, query, generateActions) {
        const summary = `Based on verified sources, here are the key findings for "${query}":\n\n${critiqueResult.acceptedClaims
            .slice(0, 5)
            .map((c) => `- ${c.statement}`)
            .join('\n')}`;
        const deepDive = `## Detailed Analysis\n\n### Verified Information\n\n${critiqueResult.acceptedClaims
            .map((c) => `**${c.statement}**\nConfidence: ${(c.confidence * 100).toFixed(0)}%`)
            .join('\n\n')}\n\n### Areas of Uncertainty\n\n${critiqueResult.contradictions.length > 0
            ? `${critiqueResult.contradictions.length} contradiction(s) detected.`
            : 'No significant contradictions found.'}`;
        const keyFindings = critiqueResult.acceptedClaims
            .filter((c) => c.confidence >= 0.7)
            .slice(0, 7)
            .map((c) => c.statement);
        let actionableOutputs = [];
        if (generateActions) {
            actionableOutputs = [
                {
                    type: 'prd',
                    title: 'PRD Document',
                    description: 'Create product requirements based on research',
                    priority: 'medium',
                },
            ];
        }
        return {
            taskId: this.taskId,
            summary,
            deepDive,
            keyFindings,
            actionableOutputs: actionableOutputs.length > 0 ? actionableOutputs : undefined,
            confidence: critiqueResult.overallConfidence,
        };
    }
}
exports.SynthesizerAgent = SynthesizerAgent;
