# CiteScope AI — Intelligent Research Discovery, Citation Analysis & Research Gap Explorer

<p align="center">
  <strong>B.Tech Capstone / Final-Semester Project</strong><br>
  Cross-Platform Academic Suite (Web + Native Android Companion)
</p>

---

## 🌟 Overview & Core Value Proposition

Modern researchers waste countless hours navigating fragmented academic tools: searching on Google Scholar, organizing in Zotero, drawing citation maps on ResearchRabbit or Litmaps, extracting comparison tables on Elicit, and reading PDFs in SciSpace—all while hitting expensive $20+/month subscription paywalls.

**CiteScope AI** solves this fragmentation through a unified, open-access, zero-cost academic suite featuring:

1. **Intelligent Literature Discovery & Consensus Search:** Query over 250M+ scientific works via the OpenAlex API and Semantic Scholar Academic Graph, accompanied by an instant **Consensus Meter** synthesizing affirmative, negative, and mixed evidence.
2. **Multi-Paper Comparison Matrix (Elicit Style):** Interactive structured grid extracting Core Problem, Methodology, Datasets/Sample Sizes, Key Metrics, and Stated Limitations across selected papers with click-to-verify **Provenance Extraction Drawers**.
3. **Smart Citation Graph & Timeline Projection (Litmaps + ResearchRabbit + Scite Synergy):** Toggle between **Force-Directed Networks** and **Chronological Impact Maps** (Year vs Citation Count), featuring **sentiment-colored directed edges**:
   - 🟢 **Supporting** (citing paper corroborates findings),
   - 🔴 **Contrasting** (citing paper reports conflicting results or failure to replicate),
   - ⚪ **Mentioning** (background contextual citation).
   Hovering any edge presents the exact in-text tri-sentence citation context and classifier confidence score.
4. **Automated Research Gap & Frontier Explorer:** Synthesizes systemic literature limitation clusters, highlights active scientific controversies between conflicting papers, and surfaces concrete B.Tech/M.Tech capstone thesis proposals with high opportunity scores.
5. **Split-View Paper Copilot (SciSpace Style):** Interactive document reader allowing researchers to read open-access PDFs, select passages, and trigger one-click math formula and data table explications.
6. **Native Android Research Companion (Kotlin + Jetpack Compose):** Fills the mobile void left by SciSpace and Consensus, offering offline library synchronization via Room SQLite, touch annotations, and mobile-friendly literature review during commutes.

---

## 📁 Repository Structure

```
citescope/
├── web/                       # Modern Vite + React + TypeScript Web Application
│   ├── src/
│   │   ├── App.tsx            # Main application with all 6 research tabs
│   │   ├── index.css          # Deep Space Academic Design System & Glassmorphism tokens
│   │   └── main.tsx           # React root mounting
│   ├── index.html             # Google Fonts (Inter, Outfit, Fira Code) & SEO tags
│   └── package.json           # Dependencies (lucide-react, vite, typescript)
│
├── backend/                   # Python FastAPI Asynchronous Services
│   ├── main.py                # REST API routes & CORS configuration
│   ├── requirements.txt       # Dependencies (fastapi, uvicorn, httpx, pydantic)
│   └── services/
│       ├── openalex.py        # OpenAlex polite-pool client & inverted abstract decoder
│       └── analyzer.py        # Consensus meter, comparison matrix, graph & gap engine
│
├── android/                   # Native Android Jetpack Compose Project
│   ├── build.gradle.kts       # Root Gradle configuration
│   ├── settings.gradle.kts    # Project & repository settings
│   └── app/
│       ├── build.gradle.kts   # Compose, Material 3, Room, and Retrofit dependencies
│       └── src/main/
│           ├── AndroidManifest.xml
│           └── java/com/citescope/ai/
│               ├── CiteScopeApplication.kt  # Room database initializer
│               ├── MainActivity.kt          # Compose UI, Navigation, Discovery & Reader
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
- `GET /api/health` — Service health and uptime
- `GET /api/search?q={query}` — OpenAlex literature search + Consensus stance
- `GET /api/consensus?q={question}` — Empirical consensus percentage breakdown
- `POST /api/matrix/extract` — Multi-paper comparison matrix generator
- `GET /api/citations/graph?topic={topic}` — Sentiment-colored citation graph adjacency
- `GET /api/research-gaps?topic={topic}` — Limitation clusters, conflicts & thesis frontiers
- `POST /api/copilot/chat` — Grounded paper Q&A with formula and table explication

---

### 3. Running the Vite Web Application
```bash
cd web
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

### 4. Running the Native Android Application
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
CiteScope AI is developed as an open B.Tech final semester capstone project under the MIT License. It utilizes documented public APIs (OpenAlex polite pool, Semantic Scholar S2AG, Unpaywall) and open-source datasets (Allen Institute for AI SciCite).
