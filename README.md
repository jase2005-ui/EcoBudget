# EcoBudget - Personal Finance Tracker

A full-stack personal finance app built with React + FastAPI + MongoDB, designed for tracking expenses in Botswana Pula (BWP).

## Features

- **Dashboard** — Spending hero, daily/weekly/monthly summary, recent transactions, budget progress
- **Expenses** — Full CRUD with search, filter by category/month, edit via modal
- **Recurring Expenses** — Auto-generate monthly entries for rent, subscriptions, etc.
- **Categories** — Customizable with color coding (8 defaults seeded per user)
- **Budgets** — Per-category monthly limits with progress tracking
- **Reports** — Pie charts (by category, payment method), 6-month bar trend
- **Monthly Summary** — AI-powered analysis with charts and detailed breakdown
- **AI Financial Advisor** — Chat with GPT-4o for personalized BWP financial advice
- **Authentication** — JWT with httpOnly cookies, registration, brute force protection
- **Dark Mode** — Toggle with localStorage persistence
- **Responsive** — Mobile, tablet, and desktop layouts

## Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | React (CRA), TailwindCSS, shadcn/ui, Recharts, Framer Motion, React Query |
| Backend  | Python FastAPI, Motor (async MongoDB), bcrypt, PyJWT |
| Database | MongoDB |
| AI       | OpenAI GPT-4o via Emergent LLM Key |

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
# Configure .env (see .env for required variables)
uvicorn server:app --host 0.0.0.0 --port 8001
```

### Frontend
```bash
cd frontend
yarn install
# Set REACT_APP_BACKEND_URL in .env
yarn start
```

### Environment Variables

**Backend (.env)**
- `MONGO_URL` — MongoDB connection string
- `DB_NAME` — Database name
- `JWT_SECRET` — Random 64-char hex for JWT signing
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — Admin seed credentials
- `FRONTEND_URL` — Frontend origin for CORS
- `EMERGENT_LLM_KEY` — API key for AI features

**Frontend (.env)**
- `REACT_APP_BACKEND_URL` — Backend API base URL

## Default Admin
- Email: `admin@ecobudget.com`
- Password: `admin123`
