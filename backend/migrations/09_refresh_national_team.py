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

TEAM_ID = 25373
TOURNAMENT_ID = 10437
SEASON_ID = 54504

def upsert(db, key, data):
    row = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == key).first()
    if row:
        row.data = data
    else:
        db.add(models.NationalTeamCache(key=key, data=data))
    db.commit()

def fetch_all(page):
    return page.evaluate(f"""async () => {{
        const [nextRes, lastRes, standRes] = await Promise.all([
            fetch('https://api.sofascore.com/api/v1/team/{TEAM_ID}/events/next/0').then(r => r.json()),
            fetch('https://api.sofascore.com/api/v1/team/{TEAM_ID}/events/last/0').then(r => r.json()),
            fetch('https://api.sofascore.com/api/v1/unique-tournament/{TOURNAMENT_ID}/season/{SEASON_ID}/standings/total').then(r => r.json()),
        ])
        const groupH = (standRes.standings || []).find(g => (g.name || '').includes('Group H'))
        return {{
            upcoming: nextRes.events || [],
            recent: [...(lastRes.events || [])].reverse().slice(0, 5),
            standings: groupH ? groupH.rows : [],
        }}
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

print(f"  upcoming: {len(result['upcoming'])} mängu")
print(f"  recent:   {len(result['recent'])} tulemust")
print(f"  standings: {len(result['standings'])} rida")

upsert(db, "upcoming_games", result["upcoming"])
upsert(db, "recent_games", result["recent"])
upsert(db, "standings", result["standings"])

db.close()
print("\nValmis — andmed salvestatud Neon DB-sse.")
