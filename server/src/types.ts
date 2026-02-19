export interface ResearchQuery {
  id: string;
  userId: string;
  query: string;
  sessionId?: string;
}

export interface TaskPlan {
  subtasks: SubTask[];
  strategy: string;
  estimatedCost: number;
  estimatedTime: number;
}

export interface SubTask {
  id: string;
  type: AgentType;
  description: string;
  dependencies: string[];
  toolStrategy: ToolStrategy;
}

export type AgentType = 'planner' | 'research' | 'critic' | 'synthesizer' | 'memory' | 'action' | 'meta';

export interface ToolStrategy {
  primary: string[];
  fallback: string[];
  maxSources: number;
}

export interface ResearchResult {
  taskId: string;
  sources: SourceResult[];
  claims: Claim[];
  rawContent: string;
}

export interface SourceResult {
  id: string;
  type: 'web' | 'paper' | 'github' | 'blog' | 'document';
  title: string;
  url: string;
  content: string;
  reliability: number;
  bias: number;
  metadata: Record<string, unknown>;
}

export interface Claim {
  id: string;
  statement: string;
  evidence: string[];
  confidence: number;
  contradictedBy?: string[];
}

export interface CritiqueResult {
  taskId: string;
  acceptedClaims: Claim[];
  rejectedClaims: Claim[];
  contradictions: Contradiction[];
  biasIndicators: BiasIndicator[];
  overallConfidence: number;
}

export interface Contradiction {
  claimA: string;
  claimB: string;
  severity: 'low' | 'medium' | 'high';
}

export interface BiasIndicator {
  claim: string;
  biasType: string;
  severity: number;
}

export interface AcademicCitation {
  index: number;
  title: string;
  authors?: string;
  year?: number;
  venue?: string;
  url?: string;
  citationText: string;
}

export interface SynthesisResult {
  taskId: string;
  summary: string;
  deepDive: string;
  keyFindings: string[];
  actionableOutputs?: ActionItem[];
  confidence: number;
  // Academic-specific fields
  introduction?: string;
  conceptsAndDefinitions?: string;
  applications?: string;
  challenges?: string;
  futureDirections?: string;
  conclusion?: string;
  keyTakeaways?: string[];
  furtherReading?: string[];
  citations?: AcademicCitation[];
  verifiedSources?: number;
  contradictionsFound?: number;
}

export interface ActionItem {
  type: 'prd' | 'architecture' | 'ticket' | 'code' | 'decision';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface MemoryItem {
  id: string;
  type: 'preference' | 'interest' | 'strategy' | 'fact';
  content: string;
  importance: number;
  embedding?: number[];
}

export interface EvaluationResult {
  type: 'hallucination' | 'completeness' | 'agreement' | 'bias';
  score: number;
  details: Record<string, unknown>;
  passed: boolean;
  recommendations?: string[];
}

export interface AgentOutput {
  type: AgentType;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
  cost: number;
  tokens: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface SessionContext {
  sessionId: string;
  userId: string;
  query: string;
  tasks: unknown[];
  sources: SourceResult[];
  outputs: AgentOutput[];
  memories: MemoryItem[];
  knowledgeGraph: KnowledgeGraphItem[];
}

export interface KnowledgeGraphItem {
  id: string;
  type: 'entity' | 'concept' | 'fact' | 'claim';
  name: string;
  description?: string;
  relations: { target: string; relation: string; strength: number }[];
}
