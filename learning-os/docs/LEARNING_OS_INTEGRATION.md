# Personal Learning Intelligence OS - Integration Architecture

## Overview

This document outlines the integration of all 10 learning features into a unified Personal Learning Intelligence OS, building on the existing ARROS codebase.

---

## Current State: ARROS

### Existing Components (Ready to Use)

```
ARROS Codebase
├── Agents (20 files)
│   ├── studyOS.ts          ✅ Flashcards, Quizzes, SRS, Mock Exams
│   ├── debate.ts           ✅ Thesis-Antithesis-Synthesis
│   ├── citationManager.ts  ✅ APA/MLA/IEEE citations
│   ├── factChecker.ts      ✅ Claim verification
│   ├── memory.ts           ✅ Knowledge graph + vector embeddings
│   └── ...
├── Services
│   ├── sarvam.ts           ✅ 10 Indian languages STT/TTS/OCR
│   ├── semanticScholar.ts  ✅ Academic paper search
│   ├── llm.ts              ✅ OpenAI + Anthropic
│   └── ...
├── Pages (14)
│   ├── StudyOSPage.tsx     ✅ Study tools UI
│   ├── VoiceStudioPage.tsx ✅ Voice tools
│   └── ...
└── Database
    └── Prisma Schema       ✅ Users, Sessions, Memory, KnowledgeGraph
```

---

## Target State: Personal Learning Intelligence OS

### Module Mapping

| Your Idea | ARROS Component | Action |
|-----------|-----------------|--------|
| **1. AI Concept Coach** | studyOS.ts + memory.ts | ENHANCE with stepwise tutor, mastery tracking |
| **2. Rubric Evaluator** | None | BUILD NEW |
| **3. Study Planner + SRS** | studyOS.ts (partial) | ENHANCE with syllabus parser, calendar |
| **4. Multilingual Voice** | sarvam.ts | ✅ DONE |
| **5. Lab Simulator/Debug** | None | BUILD NEW |
| **6. Academic Integrity** | citationManager.ts + factChecker.ts | ENHANCE with AI-detection |
| **7. Career Navigator** | None | BUILD NEW |
| **8. Confidence Booster** | None | BUILD NEW |
| **9. Debate Coach** | debate.ts | ✅ DONE |
| **10. Unified Learning OS** | All components | INTEGRATE |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PERSONAL LEARNING INTELLIGENCE OS                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         UNIFIED DASHBOARD (New)                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Learning    │ │ Mastery     │ │ Daily       │ │ Career      │           │
│  │ Pulse       │ │ Map         │ │ Schedule    │ │ Score       │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│  LEARN MODULE     │     │  PLAN MODULE      │     │  EVALUATE MODULE  │
│  (Enhanced)       │     │  (New)            │     │  (New)            │
├───────────────────┤     ├───────────────────┤     ├───────────────────┤
│ • Concept Coach   │     │ • Study Planner   │     │ • Rubric Evaluator│
│ • Hint System     │     │ • Syllabus Parser │     │ • Essay Scoring   │
│ • Mastery Track   │     │ • Calendar Sync   │     │ • Code Evaluator  │
│ • Stepwise Explain│     │ • Spaced Repetition│    │ • Integrity Check │
│ • Debate Coach    │     │ • Burnout Detection│    │ • Citation Gen    │
│ • Voice Learning  │     │ • Score Prediction │    │ • AI-Detection    │
└───────────────────┘     └───────────────────┘     └───────────────────┘
        │                             │                             │
        └─────────────────────────────┼─────────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTELLIGENCE LAYER (New)                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Confidence  │ │ Weak Topic  │ │ Career      │ │ Lab Debug   │           │
│  │ Tracker     │ │ Detector    │ │ Navigator   │ │ Coach       │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXISTING ARROS FOUNDATION                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ studyOS.ts  │ │ memory.ts   │ │ sarvam.ts   │ │ debate.ts   │           │
│  │ debate.ts   │ │ citationMgr │ │ factChecker │ │ llm.ts      │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## New Modules to Build

### 1. Concept Coach Engine (`server/src/agents/conceptCoach.ts`)

**Extends:** `studyOS.ts`

**New Features:**
- Stepwise explanation with progressive disclosure
- 4-level hint system (question → concept → partial → full)
- Mastery tracking per topic (0.0 - 1.0)
- Confidence meter based on response patterns
- "Why this step?" explainability

**Database Additions:**
```prisma
model TopicMastery {
  id              String   @id @default(uuid())
  userId          String
  topic           String
  masteryLevel    Float    // 0.0 to 1.0
  confidenceScore Float
  hintsUsed       Int
  attempts        Int
  lastPracticedAt DateTime
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  
  @@unique([userId, topic])
}

model LearningSession {
  id              String   @id @default(uuid())
  userId          String
  topicId         String
  startedAt       DateTime @default(now())
  endedAt         DateTime?
  hintsRequested  Int      @default(0)
  correctAnswers  Int      @default(0)
  wrongAnswers    Int      @default(0)
  confidenceReadings Json  // [{time, score}]
  stressSignals   Json     // hesitation markers
  
  user User @relation(fields: [userId], references: [id])
}
```

**API Endpoints:**
```
POST /api/learn/explain      - Get stepwise explanation
POST /api/learn/hint         - Request hint (level 1-4)
GET  /api/learn/mastery      - Get mastery scores
POST /api/learn/assess       - Submit answer for assessment
GET  /api/learn/weak-topics  - Get weak areas
```

---

### 2. Study Planner Module (`server/src/agents/studyPlanner.ts`)

**Extends:** `studyOS.ts` (SRS functions)

**New Features:**
- Syllabus parser (PDF/text to structured plan)
- Auto-generated study schedule
- Calendar integration
- Burnout risk detection
- Exam score prediction
- Distraction blocking suggestions

**Database Additions:**
```prisma
model StudyPlan {
  id          String   @id @default(uuid())
  userId      String
  title       String
  syllabus    Json     // Parsed syllabus structure
  startDate   DateTime
  endDate     DateTime
  dailyHours  Float
  planData    Json     // Generated schedule
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
}

model StudyTask {
  id          String   @id @default(uuid())
  planId      String
  topic       String
  scheduledAt DateTime
  duration    Int      // minutes
  completed   Boolean  @default(false)
  difficulty  Float
  priority    Int
  
  plan StudyPlan @relation(fields: [planId], references: [id])
}

model BurnoutIndicator {
  id              String   @id @default(uuid())
  userId          String
  date            DateTime @default(now())
  studyHours      Float
  breakHours      Float
  focusScore      Float
  stressSignals   Json
  riskLevel       String   // low, medium, high
  
  user User @relation(fields: [userId], references: [id])
}
```

---

### 3. Assignment Evaluator (`server/src/agents/evaluator.ts`)

**New Module**

**Features:**
- Rubric-based scoring
- Essay evaluation
- Code evaluation (unit tests, logic)
- PPT/Lab report evaluation
- "Improve to A+" mode
- Version comparison

**Database Additions:**
```prisma
model Rubric {
  id          String   @id @default(uuid())
  name        String
  type        String   // essay, code, ppt, lab_report
  criteria    Json     // [{name, weight, description}]
  createdBy   String?
  createdAt   DateTime @default(now())
}

model Assignment {
  id          String   @id @default(uuid())
  userId      String
  rubricId    String?
  type        String   // essay, code, ppt, lab_report
  title       String
  content     String   @db.Text
  fileUrl     String?
  evaluation  Json?    // Score breakdown, feedback
  score       Float?
  submittedAt DateTime @default(now())
  version     Int      @default(1)
  
  user   User    @relation(fields: [userId], references: [id])
  rubric Rubric? @relation(fields: [rubricId], references: [id])
}
```

**API Endpoints:**
```
POST /api/evaluate/essay     - Evaluate essay
POST /api/evaluate/code      - Evaluate code
POST /api/evaluate/ppt       - Evaluate presentation
POST /api/evaluate/improve   - Get A+ suggestions
POST /api/evaluate/compare   - Compare versions
GET  /api/rubrics            - List rubrics
POST /api/rubrics            - Create rubric
```

---

### 4. Academic Integrity Layer (`server/src/agents/integrity.ts`)

**Extends:** `citationManager.ts` + `factChecker.ts`

**New Features:**
- AI-content detection
- Originality scoring
- Reference suggestions
- Citation style teaching

**Database Additions:**
```prisma
model IntegrityCheck {
  id              String   @id @default(uuid())
  assignmentId    String
  originalityScore Float
  aiProbability   Float
  flaggedPhrases  Json
  suggestions     Json
  checkedAt       DateTime @default(now())
  
  assignment Assignment @relation(fields: [assignmentId], references: [id])
}
```

---

### 5. Career Navigator (`server/src/agents/careerNavigator.ts`)

**New Module**

**Features:**
- Skill gap analysis
- Job-ready score
- Resume feedback
- Mock interview
- Learning roadmap

**Database Additions:**
```prisma
model SkillProfile {
  id          String   @id @default(uuid())
  userId      String
  skills      Json     // [{skill, level, evidence}]
  targetRole  String?
  gapAnalysis Json?
  jobReadyScore Float?
  updatedAt   DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
}

model MockInterview {
  id          String   @id @default(uuid())
  userId      String
  role        String
  questions   Json
  answers     Json
  feedback    Json
  score       Float
  createdAt   DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
}
```

---

### 6. Confidence Booster (`server/src/agents/confidenceBooster.ts`)

**New Module**

**Features:**
- Response hesitation tracking
- Mistake pattern detection
- Encouragement tone adaptation
- Micro-success feedback
- Stress-aware suggestions

**Database Additions:**
```prisma
model ConfidenceProfile {
  id              String   @id @default(uuid())
  userId          String
  baseline        Float    @default(0.5)
  currentLevel    Float
  hesitationCount Int      @default(0)
  encouragementStyle String // gentle, motivating, challenging
  lastUpdated     DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
}

model ConfidenceEvent {
  id          String   @id @default(uuid())
  profileId   String
  type        String   // hesitation, mistake, success, stress
  context     Json
  response    String   // AI's adaptive response
  createdAt   DateTime @default(now())
  
  profile ConfidenceProfile @relation(fields: [profileId], references: [id])
}
```

---

### 7. Lab Debug Coach (`server/src/agents/debugCoach.ts`)

**New Module**

**Features:**
- Stepwise debug explanation
- Logic error detection
- "Why your logic fails" analysis
- Unit-test based learning
- Code evolution tracking

---

## Frontend Integration

### New Page: LearningOSDashboard.tsx

```tsx
// Unified dashboard with:
// - Learning Pulse (daily progress)
// - Mastery Map (topic visualization)
// - Daily Schedule (from planner)
// - Career Score (if enabled)
// - Confidence Trend
// - Quick Actions (Start Learning, Evaluate Assignment, etc.)
```

### Enhanced Pages

| Page | Enhancements |
|------|-------------|
| StudyOSPage | Add Concept Coach mode, Mastery visualization |
| VoiceStudioPage | Add multilingual learning mode |
| New: PlannerPage | Study planner UI with calendar |
| New: EvaluatorPage | Assignment submission and feedback |
| New: CareerPage | Skill map and job readiness |

---

## Implementation Roadmap

### Phase 1: Core Learning (Week 1-2)
- [ ] Create `conceptCoach.ts` agent
- [ ] Add TopicMastery, LearningSession models
- [ ] Implement 4-level hint system
- [ ] Add mastery tracking UI

### Phase 2: Study Planning (Week 3-4)
- [ ] Create `studyPlanner.ts` agent
- [ ] Add StudyPlan, StudyTask models
- [ ] Implement syllabus parser
- [ ] Add calendar integration

### Phase 3: Assignment Evaluation (Week 5-6)
- [ ] Create `evaluator.ts` agent
- [ ] Add Rubric, Assignment models
- [ ] Implement essay/code evaluation
- [ ] Add rubric management UI

### Phase 4: Intelligence Layer (Week 7-8)
- [ ] Create `confidenceBooster.ts` agent
- [ ] Create `integrity.ts` enhancements
- [ ] Add confidence tracking
- [ ] Implement AI-detection

### Phase 5: Career & Debug (Week 9-10)
- [ ] Create `careerNavigator.ts` agent
- [ ] Create `debugCoach.ts` agent
- [ ] Add skill gap analysis
- [ ] Implement mock interviews

### Phase 6: Integration (Week 11-12)
- [ ] Create unified LearningOSDashboard
- [ ] Connect all modules
- [ ] Add cross-module analytics
- [ ] Polish and test

---

## API Summary

### New Endpoints

```
# Concept Coach
POST /api/learn/explain
POST /api/learn/hint
GET  /api/learn/mastery
POST /api/learn/assess
GET  /api/learn/weak-topics

# Study Planner
POST /api/plan/generate
GET  /api/plan/today
POST /api/plan/task/complete
GET  /api/plan/burnout-risk
POST /api/plan/predict-score

# Assignment Evaluator
POST /api/evaluate/essay
POST /api/evaluate/code
POST /api/evaluate/improve
GET  /api/rubrics
POST /api/rubrics

# Career Navigator
GET  /api/career/profile
POST /api/career/analyze
POST /api/career/interview
GET  /api/career/roadmap

# Confidence Tracker
GET  /api/confidence/profile
POST /api/confidence/event

# Integrity Check
POST /api/integrity/check
GET  /api/integrity/suggestions
```

---

## Technology Stack (No Changes)

- Frontend: React 19 + TypeScript + TailwindCSS + Zustand
- Backend: Node.js + Express + Prisma
- Database: PostgreSQL + pgvector
- AI: OpenAI/Anthropic + Sarvam AI
- Services: Tavily, Serper, Firecrawl, Semantic Scholar
