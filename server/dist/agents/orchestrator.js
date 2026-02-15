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
const prisma_1 = require("../services/prisma");
const planner_1 = require("./planner");
const research_1 = require("./research");
const critic_1 = require("./critic");
const synthesizer_1 = require("./synthesizer");
const memory_1 = require("./memory");
const action_1 = require("./action");
const meta_1 = require("./meta");
class AgentOrchestrator {
    constructor(userId) {
        this.userId = userId;
    }
    research(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            const session = yield prisma_1.prisma.session.create({
                data: {
                    userId: this.userId,
                    query,
                    title: query.substring(0, 100),
                    status: 'active',
                },
            });
            const planner = new planner_1.PlannerAgent(session.id);
            const plan = yield planner.plan(query);
            let totalCost = plan.estimatedCost;
            const researchResults = [];
            const researchSubtasks = plan.subtasks.filter(t => t.type === 'research');
            for (const subtask of researchSubtasks) {
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
                const result = yield agent.research(subtask, query);
                researchResults.push(result);
            }
            const criticSubtask = plan.subtasks.find(t => t.type === 'critic');
            let critiqueResult = null;
            if (criticSubtask) {
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
