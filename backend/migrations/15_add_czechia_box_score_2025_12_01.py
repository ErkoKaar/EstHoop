"""
Lisab käsitsi box score'i koondise mängule Eesti 92 : 97 Tšehhi (01.12.2025, FIBA gameId 127608)
tabelisse NationalTeamCache (game_box_scores). Tulemus ise on recent_games all juba olemas.

Box score jäi 09_refresh_national_team.py-l vahele: FIBA "latest roster" ei kata enam selle akna
koosseisu. Mängijate numbrid on võetud FIBA mängulehelt:
https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-european-qualifiers/games/127608-EST-CZE
Turvaline korduskäivitada — sama ID kirje asendatakse.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models

GAME_ID = "fiba-127608"


def player(name, min_, pts, reb, ast, stl, blk, fg, fg3, ft, oreb, dreb, to, pf, pm, eff):
    return {
        "name": name, "min": min_, "pts": pts, "reb": reb, "ast": ast, "stl": stl, "blk": blk,
        "fg": fg, "fg3": fg3, "ft": ft, "oreb": oreb, "dreb": dreb, "to": to, "pf": pf,
        "pm": str(pm), "eff": eff,
    }


def dnp(name):
    return player(name, "0:00", 0, 0, 0, 0, 0, "0/0", "0/0", "0/0", 0, 0, 0, 0, 0, 0)


ESTONIA = [
    player("Henri Drell",       "21:25",  8, 2, 3, 0, 0, "3/7",  "1/4", "1/3", 1, 1, 3, 5, -17,  4),
    player("Kaspar Treier",     "25:46", 26, 2, 1, 1, 0, "7/11", "4/8", "8/9", 0, 2, 2, 4,   5, 23),
    player("Mihkel Kirves",      "9:21",  0, 0, 1, 0, 0, "0/1",  "0/0", "0/0", 0, 0, 0, 2,  -8,  0),
    player("Hugo Toom",          "1:37",  0, 0, 0, 0, 0, "0/0",  "0/0", "0/0", 0, 0, 0, 1,   2,  0),
    player("Janari Joesaar",    "25:23",  9, 4, 8, 0, 0, "3/4",  "2/2", "1/1", 3, 1, 0, 2,   7, 20),
    dnp("Leemet Bockler"),
    player("Joonas Riismaa",     "9:59",  8, 1, 1, 2, 0, "2/4",  "1/2", "3/3", 0, 1, 0, 2,   8, 10),
    player("Artur Konontsuk",   "32:45", 20, 5, 2, 0, 0, "8/14", "2/4", "2/2", 1, 4, 1, 2,  -7, 20),
    player("Markus Ilver",      "22:01", 11, 2, 0, 1, 1, "5/9",  "1/5", "0/1", 0, 2, 0, 0,   0, 10),
    player("Martin Paasoja",     "9:26",  5, 0, 4, 0, 0, "1/2",  "1/1", "2/2", 0, 0, 1, 1,   3,  7),
    player("Kristian Kullamae", "28:14",  2, 3, 7, 1, 0, "0/5",  "0/3", "2/2", 0, 3, 3, 2, -18,  5),
    player("Karl Johan Lips",   "14:03",  3, 3, 0, 0, 0, "1/2",  "0/0", "1/2", 1, 2, 2, 3,   0,  2),
]

CZECHIA = [
    player("Jan Zidek",          "11:30",  5, 0,  0, 0, 0, "2/3",  "1/1", "0/0", 0, 0, 1, 2,   1,  3),
    player("Patrick Samoura",     "5:57",  2, 0,  0, 0, 0, "1/1",  "0/0", "0/0", 0, 0, 0, 0,   1,  2),
    player("Vojtech Hruban",     "18:25", 11, 3,  0, 1, 0, "3/9",  "1/3", "4/4", 2, 1, 0, 3,  21,  9),
    player("Tomas Satoransky",   "32:23", 18, 4, 16, 3, 0, "7/9",  "2/3", "2/2", 0, 4, 4, 0,   6, 35),
    player("Martin Peterka",     "30:14",  9, 5,  2, 1, 0, "3/6",  "1/4", "2/4", 3, 2, 0, 0,  14, 12),
    player("Ondrej Sehnal",      "26:55", 15, 5,  5, 0, 0, "5/10", "5/7", "0/0", 1, 4, 1, 3,   3, 19),
    player("Martin Kriz",         "8:10",  0, 2,  0, 0, 0, "0/0",  "0/0", "0/0", 1, 1, 1, 3,  -6,  1),
    player("Richard Balint",     "22:08", 11, 0,  1, 0, 1, "3/11", "1/9", "4/4", 0, 0, 0, 2,  -8,  5),
    player("James Karnik",       "17:32", 10, 2,  0, 1, 0, "3/5",  "1/1", "3/4", 1, 1, 0, 3,  -2, 10),
    player("Martin Svoboda",     "12:34",  8, 0,  1, 0, 0, "3/3",  "0/0", "2/3", 0, 0, 0, 1,   3,  8),
    player("Frantisek Rylich",    "0:20",  0, 0,  0, 0, 0, "0/0",  "0/0", "0/0", 0, 0, 0, 0,  -2,  0),
    player("Tomas Kyzlink",      "13:52",  8, 1,  0, 0, 0, "3/5",  "1/1", "1/2", 0, 1, 0, 5,  -6,  6),
]

HOME_SCORE, AWAY_SCORE = 92, 97
assert sum(p["pts"] for p in ESTONIA) == HOME_SCORE
assert sum(p["pts"] for p in CZECHIA) == AWAY_SCORE

QUARTERS = [
    {"label": "Q1", "home": 29, "away": 27},
    {"label": "Q2", "home": 24, "away": 31},
    {"label": "Q3", "home": 21, "away": 22},
    {"label": "Q4", "home": 18, "away": 17},
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
    assert game["homeTeam"]["name"] == "Estonia" and game["awayTeam"]["name"] == "Czechia"
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
        "awayPlayers": sorted(CZECHIA, key=lambda p: p["pts"], reverse=True),
    }

    boxes = [b for b in load(db, "game_box_scores") if b["id"] != GAME_ID] + [box_score]
    boxes.sort(key=lambda b: b["date"], reverse=True)
    upsert(db, "game_box_scores", boxes)

    db.commit()
    print(f"Valmis — game_box_scores: {len(boxes)} box score'i.")
finally:
    db.close()
