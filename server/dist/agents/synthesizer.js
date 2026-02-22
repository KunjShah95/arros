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
const CitationSchema = zod_1.z.object({
    index: zod_1.z.number(),
    title: zod_1.z.string(),
    authors: zod_1.z.string().optional(),
    year: zod_1.z.number().optional(),
    venue: zod_1.z.string().optional(),
    url: zod_1.z.string().optional(),
    citationText: zod_1.z.string(), // e.g., [1]
});
const AcademicSynthesisSchema = zod_1.z.object({
    // Core academic structure
    introduction: zod_1.z.string(),
    conceptsAndDefinitions: zod_1.z.string(),
    keyFindings: zod_1.z.array(zod_1.z.string()),
    applications: zod_1.z.string().optional(),
    challenges: zod_1.z.string().optional(),
    futureDirections: zod_1.z.string().optional(),
    conclusion: zod_1.z.string(),
    // Study aids
    keyTakeaways: zod_1.z.array(zod_1.z.string()),
    furtherReading: zod_1.z.array(zod_1.z.string()),
    // Summary fields for backward compat
    summary: zod_1.z.string(),
    deepDive: zod_1.z.string(),
    // Citations
    citations: zod_1.z.array(CitationSchema).optional(),
    // Confidence
    confidence: zod_1.z.number(),
    verifiedSources: zod_1.z.number(),
    contradictionsFound: zod_1.z.number(),
    // Lineage (Finding index -> Citation indices)
    lineage: zod_1.z.array(zod_1.z.object({
        finding: zod_1.z.string(),
        sourceIndices: zod_1.z.array(zod_1.z.number()),
    })).optional(),
});
// Keep backward compatibility with existing SynthesisResult interface
const SynthesisResultSchema = AcademicSynthesisSchema.extend({
    actionableOutputs: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['prd', 'architecture', 'ticket', 'code', 'decision']),
        title: zod_1.z.string(),
        description: zod_1.z.string(),
        priority: zod_1.z.enum(['low', 'medium', 'high']),
    })).optional(),
});
class SynthesizerAgent {
    constructor(sessionId, taskId) {
        this.sessionId = sessionId;
        this.taskId = taskId;
    }
    synthesize(critiqueResult_1, researchRawContent_1, query_1) {
        return __awaiter(this, arguments, void 0, function* (critiqueResult, researchRawContent, query, generateActions = false) {
            const claimsText = critiqueResult.acceptedClaims
                .map((c, i) => `${i + 1}. ${c.statement} (confidence: ${(c.confidence * 100).toFixed(0)}%)`)
                .join('\n');
            const contradictionsText = critiqueResult.contradictions.length > 0
                ? `⚠️ Contradictions Found:\n${critiqueResult.contradictions.map(c => `- Conflict (${c.severity}): ${c.claimA} vs ${c.claimB}`).join('\n')}`
                : 'No significant contradictions found.';
            const messages = [
                {
                    role: 'system',
                    content: `You are ARROS — an Academic Research OS synthesizer. Your job is to produce structured, citation-backed academic reports for students and researchers.

OUTPUT STRUCTURE (follow exactly):
1. **Introduction** — clear context, scope, and why this topic matters
2. **Concepts & Definitions** — define key terms, frameworks, and foundational concepts  
3. **Key Findings** — bullet list of the most important verified facts from research
4. **Applications** — how is this topic applied in the real world?
5. **Challenges** — current limitations, open problems, controversies
6. **Future Directions** — emerging trends, research gaps, what's next
7. **Conclusion** — concise academic summary tying everything together
8. **Key Takeaways** — 5-7 exam-ready bullet points a student should remember
9. **Further Reading** — 3-5 specific recommended topics/papers for deeper study
10. **Citations** — numbered list of sources used in the report

STYLE RULES:
- Write in formal but readable academic English
- Use concrete claims backed by the provided verified evidence
- Cite sources inline using [1], [2], etc. notation
- Never use placeholder text like "As mentioned earlier"
- Each section should be substantive (not a single sentence)
- Key Takeaways should be concise, memorable, exam-ready statements
- Further Reading should be specific topics or paper titles, not generic suggestions

WHAT TO AVOID:
- Do NOT invent statistics or facts not in the source material
- Do NOT use filler phrases like "it is worth noting that"
- Do NOT be vague — be specific with examples and evidence`,
                },
                {
                    role: 'user',
                    content: `Research Query: "${query}"

Verified Claims (${critiqueResult.acceptedClaims.length} accepted, ${critiqueResult.rejectedClaims.length} rejected):
${claimsText}

${contradictionsText}

Overall Confidence: ${(critiqueResult.overallConfidence * 100).toFixed(0)}%
Verified Sources: ${critiqueResult.acceptedClaims.length}

Raw Research Content (use this to extract citations, paper titles, authors):
${researchRawContent.substring(0, 10000)}

Now produce a complete academic research report with all sections filled in. Extract and number all citations from the sources above.

Return a JSON with all fields: introduction, conceptsAndDefinitions, keyFindings (array), applications, challenges, futureDirections, conclusion, keyTakeaways (array of 5-7 bullet points), furtherReading (array of 3-5 reading suggestions), citations (array with index, title, authors, year, venue, url, citationText), summary (one-paragraph overview), deepDive (full detailed text), confidence (0-1), verifiedSources (number), contradictionsFound (number), and lineage (array of objects with 'finding' and 'sourceIndices' linking each major finding back to the citation numbers [1], [2], etc.).`,
                },
            ];
            try {
                const response = yield llm_1.llmService.chat(messages, {
                    maxTokens: 4000,
                    temperature: 0.4,
                    model: 'gpt-4o-mini',
                    responseFormat: SynthesisResultSchema,
                });
                const rawSynthesis = SynthesisResultSchema.parse(JSON.parse(response.content));
                const synthesis = Object.assign(Object.assign({}, rawSynthesis), { taskId: this.taskId, 
                    // Build summary and deepDive from academic sections if not directly provided
                    summary: rawSynthesis.summary || `${rawSynthesis.introduction}\n\n**Key Findings:**\n${rawSynthesis.keyFindings.map(f => `• ${f}`).join('\n')}`, deepDive: rawSynthesis.deepDive || this.buildDeepDive(rawSynthesis), keyFindings: rawSynthesis.keyFindings });
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
                console.error('LLM synthesis failed, using academic fallback:', error);
                return this.fallbackAcademicSynthesis(critiqueResult, query);
            }
        });
    }
    buildDeepDive(synthesis) {
        const sections = [];
        if (synthesis.introduction)
            sections.push(`## Introduction\n\n${synthesis.introduction}`);
        if (synthesis.conceptsAndDefinitions)
            sections.push(`## Concepts & Definitions\n\n${synthesis.conceptsAndDefinitions}`);
        if (synthesis.applications)
            sections.push(`## Applications\n\n${synthesis.applications}`);
        if (synthesis.challenges)
            sections.push(`## Challenges\n\n${synthesis.challenges}`);
        if (synthesis.futureDirections)
            sections.push(`## Future Directions\n\n${synthesis.futureDirections}`);
        if (synthesis.conclusion)
            sections.push(`## Conclusion\n\n${synthesis.conclusion}`);
        if (synthesis.keyTakeaways && synthesis.keyTakeaways.length > 0) {
            sections.push(`## Key Takeaways\n\n${synthesis.keyTakeaways.map(t => `• ${t}`).join('\n')}`);
        }
        if (synthesis.furtherReading && synthesis.furtherReading.length > 0) {
            sections.push(`## Further Reading\n\n${synthesis.furtherReading.map((r, i) => `${i + 1}. ${r}`).join('\n')}`);
        }
        return sections.join('\n\n');
    }
    fallbackAcademicSynthesis(critiqueResult, query) {
        const acceptedFacts = critiqueResult.acceptedClaims
            .slice(0, 8)
            .map(c => c.statement);
        const summary = `**Research Report: ${query}**\n\nBased on verified academic sources, this report summarizes key findings on the topic:\n\n${acceptedFacts.slice(0, 3).map(f => `• ${f}`).join('\n')}\n\nConfidence Score: ${(critiqueResult.overallConfidence * 100).toFixed(0)}%`;
        const introduction = `This report examines "${query}" based on verified academic sources. The research draws from peer-reviewed papers and authoritative web sources to provide a comprehensive overview.`;
        const conceptsAndDefinitions = `The following key concepts are central to understanding this topic:\n\n${acceptedFacts.slice(0, 3).map(f => `• ${f}`).join('\n')}`;
        const keyFindings = acceptedFacts.filter(f => f.length > 30).slice(0, 6);
        const conclusion = `${critiqueResult.contradictions.length > 0
            ? `Note: ${critiqueResult.contradictions.length} contradiction(s) were identified in the research, suggesting areas of ongoing debate. `
            : ''}The research achieves an overall confidence score of ${(critiqueResult.overallConfidence * 100).toFixed(0)}%, based on ${critiqueResult.acceptedClaims.length} verified claims from multiple sources.`;
        const keyTakeaways = acceptedFacts.filter(f => f.length > 20).slice(0, 5);
        const furtherReading = [
            `Recent systematic reviews on "${query}"`,
            `Applications of ${query.split(' ').slice(0, 3).join(' ')} in industry`,
            `Challenges and open problems in ${query.split(' ').slice(0, 2).join(' ')} research`,
        ];
        const deepDive = this.buildDeepDive({
            introduction,
            conceptsAndDefinitions,
            keyFindings,
            applications: 'See the verified sources for specific application domains.',
            challenges: critiqueResult.contradictions.length > 0
                ? `${critiqueResult.contradictions.length} contradiction(s) were found among research claims.`
                : 'No major challenges identified in the verified sources.',
            futureDirections: 'Continued research is recommended for the latest developments.',
            conclusion,
            keyTakeaways,
            furtherReading,
            summary,
            deepDive: '',
            confidence: critiqueResult.overallConfidence,
            verifiedSources: critiqueResult.acceptedClaims.length,
            contradictionsFound: critiqueResult.contradictions.length,
        });
        return {
            taskId: this.taskId,
            summary,
            deepDive,
            keyFindings,
            confidence: critiqueResult.overallConfidence,
        };
    }
}
exports.SynthesizerAgent = SynthesizerAgent;
