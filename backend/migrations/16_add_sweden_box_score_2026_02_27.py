"""
Lisab käsitsi box score'i koondise mängule Rootsi 77 : 88 Eesti (27.02.2026, FIBA gameId 127610)
tabelisse NationalTeamCache (game_box_scores). Tulemus ise on recent_games all juba olemas.

Box score jäi 09_refresh_national_team.py-l vahele: FIBA "latest roster" ei kata enam selle akna
koosseisu. Mängijate numbrid on võetud FIBA mängulehelt:
https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-european-qualifiers/games/127610-SWE-EST
Turvaline korduskäivitada — sama ID kirje asendatakse.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models

GAME_ID = "fiba-127610"


def player(name, min_, pts, reb, ast, stl, blk, fg, fg3, ft, oreb, dreb, to, pf, pm, eff):
    return {
        "name": name, "min": min_, "pts": pts, "reb": reb, "ast": ast, "stl": stl, "blk": blk,
        "fg": fg, "fg3": fg3, "ft": ft, "oreb": oreb, "dreb": dreb, "to": to, "pf": pf,
        "pm": str(pm), "eff": eff,
    }


def dnp(name):
    return player(name, "0:00", 0, 0, 0, 0, 0, "0/0", "0/0", "0/0", 0, 0, 0, 0, 0, 0)


SWEDEN = [
    player("Denzel Andersson", "16:53",  0, 2, 0, 0, 1, "0/3",  "0/3",  "0/0", 0, 2, 0, 4,  -3,  0),
    player("Adam Ramstedt",     "1:41",  0, 0, 0, 0, 0, "0/0",  "0/0",  "0/0", 0, 0, 0, 1,  -3,  0),
    player("Wilhelm Falk",     "21:53",  6, 2, 0, 0, 0, "2/5",  "0/2",  "2/4", 1, 1, 1, 4,  -3,  2),
    player("Tobias Borg",      "24:09",  7, 2, 3, 1, 0, "2/7",  "1/4",  "2/3", 1, 1, 1, 2,  -6,  6),
    dnp("Felix Terins"),
    player("Kenny Pohto",      "15:33",  2, 3, 1, 0, 0, "1/2",  "0/0",  "0/0", 2, 1, 1, 1,  -2,  4),
    player("Ludde Hakanson",   "28:17", 21, 3, 6, 3, 0, "8/17", "3/10", "2/2", 1, 2, 1, 0,   1, 23),
    player("Nicholas Spires",  "12:59",  2, 2, 0, 0, 2, "1/3",  "0/2",  "0/0", 1, 1, 0, 2,  -9,  4),
    player("Melwin Pantzar",   "32:47", 16, 2, 4, 5, 0, "6/13", "2/5",  "2/4", 0, 2, 3, 2, -16, 15),
    player("Pierre Hampton",   "23:02", 13, 7, 1, 0, 0, "4/8",  "1/4",  "4/4", 3, 4, 2, 4,  -8, 15),
    player("Zaba Bangala",     "22:46", 10, 4, 1, 0, 0, "4/5",  "0/0",  "2/2", 1, 3, 1, 3,  -6, 13),
    dnp("Gustav Hansson"),
]

ESTONIA = [
    player("Henri Drell",       "23:04", 23, 3, 2, 0, 1, "7/12", "2/4", "7/8", 0, 3, 2, 3,   8, 21),
    player("Sander Raieste",    "19:44",  5, 3, 1, 0, 1, "2/4",  "1/3", "0/0", 0, 3, 1, 2,   3,  7),
    player("Kaspar Treier",     "21:44", 13, 2, 0, 0, 0, "4/8",  "1/3", "4/4", 1, 1, 3, 1,   4,  8),
    dnp("Mihkel Kirves"),
    player("Matthias Tass",      "7:42",  0, 0, 0, 0, 0, "0/1",  "0/0", "0/0", 0, 0, 1, 2,   5, -2),
    player("Kregor Hermet",     "13:13",  2, 1, 1, 0, 0, "0/3",  "0/1", "2/2", 0, 1, 1, 2,  -2,  0),
    player("Kasper Suurorg",    "23:55",  9, 3, 5, 0, 0, "3/6",  "1/3", "2/2", 1, 2, 2, 4,   6, 12),
    player("Janari Joesaar",    "28:45", 10, 5, 2, 2, 0, "4/6",  "0/2", "2/2", 2, 3, 1, 3,  17, 16),
    player("Joonas Riismaa",     "0:50",  0, 0, 0, 0, 0, "0/0",  "0/0", "0/0", 0, 0, 0, 0,   0,  0),
    player("Artur Konontsuk",   "30:36",  9, 6, 0, 0, 0, "3/6",  "1/3", "2/2", 2, 4, 1, 3,   7, 11),
    player("Kristian Kullamae", "22:32", 13, 4, 3, 0, 1, "4/10", "3/6", "2/2", 0, 4, 0, 2,  -1, 15),
    player("Karl Johan Lips",    "7:55",  4, 3, 0, 0, 0, "0/0",  "0/0", "4/4", 2, 1, 2, 0,   8,  5),
]

HOME_SCORE, AWAY_SCORE = 77, 88
assert sum(p["pts"] for p in SWEDEN) == HOME_SCORE
assert sum(p["pts"] for p in ESTONIA) == AWAY_SCORE

QUARTERS = [
    {"label": "Q1", "home": 22, "away": 22},
    {"label": "Q2", "home": 14, "away": 24},
    {"label": "Q3", "home": 22, "away": 11},
    {"label": "Q4", "home": 19, "away": 31},
]
assert sum(q["home"] for q in QUARTERS) == HOME_SCORE
assert sum(q["away"] for q in QUARTERS) == AWAY_SCORE


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
    game = next((e for e in load(db, "recent_games") if e["id"] == GAME_ID), None)
    if game is None:
        sys.exit(f"Mängu {GAME_ID} pole recent_games all — lisa enne tulemus.")
    assert game["homeTeam"]["name"] == "Sweden" and game["awayTeam"]["name"] == "Estonia"
    assert game["homeScore"]["current"] == HOME_SCORE and game["awayScore"]["current"] == AWAY_SCORE

    box_score = {
        "id": GAME_ID,
        "date": game["startTimestamp"],
        "homeTeam": game["homeTeam"]["name"],
        "awayTeam": game["awayTeam"]["name"],
        "homeScore": HOME_SCORE,
        "awayScore": AWAY_SCORE,
        "quarters": QUARTERS,
        "homePlayers": sorted(SWEDEN, key=lambda p: p["pts"], reverse=True),
        "awayPlayers": sorted(ESTONIA, key=lambda p: p["pts"], reverse=True),
    }

    boxes = [b for b in load(db, "game_box_scores") if b["id"] != GAME_ID] + [box_score]
    boxes.sort(key=lambda b: b["date"], reverse=True)
    upsert(db, "game_box_scores", boxes)

    db.commit()
    print(f"Valmis — game_box_scores: {len(boxes)} box score'i.")
finally:
    db.close()
