"""
Fetches Estonian national team data from SofaScore using a real browser
(Playwright) and saves to DB. Run locally — SofaScore blocks server-side
and non-localhost browser requests.
Safe to re-run — upserts existing rows.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from playwright.sync_api import sync_playwright
from database import SessionLocal
import models

TEAM_ID = 25373  # Estonia SofaScore team ID (never changes)

def upsert(db, key, data):
    row = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == key).first()
    if row:
        row.data = data
    else:
        db.add(models.NationalTeamCache(key=key, data=data))
    db.commit()

def fetch_all(page):
    return page.evaluate(f"""async () => {{
        const [nextRes, lastRes] = await Promise.all([
            fetch('https://api.sofascore.com/api/v1/team/{TEAM_ID}/events/next/0').then(r => r.json()),
            fetch('https://api.sofascore.com/api/v1/team/{TEAM_ID}/events/last/0').then(r => r.json()),
        ])

        const upcoming = nextRes.events || []
        const recent = [...(lastRes.events || [])].reverse().slice(0, 5)

        // Find first qualifying game (not friendly) from upcoming, then recent
        const allEvents = [...upcoming, ...recent]
        const qualGame = allEvents.find(ev => {{
            const name = (ev.tournament?.name || '').toLowerCase()
            return name.includes('qualifier') || name.includes('eurobasket') || name.includes('olympic')
        }})

        let standings = {{ name: null, rows: [] }}

        if (qualGame) {{
            const tournamentId = qualGame.tournament?.uniqueTournament?.id
            const seasonId = qualGame.season?.id
            if (tournamentId && seasonId) {{
                const standRes = await fetch(
                    `https://api.sofascore.com/api/v1/unique-tournament/${{tournamentId}}/season/${{seasonId}}/standings/total`
                ).then(r => r.json())
                const estGroup = (standRes.standings || []).find(g =>
                    (g.rows || []).some(r => r.team?.name === 'Estonia')
                )
                if (estGroup) {{
                    standings = {{ name: estGroup.name, rows: estGroup.rows || [] }}
                }}
            }}
        }}

        return {{ upcoming, recent, standings }}
    }}""")

db = SessionLocal()

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("https://www.sofascore.com/")
    page.wait_for_load_state("domcontentloaded")

    print("Fetching SofaScore data...")
    result = fetch_all(page)
    browser.close()

print(f"  upcoming:  {len(result['upcoming'])} mängu")
print(f"  recent:    {len(result['recent'])} tulemust")
print(f"  standings: {len(result['standings']['rows'])} rida ({result['standings']['name']})")

upsert(db, "upcoming_games", result["upcoming"])
upsert(db, "recent_games", result["recent"])
upsert(db, "standings", result["standings"])

db.close()
print("\nValmis — andmed salvestatud Neon DB-sse.")
