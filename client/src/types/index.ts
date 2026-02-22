export interface Session {
  id: string;
  userId: string;
  title?: string;
  query?: string;
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface AgentTask {
  id: string;
  sessionId: string;
  type: 'planner' | 'research' | 'critic' | 'synthesizer' | 'memory' | 'action' | 'meta' | 'debate';
  agentName?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  cost?: number;
  tokens?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Source {
  id: string;
  sessionId: string;
  type: 'web' | 'paper' | 'github' | 'blog' | 'document';
  title: string;
  url: string;
  content?: string;
  reliability?: number;
  bias?: number;
  createdAt: string;
}

export interface Claim {
  id: string;
  statement: string;
  evidence: string[];
  confidence: number;
  contradictedBy?: string[];
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
  lineage?: Array<{ finding: string; sourceIndices: number[] }>;
}

export interface Integration {
  id: string;
  name: 'notion' | 'github' | 'zotero' | 'slack';
  connected: boolean;
  config?: Record<string, unknown>;
}

export interface ActionItem {
  id?: string;
  type: 'prd' | 'architecture' | 'ticket' | 'code' | 'decision' | 'connector';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status?: 'pending' | 'completed' | 'failed';
  integrationId?: string;
}

export interface Evaluation {
  id: string;
  sessionId: string;
  type: 'hallucination' | 'completeness' | 'agreement' | 'bias' | 'meta';
  score: number;
  passed: boolean;
  createdAt: string;
}

export interface ResearchResponse {
  sessionId: string;
  query: string;
  plan: {
    subtasks: Array<{
      id: string;
      type: string;
      description: string;
      dependencies: string[];
    }>;
    strategy: string;
    estimatedCost: number;
    estimatedTime: number;
  };
  synthesis: SynthesisResult;
  evaluations: Array<{ type: string; score: number; passed: boolean }>;
  totalCost: number;
  totalTime: number;
}

export interface UserMemory {
  id: string;
  type: 'preference' | 'interest' | 'strategy' | 'fact';
  content: string;
  importance: number;
  createdAt: string;
}

export interface UserInterest {
  id: string;
  topic: string;
  depth: number;
  lastResearchedAt?: string;
}

export interface KnowledgeNode {
  id: string;
  type: 'entity' | 'concept' | 'fact' | 'claim';
  name: string;
  description?: string;
  properties?: Record<string, unknown>;
}

export interface KnowledgeEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relation: string;
  strength: number;
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface WebSocketMessage {
  type: 'task_started' | 'task_progress' | 'task_completed' | 'task_failed' | 'source_found' | 'error';
  payload: unknown;
  timestamp: string;
}

// Sarvam AI Types
export interface SarvamOCRResult {
  text: string;
  confidence: number;
  language?: string;
  metadata: Record<string, unknown>;
}

export interface SarvamTTSRequest {
  text: string;
  language?: string;
  voice?: string;
  speed?: number;
  pitch?: number;
}

export interface SarvamTTSResult {
  audioUrl: string;
  audioBase64?: string;
  duration: number;
  format: string;
}

export interface SarvamSTTResult {
  text: string;
  confidence: number;
  language?: string;
  duration: number;
}

export interface SarvamLanguages {
  [key: string]: string;
}
