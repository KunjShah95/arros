# ARROS Architecture

## System Overview

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
