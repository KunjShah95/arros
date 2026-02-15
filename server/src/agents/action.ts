import type { ActionItem, SynthesisResult } from '../types';
import { prisma } from '../services/prisma';
import { Prisma } from '@prisma/client';

export class ActionAgent {
  private sessionId: string;
  private taskId: string;

  constructor(sessionId: string, taskId: string) {
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  async generateActions(synthesisResult: SynthesisResult, query: string): Promise<ActionItem[]> {
    const actions: ActionItem[] = [];

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

    await prisma.agentOutput.create({
      data: {
        sessionId: this.sessionId,
        taskId: this.taskId,
        type: 'action',
        content: { actions } as unknown as Prisma.InputJsonValue,
        confidence: synthesisResult.confidence,
      },
    });

    await prisma.agentTask.update({
      where: { id: this.taskId },
      data: { status: 'completed', output: { actionsGenerated: actions.length } as Prisma.InputJsonValue },
    });

    return actions;
  }

  private generateArchitectureActions(synthesisResult: SynthesisResult): ActionItem[] {
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

  private generateDecisionMatrix(synthesisResult: SynthesisResult): ActionItem[] {
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

  private generateLearningPath(synthesisResult: SynthesisResult): ActionItem[] {
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

  private generateGenericActions(synthesisResult: SynthesisResult): ActionItem[] {
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
