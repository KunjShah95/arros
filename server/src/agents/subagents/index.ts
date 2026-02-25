// Export the main specialized fleets with unique names to avoid conflicts

// Specialized Research Fleet - export as ResearchFleetV2
export { ResearchAgentFleet as ResearchFleetV2, BaseResearchAgent, SearchResult } from './specializedResearchFleet';
export { WebResearchAgent, AcademicResearchAgent, CodeResearchAgent, NewsResearchAgent, PatentResearchAgent, VideoResearchAgent, BookResearchAgent, ForumResearchAgent } from './specializedResearchFleet';

// Specialized Planning Fleet
export { PlanningAgentFleet, BasePlanningAgent } from './specializedPlanningFleet';
export { StrategyAgent, TimelineAgent, ResourceAgent, RiskAgent, ResearchPlanningAgent } from './specializedPlanningFleet';

// Specialized Code Fleet - export as CodeFleetV2
export { CodeFleet as CodeFleetV2, BaseCodeAgent } from './specializedCodeFleet';
export { CodeGenerationAgent, BackendAgent, FrontendAgent, DevOpsAgent, TestAgent, CodeGenerationResult, CodeReviewResult } from './specializedCodeFleet';

// Specialized Code Review Fleet - export as CodeReviewFleetV2
export { CodeReviewFleet as CodeReviewFleetV2, BaseReviewAgent } from './specializedCodeReviewFleet';
export { CodeReviewAgent, StyleReviewAgent, PerformanceReviewAgent, SecurityReviewAgent, ArchitectureReviewAgent, ReviewIssue } from './specializedCodeReviewFleet';

// Specialized Critic Fleet - export as CriticFleetV2
export { FinalCriticAgent, CriticFleet as CriticFleetV2, BaseCriticAgent } from './specializedCriticFleet';
export { TruthCriticAgent, LogicCriticAgent, BiasCriticAgent, QualityCriticAgent, ComplianceCriticAgent } from './specializedCriticFleet';

// Specialized Additional Agents
export { SpecializedAgentFleet, BaseSpecializedAgent } from './specializedAdditionalAgents';
export { SynthesisAgent, DecisionAgent, CreativeAgent, LearningAgent, ResearchSynthesisAgent, MemoryAgent as SpecializedMemoryAgent } from './specializedAdditionalAgents';

// Core fleets (keep for backwards compatibility)
export * from './researchFleet';
export * from './criticFleet';
export * from './memoryFleet';
export * from './actionFleet';
export * from './synthesizerFleet';
