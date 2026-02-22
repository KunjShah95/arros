// Learning OS - New Agents Index
// Export all new AI agents for the Personal Learning Intelligence OS

export * from './conceptCoach';
export * from './assignmentEvaluator';
export * from './integrity';
export * from './studyPlanner';
export * from './codeDebugCoach';
export * from './confidenceBooster';
export * from './fallacyDetector';
export * from './quizGenerator';
export * from './learningStyleDetector';
export * from './predictiveAnalytics';
export * from './calendarIntegration';
export * from './webSearch';
export * from './portfolioGenerator';
export * from './certificateGenerator';
export * from './lmsConnector';

// Re-export with alias to avoid conflicts
export { CareerSkillNavigatorAgent } from './careerNavigator';
export { SkillIntelligenceEngine } from './skillIntelligence';
export type { Skill, SkillGap } from './skillIntelligence';
