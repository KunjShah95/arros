# ARROS — Academic Research OS

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-brightgreen" alt="Version">
  <img src="https://img.shields.io/badge/Built-In-India-orange" alt="Made in India">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/Stack-React%20%2B%20Node.js-lightgrey" alt="Stack">
</p>

<p align="center">
  <b>विद्यया अमृतमश्नुते</b><br>
  <i>Knowledge is Immortal</i>
</p>

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Project Structure](#project-structure)
6. [API Documentation](#api-documentation)
7. [Agent Society](#agent-society)
8. [Indian Language Support](#indian-language-support)
9. [Deployment](#deployment)
10. [Environment Variables](#environment-variables)
11. [Contributing](#contributing)
12. [License](#license)

---

## Overview

**ARROS (Academic Research OS)** is an AI-powered research assistant built specifically for students. It transforms any academic topic into a verified, citation-backed structured research report with memory and continuity.

Unlike traditional chatbots, ARROS operates as a research assistant OS with a society of specialized agents that plan, search, verify, and synthesize academic content.

### Key Highlights

- 🚀 **5-Agent Pipeline**: Planner → Web Research → Scholar → Critic → Synthesizer
- 📚 **Real Citations**: Semantic Scholar, arXiv, IEEE integration
- 🧠 **Memory System**: Sessions persist, continues previous research
- 🗣️ **Voice AI**: Speech-to-Text and Text-to-Speech in 10+ Indian languages
- 📄 **Document Scanner**: OCR for PDFs and images
- 🇮🇳 **Made in India**: Designed for Indian students with Indic language support

---

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Research Pipeline** | 5 specialized agents work in sequence to produce academic reports |
| **Semantic Scholar Integration** | Real peer-reviewed papers with DOI, authors, citations |
| **Session Memory** | Research sessions persist; say "continue my research" to resume |
| **Confidence Scoring** | Every report shows confidence %, verified sources, contradictions |
| **Multi-format Output** | Academic report with Intro, Concepts, Findings, Citations, References |

### AI Features (Powered by Sarvam AI)

| Feature | Description |
|---------|-------------|
| **Speech-to-Text (STT)** | Voice input in Hindi, English, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Marathi, Punjabi |
| **Text-to-Speech (TTS)** | Listen to research output in 10+ Indian languages with natural voices |
| **Vision Document (OCR)** | Upload PDFs/images - extracts text and creates citations automatically |

### Output Format

ARROS generates structured academic reports with:

1. **Introduction** — Context and overview
2. **Concepts & Definitions** — Key terms explained
3. **Key Research Findings** — Cited discoveries
4. **Applications** — Real-world use cases
5. **Current Challenges** — Limitations and problems
6. **Future Directions** — Research opportunities
7. **Conclusion** — Summary
8. **Key Takeaways** — Exam-ready bullet points
9. **Further Reading** — Additional resources
10. **References** — Full citations with URLs

---

## Tech Stack

### Frontend

- **React 18** — UI framework
- **TypeScript** — Type safety
- **Tailwind CSS** — Styling
- **Framer Motion** — Animations
- **Vite** — Build tool
- **React Router** — Navigation

### Backend

- **Node.js** — Runtime
- **Express** — Web framework
- **TypeScript** — Type safety
- **Prisma** — ORM
- **PostgreSQL** — Database
- **pgvector** — Vector embeddings for memory

### AI & Services

- **Sarvam AI** — TTS, STT, OCR for Indian languages
- **LLM Integration** — OpenAI, Anthropic (configurable)
- **Semantic Scholar API** — Academic papers
- **Tavily** — Web search
- **Firecrawl** — Web scraping

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/arros.git
cd arros
```

2. **Install dependencies**

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. **Set up environment variables**

```bash
# Server .env
cp server/.env.example server/.env
# Edit server/.env with your API keys

# Client .env (if needed)
cp client/.env.example client/.env
```

4. **Set up database**

```bash
cd server
npx prisma generate
npx prisma db push
```

5. **Start development servers**

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

6. **Open browser**

Navigate to `http://localhost:5173`

---

## Project Structure

```
arros/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ResearchWorkspace.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── AgentTimeline.tsx
│   │   │   ├── STTComponent.tsx
│   │   │   ├── TTSComponent.tsx
│   │   │   ├── OCRComponent.tsx
│   │   │   └── ui.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── LandingPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── VoiceStudioPage.tsx
│   │   │   ├── DocumentScannerPage.tsx
│   │   │   └── ...
│   │   ├── services/        # API services
│   │   ├── store/           # State management
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── server/                   # Node.js backend
│   ├── src/
│   │   ├── agents/          # AI agents
│   │   │   ├── orchestrator.ts
│   │   │   ├── planner.ts
│   │   │   ├── research.ts
│   │   │   ├── critic.ts
│   │   │   ├── synthesizer.ts
│   │   │   └── memory.ts
│   │   ├── services/        # External services
│   │   │   ├── sarvam.ts   # Sarvam AI integration
│   │   │   ├── semanticScholar.ts
│   │   │   ├── tavily.ts
│   │   │   └── ...
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   ├── prisma/          # Database schema
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

---

## API Documentation

### Research Endpoints

#### Create Research Session

```http
POST /api/research
Content-Type: application/json

{
  "query": "Explain Federated Learning in Healthcare"
}
```

**Response:**
```json
{
  "sessionId": "session_abc123",
  "query": "Explain Federated Learning in Healthcare",
  "plan": {
    "strategy": "comprehensive",
    "subtasks": [...]
  },
  "synthesis": {
    "confidence": 0.87,
    "verifiedSources": 6,
    "contradictionsFound": 1,
    "introduction": "...",
    "keyFindings": [...],
    "citations": [...]
  },
  "totalTime": 125000,
  "totalCost": 0.023
}
```

#### Get Session

```http
GET /api/session/:sessionId
```

#### Get User Sessions

```http
GET /api/sessions
```

#### Get Sources

```http
GET /api/sources/:sessionId
```

### Voice AI Endpoints (Sarvam AI)

#### Text-to-Speech

```http
POST /api/sarvam/tts
Content-Type: application/json

{
  "text": "Hello, this is a test",
  "language": "en-IN",
  "voice": "anushka"
}
```

#### Speech-to-Text

```http
POST /api/sarvam/stt
Content-Type: multipart/form-data

- file: audio_file
- language: en-IN
```

#### Document OCR

```http
POST /api/sarvam/ocr
Content-Type: multipart/form-data

- file: document.pdf
- language: en
```

#### Get Available Voices

```http
GET /api/sarvam/voices
```

#### Get Supported Languages

```http
GET /api/sarvam/languages
```

---

## Agent Society

ARROS uses a **5-Agent Society** that works in sequence:

### 1. Planner Agent (विभज्यते)
Breaks your query into academic subtasks:
- Definitions
- Key papers
- Applications
- Challenges
- Future scope

### 2. Web Research Agent (अन्वेषणं)
Fetches foundational knowledge from:
- Wikipedia
- Educational blogs
- Authoritative web sources

### 3. Scholar Agent (ग्रन्थान्वेषी)
Searches academic databases:
- Semantic Scholar
- arXiv
- IEEE Xplore

### 4. Critic/Verifier Agent (परिक्षकः)
Checks:
- Source reliability
- Conflicting claims
- Confidence scores

### 5. Synthesizer Agent (सङ्ग्राहकः)
Produces final output:
- Introduction
- Concepts
- Key findings
- Applications
- Challenges
- Conclusion
- Key takeaways
- References

---

## Indian Language Support

ARROS supports **10+ Indian languages** through Sarvam AI:

| Language | Code | TTS Voices |
|----------|------|------------|
| English | en-IN | Arvind, Anushka |
| Hindi | hi-IN | Hitesh, Aditi |
| Tamil | ta-IN | Uma, Kumar |
| Telugu | te-IN | - |
| Kannada | kn-IN | - |
| Malayalam | ml-IN | - |
| Bengali | bn-IN | - |
| Gujarati | gu-IN | - |
| Marathi | mr-IN | - |
| Punjabi | pa-IN | - |

### Sanskrit Terms Used

| Sanskrit | English |
|----------|---------|
| विद्यया अमृतमश्नुते | Knowledge is immortal |
| विभज्यते | Divide/Break down |
| अन्वेषणं | Exploration |
| ग्रन्थान्वेषी | Book researcher |
| परिक्षकः | Examiner |
| सङ्ग्राहकः | Compiler/Collector |
| श्रवणं | Listening |
| उच्चारणं | Pronunciation |
| दर्शनं | Vision/Sight |
| स्मृतिः | Memory |

---

## Deployment

### Docker (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment

#### Server

```bash
cd server
npm run build
pm2 start dist/index.js
```

#### Client

```bash
cd client
npm run build
# Serve dist folder with nginx or any static host
```

---

## Environment Variables

### Server (.env)

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/arros

# Cache
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Sarvam AI (Indian Language AI)
SARVAM_API_KEY=your_sarvam_api_key

# Research Services
SEMANTIC_SCHOLAR_API_KEY=your_semantic_scholar_key
TAVILY_API_KEY=your_tavily_key
FIRECRAWL_API_KEY=your_firecrawl_key

# Auth (optional)
JWT_SECRET=your_jwt_secret
```

### Client (.env)

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

---

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **Sarvam AI** — For providing India's sovereign AI platform with Indic language support
- **Semantic Scholar** — For academic paper search API
- **OpenAI/Anthropic** — For LLM capabilities
- **Indian student community** — For inspiration and feedback

---

## Support

- 📧 Email: support@arros.ai
- 💬 Discord: [Join our community](https://discord.gg/arros)
- 🐛 Issues: [Report bugs](https://github.com/yourusername/arros/issues)

---

<p align="center">
  Made with ❤️ in India<br>
  <sub>ARROS — Academic Research OS</sub>
</p>
