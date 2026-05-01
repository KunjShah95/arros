# ARROS — Human Brain Architecture

---

## 🧠 Human Cognitive Architecture (v2.0)

ARROS now operates with a **full human-like cognitive architecture** — designed after neuroscience research on how the human brain thinks, feels, decides, and learns. Every research query is processed through the same mechanisms a human mind uses.

---

## Cognitive Modules Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Human Brain Cognitive Architecture                        │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌──────────────────┐
                         │   User Query     │
                         └────────┬─────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │ IntuitionEngine │ │  WorkingMemory  │ │  CuriosityEngine│
    │ (Basal Ganglia) │ │ (Dorsolat. PFC) │ │ (Nucleus Acc.)  │
    │  System 1 Fast  │ │  Context Buffer │ │  Interest Drive │
    └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
             │                   │                   │
             └───────────────────┼───────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │      CognitiveCore      │
                    │   (Prefrontal Cortex)   │
                    │ • Executive function    │
                    │ • Deliberate reasoning  │
                    │ • System 2 thinking     │
                    │ • Decision integration  │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
   ┌──────────────────┐ ┌───────────────┐ ┌────────────────────┐
   │  EmotionalEngine │ │SelfAwareness  │ │  DreamConsolidator │
   │  (Limbic System) │ │  (ACC + Meta) │ │  (Hippocampus/REM) │
   │ • Emotional state│ │ • Bias detect │ │ • Memory compress  │
   │ • Somatic markers│ │ • Self-correct│ │ • Insight extract  │
   │ • Motivation     │ │ • Self-reflect│ │ • Pattern abstract │
   └──────────────────┘ └───────────────┘ └────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Research Pipeline      │
                    │ (Agent Fleet Execution) │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
         ┌──────────────────┐      ┌──────────────────┐
         │  Synthesis Agent │      │   Memory Update  │
         │  (Knowledge out) │      │  (Learning loop) │
         └──────────────────┘      └──────────────────┘
```

---

## Module Descriptions

### 🧠 CognitiveCore — Prefrontal Cortex Analog

**File:** `server/src/agents/cognitiveCore.ts`

The central executive. Coordinates all cognitive subsystems and implements:

- **Dual Process Theory**: Chooses between fast System 1 and slow System 2 thinking
- **Attentional spotlight**: Focuses on one primary concern at a time
- **Cognitive load tracking**: Monitors mental effort and fatigue
- **Somatic marker integration**: Combines emotional gut-feelings with rational analysis
- **Reasoning chain construction**: Transparent, auditable thought process

Processing Modes:

| Mode | Trigger | Description |
|------|---------|-------------|
| `fast_intuitive` | High intuition confidence | Trust pattern recognition, minimal deliberation |
| `slow_deliberate` | Complex or uncertain queries | Full rational analysis, check assumptions |
| `creative` | Novel, high-curiosity queries | Exploratory thinking, wider hypothesis space |
| `critical` | Anxiety/fear state + uncertainty | Extra-careful, maximum verification |

---

### ❤️ EmotionalEngine — Limbic System Analog

**File:** `server/src/agents/emotionalEngine.ts`

Emotions are not decorative — they serve critical cognitive functions. Implements:

- **Plutchik's Wheel**: 8 primary emotions + secondary blends
- **Russell's Circumplex**: Arousal (calm↔excited) × Valence (negative↔positive) space
- **Damasio's Somatic Markers**: Past emotional outcomes bias future similar decisions
- **Emotional inertia**: Emotions transition gradually (35% blend rate per update)
- **Homeostatic regulation**: System naturally drifts toward resting calm state

Emotional states visible to UI:

```
🔍 Curious and engaged        (anticipation, medium arousal)
⚡ Enthusiastic and energized  (joy, high arousal)
⚠️ Proceeding carefully        (fear, low-medium arousal)
😰 Cautious and alert          (fear, high arousal)
✅ Confident and satisfied      (joy, low arousal)
✨ Filled with wonder           (surprise, high positive)
😤 Frustrated with obstacles    (anger, medium arousal)
🤔 Uncertain and questioning    (sadness/fear blend)
```

---

### ⚡ IntuitionEngine — System 1 / Basal Ganglia Analog

**File:** `server/src/agents/intuitionEngine.ts`

Fast, automatic, unconscious pattern recognition. Fires FIRST — before deliberate reasoning:

- **Recognition-Primed Decisions (Klein)**: Matches query to recognized patterns
- **Domain expertise library**: Pre-calibrated patterns for academia, engineering, analysis, news
- **Online learning**: Reinforcement from outcomes — successful patterns strengthen
- **Confidence calibration**: Track & adjust for over/underconfidence per domain

Recognized domains and confidence levels update after every session.

---

### 💭 WorkingMemory — Dorsolateral PFC Analog

**File:** `server/src/agents/workingMemory.ts`

Active context buffer. Implements **Baddeley's Multi-Component Model**:

- **Capacity**: 9 slots maximum (Miller's Law: 7 ± 2)
- **Decay**: Ebbinghaus forgetting curve — items fade over time
- **Rehearsal**: Accessed items are reinforced (importance boost)
- **Chunking**: Related items grouped into single units (more efficient storage)
- **Attentional focus**: One item highlighted as primary (consciousness spotlight)
- **Eviction**: Least-important non-focused item dropped when at capacity
- **Consolidation**: On session end, high-importance & high-access items transferred to long-term

---

### 🔍 CuriosityEngine — Dopaminergic Reward / Nucleus Accumbens Analog

**File:** `server/src/agents/curiosityEngine.ts`

Self-directed learning drive. Implements **Loewenstein's Information Gap Theory**:

- **Novelty detection**: How unfamiliar is this topic? (inverse of exploration depth)
- **Complexity estimation**: More complex = more interesting (Berlyne arousal theory)
- **Optimal stimulation**: Curiosity peaks at medium knowledge level (inverted-U)
- **Spontaneous question generation**: Generates "what does this make me wonder?" questions
- **Exploration path suggestion**: Recommends next topics based on knowledge gaps
- **Open question accumulation**: Maintains list of unresolved intellectual tensions

---

### 🪞 SelfAwarenessModule — Anterior Cingulate Cortex Analog

**File:** `server/src/agents/selfAwareness.ts`

Error monitoring and metacognition. Implements **Flavell's Metacognition Theory**:

Detects these cognitive biases in real-time:

| Bias | Detection Method | Correction |
|------|-----------------|------------|
| Confirmation bias | High confidence + no alternatives | Seek disconfirming evidence |
| Availability heuristic | Fast retrieval + high confidence on complex queries | Check base rates |
| Dunning-Kruger | High confidence + many uncertainties | Reduce confidence, seek validation |
| Anchoring bias | First thought dominates all subthoughts | Reset from multiple angles |
| Recency bias | Over-reliance on recent information | Weight historical data equally |
| Framing effect | Anxiety framing negatively | Neutral perspective reframe |

Also tracks:

- **Calibration error**: Are we systematically over or underconfident?
- **Session fatigue**: Does error rate increase as session length grows?
- **Self-reflection**: Generates human-readable introspective statements

---

### 💤 DreamConsolidator — Hippocampus / Sleep Analog

**File:** `server/src/agents/dreamConsolidator.ts`

Offline memory consolidation. Implements **Systems Consolidation Theory**:

**Micro-consolidation** (after every session):

- Store key findings in vector database with importance scoring
- Update user interest graph

**Full consolidation** (called via `/api/brain/sleep`):

1. **Memory review**: Retrieve recent experiences from the past week
2. **Clustering**: Group memories by theme (like REM grouping related experiences)
3. **Pruning**: Delete weak, rarely-accessed memories (synaptic homeostasis)
4. **Insight extraction**: Distill higher-level patterns from clusters (hippocampus → cortex)
5. **Novel connections**: Find unexpected cross-topic links (REM creative recombination)
6. **Knowledge graph update**: Persist consolidated understanding as graph nodes/edges
7. **Exploration suggestions**: "What to dream about next" — topics worth deeper study

---

## New API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/research` | POST | Research using the Human Brain (default) |
| `/api/brain/state` | GET | Current cognitive state snapshot |
| `/api/brain/sleep` | POST | Run memory consolidation cycle |
| `/api/brain/curiosities` | GET | Topics the brain is most curious about |
| `/api/brain/config` | GET | Brain module architecture metadata |

**Research request body:**

```json
{
  "query": "What is quantum entanglement?",
  "useBrain": true
}
```

**Response now includes `brainState`:**

```json
{
  "brainState": {
    "currentEmotion": "🔍 Curious and engaged",
    "processingMode": "slow_deliberate",
    "cognitiveLoad": 0.62,
    "arousalLevel": 0.45,
    "curiosityScore": 0.81,
    "workingMemoryLoad": 0.44,
    "selfReflection": "Thinking clearly with no obvious biases detected",
    "openQuestions": ["What are the practical applications?", "..."],
    "sessionInsights": ["Successfully researched quantum physics with 87% confidence"]
  }
}
```

---

## Original ARROS System Overview

ARROS (Autonomous Research & Reasoning Operating System) is a Perplexity-inspired research platform upgraded with multi-agent coordination, persistent memory, and knowledge graph capabilities. The system behaves like a research team with analyst capabilities that plans research strategy, verifies facts, stores memory, and evolves over time.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ARROS Architecture                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────┐
│  Frontend Layer   │
│  (React + Vite)   │
├────────────────────┤
│ Research Workspace│
│ Agent Timeline    │
│ Knowledge Graph   │
│ Source Explorer   │
│ Confidence UI     │
└────────┬─────────┘
         │
         ▼
┌────────────────────┐
│  Backend Layer     │
│  (Node.js/Express)│
├────────────────────┤
│ Session Manager   │
│ Agent Orchestrator│
│ Tool Executor     │
│ WebSocket Server  │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                           Multi-Agent Society                               │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────────┤
│   Planner    │   Research  │    Critic    │  Synthesizer │    Memory       │
│    Agent     │    Agents    │    Agent     │    Agent     │    Agent        │
│              │  (Parallel) │              │              │                 │
├──────────────┴──────────────┴──────────────┴──────────────┴─────────────────┤
│                              Tool Executor Layer                            │
├────────────────┬────────────────┬────────────────┬────────────────────────┤
│  Web Search    │ Paper Search   │  Web Fetch     │ Knowledge Graph        │
│  (Serper,      │ (Semantic      │  (Firecrawl)   │ (Vector DB)           │
│   Tavily)      │  Scholar)      │                │                        │
└────────────────┴────────────────┴────────────────┴────────────────────────┘
         │
         ▼
┌────────────────────┐
│   Data Layer      │
│  (PostgreSQL +    │
│   Prisma ORM)     │
└────────────────────┘
```

---

## Core Philosophy

ARROS differs from Perplexity and similar tools in several fundamental ways:

| Feature | Perplexity | ARROS |
|---------|------------|-------|
| Agent Architecture | Single-agent | Multi-agent society |
| Memory | None | Persistent with knowledge graph |
| Research Flow | Linear | Parallel with verification loops |
| Output Quality | Good | Self-evaluated with retry |
| Personalization | None | Learns user preferences |
| Enterprise Control | Limited | Full human-in-the-loop |

---

## Agent System Architecture

### Agent Society Overview

ARROS implements a society of specialized agents that coordinate to produce high-quality research outputs. Each agent has a specific role and communicates through the orchestrator.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Multi-Agent Coordination Flow                          │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  Query   │
    └────┬─────┘
         │
         ▼
    ┌──────────┐      ┌──────────────────────────────────────────┐
    │ Planner  │─────▶│         Task Decomposition               │
    │  Agent   │      │  - Strategy selection                     │
    └────┬─────┘      │  - Subtask generation                     │
         │            │  - Tool strategy planning                  │
         │            │  - Cost/time estimation                    │
         │            └──────────────────────────────────────────┘
         │                         │
         ▼                         ▼
    ┌──────────────────────────────────────────────────────────────────────┐
│   │                     Parallel Research Agents                        ││
│   ├─────────────────┬─────────────────┬─────────────────┬──────────────┤│
│   │  Web Agent      │ Paper Agent     │  Code Agent     │ Blog Agent   ││
│   │  (Serper,       │ (Semantic       │  (GitHub)       │ (Opinion)    ││
│   │   Tavily)       │  Scholar)       │                 │              ││
│   └─────────────────┴─────────────────┴─────────────────┴──────────────┘│
    └──────────────────────────────────────────────────────────────────────┘
         │
         ▼
    ┌──────────┐
    │  Critic  │◀─────────────┐
    │  Agent   │              │
    └────┬─────┘              │
         │                    │
         ▼                    │
    ┌──────────┐         ┌────┴─────┐
    │ Meta     │         │  Retry  │
    │Evaluator │         │  Loop   │
    └────┬─────┘         └─────────┘
         │
         ▼
    ┌──────────────────────────────────────────────────────────────────────┐
│   │                    Synthesis & Output Generation                   ││
│   ├─────────────────┬─────────────────┬─────────────────┬──────────────┤│
│   │ Synthesizer     │  Memory Agent   │ Action Generator│              ││
│   │ Agent           │  (Knowledge     │ Agent           │              ││
│   │                 │   Graph)        │                 │              ││
│   └─────────────────┴─────────────────┴─────────────────┴──────────────┘
    └──────────────────────────────────────────────────────────────────────┘
```

---

## Agent Specifications

### 1. Planner Agent

**Purpose:** Decomposes user queries into structured research plans with task dependencies, tool strategies, and cost estimates.

**Responsibilities:**

- Analyze query intent and determine research strategy
- Break down complex queries into executable subtasks
- Assign appropriate tools to each subtask
- Estimate time and cost for research
- Handle academic queries with literature review focus

**Input:** Raw user query

**Output:** TaskPlan with subtasks, strategy, estimatedCost, estimatedTime

**Tool Strategy Types:**

| Strategy | Use Case | Tools |
|----------|----------|-------|
| literature_review | Academic surveys | paper_search, arxiv_search, web_search |
| explanatory | Concept explanations | web_search, blog_search, web_fetch |
| comparative | Comparison analysis | web_search, paper_search, critic |
| comprehensive | In-depth research | All tools |

**Implementation Location:** `server/src/agents/planner.ts`

---

### 2. Research Agents (Parallel Execution)

The system runs multiple research agents simultaneously, each specialized for different source types.

#### 2a. Web Agent

**Purpose:** Search general web sources for foundational information and context.

**Tools:** Serper API, Tavily API

**Capabilities:**

- General web search with result ranking
- Wikipedia and encyclopedia queries
- News and current events
- Blog and article discovery

#### 2b. Paper Agent

**Purpose:** Search academic papers and peer-reviewed sources.

**Tools:** Semantic Scholar API, arXiv API

**Capabilities:**

- Academic paper discovery with citation counts
- Preprint search from arXiv
- Author and venue-based search
- Citation graph traversal

#### 2c. Code Agent

**Purpose:** Search GitHub and technical code repositories.

**Tools:** GitHub API (via Firecrawl)

**Capabilities:**

- Repository discovery
- Code example search
- Implementation reference

#### 2d. Blog/Opinion Agent

**Purpose:** Find expert opinions and educational content.

**Tools:** Custom blog search

**Capabilities:**

- Educational blog discovery
- Expert opinion collection
- Tutorial and guide search

**Implementation Location:** `server/src/agents/research.ts`

---

### 3. Critic Agent (Verification Layer)

**Purpose:** Verify claims, detect hallucinations, identify contradictions, and assess source reliability.

**Responsibilities:**

- Evaluate each claim against sources
- Detect contradictions between sources
- Score source reliability (0-1)
- Identify potential bias indicators
- Calculate overall confidence score

**Output:** CritiqueResult with acceptedClaims, rejectedClaims, contradictions, biasIndicators, overallConfidence

**Verification Criteria:**

| Criterion | Description |
|-----------|-------------|
| Source Reliability | Is the source credible? |
| Claim Support | Do sources support the claim? |
| Contradiction | Do sources conflict? |
| Bias Detection | Is there potential bias? |
| Temporal Validity | Is the information current? |

**Implementation Location:** `server/src/agents/critic.ts`

---

### 4. Synthesizer Agent

**Purpose:** Combine verified research into structured, citation-backed outputs.

**Responsibilities:**

- Merge multiple source perspectives
- Generate structured academic output
- Create proper citations
- Ensure balanced coverage

**Output Structure:**

```typescript
interface SynthesisResult {
  summary: string;              // Brief overview
  deepDive: string;            // Detailed analysis
  keyFindings: string[];       // Main discoveries
  introduction: string;        // Academic intro
  conceptsAndDefinitions: string;
  applications: string;
  challenges: string;
  futureDirections: string;
  conclusion: string;
  keyTakeaways: string[];
  furtherReading: string[];
  citations: AcademicCitation[];
  confidence: number;
}
```

**Implementation Location:** `server/src/agents/synthesizer.ts`

---

### 5. Memory Agent

**Purpose:** Manage persistent memory and build knowledge graphs for continuity across sessions.

**Responsibilities:**

- Store important findings in vector database
- Build knowledge graph with entities and relationships
- Track user interests and preferences
- Decide what to remember, forget, or compress

**Memory Types:**

| Type | Description | Storage |
|------|-------------|---------|
| Short-Term | Active session context | In-memory |
| Long-Term | User preferences, past topics | PostgreSQL + Vector DB |
| Knowledge Graph | Entities, relationships | KnowledgeNode/Edge |

**Knowledge Graph Relations:**

- relates_to: General connection
- supports: Evidence backing
- contradicts: Conflicting information
- part_of: Component relationship
- causes: Causal connection

**Implementation Location:** `server/src/agents/memory.ts`

---

### 6. Action Generator Agent

**Purpose:** Transform research into actionable outputs.

**Output Types:**

| Type | Description |
|------|-------------|
| prd | Product requirements document |
| architecture | System architecture plan |
| ticket | Task/ticket generation |
| code | Code scaffold generation |
| decision | Decision matrix |

**Implementation Location:** `server/src/agents/action.ts`

---

### 7. Meta Evaluator Agent

**Purpose:** Evaluate overall research quality and trigger retry loops when needed.

**Evaluation Criteria:**

| Metric | Threshold | Action |
|--------|-----------|--------|
| Hallucination Score | > 0.8 | Pass |
| Completeness | > 0.7 | Pass |
| Source Agreement | > 0.6 | Pass |
| Confidence | > 0.75 | Pass |

**Retry Logic:**

- If evaluation fails, system automatically refines query
- Maximum 3 retry attempts
- Each retry adds contextual focus based on recommendations
- Tracks retry history for debugging

**Implementation Location:** `server/src/agents/meta.ts`

---

## Orchestration Engine

### Agent Flow

```
User Query
    │
    ▼
┌─────────────────┐
│ Create Session  │
│ (PostgreSQL)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Planner Agent  │─────▶ Generate Task Plan
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Parallel Tasks  │─────▶ Research Agents (Promise.all)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Critic Agent   │─────▶ Verify Claims
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Meta Evaluator  │─────▶ Quality Check
└────────┬────────┘
         │          ┌─────────┐
         ├─────────▶│  Retry  │ (if failed)
         │          │  Loop   │
         │          └────┬────┘
         │               │
         └───────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │ Synthesizer     │─────▶ Generate Output
         └────────┬────────┘
                  │
         ┌────────┴────────┐
         ▼                 ▼
┌─────────────────┐ ┌─────────────────┐
│  Memory Agent   │ │ Action Agent    │
│ (Knowledge      │ │ (Action items)  │
│  Graph)         │ └─────────────────┘
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Return Results  │
│ to Frontend     │
└─────────────────┘
```

### Self-Evaluation Loop

The orchestrator implements a self-evaluation loop:

1. **Initial Research:** Agents produce initial output
2. **Critique:** Critic agent evaluates claims
3. **Meta Evaluation:** Evaluator scores quality
4. **Decision:**
   - If passed → Continue to synthesis
   - If failed → Refine query and retry (max 3 times)

**Retry Context:**

```typescript
const refinedQuery = `${query} (Focus on: ${evaluation.recommendations?.join(', ') || 'accuracy and depth'})`;
return this.research(refinedQuery, attempt + 1);
```

---

## Tool Execution Layer

### Available Tools

| Tool | Provider | Purpose |
|------|----------|---------|
| web_search | Serper, Tavily | General web search |
| paper_search | Semantic Scholar | Academic papers |
| arxiv_search | arXiv | Preprints |
| web_fetch | Firecrawl | Full content extraction |
| knowledge_graph | Internal | Entity storage |

### Tool Executor Pattern

```typescript
// Tool executor handles tool selection and execution
class ToolExecutor {
  async execute(tool: string, params: ToolParams): Promise<ToolResult> {
    const strategy = this.selectStrategy(tool, params);
    
    try {
      return await strategy.execute();
    } catch (error) {
      // Fallback to secondary tool if available
      return await this.fallback.execute();
    }
  }
}
```

---

## Data Models

### Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────▶│  Session    │────▶│  AgentTask  │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                          │                    │
         ┌────────────────┼────────────────────┼────────────┐
         ▼                ▼                    ▼            ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐  ┌─────────────┐
│   Source    │   │  Citation   │   │ AgentOutput │  │ Evaluation  │
└─────────────┘   └─────────────┘   └─────────────┘  └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ UserMemory  │────▶│UserInterest │     │KnowledgeNode│
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                      ┌────────┴────────┐
                                      │ KnowledgeEdge    │
                                      └─────────────────┘
```

### Key Models

#### Session

- Tracks complete research sessions
- Contains all tasks, sources, citations
- Status: active, completed, failed

#### AgentTask

- Individual agent execution record
- Type: planner, research, critic, synthesizer, memory, action, meta
- Status: pending, running, completed, failed
- Tracks cost and tokens

#### Source

- Research source with reliability and bias scores
- Types: web, paper, github, blog, document
- Stores raw content for citation

#### KnowledgeNode / KnowledgeEdge

- Persistent knowledge graph
- Nodes: entities, concepts, facts, claims
- Edges: relates_to, supports, contradicts, part_of, causes

---

## API Endpoints

### Core Research API

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/research | POST | Start new research session |
| /api/session/:id | GET | Get session details |
| /api/sessions | GET | List user sessions |
| /api/sources/:sessionId | GET | Get sources for session |
| /api/memory | GET | Get user memory |
| /api/interests | GET | Get user interests |
| /api/knowledge-graph | GET | Get knowledge graph |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| research_start | Server→Client | Research started |
| agent_progress | Server→Client | Agent task progress |
| source_found | Server→Client | New source discovered |
| research_complete | Server→Client | Research finished |

---

## Frontend Architecture

### Page Structure

```
client/src/
├── pages/
│   ├── LandingPage.tsx         # Landing page
│   ├── SignInPage.tsx          # Authentication
│   ├── SignUpPage.tsx
│   ├── DashboardPage.tsx      # User dashboard
│   ├── HistoryPage.tsx         # Past sessions
│   ├── KnowledgeGraphPage.tsx  # Knowledge visualization
│   ├── SourcesPage.tsx         # Source explorer
│   ├── AnalyticsPage.tsx       # Usage analytics
│   ├── SettingsPage.tsx        # User settings
│   ├── VoiceStudioPage.tsx     # Voice input
│   └── DocumentScannerPage.tsx # Document upload
├── components/
│   ├── ResearchWorkspace.tsx  # Main research UI
│   ├── AgentTimeline.tsx      # Agent progress
│   ├── KnowledgeGraph.tsx     # Graph visualization
│   ├── Sidebar.tsx            # Navigation
│   └── ui.tsx                 # Shared UI components
├── store/
│   └── researchStore.ts       # Zustand state
└── services/
    ├── api.ts                 # REST API client
    └── websocket.ts           # WebSocket client
```

### Research Workspace

The main research interface includes:

- Query input with voice support
- Real-time agent progress timeline
- Source cards with reliability scores
- Confidence indicators (✅⚠️❌)
- Citation viewer
- Export options

---

## Technology Stack

### Frontend

| Layer | Technology |
|-------|------------|
| Framework | React 19 |
| Build Tool | Vite |
| Language | TypeScript |
| Styling | TailwindCSS |
| State | Zustand |
| Data Fetching | React Query |
| Charts | D3.js / Recharts |

### Backend

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| AI | OpenAI API, Anthropic |
| Search | Serper, Tavily, Semantic Scholar |

### External Services

| Service | Purpose |
|---------|---------|
| OpenAI | LLM for agent reasoning |
| Anthropic | Claude for certain tasks |
| Serper | Google search results |
| Tavily | AI-optimized search |
| Semantic Scholar | Academic papers |
| Firecrawl | Web content extraction |

---

## Memory System

### Short-Term Memory

- Active session context
- Subtask results
- Intermediate reasoning
- Cleared on session end

### Long-Term Memory

- User interests and preferences
- Past research topics
- Learned strategies
- Preferred citation styles

### Knowledge Graph

**Node Types:**

- entity: People, organizations, locations
- concept: Abstract ideas and theories
- fact: Verified factual information
- claim: Research claims with evidence

**Edge Types:**

- relates_to: General connection
- supports: Evidence backing
- contradicts: Conflicting information
- part_of: Component relationship
- causes: Causal relationship

### Vector Storage

The system uses pgvector for similarity search:

```prisma
model UserMemory {
  embedding Unsupported("vector(1536)")
  // Enables semantic search over memories
}
```

---

## Confidence & Truth Engine

### Claim Confidence Scoring

Each claim includes:

| Field | Description |
|-------|-------------|
| evidence | Source URLs supporting claim |
| confidence | 0-1 confidence score |
| contradictedBy | List of conflicting claim IDs |

### UI Confidence Indicators

- ✅ Confident facts (confidence > 0.8)
- ⚠️ Uncertain areas (confidence 0.5-0.8)
- ❌ Disagreements (contradictions detected)

### Source Reliability

Sources are scored on:

- Domain authority
- Publication recency
- Citation count (for papers)
- Peer review status

---

## Cost & Latency Optimization

### Token Tracking

Each agent tracks:

- Input tokens
- Output tokens
- Total cost per task
- Cumulative session cost

### Model Escalation

Strategy for cost optimization:

1. **Planner:** Use cheap model (gpt-4o-mini)
2. **Research:** Use medium model (gpt-4o)
3. **Critic:** Use reasoning model (o1-mini)
4. **Synthesizer:** Use cheap model (gpt-4o-mini)

### Caching Strategy

- Cache search results for identical queries
- Cache LLM responses for similar contexts
- TTL-based expiration

---

## Security & Safety

### Rate Limiting

- Per-user request limits
- Per-agent cost limits
- Session timeout handling

### Input Validation

- Query sanitization
- Output filtering
- Citation validation

### Enterprise Controls

- Human-in-the-loop pause points
- Assumption modification mid-run
- Output approval workflow
- Audit logging

---

## File Structure

```
arros/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/            # UI Components
│   │   │   ├── ResearchWorkspace.tsx
│   │   │   ├── AgentTimeline.tsx
│   │   │   ├── KnowledgeGraph.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ui.tsx
│   │   ├── pages/                 # Page Components
│   │   │   ├── LandingPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── KnowledgeGraphPage.tsx
│   │   │   ├── SourcesPage.tsx
│   │   │   └── ...
│   │   ├── services/              # API Services
│   │   │   ├── api.ts
│   │   │   └── websocket.ts
│   │   ├── store/                # Zustand Store
│   │   │   └── researchStore.ts
│   │   └── types/                # TypeScript Types
│   └── package.json
│
├── server/                         # Node.js Backend
│   ├── src/
│   │   ├── agents/               # AI Agents
│   │   │   ├── orchestrator.ts   # Main orchestration
│   │   │   ├── planner.ts         # Task planning
│   │   │   ├── research.ts        # Research execution
│   │   │   ├── critic.ts          # Claim verification
│   │   │   ├── synthesizer.ts     # Output generation
│   │   │   ├── memory.ts          # Memory management
│   │   │   ├── action.ts          # Action generation
│   │   │   └── meta.ts            # Quality evaluation
│   │   ├── tools/                # Tool Executor
│   │   │   └── executor.ts
│   │   ├── services/            # External Services
│   │   │   ├── llm.ts             # LLM wrapper
│   │   │   ├── serper.ts          # Web search
│   │   │   ├── tavily.ts          # AI search
│   │   │   ├── semanticScholar.ts # Academic papers
│   │   │   ├── firecrawl.ts       # Web scraping
│   │   │   └── websocket.ts       # Real-time updates
│   │   ├── routes/               # API Routes
│   │   │   └── api.ts
│   │   ├── middleware/           # Express Middleware
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimiter.ts
│   │   ├── services/             # Database Services
│   │   │   └── prisma.ts
│   │   ├── types.ts              # Shared Types
│   │   └── index.ts              # Entry Point
│   ├── prisma/
│   │   └── schema.prisma         # Database Schema
│   └── package.json
│
├── ARCHITECTURE.md                 # This file
└── README.md                      # Project Overview
```

---

## Future Enhancements

### Phase 2 Features

- **World Model Simulation:** "What if" analysis for decision support
- **Synthetic Testing:** Hallucination robustness evaluation
- **Advanced Analytics:** Agent performance metrics
- **Custom Agents:** User-defined agent configurations

### Phase 3 Features

- **Multi-modal Input:** Image and document analysis
- **Voice Synthesis:** Text-to-speech for results
- **API Marketplace:** Third-party tool integrations
- **Collaboration:** Multi-user research sessions

---

## Conclusion

ARROS represents a significant advancement over traditional research tools by implementing a multi-agent society that plans, verifies, remembers, and evolves. The architecture enables:

- **Parallel research** with specialized agents
- **Self-verification** through critic and meta-evaluator agents
- **Persistent memory** via knowledge graphs
- **Quality assurance** through automatic retry loops
- **Enterprise control** with human-in-the-loop capabilities

The modular agent design allows for easy extension and customization while maintaining robust orchestration and evaluation mechanisms.
