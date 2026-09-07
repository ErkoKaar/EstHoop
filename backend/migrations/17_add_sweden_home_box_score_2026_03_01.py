"""
Lisab käsitsi box score'i koondise mängule Eesti 69 : 79 Rootsi (01.03.2026, FIBA gameId 127606)
tabelisse NationalTeamCache (game_box_scores). Tulemus ise on recent_games all juba olemas.

Box score jäi 09_refresh_national_team.py-l vahele: FIBA "latest roster" ei kata enam selle akna
koosseisu. Mängijate numbrid on võetud FIBA mängulehelt:
https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-european-qualifiers/games/127606-EST-SWE
Turvaline korduskäivitada — sama ID kirje asendatakse.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models

GAME_ID = "fiba-127606"


def player(name, min_, pts, reb, ast, stl, blk, fg, fg3, ft, oreb, dreb, to, pf, pm, eff):
    return {
        "name": name, "min": min_, "pts": pts, "reb": reb, "ast": ast, "stl": stl, "blk": blk,
        "fg": fg, "fg3": fg3, "ft": ft, "oreb": oreb, "dreb": dreb, "to": to, "pf": pf,
        "pm": str(pm), "eff": eff,
    }


def dnp(name):
    return player(name, "0:00", 0, 0, 0, 0, 0, "0/0", "0/0", "0/0", 0, 0, 0, 0, 0, 0)


ESTONIA = [
    player("Henri Drell",       "24:29", 16, 2, 3, 0, 1, "6/11", "2/5", "2/7", 1, 1, 1, 2,   0, 11),
    player("Sander Raieste",    "18:56",  4, 4, 3, 1, 0, "1/4",  "0/2", "2/2", 2, 2, 0, 2, -14,  9),
    player("Kaspar Treier",     "24:39", 12, 2, 4, 0, 1, "4/11", "2/7", "2/6", 0, 2, 2, 3,  -4,  6),
    player("Mihkel Kirves",      "8:36",  0, 1, 0, 1, 0, "0/1",  "0/0", "0/0", 0, 1, 1, 1,  -2,  0),
    player("Siim-Sander Vene",  "11:02",  3, 1, 0, 0, 0, "1/3",  "1/1", "0/0", 1, 0, 0, 3,   3,  2),
    player("Kregor Hermet",     "12:35",  4, 3, 1, 0, 0, "2/4",  "0/1", "0/0", 0, 3, 0, 4,  -2,  6),
    player("Kasper Suurorg",    "22:21", 11, 0, 4, 0, 1, "4/7",  "3/5", "0/0", 0, 0, 0, 3,  -1, 13),
    player("Janari Joesaar",    "24:47",  5, 6, 0, 2, 0, "2/5",  "1/2", "0/1", 3, 3, 1, 4, -13,  8),
    player("Joonas Riismaa",     "6:45",  2, 3, 0, 0, 0, "0/0",  "0/0", "2/4", 2, 1, 1, 0,   4,  2),
    player("Artur Konontsuk",   "20:59",  2, 2, 1, 1, 0, "1/8",  "0/1", "0/0", 0, 2, 0, 0, -10, -1),
    player("Kristian Kullamae", "24:51", 10, 3, 3, 1, 0, "2/7",  "1/5", "5/5", 0, 3, 4, 2, -11,  8),
    dnp("Karl Johan Lips"),
]

SWEDEN = [
    player("Adam Ramstedt",     "3:21",  4,  1, 1, 0, 0, "2/2",  "0/0", "0/1", 1, 0, 0, 1,  3,  5),
    player("Oskar Palmquist",  "15:49",  2,  3, 0, 0, 0, "0/1",  "0/1", "2/2", 0, 3, 0, 2, -6,  4),
    player("Wilhelm Falk",     "24:02", 11,  5, 1, 1, 0, "3/6",  "0/1", "5/7", 0, 5, 0, 2, 14, 13),
    player("Tobias Borg",      "21:27", 13,  2, 2, 0, 0, "4/10", "2/6", "3/3", 0, 2, 1, 2, -7, 10),
    player("Felix Terins",      "0:40",  0,  0, 0, 0, 0, "0/0",  "0/0", "0/0", 0, 0, 0, 1,  0,  0),
    player("Kenny Pohto",      "10:56",  0,  3, 2, 1, 1, "0/1",  "0/0", "0/0", 1, 2, 4, 2,  2,  2),
    player("Ludde Hakanson",   "30:06", 18,  3, 3, 1, 0, "6/14", "4/9", "2/2", 0, 3, 5, 3, 14, 12),
    player("Nicholas Spires",  "21:41", 10,  7, 1, 2, 3, "4/7",  "2/5", "0/0", 1, 6, 1, 2,  7, 19),
    player("Melwin Pantzar",   "26:46",  8,  6, 7, 0, 0, "2/9",  "0/5", "4/6", 3, 3, 2, 4, 17, 10),
    player("Pierre Hampton",   "18:26",  7,  2, 2, 2, 0, "1/5",  "1/3", "4/4", 2, 0, 1, 4,  3,  8),
    player("Zaba Bangala",     "25:43",  6, 10, 1, 0, 0, "1/2",  "0/0", "4/6", 5, 5, 2, 2,  5, 12),
    player("Gustav Hansson",    "1:04",  0,  0, 0, 0, 0, "0/0",  "0/0", "0/0", 0, 0, 0, 0, -2,  0),
]

HOME_SCORE, AWAY_SCORE = 69, 79
assert sum(p["pts"] for p in ESTONIA) == HOME_SCORE
assert sum(p["pts"] for p in SWEDEN) == AWAY_SCORE

QUARTERS = [
    {"label": "Q1", "home": 22, "away": 23},
    {"label": "Q2", "home": 16, "away": 15},
    {"label": "Q3", "home": 17, "away": 13},
    {"label": "Q4", "home": 14, "away": 28},
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
    assert game["homeTeam"]["name"] == "Estonia" and game["awayTeam"]["name"] == "Sweden"
    assert game["homeScore"]["current"] == HOME_SCORE and game["awayScore"]["current"] == AWAY_SCORE

    box_score = {
        "id": GAME_ID,
        "date": game["startTimestamp"],
        "homeTeam": game["homeTeam"]["name"],
        "awayTeam": game["awayTeam"]["name"],
        "homeScore": HOME_SCORE,
        "awayScore": AWAY_SCORE,
        "quarters": QUARTERS,
        "homePlayers": sorted(ESTONIA, key=lambda p: p["pts"], reverse=True),
        "awayPlayers": sorted(SWEDEN, key=lambda p: p["pts"], reverse=True),
    }

    boxes = [b for b in load(db, "game_box_scores") if b["id"] != GAME_ID] + [box_score]
    boxes.sort(key=lambda b: b["date"], reverse=True)
    upsert(db, "game_box_scores", boxes)

    db.commit()
    print(f"Valmis — game_box_scores: {len(boxes)} box score'i.")
finally:
    db.close()
