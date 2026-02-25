/**
 * HumanBrainOrchestrator — The Complete Human-Like Cognitive Brain
 *
 * This orchestrator replaces the mechanical pipeline approach with a fully
 * human-like cognitive architecture that:
 *
 *  🧠 THINKS before acting (CognitiveCore — prefrontal cortex)
 *  ❤️  FEELS through the process (EmotionalEngine — limbic system)
 *  ⚡  INTUITS from patterns (IntuitionEngine — System 1 / basal ganglia)
 *  💭  HOLDS context in mind (WorkingMemory — 7±2 working memory)
 *  🔍  WONDERS and explores (CuriosityEngine — information gap drive)
 *  🪞  REFLECTS on itself (SelfAwarenessModule — metacognition)
 *  💤  CONSOLIDATES overnight (DreamConsolidator — memory consolidation)
 *
 * Decision Flow:
 *  1. Brain "wakes up" and orients to the query
 *  2. Intuition fires first (fast, automatic)
 *  3. Emotion colors the context
 *  4. Deliberate reasoning kicks in
 *  5. Self-awareness monitors for biases
 *  6. Curiosity flags interesting threads to follow
 *  7. Working memory maintains context across steps
 *  8. Brain executes a plan that was genuinely DECIDED, not just computed
 *  9. Emotion updates based on outcome
 * 10. Memory consolidates what matters
 */

import { v4 as uuid } from 'uuid';
import { prisma } from '../services/prisma';
import { CognitiveCore } from './cognitiveCore';
import { EmotionalEngine } from './emotionalEngine';
import { WorkingMemory } from './workingMemory';
import { CuriosityEngine } from './curiosityEngine';
import { SelfAwarenessModule } from './selfAwareness';
import { DreamConsolidator } from './dreamConsolidator';
import { PlannerAgent } from './planner';
import { ResearchAgent } from './research';
import { CriticAgent } from './critic';
import { SynthesizerAgent } from './synthesizer';
import { MemoryAgent } from './memory';
import { ActionAgent } from './action';
import { MetaEvaluatorAgent } from './meta';
import { DebateAgent } from './debate';
import {
    CriticFleet,
    MemoryFleet,
    ActionFleet,
    SynthesizerFleet,
    // Specialized Planning Fleet
    PlanningAgentFleet,
    StrategyAgent,
    TimelineAgent,
    ResourceAgent,
    RiskAgent,
    ResearchPlanningAgent,
    // Specialized Code Fleet (exported as CodeFleetV2 from index)
    CodeFleetV2,
    CodeGenerationAgent,
    BackendAgent,
    FrontendAgent,
    DevOpsAgent,
    TestAgent,
    // Specialized Code Review Fleet (exported as CodeReviewFleetV2 from index)
    CodeReviewFleetV2,
    CodeReviewAgent,
    StyleReviewAgent,
    PerformanceReviewAgent,
    SecurityReviewAgent,
    ArchitectureReviewAgent,
    // Specialized Critic Fleet (the CriticFleet is already exported above)
    FinalCriticAgent,
    TruthCriticAgent,
    LogicCriticAgent,
    BiasCriticAgent,
    QualityCriticAgent,
    ComplianceCriticAgent,
    // Specialized Research Agents
    WebResearchAgent,
    AcademicResearchAgent,
    CodeResearchAgent,
    NewsResearchAgent,
    PatentResearchAgent,
    VideoResearchAgent,
    BookResearchAgent,
    ForumResearchAgent,
    // Specialized Additional Agents
    SpecializedAgentFleet,
    SynthesisAgent,
    DecisionAgent,
    CreativeAgent,
    LearningAgent,
    ResearchSynthesisAgent,
    SpecializedMemoryAgent,
    ResearchAgentFleet,
} from './subagents';
import type {
    TaskPlan,
    ResearchResult,
    CritiqueResult,
    SynthesisResult,
    SourceResult,
    Claim,
} from '../types';
import type { AgentBreakdown, ResearchResponse } from './orchestrator';
// Direct imports so we can use the REAL class names (index re-exports them as V2 aliases)
import { CodeFleet } from './subagents/specializedCodeFleet';
import { CodeReviewFleet } from './subagents/specializedCodeReviewFleet';
// Import the NEW specialized fleets directly to avoid barrel collision with old same-named classes
import { CriticFleet as SpecializedCriticFleet } from './subagents/specializedCriticFleet';
import { ResearchAgentFleet as SpecializedResearchFleet } from './subagents/specializedResearchFleet';

// ─── Brain State ──────────────────────────────────────────────────────────────

export interface BrainState {
    isThinking: boolean;
    currentEmotion: string;
    processingMode: string;
    cognitiveLoad: number;
    arousalLevel: number;
    curiosityScore: number;
    workingMemoryLoad: number;
    selfReflection: string;
    openQuestions: string[];
    sessionInsights: string[];
}

// ─── HumanBrainOrchestrator Class ────────────────────────────────────────────

export class HumanBrainOrchestrator {
    private userId: string;
    private useSubagents: boolean;

    // Cognitive subsystems — the "organs" of the brain
    private cognitiveCore: CognitiveCore;
    private emotionalEngine: EmotionalEngine;
    private curiosityEngine: CuriosityEngine;
    private selfAwareness: SelfAwarenessModule;
    private dreamConsolidator: DreamConsolidator;

    // Shared working memory across the session
    private workingMemory: WorkingMemory;

    // Specialized agent fleets (the "specialists" of the brain)
    private specializedResearchFleet: SpecializedResearchFleet;
    private specializedPlanningFleet: PlanningAgentFleet;
    private codeFleet: CodeFleet;
    private codeReviewFleet: CodeReviewFleet;
    private criticFleet: SpecializedCriticFleet;
    private specializedAgentFleet: SpecializedAgentFleet;

    // Session-level state
    private sessionInsights: string[] = [];
    private sessionStartEmotion: string = '';

    constructor(userId: string, useSubagents: boolean = true) {
        this.userId = userId;
        this.useSubagents = useSubagents;

        // Initialize all cognitive subsystems
        const sessionId = `brain_session_${uuid()}`;

        this.cognitiveCore = new CognitiveCore(userId, sessionId);
        this.emotionalEngine = new EmotionalEngine(userId, sessionId);
        this.curiosityEngine = new CuriosityEngine(userId);
        this.selfAwareness = new SelfAwarenessModule(userId, sessionId);
        this.dreamConsolidator = new DreamConsolidator(userId);
        this.workingMemory = new WorkingMemory(sessionId);

        // Initialize specialized agent fleets
        this.specializedResearchFleet = new SpecializedResearchFleet(sessionId, `fleet_${uuid()}`);
        this.specializedPlanningFleet = new PlanningAgentFleet(sessionId, `planner_${uuid()}`);
        this.codeFleet = new CodeFleet(sessionId, `code_${uuid()}`);
        this.codeReviewFleet = new CodeReviewFleet(sessionId, `review_${uuid()}`);
        this.criticFleet = new SpecializedCriticFleet(sessionId, `critic_${uuid()}`);
        this.specializedAgentFleet = new SpecializedAgentFleet(sessionId, `specialized_${uuid()}`);
    }

    /**
     * The main research function — now powered by human-like cognition
     */
    async research(query: string, attempt: number = 1): Promise<ResearchResponse & { brainState: BrainState }> {
        const startTime = Date.now();

        console.log('\n' + '═'.repeat(70));
        console.log(`🧠 [HumanBrain] THINKING: "${query.substring(0, 80)}"`);
        console.log('═'.repeat(70));

        // ─── Step 1: ORIENT — Brain wakes up and orients to the query ───────────
        const session = await prisma.session.upsert({
            where: { id: attempt === 1 ? uuid() : 'non-existent' },
            update: { status: 'active' },
            create: {
                userId: this.userId,
                query,
                title: query.substring(0, 100),
                status: 'active',
            },
        });

        // Load relevant working memory for this query
        const relevantMemory = this.workingMemory.retrieve(query);
        const memoryContext = relevantMemory.map(m => m.content).join('\n');

        // ─── Step 2: THINK — Full cognitive evaluation ───────────────────────────
        console.log('🧠 [CognitiveCore] Initiating deliberate reasoning...');
        const cognitiveDecision = await this.cognitiveCore.think(query, memoryContext);
        const cognitiveState = this.cognitiveCore.getCognitiveState();

        // Store thinking result in working memory
        this.workingMemory.store({
            key: `decision_${session.id}`,
            content: cognitiveDecision.reasoning,
            importance: cognitiveDecision.confidence,
            timestamp: new Date(),
            tags: ['decision', 'reasoning', 'current_query'],
        });

        // ─── Step 3: FEEL — Get emotional context ───────────────────────────────
        const emotionalState = await this.emotionalEngine.getCurrentState();
        const emotionLabel = this.emotionalEngine.labelEmotion(emotionalState);
        this.sessionStartEmotion = emotionLabel;
        console.log(`❤️  [EmotionalEngine] ${emotionLabel} (arousal: ${emotionalState.arousal.toFixed(2)})`);

        // ─── Step 4: WONDER — Check curiosity ───────────────────────────────────
        const curiosityAssessment = await this.curiosityEngine.assess(query);
        await this.curiosityEngine.registerInterest(query);
        console.log(`🔍 [CuriosityEngine] Curiosity: ${(curiosityAssessment.score * 100).toFixed(0)}% | Novelty: ${(curiosityAssessment.noveltyScore * 100).toFixed(0)}%`);

        // Log spontaneous questions from curiosity
        if (curiosityAssessment.relatedQuestions.length > 0) {
            console.log(`💭 [Brain] I'm also wondering: "${curiosityAssessment.relatedQuestions[0]}"`);
            curiosityAssessment.relatedQuestions.forEach(q => this.curiosityEngine.addOpenQuestion(q));
        }

        // ─── Step 5: PLAN — Brain decides HOW to approach this ──────────────────
        console.log(`\n⚡ [Brain] Using processing mode: ${cognitiveState.processingMode}`);
        console.log(`📊 [Brain] Cognitive load: ${(cognitiveState.cognitiveLoad * 100).toFixed(0)}% | Confidence: ${(cognitiveDecision.confidence * 100).toFixed(0)}%`);

        // Brain's decision influences the research plan
        const planner = new PlannerAgent(session.id);
        const plan = await planner.plan(this.enrichQueryWithCognition(query, cognitiveDecision, curiosityAssessment));
        let totalCost = plan.estimatedCost;

        // ─── Step 6: ACT — Execute the research plan ────────────────────────────
        let researchResult: ResearchResponse;

        if (this.useSubagents) {
            researchResult = await this.runWithSubagents(session, query, plan, startTime, attempt, cognitiveDecision);
        } else {
            researchResult = await this.runStandardPipeline(session, query, plan, startTime, attempt, cognitiveDecision);
        }

        // ─── Step 7: REFLECT — Self-awareness check on the outcome ──────────────
        const selfCheckResult = this.selfAwareness.reflect();
        if (selfCheckResult.improvements.length > 0) {
            console.log(`🪞 [SelfAwareness] ${selfCheckResult.improvements[0]}`);
        }
        this.selfAwareness.recordOutcome(
            cognitiveDecision.confidence,
            researchResult.synthesis?.confidence ?? 0.5,
            query
        );

        // ─── Step 8: UPDATE EMOTION — How did it go? ───────────────────────────
        const synthesisConfidence = researchResult.synthesis?.confidence ?? 0.5;
        await this.emotionalEngine.update({
            trigger: query,
            outcome: synthesisConfidence > 0.7 ? 'success' : synthesisConfidence > 0.4 ? 'uncertainty' : 'failure',
            intensity: synthesisConfidence,
        });

        const finalEmotion = await this.emotionalEngine.getCurrentState();
        const finalEmotionLabel = this.emotionalEngine.labelEmotion(finalEmotion);
        console.log(`❤️  [EmotionalEngine] Post-research emotion: ${finalEmotionLabel}`);

        // ─── Step 9: CONSOLIDATE — Store important memories ─────────────────────
        if (researchResult.synthesis) {
            await this.dreamConsolidator.microConsolidate(researchResult.synthesis, query);
            this.curiosityEngine.updateKnowledge(query.split(' ').slice(0, 3).join(' '), synthesisConfidence * 0.3);
        }

        // Update working memory with session result
        this.workingMemory.store({
            key: `result_${session.id}`,
            content: researchResult.synthesis?.summary?.substring(0, 200) ?? query,
            importance: synthesisConfidence,
            timestamp: new Date(),
            tags: ['result', 'synthesis', 'completed'],
        });

        // Generate session insight
        const sessionInsight = this.generateSessionInsight(query, cognitiveDecision, synthesisConfidence, curiosityAssessment);
        this.sessionInsights.push(sessionInsight);

        // ─── Step 10: BUILD BRAIN STATE — Return cognitive transparency ─────────
        const brainState: BrainState = {
            isThinking: false,
            currentEmotion: finalEmotionLabel,
            processingMode: cognitiveState.processingMode,
            cognitiveLoad: cognitiveDecision.cognitiveLoad,
            arousalLevel: finalEmotion.arousal,
            curiosityScore: curiosityAssessment.score,
            workingMemoryLoad: this.workingMemory.getLoad(),
            selfReflection: selfCheckResult.commonBiases.length > 0
                ? `Noticed potential ${selfCheckResult.commonBiases[0].replace(/_/g, ' ')} — staying vigilant`
                : 'Thinking clearly with no obvious biases detected',
            openQuestions: this.curiosityEngine.getOpenQuestions().slice(0, 3),
            sessionInsights: this.sessionInsights.slice(-3),
        };

        console.log('\n' + '─'.repeat(70));
        console.log(`✅ [HumanBrain] Research complete in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
        console.log(`🧠 Emotion: ${finalEmotionLabel} | Mode: ${cognitiveState.processingMode} | Load: ${(cognitiveDecision.cognitiveLoad * 100).toFixed(0)}%`);
        console.log('─'.repeat(70) + '\n');

        return {
            ...researchResult,
            brainState,
        };
    }

    /**
     * Get the current brain state (for UI display)
     */
    async getBrainState(): Promise<BrainState> {
        const emotionalState = await this.emotionalEngine.getCurrentState();
        const cogState = this.cognitiveCore.getCognitiveState();
        const emotionLabel = this.emotionalEngine.labelEmotion(emotionalState);
        const selfReflection = this.selfAwareness.reflect();

        return {
            isThinking: cogState.cognitiveLoad > 0.3,
            currentEmotion: emotionLabel,
            processingMode: cogState.processingMode,
            cognitiveLoad: cogState.cognitiveLoad,
            arousalLevel: emotionalState.arousal,
            curiosityScore: 0,
            workingMemoryLoad: this.workingMemory.getLoad(),
            selfReflection: selfReflection.improvements[0] ?? 'No concerns noted',
            openQuestions: this.curiosityEngine.getOpenQuestions().slice(0, 3),
            sessionInsights: this.sessionInsights.slice(-3),
        };
    }

    /**
     * Run a full offline consolidation cycle (call this between sessions)
     */
    async sleep(): Promise<void> {
        console.log('\n🌙 [HumanBrain] Entering consolidation (sleep) mode...');
        const result = await this.dreamConsolidator.consolidate();
        await this.cognitiveCore.rest();
        const toConsolidate = this.workingMemory.consolidate();
        console.log(`💤 [HumanBrain] Consolidation complete: ${result.insightsGenerated.length} insights, ${result.memoriesPruned} memories pruned`);
        if (result.dominantThemes.length > 0) {
            console.log(`🧠 [HumanBrain] Dominant themes: ${result.dominantThemes.join(', ')}`);
        }
    }

    // ─── Private Methods ─────────────────────────────────────────────────────────

    /**
     * Enrich the query with cognitive insights before planning
     * This is how the brain's state influences HOW it researches
     */
    private enrichQueryWithCognition(
        query: string,
        decision: any,
        curiosity: any
    ): string {
        const extras: string[] = [];

        if (decision.alternatives.length > 0) {
            extras.push(`Also consider: ${decision.alternatives[0]}`);
        }

        if (curiosity.relatedQuestions.length > 0) {
            extras.push(`Curious about: ${curiosity.relatedQuestions[0]}`);
        }

        if (curiosity.explorationPath.length > 0) {
            extras.push(`Worth exploring: ${curiosity.explorationPath[0]}`);
        }

        if (extras.length === 0) return query;
        return `${query} [Brain context: ${extras.join('; ')}]`;
    }

    private generateSessionInsight(
        query: string,
        decision: any,
        outcome: number,
        curiosity: any
    ): string {
        if (outcome > 0.8) {
            return `Successfully researched "${query.substring(0, 40)}" with ${(outcome * 100).toFixed(0)}% confidence`;
        } else if (curiosity.noveltyScore > 0.7) {
            return `Explored new territory: "${query.substring(0, 40)}" — high novelty, learning opportunity`;
        } else {
            return `Completed research on "${query.substring(0, 40)}" — ${decision.reasoning.substring(0, 80)}`;
        }
    }

    // ─── Subagent Pipeline (with cognitive integration) ───────────────────────

    private async runWithSubagents(
        session: any,
        query: string,
        plan: TaskPlan,
        startTime: number,
        attempt: number,
        cognitiveDecision: any
    ): Promise<ResearchResponse> {
        const agentBreakdown: AgentBreakdown = {
            research: { web: 0, academic: 0, code: 0, news: 0 },
            critic: { verified: 0, biases: 0, contradictions: 0 },
            memory: { shortTerm: 0, longTerm: 0, graphNodes: 0 },
            actions: { prds: 0, tickets: 0, code: 0, decisions: 0 },
        };

        const memoryFleet = new MemoryFleet(this.userId, session.id);
        memoryFleet.storeContext(`Brain thinks: ${cognitiveDecision.reasoning.substring(0, 100)}`);
        memoryFleet.storeContext(`Research query: ${query}`);

        // Research with awareness that the brain is curious about related questions
        const { sources, claims } = await this.runResearchFleet(session.id, query, plan, agentBreakdown);
        const critiqueResult = await this.runCriticFleet(session.id, claims, sources, agentBreakdown);

        const debateSubtask = plan.subtasks.find(t => t.type === 'debate');
        if (debateSubtask) {
            const debateTask = await prisma.agentTask.create({
                data: {
                    sessionId: session.id,
                    type: 'debate',
                    agentName: 'DebateAgent',
                    status: 'running',
                    startedAt: new Date(),
                },
            });
            const debateAgent = new DebateAgent(session.id, debateTask.id);
            await debateAgent.deliberate(claims, critiqueResult);
        }

        const synthesisResult = await this.runSynthesizerFleet(session.id, critiqueResult, sources, query);
        await this.runMemoryFleet(session.id, memoryFleet, synthesisResult, query, agentBreakdown);

        const actionSubtask = plan.subtasks.find(t => t.type === 'action');
        if (actionSubtask) {
            await this.runActionFleet(session.id, synthesisResult, query, agentBreakdown);
        }

        let evaluations: Array<{ type: string; score: number; passed: boolean }> = [];
        const metaSubtask = plan.subtasks.find(t => t.type === 'meta');
        if (metaSubtask) {
            const metaTask = await prisma.agentTask.create({
                data: {
                    sessionId: session.id,
                    type: 'meta',
                    agentName: 'MetaEvaluatorAgent',
                    status: 'running',
                    startedAt: new Date(),
                },
            });
            const metaEvaluator = new MetaEvaluatorAgent(session.id, metaTask.id);
            const evaluation = await metaEvaluator.evaluate(synthesisResult, critiqueResult, query);
            evaluations = [{ type: evaluation.type, score: evaluation.score, passed: evaluation.passed }];

            if (!evaluation.passed && attempt < 3) {
                // Brain DECIDES to retry — not just a mechanical loop
                await this.emotionalEngine.update({ trigger: query, outcome: 'failure', intensity: 0.6 });
                console.log(`🧠 [HumanBrain] Quality below threshold (${evaluation.score.toFixed(2)}). Brain deciding to retry with focus...`);
                const refinedQuery = `${query} (Focus on: ${evaluation.recommendations?.join(', ') || 'accuracy and depth'})`;
                await prisma.session.update({ where: { id: session.id }, data: { status: 'completed' } });
                return (await this.research(refinedQuery, attempt + 1)) as any;
            }
        }

        await prisma.session.update({ where: { id: session.id }, data: { status: 'completed' } });

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
    }

    private async runStandardPipeline(
        session: any,
        query: string,
        plan: TaskPlan,
        startTime: number,
        attempt: number,
        cognitiveDecision: any
    ): Promise<ResearchResponse> {
        const researchSubtasks = plan.subtasks.filter(t => t.type === 'research');
        const researchResults = await Promise.all(
            researchSubtasks.map(async subtask => {
                const task = await prisma.agentTask.create({
                    data: { sessionId: session.id, type: 'research', agentName: 'ResearchAgent', status: 'running', startedAt: new Date() },
                });
                return new ResearchAgent(session.id, task.id).research(subtask, query);
            })
        );

        let critiqueResult: CritiqueResult | null = null;
        const critiqueSubtask = plan.subtasks.find(t => t.type === 'critic');
        if (critiqueSubtask) {
            const criticTask = await prisma.agentTask.create({
                data: { sessionId: session.id, type: 'critic', agentName: 'CriticAgent', status: 'running', startedAt: new Date() },
            });
            critiqueResult = await new CriticAgent(session.id, criticTask.id).critique(researchResults);
        }

        let synthesisResult: SynthesisResult | null = null;
        if (critiqueResult) {
            const synthTask = await prisma.agentTask.create({
                data: { sessionId: session.id, type: 'synthesizer', agentName: 'SynthesizerAgent', status: 'running', startedAt: new Date() },
            });
            synthesisResult = await new SynthesizerAgent(session.id, synthTask.id).synthesize(
                critiqueResult,
                researchResults.map(r => r.rawContent).join('\n'),
                query,
                plan.subtasks.some(t => t.type === 'action')
            );
        }

        if (synthesisResult) {
            const memoryTask = await prisma.agentTask.create({
                data: { sessionId: session.id, type: 'memory', agentName: 'MemoryAgent', status: 'running', startedAt: new Date() },
            });
            await new MemoryAgent(session.id, this.userId, memoryTask.id).storeResults(synthesisResult, query);
        }

        let evaluations: Array<{ type: string; score: number; passed: boolean }> = [];
        if (synthesisResult && critiqueResult) {
            const metaTask = await prisma.agentTask.create({
                data: { sessionId: session.id, type: 'meta', agentName: 'MetaEvaluatorAgent', status: 'running', startedAt: new Date() },
            });
            const evaluation = await new MetaEvaluatorAgent(session.id, metaTask.id).evaluate(synthesisResult, critiqueResult, query);
            evaluations = [{ type: evaluation.type, score: evaluation.score, passed: evaluation.passed }];

            if (!evaluation.passed && attempt < 3) {
                await this.emotionalEngine.update({ trigger: query, outcome: 'failure', intensity: 0.6 });
                const refinedQuery = `${query} (Focus on: ${evaluation.recommendations?.join(', ') || 'accuracy and depth'})`;
                await prisma.session.update({ where: { id: session.id }, data: { status: 'completed' } });
                return (await this.research(refinedQuery, attempt + 1)) as any;
            }
        }

        await prisma.session.update({ where: { id: session.id }, data: { status: 'completed' } });

        return {
            sessionId: session.id,
            query,
            plan,
            synthesis: synthesisResult!,
            evaluations,
            totalCost: plan.estimatedCost,
            totalTime: Date.now() - startTime,
        };
    }

    // ─── Fleet Runners (kept from original orchestrator) ──────────────────────

    private async runResearchFleet(sessionId: string, query: string, plan: TaskPlan, breakdown: AgentBreakdown) {
        const researchFleet = new SpecializedResearchFleet(sessionId, `${sessionId}_fleet`);
        const task = await prisma.agentTask.create({
            data: { sessionId, type: 'research', agentName: 'ResearchAgentFleet', status: 'running', startedAt: new Date() },
        });
        const result = await researchFleet.runAll(query);
        breakdown.research = {
            web: result.sources.filter((s: SourceResult) => s.type === 'web').length,
            academic: result.sources.filter((s: SourceResult) => s.type === 'paper').length,
            code: result.sources.filter((s: SourceResult) => s.type === 'github').length,
            news: 0,
        };
        await prisma.agentTask.update({ where: { id: task.id }, data: { status: 'completed', output: { sourcesFound: result.sources.length } as any } });
        return result;
    }

    private async runCriticFleet(sessionId: string, claims: Claim[], sources: SourceResult[], breakdown: AgentBreakdown): Promise<CritiqueResult> {
        const criticFleet = new CriticFleet(sessionId);
        const task = await prisma.agentTask.create({
            data: { sessionId, type: 'critic', agentName: 'CriticFleet', status: 'running', startedAt: new Date() },
        });
        const result = await criticFleet.critique(claims, sources);
        breakdown.critic = {
            verified: result.verified.filter(v => v.verified).length,
            biases: result.biases.length,
            contradictions: result.contradictions.length,
        };
        const critiqueResult: CritiqueResult = {
            taskId: task.id,
            acceptedClaims: result.verified.filter(v => v.verified).map(v => ({ id: v.claimId, statement: v.statement, evidence: v.evidence, confidence: v.confidence })),
            rejectedClaims: result.verified.filter(v => !v.verified).map(v => ({ id: v.claimId, statement: v.statement, evidence: v.evidence, confidence: v.confidence })),
            contradictions: result.contradictions.map(c => ({ claimA: c.statementA, claimB: c.statementB, severity: c.severity })),
            biasIndicators: result.biases.map(b => ({ claim: b.statement, biasType: b.biasType, severity: b.severity })),
            overallConfidence: result.overallConfidence,
        };
        await prisma.agentTask.update({ where: { id: task.id }, data: { status: 'completed', output: { verified: breakdown.critic.verified, contradictions: breakdown.critic.contradictions } as any } });
        return critiqueResult;
    }

    private async runSynthesizerFleet(sessionId: string, critiqueResult: CritiqueResult, sources: SourceResult[], query: string): Promise<SynthesisResult> {
        const synthesizerFleet = new SynthesizerFleet(sessionId, `${sessionId}_synth`);
        const task = await prisma.agentTask.create({
            data: { sessionId, type: 'synthesizer', agentName: 'SynthesizerFleet', status: 'running', startedAt: new Date() },
        });
        const researchContent = sources.map(s => s.content).join('\n');
        const synthesis = await synthesizerFleet.synthesize(critiqueResult, researchContent, query);
        await prisma.agentTask.update({ where: { id: task.id }, data: { status: 'completed', output: { keyFindings: synthesis.keyFindings.length } as any } });
        return synthesis;
    }

    private async runMemoryFleet(sessionId: string, memoryFleet: MemoryFleet, synthesis: SynthesisResult, query: string, breakdown: AgentBreakdown) {
        const memoryTask = await prisma.agentTask.create({
            data: { sessionId, type: 'memory', agentName: 'MemoryFleet', status: 'running', startedAt: new Date() },
        });
        memoryFleet.storeContext(`Synthesis: ${synthesis.keyFindings.length} key findings`);
        for (const finding of synthesis.keyFindings.slice(0, 3)) {
            await memoryFleet.persistToLongTerm('fact', finding);
            breakdown.memory.longTerm++;
        }
        const topic = query.split(' ').slice(0, 3).join(' ');
        await memoryFleet.updateInterest(topic);
        await memoryFleet.buildKnowledgeGraph(topic, synthesis.keyFindings);
        breakdown.memory.graphNodes = synthesis.keyFindings.length;
        await prisma.agentTask.update({ where: { id: memoryTask.id }, data: { status: 'completed', output: { shortTerm: breakdown.memory.shortTerm, longTerm: breakdown.memory.longTerm, graphNodes: breakdown.memory.graphNodes } as any } });
    }

    private async runActionFleet(sessionId: string, synthesis: SynthesisResult, query: string, breakdown: AgentBreakdown) {
        const actionTask = await prisma.agentTask.create({
            data: { sessionId, type: 'action', agentName: 'ActionFleet', status: 'running', startedAt: new Date() },
        });
        const actionFleet = new ActionFleet(sessionId, actionTask.id);
        const actions = await actionFleet.generateAll(query, synthesis);
        breakdown.actions = {
            prds: actions.filter(a => a.type === 'prd').length,
            tickets: actions.filter(a => a.type === 'ticket').length,
            code: actions.filter(a => a.type === 'code').length,
            decisions: actions.filter(a => a.type === 'decision').length,
        };
        await prisma.agentTask.update({ where: { id: actionTask.id }, data: { status: 'completed', output: { actionsGenerated: actions.length, breakdown: breakdown.actions } as any } });
    }

    async getSession(sessionId: string) {
        return prisma.session.findUnique({
            where: { id: sessionId },
            include: { tasks: true, sources: true, citations: true, outputs: true, evaluations: true },
        });
    }

    async getUserSessions() {
        return prisma.session.findMany({
            where: { userId: this.userId },
            orderBy: { updatedAt: 'desc' },
            take: 20,
        });
    }

    // ─── Specialized Fleet Methods (New Enhanced Brain Functions) ───────────────

    /**
     * Run specialized research fleet - uses domain-specific research agents
     */
    async specializedResearch(
        query: string,
        types: ('web' | 'academic' | 'code' | 'news' | 'patent' | 'video' | 'book' | 'forum')[] = []
    ) {
        const result = await this.specializedResearchFleet.runTargeted(query, types as string[]);
        return { sources: result.sources, claims: result.claims };
    }

    /**
     * Generate comprehensive research plan using planning fleet
     */
    async planResearch(query: string, context?: any) {
        const sessionId = `planning_${uuid()}`;
        const taskPlan = await this.specializedPlanningFleet.generateTaskPlan(query, context);
        return taskPlan;
    }

    /**
     * Generate code using specialized code agents
     */
    async generateCode(request: {
        prompt: string;
        type?: 'general' | 'backend' | 'frontend' | 'devops' | 'test';
        language?: string;
        framework?: string;
        context?: string;
    }) {
        return this.codeFleet.generateCode(request);
    }

    /**
     * Review code quality using specialized review agents
     */
    async reviewCode(request: { code: string; language?: string; context?: string }) {
        return this.codeReviewFleet.runAll(request.code, request.context);
    }

    /**
     * Perform comprehensive critique with truth, logic, bias, and quality checks
     */
    async comprehensiveCritique(content: string, context?: any) {
        return this.criticFleet.evaluate(content, context);
    }

    /**
     * Synthesize information from multiple sources
     */
    async synthesizeInformation(input: { content: string; context?: string; purpose?: string }) {
        return this.specializedAgentFleet.synthesize(input);
    }

    /**
     * Make informed decisions using decision agent
     */
    async makeDecision(input: { question: string; options?: string[]; context?: string }) {
        return this.specializedAgentFleet.decide(input);
    }

    /**
     * Generate creative content
     */
    async createContent(input: { prompt: string; format?: string; style?: string; constraints?: string[] }) {
        return this.specializedAgentFleet.create(input);
    }

    /**
     * Assess learning from content
     */
    async assessLearning(input: { content: string; previousKnowledge?: string[]; goal?: string }) {
        return this.specializedAgentFleet.learn(input);
    }

    /**
     * Memory operations (store, retrieve, delete)
     */
    async manageMemory(input: { action: 'store' | 'retrieve' | 'delete'; content: string; key?: string; tags?: string[]; context?: string }) {
        return this.specializedAgentFleet.memory(input);
    }

    /**
     * Get comprehensive brain state report
     */
    async getBrainReport() {
        return {
            architecture: 'Human Brain Cognitive Architecture v2.0',
            modules: [
                { name: 'CognitiveCore', role: 'Executive function, decision-making, deliberate reasoning' },
                { name: 'EmotionalEngine', role: 'Emotional state tracking, motivation' },
                { name: 'IntuitionEngine', role: 'Fast pattern recognition, System 1 thinking' },
                { name: 'WorkingMemory', role: 'Active context buffer' },
                { name: 'CuriosityEngine', role: 'Self-directed learning' },
                { name: 'SelfAwarenessModule', role: 'Error monitoring, metacognition' },
                { name: 'DreamConsolidator', role: 'Memory consolidation, insight extraction' },
                // New specialized fleets
                { name: 'SpecializedResearchFleet', role: 'Domain-specific research (web, academic, code, news, patent, video, book, forum)' },
                { name: 'PlanningAgentFleet', role: 'Strategy, timeline, resources, risk assessment' },
                { name: 'CodeFleet', role: 'Code generation (general, backend, frontend, devops, test)' },
                { name: 'CodeReviewFleet', role: 'Code review (style, performance, security, architecture)' },
                { name: 'CriticFleet', role: 'Truth, logic, bias, quality evaluation' },
                { name: 'SpecializedAgentFleet', role: 'Synthesis, decision, creative, learning agents' },
            ],
            capabilities: [
                'Multi-domain research with 8 specialized agents',
                'Comprehensive planning with strategy, timeline, resources, and risk analysis',
                'Full-stack code generation with specialized agents',
                'Multi-aspect code review (style, performance, security, architecture)',
                '4-dimensional content evaluation (truth, logic, bias, quality)',
                'Information synthesis and knowledge management',
                'Creative content generation',
                'Decision making with reasoning and risk assessment',
                'Learning assessment and knowledge tracking',
            ],
        };
    }
}
