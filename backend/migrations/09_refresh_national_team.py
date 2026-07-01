"""
Fetches Estonian national team game schedule from ProBallers and saves to DB.
Safe to re-run — upserts existing rows.
"""
import sys
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import requests
from bs4 import BeautifulSoup
from database import SessionLocal
import models

TOURNAMENT_NAME = 'FIBA Basketball World Cup 2027 European Qualifiers'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}


def season_url():
    today = datetime.now(timezone.utc)
    year = today.year if today.month >= 8 else today.year - 1
    return f'https://www.proballers.com/basketball/team/203/estonia/{year}'


def fetch_games():
    url = season_url()
    print(f"Fetching {url}")
    r = requests.get(url, headers=HEADERS, timeout=20)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, 'html.parser')

    entries = soup.find_all(
        class_=lambda c: c and 'main__schedule__match__entry' in c.split() if c else False
    )
    print(f"Found {len(entries)} game entries")

    upcoming, recent = [], []

    for entry in entries:
        # Date/time — format: "2026-07-03 6:00 PM"
        date_div = entry.find(class_=lambda c: c and 'date' in c.split() if c else False)
        date_str = date_div.get_text(strip=True) if date_div else ''
        try:
            dt = datetime.strptime(date_str, '%Y-%m-%d %I:%M %p').replace(tzinfo=timezone.utc)
            ts = int(dt.timestamp())
        except ValueError:
            ts = None

        # Teams (first = home, second = away)
        team_entries = entry.find_all(
            class_=lambda c: c and 'team__entry' in c.split() if c else False
        )
        teams = []
        for te in team_entries:
            title = te.find(class_=lambda c: c and 'title' in c.split() if c else False)
            if title:
                teams.append(title.get_text(strip=True))
        if len(teams) < 2:
            continue
        home_team, away_team = teams[0], teams[1]

        # Scores — two .score elements only present for finished games
        score_els = entry.find_all(
            class_=lambda c: c and 'score' in c.split() if c else False
        )
        has_score = len(score_els) == 2
        home_score = away_score = None
        if has_score:
            try:
                home_score = int(score_els[0].get_text(strip=True))
                away_score = int(score_els[1].get_text(strip=True))
            except ValueError:
                has_score = False

        game_id = f"pb-{home_team.lower().replace(' ', '-')}-{away_team.lower().replace(' ', '-')}-{date_str[:10]}"

        event = {
            'id': game_id,
            'homeTeam': {'name': home_team},
            'awayTeam': {'name': away_team},
            'startTimestamp': ts,
            'tournament': {'name': TOURNAMENT_NAME},
        }
        if has_score:
            event['homeScore'] = {'current': home_score}
            event['awayScore'] = {'current': away_score}

        if has_score:
            recent.append(event)
        else:
            upcoming.append(event)

    # Most recent first, cap at 5
    recent.reverse()
    return upcoming, recent[:5]


def upsert(db, key, data):
    row = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == key).first()
    if row:
        row.data = data
    else:
        db.add(models.NationalTeamCache(key=key, data=data))
    db.commit()


upcoming, recent = fetch_games()
print(f"  upcoming:  {len(upcoming)} mängu")
print(f"  recent:    {len(recent)} tulemust")

db = SessionLocal()
upsert(db, 'upcoming_games', upcoming)
upsert(db, 'recent_games', recent)
db.close()
print("\nValmis — andmed salvestatud Neon DB-sse.")
