# Project File Structure

```
ai-analyst-saas/                         ← Monorepo root
├── .env.example                         ← Environment variable template
├── .gitignore
├── docker-compose.yml                   ← Full stack orchestration
├── README.md
├── PROJECT_STRUCTURE.md
│
├── frontend/                            ── Next.js 14 (App Router)
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── next.config.ts
│   └── src/
│       ├── app/                         ── File-based routing
│       │   ├── layout.tsx               ← Root layout + fonts
│       │   ├── globals.css              ← Tailwind base styles
│       │   ├── providers.tsx            ← React Query + Toast providers
│       │   ├── page.tsx                 ← Redirects to /login
│       │   ├── login/page.tsx           ← Auth (login + register)
│       │   ├── dashboard/page.tsx       ← KPIs, charts, insights
│       │   ├── upload/page.tsx          ← File upload wizard
│       │   ├── explorer/page.tsx        ← Schema viewer + data table
│       │   ├── analysis/page.tsx        ← AI analysis engine + progress
│       │   ├── charts/page.tsx          ← Interactive Recharts tabs
│       │   ├── chat/page.tsx            ← Natural language data chat
│       │   ├── sql/page.tsx             ← Generated SQL queries
│       │   ├── python/page.tsx          ← Python script download
│       │   ├── excel/page.tsx           ← Excel formula generator
│       │   ├── reports/page.tsx         ← PDF/PPTX/Excel export
│       │   └── settings/page.tsx        ← Model + preference config
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx          ← Navigation sidebar
│       │   │   └── TopBar.tsx           ← Page header + search
│       │   ├── ui/
│       │   │   ├── Button.tsx           ← Primary/secondary/ghost
│       │   │   ├── Card.tsx             ← Surface card with glow
│       │   │   └── Badge.tsx            ← Status + type badges
│       │   └── charts/                  ← (extend with chart wrappers)
│       ├── hooks/
│       │   ├── useAnalysis.ts           ← Poll analysis job status
│       │   └── useDataset.ts            ← Upload + profile dataset
│       ├── lib/
│       │   ├── api.ts                   ← Axios client + all API calls
│       │   └── utils.ts                 ← cn(), formatBytes(), etc.
│       ├── store/
│       │   └── useAppStore.ts           ← Zustand global state
│       └── types/
│           └── index.ts                 ← All TypeScript interfaces
│
├── backend/                             ── FastAPI (Python 3.11)
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py                       ← Migration environment
│   │   └── versions/001_initial.py      ← Initial schema migration
│   ├── app/
│   │   ├── main.py                      ← FastAPI app, middleware, lifespan
│   │   ├── core/
│   │   │   ├── config.py                ← Pydantic settings from .env
│   │   │   ├── database.py              ← Async SQLAlchemy engine + session
│   │   │   ├── security.py              ← JWT encode/decode + bcrypt
│   │   │   └── celery_app.py            ← Celery instance + config
│   │   ├── models/                      ← SQLAlchemy ORM models
│   │   │   ├── user.py                  ← User (id, email, plan, …)
│   │   │   ├── dataset.py               ← Dataset (file, schema, status)
│   │   │   ├── analysis.py              ← AnalysisResult (insights, kpis, …)
│   │   │   └── report.py                ← Report (format, status, url)
│   │   ├── schemas/                     ← Pydantic request/response models
│   │   │   ├── auth.py
│   │   │   ├── dataset.py
│   │   │   └── analysis.py
│   │   ├── services/                    ← Business logic layer
│   │   │   ├── dataset_service.py       ← Upload, parse, profile
│   │   │   ├── analysis_service.py      ← Orchestrate Celery analysis jobs
│   │   │   ├── ai_service.py            ← Anthropic Claude API calls
│   │   │   └── report_service.py        ← PDF/PPTX/Excel generation
│   │   ├── api/v1/
│   │   │   ├── router.py                ← Aggregates all routers
│   │   │   ├── deps.py                  ← get_current_user dependency
│   │   │   └── endpoints/
│   │   │       ├── auth.py              ← POST /auth/login, /register, /me
│   │   │       ├── datasets.py          ← CRUD + upload + profile + preview
│   │   │       ├── analysis.py          ← POST /run, GET /status, /results
│   │   │       ├── chat.py              ← POST /message
│   │   │       └── reports.py           ← POST /generate, GET /download
│   │   └── utils/
│   │       ├── file_validator.py        ← MIME + size + extension checks
│   │       └── response.py              ← Standardised ok()/err() helpers
│   └── tests/
│       ├── conftest.py                  ← In-memory SQLite fixtures
│       ├── unit/
│       │   ├── test_analysis.py         ← Trend, anomaly, KPI unit tests
│       │   └── test_dataset.py          ← Upload, schema extraction tests
│       └── integration/                 ← (extend with API integration tests)
│
├── ai_services/                         ── Standalone AI/ML modules
│   ├── analysis/
│   │   ├── trend_analyzer.py            ← LinearRegression trend + R²
│   │   └── anomaly_detector.py          ← Z-score + IQR detectors
│   ├── generators/
│   │   ├── sql_generator.py             ← Schema → SQL queries
│   │   └── python_generator.py          ← Schema → Python analysis script
│   ├── models/                          ← (add fine-tuned model configs)
│   └── prompts/
│       └── system_prompts.py            ← All LLM system prompts
│
└── infra/
    ├── docker/
    │   ├── Dockerfile.backend           ← Python 3.11 slim image
    │   └── Dockerfile.frontend          ← Node 20 multi-stage build
    ├── nginx/
    │   └── nginx.conf                   ← Reverse proxy + upload size limit
    ├── scripts/
    │   └── init.sql                     ← DB init (extensions, seed)
    └── .github/workflows/
        └── ci.yml                       ← Test → build → deploy pipeline
```

## How It All Connects

```
Browser → Nginx → Next.js (SSR/CSR)
                       ↓ REST /api/v1/*
               FastAPI Backend
                ↓           ↓
           PostgreSQL    Redis → Celery Worker
                                   ↓
                           AI Analysis Pipeline
                           (Pandas + Claude API)
                                   ↓
                           Results → DB → Frontend
```
