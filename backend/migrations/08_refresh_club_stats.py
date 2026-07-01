"""
Scrapes club stats for all players from ProBallers and saves to DB.
Run locally (Render's IP is blocked by ProBallers).
Safe to re-run — upserts existing rows.
"""
import sys
import os
import unicodedata
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models
from scraper import scrape_player

db = SessionLocal()

players = db.query(models.Player).filter(models.Player.proballers_id.isnot(None)).all()
print(f"Scraping stats for {len(players)} players...\n")

ok, fail = 0, 0
for p in players:
    try:
        pb_slug = unicodedata.normalize("NFKD", p.name.lower()).encode("ascii", "ignore").decode("ascii").replace(" ", "-")
        data = scrape_player(p.proballers_id, pb_slug)

        existing = db.query(models.PlayerClubStats).filter(models.PlayerClubStats.slug == p.slug).first()
        if existing:
            existing.data = data
        else:
            db.add(models.PlayerClubStats(slug=p.slug, data=data))
        db.commit()
        seasons = len(data.get("seasons", []))
        print(f"  ✓ {p.name} — {seasons} hooaega")
        ok += 1
    except Exception as e:
        print(f"  ✗ {p.name} — {e}")
        db.rollback()
        fail += 1

db.close()
print(f"\nValmis: {ok} õnnestus, {fail} ebaõnnestus")
