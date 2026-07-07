# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Verification policy

Do not run verification steps on your own initiative — no dev server, no build, no lint/typecheck runs, no browser checks, no tests — unless the user explicitly asks for it in that turn. Make the code change and stop there; wait for the user to request a check.

# Planning policy

Before implementing any change, first present a short plan (what will change, which files, the approach) and wait for the user to explicitly confirm it. Do not start editing code until the user has approved the plan in that turn.

# Git policy

Never run `git commit` or `git push` on your own initiative. Only do so when the user explicitly asks for a commit or push in that turn — approval for one commit/push does not carry over to later changes.

# Long-chat summary policy

After 15 user messages have accumulated in a single chat, summarize everything done so far and all information a new chat would need to continue the work (decisions made, current state, outstanding steps), then advise the user to open a new chat.

# Code quality policy

Write code like a senior developer: think through edge cases, failure modes, and invalid inputs before considering the task done, not just the happy path.

# Project overview

EstHoop (esthoop.ee) — Eesti korvpalli fännileht: mängijate profiilid ja statistika,
klubi- ja koondisemängud/seis, piletite leht, AI vestlusrobot.

# Architecture

- `backend/` — FastAPI + SQLAlchemy, eraldi Vercel projekt `est-hoop-api`. Postgres andmebaas `DATABASE_URL` env kaudu.
- `frontend/` — React 19 + Vite + Tailwind v4 + react-router, eraldi Vercel projekt `est-hoop` (SPA rewrite `frontend/vercel.json`-is).
- `backend/migrations/` — numbrilised ühekordsed skriptid (01–10), pole Alembic-põhised; osa neist (08, 09, 10) töötavad ka päevaste "refresh" jobidena.
- `.github/workflows/` — kolm ajastatud (cron) töövoogu, mis käivitavad refresh-skriptid `DATABASE_URL` vastu ja täidavad DB cache tabeleid (`PlayerClubStats`, `PlayerFibaStats`, `NationalTeamCache`), kuna live scraping on production'is (Vercel/Render) sageli blokeeritud.
- `sofascore-proxy/` — mahajäetud Cloudflare Worker katse (vt commit 2424b1a); SofaScore blokeerib ka CF Workerid, tagasi pöördutud backend/ProBallers scraperi juurde.
- `/chat` endpoint kasutab Anthropic API-t (`claude-haiku-4-5`) koos serveripoolselt lisatud mängijate/mängude kontekstiga.

# Data flow / caching

Statistikat kraabitakse ainult ajastatud skriptidega ja hoitakse Postgres cache tabelites.
`main.py` endpointid loevad esmalt DB cache'ist, live scraping on ainult varulahendus (töötab lokaalselt, mitte usaldusväärselt production'is).

# Conventions

- UI tekstid ja API veateated on eesti keeles.
- Mängija identiteedi väljad `proballers_id`, `fiba_id`, `sofascore_id` pole kõigil mängijatel täidetud — kontrolli None enne kasutamist.