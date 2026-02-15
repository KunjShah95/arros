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
exports.ActionAgent = void 0;
const prisma_1 = require("../services/prisma");
class ActionAgent {
    constructor(sessionId, taskId) {
        this.sessionId = sessionId;
        this.taskId = taskId;
    }
    generateActions(synthesisResult, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const actions = [];
            const lowerQuery = query.toLowerCase();
            if (lowerQuery.includes('build') || lowerQuery.includes('implement') || lowerQuery.includes('create system')) {
                actions.push(...this.generateArchitectureActions(synthesisResult));
            }
            if (lowerQuery.includes('compare') || lowerQuery.includes('vs') || lowerQuery.includes('versus')) {
                actions.push(...this.generateDecisionMatrix(synthesisResult));
            }
            if (lowerQuery.includes('learn') || lowerQuery.includes('understand') || lowerQuery.includes('study')) {
                actions.push(...this.generateLearningPath(synthesisResult));
            }
            actions.push(...this.generateGenericActions(synthesisResult));
            yield prisma_1.prisma.agentOutput.create({
                data: {
                    sessionId: this.sessionId,
                    taskId: this.taskId,
                    type: 'action',
                    content: { actions },
                    confidence: synthesisResult.confidence,
                },
            });
            yield prisma_1.prisma.agentTask.update({
                where: { id: this.taskId },
                data: { status: 'completed', output: { actionsGenerated: actions.length } },
            });
            return actions;
        });
    }
    generateArchitectureActions(synthesisResult) {
        return [
            {
                type: 'architecture',
                title: 'System Architecture Design',
                description: `Design system architecture incorporating ${synthesisResult.keyFindings.slice(0, 3).join(', ')}`,
                priority: 'high',
            },
            {
                type: 'prd',
                title: 'Product Requirements Document',
                description: 'Create PRD based on research findings',
                priority: 'high',
            },
            {
                type: 'code',
                title: 'Technical Specifications',
                description: 'Write technical specs and API design',
                priority: 'medium',
            },
        ];
    }
    generateDecisionMatrix(synthesisResult) {
        return [
            {
                type: 'decision',
                title: 'Decision Matrix',
                description: 'Create weighted decision matrix comparing options',
                priority: 'high',
            },
            {
                type: 'ticket',
                title: 'Research Summary',
                description: 'Document decision criteria and tradeoffs',
                priority: 'medium',
            },
        ];
    }
    generateLearningPath(synthesisResult) {
        return [
            {
                type: 'prd',
                title: 'Learning Roadmap',
                description: `Create structured learning path based on: ${synthesisResult.keyFindings[0] || 'research findings'}`,
                priority: 'medium',
            },
            {
                type: 'ticket',
                title: 'Knowledge Checkpoints',
                description: 'Define key concepts to verify understanding',
                priority: 'low',
            },
        ];
    }
    generateGenericActions(synthesisResult) {
        return [
            {
                type: 'ticket',
                title: 'Documentation Update',
                description: 'Document research findings and insights',
                priority: 'low',
            },
        ];
    }
}
exports.ActionAgent = ActionAgent;
