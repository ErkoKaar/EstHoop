"""
Scrapes club stats for all players from ProBallers and saves to DB.
Run locally (Render's IP is blocked by ProBallers).
Safe to re-run — upserts existing rows. ProBallers only ever shows the last 5
games total (club + national mixed), so club and national games are merged
with the previously stored rows and each kept as a rolling window of 5.
"""
import sys
import os
import unicodedata
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models
from scraper import scrape_player, split_games_by_type

MAX_GAMES = 5


def _parse_date(game: dict) -> datetime:
    try:
        return datetime.strptime(game["DATE"], "%b %d, %Y")
    except (KeyError, ValueError):
        return datetime.min


def _merge_games(prior: list[dict], new: list[dict]) -> list[dict]:
    by_key = {(g.get("DATE"), g.get("OPPONENT")): g for g in prior}
    for g in new:
        by_key[(g.get("DATE"), g.get("OPPONENT"))] = g
    merged = sorted(by_key.values(), key=_parse_date, reverse=True)
    return merged[:MAX_GAMES]


db = SessionLocal()

players = db.query(models.Player).filter(models.Player.proballers_id.isnot(None)).all()
print(f"Scraping stats for {len(players)} players...\n")

ok, fail = 0, 0
for p in players:
    try:
        pb_slug = unicodedata.normalize("NFKD", p.name.lower()).encode("ascii", "ignore").decode("ascii").replace(" ", "-")
        data = scrape_player(p.proballers_id, pb_slug)

        new_club, new_national = split_games_by_type(data.pop("games", []))

        existing = db.query(models.PlayerClubStats).filter(models.PlayerClubStats.slug == p.slug).first()
        prior_club = existing.data.get("clubGames", []) if existing else []
        prior_national = existing.data.get("nationalGames", []) if existing else []

        data["clubGames"] = _merge_games(prior_club, new_club)
        data["nationalGames"] = _merge_games(prior_national, new_national)

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
