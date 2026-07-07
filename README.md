# EstHoop

Estonian basketball fan site ([esthoop.ee](https://esthoop.ee)) — profiles and stats for
Estonian national team and club players, national team games/standings, a tickets page, and
an AI chatbot.

## Screenshots

| Players | Player |
|---|---|
| ![Players view](frontend/public/Views/Mängijad_View.png) | ![Player view](frontend/public/Views/Mängija_View.png) |

| National team | Stats |
|---|---|
| ![National team view](frontend/public/Views/Koondis_View.png) | ![Stats view](frontend/public/Views/Statistika_View.png) |

| Tickets |
|---|
| ![Tickets view](frontend/public/Views/Piletid_View.png) |

## Features

- **Players** — profiles, club and national team stats (seasons, games, charts)
- **Stats** — National team/Club leaderboards, filterable by stat category
- **National team** — upcoming games, recent results with box scores, group standings
- **Club basketball** — club games played by Estonian national team players worldwide (ProBallers)
- **Tickets** — national team home game info, link to Piletitasku
- **Chatbot** — Anthropic Claude based, answers only from the site's own data

## Tech stack

**Frontend** — React 19, Vite, React Router v7, Tailwind CSS v4, Recharts (charts),
Framer Motion + tsParticles (national team hero animation).

**Backend** — FastAPI + SQLAlchemy (Python), PostgreSQL, BeautifulSoup (ProBallers/FIBA
scraping), Anthropic API (chatbot, `claude-haiku-4-5`).

**Hosting** — Frontend: [Vercel](https://vercel.com) (project `est-hoop`). Backend:
[Render](https://render.com) (`esthoop-backend`). Data is refreshed by scheduled GitHub
Actions workflows.

## Project structure

```
backend/
  main.py                 FastAPI app, all API endpoints
  database.py             SQLAlchemy engine/session (via DATABASE_URL)
  models.py               ORM models (Player, PlayerClubStats, PlayerFibaStats, NationalTeamCache)
  scraper.py               ProBallers + FIBA scraping functions
  migrations/              One-off scripts (01-13) + daily refresh jobs (08, 09, 10)
                           + check_new_competition.py (watches for new FIBA competitions)
  requirements.txt, vercel.json

frontend/
  src/
    pages/                 KoondisPage, PlayersPage, PlayerPage, StatsPage, PiletidPage, KlubiKorvpallPage
    components/             Navbar, PlayerAvatar, Panel, FlagDivider, StatsTabToggle, ChatWidget, Skeleton, PageLoader
    contexts/                LoadingContext
  public/
    players/                Player headshots ({slug}.jpg/png)
    Views/                   README screenshots

.github/workflows/         Scheduled (cron) data refresh workflows
```

## Getting started

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# create a .env file (see below)
uvicorn main:app --reload   # http://localhost:8000

# Frontend
cd frontend
npm install
# create a .env file (see below)
npm run dev                  # http://localhost:5173
```

### Environment variables

**`backend/.env`**

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `ANTHROPIC_API_KEY` | For the chatbot (Anthropic API) |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Optional — only for `migrations/check_new_competition.py` notifications |

**`frontend/.env`**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL (e.g. `http://localhost:8000` locally) |

## Database & data flow

Live scraping only happens via scheduled GitHub Actions workflows (`.github/workflows/`),
which populate Postgres cache tables — API endpoints read from those first; live scraping
is only a local fallback (ProBallers/FIBA frequently block Render's IPs).

| Data | Source | Cache table | Schedule |
|---|---|---|---|
| Player identity | Manually curated (proballers_id, fiba_id) | `Player` | One-off migration |
| Club stats | proballers.com | `PlayerClubStats` | Daily at 02:00 UTC |
| National team stats (player) | fiba.basketball (player page) | `PlayerFibaStats` | Daily at 21:00 UTC |
| National team games/standings/box scores | fiba.basketball + digital-api.fiba.basketball | `NationalTeamCache` | Daily at 21:00 UTC |

## Scripts

**`backend/migrations/`** — numbered one-off scripts (01-13: seeding players, adding IDs,
roster changes), three of which (08, 09, 10) plus `check_new_competition.py` also run as
daily refresh jobs via GitHub Actions.

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

## Deployment

Frontend auto-deploys to Vercel (`est-hoop` project) on push to `main`. Backend runs on
Render (`esthoop-backend`) — also deployed via git integration. The `/health` endpoint is
monitored by UptimeRobot (accepts both GET and HEAD requests).
