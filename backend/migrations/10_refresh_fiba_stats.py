"""
Scrapes FIBA national team stats for all players and saves to DB.
Safe to re-run — upserts existing rows.
"""
import sys
import os
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import Base, engine, SessionLocal
import models
from scraper import scrape_fiba_national_team

Base.metadata.create_all(bind=engine)

db = SessionLocal()
players = db.query(models.Player).filter(models.Player.fiba_id.isnot(None)).all()
print(f"Scraping FIBA stats for {len(players)} players...\n")

ok, fail = 0, 0
for p in players:
    try:
        name_slug = unicodedata.normalize("NFKD", p.name.lower()).encode("ascii", "ignore").decode("ascii").replace(" ", "-")
        data = scrape_fiba_national_team(p.fiba_id, name_slug)

        existing = db.query(models.PlayerFibaStats).filter(models.PlayerFibaStats.slug == p.slug).first()
        if existing:
            existing.data = data
        else:
            db.add(models.PlayerFibaStats(slug=p.slug, data=data))
        db.commit()
        print(f"  ✓ {p.name} — {len(data)} hooaega")
        ok += 1
    except Exception as e:
        print(f"  ✗ {p.name} — {e}")
        db.rollback()
        fail += 1

db.close()
print(f"\nValmis: {ok} õnnestus, {fail} ebaõnnestus")
