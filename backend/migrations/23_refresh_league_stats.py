"""
Scrapes season totals for every player in the leagues where an Estonian plays
this season and saves them to LeagueStatsCache. main.py computes the league
percentiles on the player profile from these rows.

Leagues come from the LEAGUE_URL of the season rows in PlayerClubStats, so
08_refresh_club_stats.py must have run first. A league is saved only when every
team page came through, otherwise the previous version stays.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import requests

from database import Base, engine, SessionLocal
import models
from scraper import league_of_season, scrape_league_stats

Base.metadata.create_all(bind=engine)

db = SessionLocal()

leagues = set()
for row in db.query(models.PlayerClubStats).all():
    for season_row in (row.data or {}).get("seasons", []):
        league = league_of_season(season_row)
        if league:
            leagues.add(league)

if not leagues:
    print("Ühelgi mängijal pole hooaja ridadel LEAGUE_URL-i. Käivita enne 08_refresh_club_stats.py.")
    db.close()
    sys.exit(1)

current = max(season for _, _, season in leagues)
targets = sorted(l for l in leagues if l[2] == current)
print(f"Hooaeg {current}: {len(targets)} liigat\n")

ok, fail = 0, 0
for league_id, league_slug, season in targets:
    try:
        data = scrape_league_stats(league_id, league_slug, season)
        key = f"{league_id}:{season}"
        existing = db.query(models.LeagueStatsCache).filter(models.LeagueStatsCache.key == key).first()
        if existing:
            existing.data = data
        else:
            db.add(models.LeagueStatsCache(key=key, data=data))
        db.commit()
        print(f"  ✓ {data['leagueName']} — {data['teams']} meeskonda, {len(data['players'])} mängijat")
        ok += 1
    except requests.HTTPError as e:
        print(f"  ✗ {league_slug} — {e}")
        db.rollback()
        fail += 1
        # 403 on Cloudflare'i blokeering: edasised päringud ei läbiks niikuinii
        # ja ainult pikendaksid blokeeringut.
        if e.response is not None and e.response.status_code == 403:
            print("\nProBallers blokeeris (403), ülejäänud liigad jäävad järgmisesse käiku.")
            break
    except Exception as e:
        print(f"  ✗ {league_slug} — {e}")
        db.rollback()
        fail += 1

db.close()
print(f"\nValmis: {ok} õnnestus, {fail} ebaõnnestus")
