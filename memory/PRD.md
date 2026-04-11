# EcoBudget - Personal Finance Tracker PRD

## Original Problem Statement
User uploaded an EcoBudget app originally built on the Base44 low-code platform. The app had deployment errors (Vite import resolution failures: `@/App.jsx` from `src/main.jsx`). Task was to make it deployable, debug all issues, then add auth, edit expenses, and dark mode.

## Architecture
- **Frontend**: React (CRA) + TailwindCSS + shadcn/ui + Recharts + Framer Motion + React Query
- **Backend**: FastAPI (Python) + Motor (async MongoDB driver) + JWT Auth (bcrypt + PyJWT)
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o via Emergent LLM Key (emergentintegrations library)

## Core Requirements
- Personal expense tracking with categories, budgets, and reporting
- Currency: BWP (Botswana Pula)
- Responsive design for mobile, tablet, and desktop
- AI-powered financial advisor and monthly summaries
- Multi-user authentication with JWT
- Dark mode support

## What Was Implemented

### Phase 1 (2026-04-10) - Migration & Core
1. Full backend API - CRUD for Expenses, Categories, Budgets + AI/LLM endpoint
2. 8 seeded default categories per user
3. Dashboard, Expenses, Add Expense, Categories, Budgets, Reports, Monthly Summary, AI Advisor pages
4. Responsive sidebar + mobile bottom nav
5. Fixed all Base44 platform dependencies

### Phase 2 (2026-04-10) - Auth + Edit + Dark Mode
1. **JWT Authentication** - Register, Login, Logout, Refresh, Forgot/Reset Password
   - httpOnly cookies (access: 15min, refresh: 7days)
   - bcrypt password hashing
   - Admin seeding on startup
   - Brute force protection (5 attempts = 15min lockout)
   - All data user-scoped
2. **Edit Expenses** - PUT endpoint + modal dialog on expenses page
3. **Dark Mode** - Toggle in sidebar, CSS variables for light/dark, localStorage persistence

## Testing Status
- Backend: 100% pass (brute force protection fixed)
- Frontend: 100% pass (auth flows, edit, dark mode all working)
- Deployment check: PASS

## Backlog (P1)
- Recurring expenses
- Export data (CSV/PDF)
- Email notifications for budget alerts

## Backlog (P2)
- Multi-currency support
- Expense receipt photo upload
- Data import from bank statements
- Spending goals with progress tracking
