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
exports.ResearchAgent = void 0;
const executor_1 = require("../tools/executor");
const prisma_1 = require("../services/prisma");
class ResearchAgent {
    constructor(sessionId, taskId) {
        this.sessionId = sessionId;
        this.taskId = taskId;
    }
    research(subtask, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const sources = [];
            const claims = [];
            const primaryTools = subtask.toolStrategy.primary;
            const fallbackTools = subtask.toolStrategy.fallback;
            const maxSources = subtask.toolStrategy.maxSources;
            for (const toolName of primaryTools) {
                if (sources.length >= maxSources)
                    break;
                const result = yield executor_1.toolExecutor.execute(toolName, {
                    query,
                    numResults: Math.ceil(maxSources / primaryTools.length),
                }, this.taskId);
                if (result.success && result.data) {
                    const toolSources = this.parseSources(toolName, result.data);
                    sources.push(...toolSources);
                }
            }
            for (const source of sources) {
                const fetchResult = yield executor_1.toolExecutor.execute('web_fetch', {
                    url: source.url,
                }, this.taskId);
                if (fetchResult.success && fetchResult.data) {
                    source.content = this.extractContent(fetchResult.data);
                    const extractedClaims = this.extractClaims(source.content);
                    claims.push(...extractedClaims.map((statement, idx) => ({
                        id: `claim_${source.id}_${idx}`,
                        statement,
                        evidence: [source.id],
                        confidence: source.reliability,
                    })));
                }
            }
            yield prisma_1.prisma.source.createMany({
                data: sources.map(s => ({
                    sessionId: this.sessionId,
                    type: s.type,
                    title: s.title,
                    url: s.url,
                    content: s.content,
                    reliability: s.reliability,
                    bias: s.bias,
                    metadata: s.metadata,
                })),
            });
            const researchResult = {
                taskId: this.taskId,
                sources,
                claims,
                rawContent: sources.map(s => s.content).join('\n\n'),
            };
            yield prisma_1.prisma.agentTask.update({
                where: { id: this.taskId },
                data: {
                    status: 'completed',
                    output: researchResult,
                },
            });
            return researchResult;
        });
    }
    parseSources(toolName, data) {
        if (!Array.isArray(data))
            return [];
        return data.map((item, idx) => {
            var _a, _b;
            const source = item;
            return {
                id: `source_${Date.now()}_${idx}`,
                type: this.getSourceType(toolName),
                title: source.title || 'Untitled',
                url: source.url || '',
                content: source.content || '',
                reliability: (_a = source.reliability) !== null && _a !== void 0 ? _a : 0.7,
                bias: (_b = source.bias) !== null && _b !== void 0 ? _b : 0,
                metadata: source,
            };
        });
    }
    getSourceType(toolName) {
        switch (toolName) {
            case 'paper_search': return 'paper';
            case 'github_search': return 'github';
            default: return 'web';
        }
    }
    extractContent(data) {
        if (typeof data === 'string')
            return data;
        if (typeof data === 'object' && data !== null) {
            return data.content || '';
        }
        return '';
    }
    extractClaims(content) {
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
        return sentences.slice(0, 10).map(s => s.trim());
    }
}
exports.ResearchAgent = ResearchAgent;
