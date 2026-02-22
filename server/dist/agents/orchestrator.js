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
exports.AgentOrchestrator = void 0;
const uuid_1 = require("uuid");
const prisma_1 = require("../services/prisma");
const planner_1 = require("./planner");
const research_1 = require("./research");
const critic_1 = require("./critic");
const synthesizer_1 = require("./synthesizer");
const memory_1 = require("./memory");
const action_1 = require("./action");
const meta_1 = require("./meta");
const debate_1 = require("./debate");
const subagents_1 = require("./subagents");
class AgentOrchestrator {
    constructor(userId, useSubagents = true) {
        this.userId = userId;
        this.useSubagents = useSubagents;
    }
    research(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, attempt = 1) {
            var _a;
            const startTime = Date.now();
            const session = yield prisma_1.prisma.session.upsert({
                where: { id: attempt === 1 ? (0, uuid_1.v4)() : 'non-existent' },
                update: { status: 'active' },
                create: {
                    userId: this.userId,
                    query,
                    title: query.substring(0, 100),
                    status: 'active',
                },
            });
            const planner = new planner_1.PlannerAgent(session.id);
            const plan = yield planner.plan(query);
            let totalCost = plan.estimatedCost;
            let agentBreakdown;
            if (this.useSubagents) {
                return this.runWithSubagents(session, query, plan, startTime, attempt);
            }
            const researchSubtasks = plan.subtasks.filter(t => t.type === 'research');
            const researchPromises = researchSubtasks.map((subtask) => __awaiter(this, void 0, void 0, function* () {
                const task = yield prisma_1.prisma.agentTask.create({
                    data: {
                        sessionId: session.id,
                        type: 'research',
                        agentName: 'ResearchAgent',
                        status: 'running',
                        startedAt: new Date(),
                    },
                });
                const agent = new research_1.ResearchAgent(session.id, task.id);
                return agent.research(subtask, query);
            }));
            const researchResults = yield Promise.all(researchPromises);
            const critiqueSubtask = plan.subtasks.find(t => t.type === 'critic');
            let critiqueResult = null;
            if (critiqueSubtask) {
                const criticTask = yield prisma_1.prisma.agentTask.create({
                    data: {
                        sessionId: session.id,
                        type: 'critic',
                        agentName: 'CriticAgent',
                        status: 'running',
                        startedAt: new Date(),
                    },
                });
                const critic = new critic_1.CriticAgent(session.id, criticTask.id);
                critiqueResult = yield critic.critique(researchResults);
            }
            const debateSubtask = plan.subtasks.find(t => t.type === 'debate');
            if (debateSubtask && critiqueResult) {
                const debateTask = yield prisma_1.prisma.agentTask.create({
                    data: {
                        sessionId: session.id,
                        type: 'debate',
                        agentName: 'DebateAgent',
                        status: 'running',
                        startedAt: new Date(),
                    },
                });
                const debateAgent = new debate_1.DebateAgent(session.id, debateTask.id);
                yield debateAgent.deliberate(researchResults.flatMap(r => r.claims), critiqueResult);
            }
            const synthesizerSubtask = plan.subtasks.find(t => t.type === 'synthesizer');
            let synthesisResult = null;
            if (synthesizerSubtask && critiqueResult) {
                const synthTask = yield prisma_1.prisma.agentTask.create({
                    data: {
                        sessionId: session.id,
                        type: 'synthesizer',
                        agentName: 'SynthesizerAgent',
                        status: 'running',
                        startedAt: new Date(),
                    },
                });
                const synthesizer = new synthesizer_1.SynthesizerAgent(session.id, synthTask.id);
                const hasActionSubtask = plan.subtasks.some(t => t.type === 'action');
                synthesisResult = yield synthesizer.synthesize(critiqueResult, researchResults.map(r => r.rawContent).join('\n'), query, hasActionSubtask);
            }
            const memorySubtask = plan.subtasks.find(t => t.type === 'memory');
            if (memorySubtask && synthesisResult) {
                const memoryTask = yield prisma_1.prisma.agentTask.create({
                    data: {
                        sessionId: session.id,
                        type: 'memory',
                        agentName: 'MemoryAgent',
                        status: 'running',
                        startedAt: new Date(),
                    },
                });
                const memoryAgent = new memory_1.MemoryAgent(session.id, this.userId, memoryTask.id);
                yield memoryAgent.storeResults(synthesisResult, query);
            }
            const actionSubtask = plan.subtasks.find(t => t.type === 'action');
            if (actionSubtask && synthesisResult) {
                const actionTask = yield prisma_1.prisma.agentTask.create({
                    data: {
                        sessionId: session.id,
                        type: 'action',
                        agentName: 'ActionAgent',
                        status: 'running',
                        startedAt: new Date(),
                    },
                });
                const actionAgent = new action_1.ActionAgent(session.id, actionTask.id);
                yield actionAgent.generateActions(synthesisResult, query);
            }
            const metaSubtask = plan.subtasks.find(t => t.type === 'meta');
            let evaluations = [];
            if (metaSubtask && synthesisResult && critiqueResult) {
                const metaTask = yield prisma_1.prisma.agentTask.create({
                    data: {
                        sessionId: session.id,
                        type: 'meta',
                        agentName: 'MetaEvaluatorAgent',
                        status: 'running',
                        startedAt: new Date(),
                    },
                });
                const metaEvaluator = new meta_1.MetaEvaluatorAgent(session.id, metaTask.id);
                const evaluation = yield metaEvaluator.evaluate(synthesisResult, critiqueResult, query);
                evaluations = [{ type: evaluation.type, score: evaluation.score, passed: evaluation.passed }];
                if (!evaluation.passed && attempt < 3) {
                    console.log(`Research quality below threshold (score: ${evaluation.score}). Retrying attempt ${attempt + 1}...`);
                    yield prisma_1.prisma.agentTask.create({
                        data: {
                            sessionId: session.id,
                            type: 'meta',
                            agentName: 'Orchestrator',
                            status: 'failed',
                            input: { attempt, score: evaluation.score },
                            output: { error: 'Quality threshold not met, triggering retry' },
                        }
                    });
                    const refinedQuery = `${query} (Focus on: ${((_a = evaluation.recommendations) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'accuracy and depth'})`;
                    return this.research(refinedQuery, attempt + 1);
                }
            }
            yield prisma_1.prisma.session.update({
                where: { id: session.id },
                data: { status: 'completed' },
            });
            return {
                sessionId: session.id,
                query,
                plan,
                synthesis: synthesisResult,
                evaluations,
                totalCost,
                totalTime: Date.now() - startTime,
            };
        });
    }
    runWithSubagents(session, query, plan, startTime, attempt) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const agentBreakdown = {
                research: { web: 0, academic: 0, code: 0, news: 0 },
                critic: { verified: 0, biases: 0, contradictions: 0 },
                memory: { shortTerm: 0, longTerm: 0, graphNodes: 0 },
                actions: { prds: 0, tickets: 0, code: 0, decisions: 0 },
            };
            const memoryFleet = new subagents_1.MemoryFleet(this.userId, session.id);
            memoryFleet.storeContext(`Research query: ${query}`);
            const { sources, claims } = yield this.runResearchFleet(session.id, query, plan, agentBreakdown);
            const critiqueResult = yield this.runCriticFleet(session.id, claims, sources, agentBreakdown);
            const debateSubtask = plan.subtasks.find(t => t.type === 'debate');
            if (debateSubtask) {
                const debateTask = yield prisma_1.prisma.agentTask.create({
                    data: {
                        sessionId: session.id,
                        type: 'debate',
                        agentName: 'DebateAgent',
                        status: 'running',
                        startedAt: new Date(),
                    },
                });
                const debateAgent = new debate_1.DebateAgent(session.id, debateTask.id);
                yield debateAgent.deliberate(claims, critiqueResult);
            }
            const synthesisResult = yield this.runSynthesizerFleet(session.id, critiqueResult, sources, query);
            yield this.runMemoryFleet(session.id, memoryFleet, synthesisResult, query, agentBreakdown);
            const actionSubtask = plan.subtasks.find(t => t.type === 'action');
            if (actionSubtask) {
                yield this.runActionFleet(session.id, synthesisResult, query, agentBreakdown);
            }
            const metaSubtask = plan.subtasks.find(t => t.type === 'meta');
            let evaluations = [];
            if (metaSubtask) {
                const metaTask = yield prisma_1.prisma.agentTask.create({
                    data: {
                        sessionId: session.id,
                        type: 'meta',
                        agentName: 'MetaEvaluatorAgent',
                        status: 'running',
                        startedAt: new Date(),
                    },
                });
                const metaEvaluator = new meta_1.MetaEvaluatorAgent(session.id, metaTask.id);
                const evaluation = yield metaEvaluator.evaluate(synthesisResult, critiqueResult, query);
                evaluations = [{ type: evaluation.type, score: evaluation.score, passed: evaluation.passed }];
                if (!evaluation.passed && attempt < 3) {
                    console.log(`Research quality below threshold (score: ${evaluation.score}). Retrying attempt ${attempt + 1}...`);
                    yield prisma_1.prisma.agentTask.create({
                        data: {
                            sessionId: session.id,
                            type: 'meta',
                            agentName: 'Orchestrator',
                            status: 'failed',
                            input: { attempt, score: evaluation.score },
                            output: { error: 'Quality threshold not met, triggering retry' },
                        }
                    });
                    const refinedQuery = `${query} (Focus on: ${((_a = evaluation.recommendations) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'accuracy and depth'})`;
                    return this.research(refinedQuery, attempt + 1);
                }
            }
            yield prisma_1.prisma.session.update({
                where: { id: session.id },
                data: { status: 'completed' },
            });
            return {
                sessionId: session.id,
                query,
                plan,
                synthesis: synthesisResult,
                evaluations,
                totalCost: plan.estimatedCost,
                totalTime: Date.now() - startTime,
                agentBreakdown,
            };
        });
    }
    runResearchFleet(sessionId, query, plan, breakdown) {
        return __awaiter(this, void 0, void 0, function* () {
            const researchFleet = new subagents_1.ResearchAgentFleet(sessionId, `${sessionId}_fleet`);
            const task = yield prisma_1.prisma.agentTask.create({
                data: {
                    sessionId,
                    type: 'research',
                    agentName: 'ResearchAgentFleet',
                    status: 'running',
                    startedAt: new Date(),
                },
            });
            const result = yield researchFleet.runAll(query);
            breakdown.research = {
                web: result.sources.filter(s => s.type === 'web').length,
                academic: result.sources.filter(s => s.type === 'paper').length,
                code: result.sources.filter(s => s.type === 'github').length,
                news: 0,
            };
            yield prisma_1.prisma.agentTask.update({
                where: { id: task.id },
                data: {
                    status: 'completed',
                    output: { sourcesFound: result.sources.length },
                },
            });
            return result;
        });
    }
    runCriticFleet(sessionId, claims, sources, breakdown) {
        return __awaiter(this, void 0, void 0, function* () {
            const criticFleet = new subagents_1.CriticFleet(sessionId);
            const task = yield prisma_1.prisma.agentTask.create({
                data: {
                    sessionId,
                    type: 'critic',
                    agentName: 'CriticFleet',
                    status: 'running',
                    startedAt: new Date(),
                },
            });
            const result = yield criticFleet.critique(claims, sources);
            breakdown.critic = {
                verified: result.verified.filter(v => v.verified).length,
                biases: result.biases.length,
                contradictions: result.contradictions.length,
            };
            const critiqueResult = {
                taskId: task.id,
                acceptedClaims: result.verified.filter(v => v.verified).map(v => ({
                    id: v.claimId,
                    statement: v.statement,
                    evidence: v.evidence,
                    confidence: v.confidence,
                })),
                rejectedClaims: result.verified.filter(v => !v.verified).map(v => ({
                    id: v.claimId,
                    statement: v.statement,
                    evidence: v.evidence,
                    confidence: v.confidence,
                })),
                contradictions: result.contradictions.map(c => ({
                    claimA: c.statementA,
                    claimB: c.statementB,
                    severity: c.severity,
                })),
                biasIndicators: result.biases.map(b => ({
                    claim: b.statement,
                    biasType: b.biasType,
                    severity: b.severity,
                })),
                overallConfidence: result.overallConfidence,
            };
            yield prisma_1.prisma.agentTask.update({
                where: { id: task.id },
                data: {
                    status: 'completed',
                    output: {
                        verified: breakdown.critic.verified,
                        contradictions: breakdown.critic.contradictions,
                    },
                },
            });
            return critiqueResult;
        });
    }
    runSynthesizerFleet(sessionId, critiqueResult, sources, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const synthesizerFleet = new subagents_1.SynthesizerFleet(sessionId, `${sessionId}_synth`);
            const task = yield prisma_1.prisma.agentTask.create({
                data: {
                    sessionId,
                    type: 'synthesizer',
                    agentName: 'SynthesizerFleet',
                    status: 'running',
                    startedAt: new Date(),
                },
            });
            const researchContent = sources.map(s => s.content).join('\n');
            const synthesis = yield synthesizerFleet.synthesize(critiqueResult, researchContent, query);
            yield prisma_1.prisma.agentTask.update({
                where: { id: task.id },
                data: {
                    status: 'completed',
                    output: { keyFindings: synthesis.keyFindings.length },
                },
            });
            return synthesis;
        });
    }
    runMemoryFleet(sessionId, memoryFleet, synthesis, query, breakdown) {
        return __awaiter(this, void 0, void 0, function* () {
            const memoryTask = yield prisma_1.prisma.agentTask.create({
                data: {
                    sessionId,
                    type: 'memory',
                    agentName: 'MemoryFleet',
                    status: 'running',
                    startedAt: new Date(),
                },
            });
            memoryFleet.storeContext(`Synthesis completed with ${synthesis.keyFindings.length} key findings`);
            for (const finding of synthesis.keyFindings.slice(0, 3)) {
                yield memoryFleet.persistToLongTerm('fact', finding);
                breakdown.memory.longTerm++;
            }
            const topic = query.split(' ').slice(0, 3).join(' ');
            yield memoryFleet.updateInterest(topic);
            yield memoryFleet.buildKnowledgeGraph(topic, synthesis.keyFindings);
            breakdown.memory.graphNodes = synthesis.keyFindings.length;
            yield prisma_1.prisma.agentTask.update({
                where: { id: memoryTask.id },
                data: {
                    status: 'completed',
                    output: {
                        shortTerm: breakdown.memory.shortTerm,
                        longTerm: breakdown.memory.longTerm,
                        graphNodes: breakdown.memory.graphNodes,
                    },
                },
            });
        });
    }
    runActionFleet(sessionId, synthesis, query, breakdown) {
        return __awaiter(this, void 0, void 0, function* () {
            const actionTask = yield prisma_1.prisma.agentTask.create({
                data: {
                    sessionId,
                    type: 'action',
                    agentName: 'ActionFleet',
                    status: 'running',
                    startedAt: new Date(),
                },
            });
            const actionFleet = new subagents_1.ActionFleet(sessionId, actionTask.id);
            const actions = yield actionFleet.generateAll(query, synthesis);
            breakdown.actions = {
                prds: actions.filter(a => a.type === 'prd').length,
                tickets: actions.filter(a => a.type === 'ticket').length,
                code: actions.filter(a => a.type === 'code').length,
                decisions: actions.filter(a => a.type === 'decision').length,
            };
            yield prisma_1.prisma.agentTask.update({
                where: { id: actionTask.id },
                data: {
                    status: 'completed',
                    output: {
                        actionsGenerated: actions.length,
                        breakdown: breakdown.actions,
                    },
                },
            });
        });
    }
    getSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.session.findUnique({
                where: { id: sessionId },
                include: {
                    tasks: true,
                    sources: true,
                    citations: true,
                    outputs: true,
                    evaluations: true,
                },
            });
        });
    }
    getUserSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.session.findMany({
                where: { userId: this.userId },
                orderBy: { updatedAt: 'desc' },
                take: 20,
            });
        });
    }
}
exports.AgentOrchestrator = AgentOrchestrator;
