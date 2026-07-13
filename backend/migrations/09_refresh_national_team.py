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


def load(db, key):
    row = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == key).first()
    return (row.data or []) if row else []


# FIBA-sourced schedule, results ja standings (kuvatakse koondise lehel)
fiba_upcoming, fiba_recent = scrape_fiba_schedule(FIBA_COMPETITION_SLUG, FIBA_TEAM_ID, TOURNAMENT_NAME)
print(f"  FIBA upcoming: {len(fiba_upcoming)} mängu")
print(f"  FIBA recent:   {len(fiba_recent)} tulemust")

standings = scrape_fiba_standings(FIBA_COMPETITION_SLUG, FIBA_TEAM_SLUG)
print(f"  standings: {standings['name']} — {len(standings['rows'])} rida")

db = SessionLocal()

# Tulemused liidetakse olemasolevatega (võti "id") — vanad mängud säilivad DB-s
# ka siis, kui nad FIBA "viimase 5" aknast väljuvad või võistlus vahetub.
recent_by_id = {e["id"]: e for e in load(db, "recent_games")}
recent_by_id.update({e["id"]: e for e in fiba_recent})
recent = sorted(recent_by_id.values(), key=lambda e: e["startTimestamp"], reverse=True)
print(f"  recent kokku (koos ajalooga): {len(recent)} tulemust")

# Box score ehitatakse ainult mängudele, millel seda veel pole — vanu ei asendata,
# sest hilisemate akende koosseisudega neid enam kokku panna ei saaks
# (scrape_fiba_box_scores kasutab "latest roster" API-t).
old_boxes = load(db, "game_box_scores")
have_box = {b["id"] for b in old_boxes}
new_boxes = scrape_fiba_box_scores(
    [g for g in fiba_recent if g["id"] not in have_box], FIBA_COMPETITION_ID
)
for bs in new_boxes:
    print(f"  ✓ uus box score: {bs['homeTeam']} vs {bs['awayTeam']} — "
          f"{len(bs['homePlayers'])}+{len(bs['awayPlayers'])} mängijat")
box_scores = sorted(old_boxes + new_boxes, key=lambda b: b["date"], reverse=True)

upsert(db, 'upcoming_games', fiba_upcoming)
upsert(db, 'recent_games', recent)
upsert(db, 'standings', standings)
upsert(db, 'game_box_scores', box_scores)
db.close()
print(f"\nValmis — {len(new_boxes)} uut box score'i, kokku {len(box_scores)}.")
