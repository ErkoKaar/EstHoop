"""
Lisab käsitsi koondise mängu Sloveenia 93 : 94 Eesti (28.11.2025, Koper, FIBA gameId 127601)
tabelisse NationalTeamCache (recent_games + game_box_scores).

Mäng jäi 09_refresh_national_team.py-l vahele: FIBA "latest roster" ei kata enam selle akna
koosseisu, seega box score'i ei saanud automaatselt kokku panna. Mängijate numbrid on võetud
FIBA mängulehelt: https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-european-qualifiers/games/127601-SLO-EST
Turvaline korduskäivitada — sama ID kirje asendatakse.
"""
import sys
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models

GAME_ID = "fiba-127601"
TOURNAMENT_NAME = "FIBA Basketball World Cup 2027 European Qualifiers"
START = int(datetime(2025, 11, 28, 17, 0, tzinfo=timezone.utc).timestamp())


def player(name, min_, pts, reb, ast, stl, blk, fg, fg3, ft, oreb, dreb, to, pf, pm, eff):
    return {
        "name": name, "min": min_, "pts": pts, "reb": reb, "ast": ast, "stl": stl, "blk": blk,
        "fg": fg, "fg3": fg3, "ft": ft, "oreb": oreb, "dreb": dreb, "to": to, "pf": pf,
        "pm": str(pm), "eff": eff,
    }


def dnp(name):
    return player(name, "0:00", 0, 0, 0, 0, 0, "0/0", "0/0", "0/0", 0, 0, 0, 0, 0, 0)


SLOVENIA = [
    player("Martin Krampelj",   "15:44",  6, 3, 1, 0, 0, "2/2",  "0/0",  "2/2",   1, 2, 0, 2,   7, 10),
    player("Ziga Samar",        "30:55", 15, 4, 8, 1, 0, "6/14", "1/4",  "2/2",   1, 3, 4, 3,  -3, 16),
    dnp("Robert Jurkovic"),
    player("Gregor Hrovat",     "35:42", 23, 1, 4, 4, 0, "4/15", "3/10", "12/14", 0, 1, 5, 4,  10, 14),
    player("Miha Cerkvenik",    "31:17", 15, 6, 1, 2, 0, "5/9",  "2/6",  "3/3",   1, 5, 0, 3,   6, 20),
    player("Aljaz Kunc",        "12:27",  4, 3, 1, 0, 0, "2/4",  "0/1",  "0/0",   0, 3, 0, 4,   2,  6),
    player("Stefan Joksimovic", "21:50",  9, 4, 2, 0, 0, "4/11", "0/5",  "1/4",   0, 4, 0, 3,   4,  5),
    player("Alen Omic",         "28:03",  6, 6, 0, 0, 0, "2/3",  "0/0",  "2/6",   1, 5, 2, 4,  -5,  5),
    player("Bine Prepelic",     "20:13",  0, 0, 1, 2, 0, "0/2",  "0/1",  "0/0",   0, 0, 0, 1, -12,  1),
    player("Gregor Glas",       "12:59", 12, 1, 1, 0, 0, "3/3",  "3/3",  "3/3",   0, 1, 1, 5,  -3, 13),
    player("Zak Smrekar",        "0:43",  0, 0, 0, 0, 0, "0/0",  "0/0",  "0/0",   0, 0, 0, 0,  -6,  0),
    player("Leon Stergar",      "15:07",  3, 3, 0, 1, 0, "1/6",  "0/2",  "1/2",   2, 1, 0, 2,  -5,  1),
]

ESTONIA = [
    player("Henri Drell",       "38:19", 29, 6, 6, 2, 2, "10/18", "4/11", "5/10", 1, 5, 6, 4,  11, 26),
    player("Kaspar Treier",     "17:38", 11, 5, 0, 0, 0, "3/5",   "2/3",  "3/4",  0, 5, 0, 5,   6, 13),
    dnp("Siim-Markus Post"),
    player("Mihkel Kirves",     "19:58",  6, 5, 1, 0, 0, "1/1",   "0/0",  "4/8",  2, 3, 0, 4,  -2,  8),
    player("Hugo Toom",          "6:13",  1, 1, 0, 0, 0, "0/1",   "0/0",  "1/2",  1, 0, 0, 0,  -5,  0),
    player("Leemet Bockler",    "11:11",  5, 2, 1, 3, 1, "2/4",   "1/2",  "0/0",  1, 1, 1, 1,   4,  9),
    player("Joonas Riismaa",    "26:19",  3, 8, 4, 1, 1, "0/2",   "0/2",  "3/4",  2, 6, 1, 5,  -2, 13),
    player("Artur Konontsuk",   "34:13", 13, 4, 0, 1, 0, "3/10",  "2/6",  "5/6",  1, 3, 3, 0,  -2,  7),
    dnp("Markus Ilver"),
    player("Martin Paasoja",    "16:21",  0, 0, 2, 2, 0, "0/5",   "0/3",  "0/0",  0, 0, 1, 2,  -6, -2),
    player("Kristian Kullamae", "36:42", 24, 5, 3, 0, 0, "10/23", "4/11", "0/0",  0, 5, 5, 3,  -1, 14),
    player("Karl Johan Lips",   "18:06",  2, 3, 1, 0, 1, "1/1",   "0/0",  "0/0",  2, 1, 0, 5,   2,  7),
]

HOME_SCORE, AWAY_SCORE = 93, 94
assert sum(p["pts"] for p in SLOVENIA) == HOME_SCORE
assert sum(p["pts"] for p in ESTONIA) == AWAY_SCORE

QUARTERS = [
    {"label": "Q1",  "home": 20, "away": 19},
    {"label": "Q2",  "home": 18, "away": 20},
    {"label": "Q3",  "home": 20, "away": 26},
    {"label": "Q4",  "home": 21, "away": 14},
    {"label": "OT1", "home": 14, "away": 15},
]
assert sum(q["home"] for q in QUARTERS) == HOME_SCORE
assert sum(q["away"] for q in QUARTERS) == AWAY_SCORE

game = {
    "id": GAME_ID,
    "gameId": 127601,
    "homeTeam": {"name": "Slovenia", "teamId": 283289},
    "awayTeam": {"name": "Estonia", "teamId": 283301},
    "startTimestamp": START,
    "tournament": {"name": TOURNAMENT_NAME},
    "homeScore": {"current": HOME_SCORE},
    "awayScore": {"current": AWAY_SCORE},
}

box_score = {
    "id": GAME_ID,
    "date": START,
    "homeTeam": "Slovenia",
    "awayTeam": "Estonia",
    "homeScore": HOME_SCORE,
    "awayScore": AWAY_SCORE,
    "quarters": QUARTERS,
    "homePlayers": sorted(SLOVENIA, key=lambda p: p["pts"], reverse=True),
    "awayPlayers": sorted(ESTONIA, key=lambda p: p["pts"], reverse=True),
}


def load(db, key):
    row = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == key).first()
    return (row.data or []) if row else []


def upsert(db, key, data):
    row = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == key).first()
    if row:
        row.data = data
    else:
        db.add(models.NationalTeamCache(key=key, data=data))


db = SessionLocal()
try:
    recent = [e for e in load(db, "recent_games") if e["id"] != GAME_ID] + [game]
    recent.sort(key=lambda e: e["startTimestamp"], reverse=True)
    upsert(db, "recent_games", recent)

    boxes = [b for b in load(db, "game_box_scores") if b["id"] != GAME_ID] + [box_score]
    boxes.sort(key=lambda b: b["date"], reverse=True)
    upsert(db, "game_box_scores", boxes)

    db.commit()
    print(f"Valmis — recent_games: {len(recent)} tulemust, game_box_scores: {len(boxes)} box score'i.")
finally:
    db.close()
