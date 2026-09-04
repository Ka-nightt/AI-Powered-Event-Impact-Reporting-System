# AI-Powered Event Impact Reporting System

A full-stack app for tracking event attendance, running demographic/impact
analytics, mapping events to UN Sustainable Development Goals, and generating
AI-written PDF impact reports — using a locally-run AI model (Ollama), so no
API key or per-request cost is required.

## Stack

| Layer      | Tech |
|------------|------|
| Frontend   | React (Vite) + Tailwind CSS + Chart.js |
| Backend    | Node.js + Express |
| Database   | PostgreSQL |
| Charts     | Chart.js (frontend), chartjs-node-canvas (server-side, for PDF embedding) |
| Reports    | PDFKit |
| AI         | Ollama (local inference — no OpenAI key needed) |

## Project layout

```
event-impact-system/
  backend/     Express API, PostgreSQL schema, PDF/AI/analytics services
  frontend/    React + Tailwind dashboard
```

## 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local install, or a hosted instance e.g. Railway/Render/Neon)
- [Ollama](https://ollama.com) installed locally, with a model pulled:
  ```bash
  ollama pull llama3.1
  ollama serve   # usually runs automatically after install
  ```

## 2. Backend setup

```bash
cd backend
cp .env.example .env    # then edit DATABASE_URL, OLLAMA_HOST, etc.
npm install
npm run migrate         # creates tables + seeds the 17 SDGs
npm run dev             # starts on http://localhost:5000
```

Key `.env` values:
- `DATABASE_URL` — your PostgreSQL connection string
- `JWT_SECRET` — set this to a long random string (used to sign login tokens)
- `OLLAMA_HOST` — where Ollama is running (default `http://localhost:11434`)
- `OLLAMA_MODEL` — the pulled model name (default `llama3.1`)
- `CORS_ORIGIN` — comma-separated list of allowed frontend origins

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env     # set VITE_API_BASE_URL to your backend's /api URL
npm install
npm run dev              # starts on http://localhost:5173
```

## 4. Using it

1. Open the app — you'll land on **Login**. Click **Create account** to sign up
   (full name, email, password), which logs you in automatically.
2. Go to **Events → New event**, fill in name/date/location/organizer.
3. Open the event, tag it with relevant **SDGs** under Overview.
4. Under **Data Upload**, choose an attendance sheet (.csv/.xlsx). The app
   parses it and shows a **validation preview** first — participant count,
   detected columns, duplicate records, and missing values — before anything
   is written to the database. Click **Confirm & analyze** to commit it, or
   **Cancel** to pick a different file. Same flow for the survey sheet.
5. Check **Analytics** for the attendance overview (registered/attended/
   absent/rate) and survey overview (responses/response rate/avg
   satisfaction), plus gender/age charts.
6. Add photos under **Gallery**.
7. Click **Generate report** under **AI Report** — this asks your local
   Ollama model for a full structured write-up (executive summary,
   attendance analysis, survey findings, key strengths, areas of concern,
   recommendations, conclusion), renders charts server-side, and produces a
   downloadable PDF. Click a report's row to expand and read the sections
   inline, or download the PDF directly.

Each event only shows up for the account that created it — data is scoped
per user via the JWT issued at login.

## 5. Deployment notes

The frontend is a static Vite build, so **Vercel** is a great fit for it.
The backend, however, needs to stay running continuously and reach a local
Ollama process — that doesn't fit Vercel's serverless functions. A
straightforward split:

- **Frontend → Vercel** (`vercel --prod` from `frontend/`, or connect the repo
  and set the root directory to `frontend`). Set `VITE_API_BASE_URL` to your
  deployed backend's URL in Vercel's environment variables.
- **Backend → Railway or Render**, on a plan that lets you run a persistent
  process. Ollama itself needs to run somewhere with enough RAM/CPU for the
  model you choose — either on the same box as the backend (if the plan
  supports it) or as a separate reachable service, with `OLLAMA_HOST` pointed
  at it. If pulling a full local model there isn't practical, the AI service
  (`backend/src/services/aiService.js` + `backend/src/config/ollama.js`) is
  isolated enough to swap for a hosted API later without touching the rest
  of the app.
- **Database → Railway/Render Postgres, or a managed provider like Neon or
  Supabase.** Run `npm run migrate` once against the production
  `DATABASE_URL` to set up tables.
- Set `CORS_ORIGIN` on the backend to your Vercel frontend URL.

## 6. Extending

- `backend/src/services/analyticsEngine.js` — add more computed metrics
- `backend/src/services/pdfService.js` — adjust report layout/branding
- `backend/src/services/aiService.js` — tweak the AI prompt or swap models
- `frontend/src/components/charts/` — add new Chart.js visualizations
