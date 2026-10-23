"""
Scrapes season totals for every player in the leagues where an Estonian plays
this season and saves them to LeagueStatsCache. main.py computes the league
percentiles on the player profile from these rows.

Leagues and the Estonians' teams (the starting points for finding the other
teams) come from LEAGUE_URL and TEAM_URL of the season rows in PlayerClubStats,
so 08_refresh_club_stats.py must have run first. A league is saved only when
every team page came through, otherwise the previous version stays.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import requests

from database import Base, engine, SessionLocal
import models
from scraper import league_of_season, scrape_league_stats, team_path

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# (liiga id, slug, hooaeg) -> eestlaste meeskonnad selles liigas
leagues: dict[tuple[int, str, int], set[str]] = {}
for row in db.query(models.PlayerClubStats).all():
    for season_row in (row.data or {}).get("seasons", []):
        league = league_of_season(season_row)
        if not league:
            continue
        teams = leagues.setdefault(league, set())
        path = team_path(season_row.get("TEAM_URL"))
        if path:
            teams.add(path)

if not leagues:
    print("Ühelgi mängijal pole hooaja ridadel LEAGUE_URL-i. Käivita enne 08_refresh_club_stats.py.")
    db.close()
    sys.exit(1)

current = max(season for _, _, season in leagues)
targets = sorted(l for l in leagues if l[2] == current)
print(f"Hooaeg {current}: {len(targets)} liigat\n")

ok, fail = 0, 0
for league_id, league_slug, season in targets:
    key = f"{league_id}:{season}"
    existing = db.query(models.LeagueStatsCache).filter(models.LeagueStatsCache.key == key).first()
    # Eelmistel käivitustel leitud meeskonnad on samuti lähtepunktid, et liiga
    # nimekiri kasvaks, kui viimaste mängude vastased vahetuvad.
    known = existing.data.get("teamPaths", []) if existing else []
    seeds = sorted(leagues[(league_id, league_slug, season)] | set(known))
    if not seeds:
        print(f"  ✗ {league_slug} — hooaja ridadel pole TEAM_URL-i, käivita enne 08_refresh_club_stats.py")
        fail += 1
        continue
    try:
        data = scrape_league_stats(league_id, league_slug, season, seeds)
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
