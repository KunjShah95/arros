import { llmService } from '../services/llm';
import { prisma } from '../services/prisma';
import { z } from 'zod';
import type { Claim, CritiqueResult } from '../types';

export interface DebateResult {
    thesis: string;
    antithesis: string;
    synthesis: string;
    commonGround: string[];
    unresolvedPoints: string[];
}

export class DebateAgent {
    private sessionId: string;
    private taskId: string;

    constructor(sessionId: string, taskId: string) {
        this.sessionId = sessionId;
        this.taskId = taskId;
    }

    async deliberate(claims: Claim[], critique: CritiqueResult): Promise<DebateResult> {
        const messages = [
            {
                role: 'system' as const,
                content: `You are an Agent Debate Coordinator for ARROS. Your job is to take research claims and a critique, then simulate a productive debate between a 'Proponent' (supporting the main claims) and a 'Skeptic' (challenging weak evidence or bias).
        
Finally, provide a 'Synthesis' that represents the most truthful middle ground.

Claims: ${JSON.stringify(claims.map(c => c.statement))}
Critique: ${JSON.stringify(critique.contradictions)}`,
            },
            {
                role: 'user' as const,
                content: `Conduct a scholarly debate on the following research points. 
        Focus on resolving contradictions: ${critique.contradictions.map(c => `${c.claimA} vs ${c.claimB}`).join('; ')}`,
            },
        ];

        const response = await llmService.chat(messages, {
            temperature: 0.4,
            model: 'gpt-4o',
            responseFormat: z.object({
                thesis: z.string(),
                antithesis: z.string(),
                synthesis: z.string(),
                commonGround: z.array(z.string()),
                unresolvedPoints: z.array(z.string()),
            }),
        });

        const result = JSON.parse(response.content) as DebateResult;

        await prisma.agentOutput.create({
            data: {
                sessionId: this.sessionId,
                taskId: this.taskId,
                type: 'critique', // Reusing critique or adding 'debate'
                content: result as any,
                confidence: 0.9,
            },
        });

        await prisma.agentTask.update({
            where: { id: this.taskId },
            data: { status: 'completed', output: result as any },
        });

        return result;
    }
}
