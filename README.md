# CiteScope AI — Intelligent Research Discovery, Citation Analysis & Research Gap Explorer

<p align="center">
  <strong>B.Tech Capstone / Final-Semester Project</strong><br>
  Evidence-First Academic Research Suite (Web Platform + Native Android Companion + Model Context Protocol Server)
</p>

---

## 🌟 Overview & Core Value Proposition

Modern researchers waste countless hours navigating fragmented academic tools: searching on Google Scholar, organizing in Zotero, drawing citation maps on ResearchRabbit or Litmaps, extracting comparison tables on Elicit, and reading PDFs in SciSpace—all while hitting expensive $20+/month subscription paywalls.

**CiteScope AI** solves this fragmentation through a unified, open-access, zero-cost academic suite featuring:

1. **Light Academic Interface:** A publication-grade, white-first scholarly interface utilizing clean typography, dark graphite text (`#0f172a`), soft-grey surfaces (`#f8fafc`), hairline borders (`#e2e8f0`), restrained academic blue accents (`#2563eb`), and meaningful semantic status badges.
2. **Multi-Source Scholarly Search Federation (150M+ Papers Worldwide):** Queries Crossref REST API (150M+ peer-reviewed publisher DOIs: IEEE, Springer Nature, Elsevier, ACM, Wiley, Oxford), arXiv canonical repository (2.4M open-access STEM papers with full abstracts & PDFs), and OpenAlex. Resilient zero-downtime architecture ensures continuous search from past to recent (1950–2026).
3. **Provider-Based Full-Text Resolver (100% Legitimate Access):** Integrates documented, authorized academic APIs—**Unpaywall REST API v2**, **arXiv canonical preprints**, **Europe PMC / PubMed Central**, and **OpenAlex**. Accurately distinguishes verified Open Access copies (with license attribution) from publisher paywalled landing pages. *Zero scraping of Google Scholar or Sci-Hub; zero fake PDF URLs or paywall bypassing.*
4. **Evidence-Grounded Consensus Meter & 3-Stat Synthesis:** Real-time empirical stance evaluation (% Affirmative, % Mixed/Conditional, % Disputing) computed strictly across retrieved, traceable scientific studies—with responsive 3-stat highlight cards and expandable evidence provenance tables.
5. **Multi-Paper Comparison Matrix:** Structured dynamic matrix extracting Core Problem, Methodology, Datasets, Key Metrics, and Stated Limitations across selected papers with dynamic custom columns and CSV export.
6. **Smart Citation Network & Lineage Graph:** Directed citation relationships categorized by sentiment intent:
   - 🟢 **Supporting** (corroborates findings),
   - 🔴 **Contrasting** (reports conflicting results or failure to replicate),
   - ⚪ **Mentioning** (background contextual citation).
7. **Automated Research Gap & Frontier Radar:** Discovers limitation clusters, active scientific disputes, and concrete high-opportunity thesis frontiers.
8. **Split-View Paper Reader & Grounded Copilot:** Clean academic reader with mathematical formulation explications and an AI research copilot with strict citation context grounding.
9. **Multi-Provider AI Engine (Zero-Key Local NLP by Default):** Seamless support for:
   - **Local Deterministic NLP** (Built-in, 100% Free, zero external API keys needed, works offline),
   - **Google Gemini** (`gemini-2.5-flash`, `gemini-1.5-pro`),
   - **OpenAI** (`gpt-4o-mini`, `gpt-4o`),
   - **Anthropic Claude** (`claude-3-7-sonnet`, `claude-3-5-sonnet`).
   *Keys are stored only in client session memory; never logged, exposed, or committed to Git.*
10. **Native Android Companion App & Direct APK Download:** Aligned with the light academic design system, supporting offline SQLite caching via Room and on-the-go literature discovery. Direct downloadable signed APK (`/citescope.apk`) hosted right on the web platform.
11. **Standalone Model Context Protocol (MCP) Server:** Exposes CiteScope's research tools to Claude Desktop, Cursor, and external AI agents over standard JSON-RPC 2.0 stdio.

---

## 📖 Presentation & Project Defense Guide
For your project viva, defense committee, or seminar slide deck, refer to the complete:
👉 [PRESENTATION_GUIDE.md](./PRESENTATION_GUIDE.md) — includes slide-by-slide script, system architecture diagram, tech stack breakdown per feature, and top 10 viva voce questions with model answers.

---

## 📁 Repository Structure

```
citescope/
├── web/                       # Vite + React + TypeScript Web Application
│   ├── src/
│   │   ├── App.tsx            # Light academic interface with all 6 research tabs
│   │   ├── index.css          # Core light academic design tokens & components
│   │   └── main.tsx           # React root mounting
│   ├── index.html             # Fonts (Inter, Roboto) & SEO metadata
│   └── package.json           # Dependencies (lucide-react, vite, typescript)
│
├── backend/                   # Python FastAPI Asynchronous Services
│   ├── main.py                # REST API routes, AI routing, & resolver endpoints
│   ├── requirements.txt       # Dependencies (fastapi, uvicorn, httpx, pydantic)
│   └── services/
│       ├── openalex.py        # OpenAlex polite-pool client & inverted abstract decoder
│       ├── analyzer.py        # Consensus meter, comparison matrix, graph & gap engine
│       ├── resolver.py        # Unpaywall v2, arXiv, Europe PMC, & DOI resolver
│       └── ai_providers.py    # Multi-provider adapter (Gemini, OpenAI, Claude, Local NLP)
│
├── mcp_server/                # Standalone Model Context Protocol (MCP) Server
│   ├── server.py              # JSON-RPC 2.0 stdio server exposing 8 academic tools
│   ├── test_mcp.py            # Protocol test suite (initialize, tools/list, tools/call)
│   └── README.md              # Claude Desktop & Cursor configuration guide
│
├── android/                   # Native Android Jetpack Compose Companion App
│   ├── build.gradle.kts       # Root Gradle configuration
│   ├── settings.gradle.kts    # Project & repository settings
│   └── app/
│       ├── build.gradle.kts   # Compose, Material 3, Room, and Retrofit dependencies
│       └── src/main/
│           ├── AndroidManifest.xml
│           └── java/com/citescope/ai/
│               ├── CiteScopeApplication.kt  # Room database initializer
│               ├── MainActivity.kt          # Light Material 3 UI, Discovery & Reader
│               ├── data/model/Paper.kt      # Room Entity & API DTOs
│               ├── data/local/PaperDao.kt   # Offline SQLite caching DAO
│               └── data/remote/CiteScopeApiService.kt # Retrofit REST service
│
└── README.md                  # Project overview and run guide
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v25)
- **Python**: 3.10+ (tested on Python 3.14)
- **Android Studio** (for building the Android APK)

---

### 2. Running the FastAPI Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The interactive API documentation is available at `http://localhost:8000/docs`.

#### Key Backend Endpoints:
- `GET /api/health` — Service health, active providers, and uptime
- `GET /api/search?q={query}` — OpenAlex literature search + consensus + OA status
- `GET /api/resolve?doi={doi}&paper_id={id}` — Verified OA full-text resolver
- `GET /api/consensus?q={question}` — Empirical consensus percentage breakdown
- `POST /api/matrix/extract` — Multi-paper comparison matrix generator
- `GET /api/citations/graph?topic={topic}` — Sentiment-colored citation graph adjacency
- `GET /api/research-gaps?topic={topic}` — Limitation clusters, conflicts & thesis frontiers
- `POST /api/copilot/chat` — Grounded Q&A with optional `X-AI-Provider` and `X-AI-Key` headers
- `GET /api/ai/providers` — List supported AI reasoning engines
- `POST /api/ai/test` — Live provider API key validator

---

### 3. Running the Web Application
```bash
cd web
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

To verify a production build:
```bash
npm run build
```

---

### 4. Running the Model Context Protocol (MCP) Server
CiteScope includes a native MCP server for integration with Claude Desktop, Cursor, or external LLM agents:

```bash
backend/venv/bin/python mcp_server/server.py
```

To run the verification test suite:
```bash
backend/venv/bin/python mcp_server/test_mcp.py
```

#### Claude Desktop Configuration (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "citescope": {
      "command": "/Users/riyansh/citescope/backend/venv/bin/python",
      "args": [
        "/Users/riyansh/citescope/mcp_server/server.py"
      ],
      "env": {
        "CITESCOPE_API_BASE": "http://localhost:8000"
      }
    }
  }
}
```

Exposed MCP Tools:
- `citescope_search_papers`: Scholarly literature discovery
- `citescope_get_paper`: Metadata and abstract retrieval
- `citescope_resolve_fulltext`: Verified OA full-text resolution
- `citescope_consensus`: Empirical evidence consensus calculation
- `citescope_extract_matrix`: Multi-paper comparison matrix
- `citescope_citation_graph`: Citation sentiment network
- `citescope_research_gaps`: Limitation clusters and open frontiers
- `citescope_user_library`: Scoped search of authenticated user's library

---

### 5. Running the Native Android Application
Open the `/Users/riyansh/citescope/android` folder in **Android Studio**:
1. Sync Gradle files.
2. Select an Android Emulator (API 26+) or connected physical device.
3. Click **Run 'app'** (`Shift + F10`) to build and deploy.

---

## 🔬 Evidence-Based REA Competitor Analysis

A full reverse engineering and architectural analysis (REA) was conducted on the leading academic AI platforms:
- **SciSpace:** Inspected PDF split-pane copilot and bounding-box canvas OCR explication.
- **Elicit:** Inspected systematic review workflows, TanStack table grid, and provenance verification drawers.
- **Scite.ai:** Inspected Smart Citations NLP pipeline (GROBID parser + DeLFT/SciCite intent classifier for Supporting, Contrasting, and Mentioning).
- **ResearchRabbit:** Inspected infinite sliding Miller columns and D3 force-directed co-citation networks.
- **Litmaps:** Inspected bivariate coordinate projection (Timeline Year vs Citation Count).
- **Zotero:** Inspected open reference management, CSL style engine, and official Kotlin + Jetpack Compose Android app (`zotero/zotero-android`).
- **Consensus:** Inspected Consensus Meter and mobile-first PWA card patterns.

Full details are documented in the master artifact:  
`citescope_product_teardown_and_architecture.md`.

---

## 📜 Academic Integrity & License
CiteScope AI is developed as an open B.Tech final semester capstone project under the MIT License. It utilizes documented public APIs (OpenAlex polite pool, Semantic Scholar S2AG, Unpaywall API v2, Europe PMC, arXiv) and does not bypass paywalls or scrape unauthorized sources.
