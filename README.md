# 🤖 AI Business Data Analyst — SaaS Platform

A production-ready Full Stack AI SaaS platform that acts as an **AI Data Analyst for businesses**.
Upload datasets, describe your business problem, and get instant insights, charts, SQL queries, Python scripts, and executive reports.

---

## 🏗️ Architecture Overview

```
ai-analyst-saas/
├── frontend/          # Next.js 14 + Tailwind + Recharts
├── backend/           # Python FastAPI + SQLAlchemy
├── ai_services/       # LLM analysis modules
├── infra/             # Docker, Nginx, CI/CD
└── docker-compose.yml
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### 1. Clone and configure
```bash
git clone https://github.com/yourorg/ai-analyst-saas
cd ai-analyst-saas
cp .env.example .env
# Edit .env with your API keys
```

### 2. Run with Docker (recommended)
```bash
docker-compose up --build
```

### 3. Run locally (development)
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev

# Celery worker (new terminal)
cd backend
celery -A app.core.celery_app worker --loglevel=info
```

### 4. Access the app
- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS, Recharts, Zustand |
| Backend | FastAPI, SQLAlchemy, Alembic, Pydantic |
| AI/LLM | Anthropic Claude, OpenAI GPT-4 |
| Data | Pandas, NumPy, Scikit-learn, Statsmodels |
| Database | PostgreSQL 15 |
| Cache/Queue | Redis, Celery |
| Storage | AWS S3 / Local |
| Auth | JWT + OAuth2 |
| Infra | Docker, Nginx, GitHub Actions |

---

## 🔑 Key Features

- 📂 CSV / Excel upload with schema detection
- 🔬 Auto AI analysis (descriptive, diagnostic, predictive)
- 📊 Interactive dashboard with KPIs and charts
- 💬 Chat with your data (natural language queries)
- 🗄️ Auto SQL query generation
- 🐍 Downloadable Python analysis scripts
- 📗 Excel formula generator
- 📄 PDF/PowerPoint report export
- 🚨 Anomaly detection and alerts
- 🔐 JWT authentication + role-based access

---

## 📁 Project Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed file descriptions.

## 🧪 Testing
```bash
# Backend tests
cd backend && pytest tests/ -v

# Frontend tests
cd frontend && npm run test
```

## 🚢 Deployment
See [infra/README.md](./infra/README.md) for production deployment instructions.
