"""
Fetches Estonian national team game schedule, standings and box scores from FIBA
and saves to DB. Safe to re-run — upserts existing rows.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models
from scraper import scrape_fiba_schedule, scrape_fiba_standings, scrape_fiba_box_scores

TOURNAMENT_NAME = 'FIBA Basketball World Cup 2027 European Qualifiers'
FIBA_COMPETITION_SLUG = 'fiba-basketball-world-cup-2027-european-qualifiers'
FIBA_TEAM_SLUG = 'estonia'
FIBA_TEAM_ID = 283301
FIBA_COMPETITION_ID = 208943


def upsert(db, key, data):
    row = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == key).first()
    if row:
        row.data = data
    else:
        db.add(models.NationalTeamCache(key=key, data=data))
    db.commit()


# FIBA-sourced schedule, results ja standings (kuvatakse koondise lehel)
fiba_upcoming, fiba_recent = scrape_fiba_schedule(FIBA_COMPETITION_SLUG, FIBA_TEAM_ID, TOURNAMENT_NAME)
print(f"  FIBA upcoming: {len(fiba_upcoming)} mängu")
print(f"  FIBA recent:   {len(fiba_recent)} tulemust")

standings = scrape_fiba_standings(FIBA_COMPETITION_SLUG, FIBA_TEAM_SLUG)
print(f"  standings: {standings['name']} — {len(standings['rows'])} rida")

box_scores = scrape_fiba_box_scores(fiba_recent, FIBA_COMPETITION_ID)
for bs in box_scores:
    print(f"  ✓ box score: {bs['homeTeam']} vs {bs['awayTeam']} — "
          f"{len(bs['homePlayers'])}+{len(bs['awayPlayers'])} mängijat")

db = SessionLocal()
upsert(db, 'upcoming_games', fiba_upcoming)
upsert(db, 'recent_games', fiba_recent)
upsert(db, 'standings', standings)
upsert(db, 'game_box_scores', box_scores)
db.close()
print(f"\nValmis — {len(box_scores)} box score salvestatud.")
