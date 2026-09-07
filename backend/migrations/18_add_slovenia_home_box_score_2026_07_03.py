"""
Lisab käsitsi box score'i koondise mängule Eesti 93 : 62 Sloveenia (03.07.2026, FIBA gameId 127603)
tabelisse NationalTeamCache (game_box_scores). Tulemus ise on recent_games all juba olemas.

Box score jäi 09_refresh_national_team.py-l vahele: FIBA "latest roster" ei kata enam selle akna
koosseisu. Mängijate numbrid on võetud FIBA mängulehelt:
https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-european-qualifiers/games/127603-EST-SLO
Turvaline korduskäivitada — sama ID kirje asendatakse.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models

GAME_ID = "fiba-127603"


def player(name, min_, pts, reb, ast, stl, blk, fg, fg3, ft, oreb, dreb, to, pf, pm, eff):
    return {
        "name": name, "min": min_, "pts": pts, "reb": reb, "ast": ast, "stl": stl, "blk": blk,
        "fg": fg, "fg3": fg3, "ft": ft, "oreb": oreb, "dreb": dreb, "to": to, "pf": pf,
        "pm": str(pm), "eff": eff,
    }


ESTONIA = [
    player("Sander Raieste",   "21:23",  0,  1, 2, 1, 0, "0/2",  "0/2", "0/0", 0, 1, 1, 3, 13,  1),
    player("Kaspar Treier",     "6:53",  3,  2, 0, 0, 0, "1/2",  "1/2", "0/0", 0, 2, 1, 0,  4,  3),
    player("Matthias Tass",    "17:03",  9,  6, 1, 0, 1, "3/3",  "0/0", "3/4", 2, 4, 1, 1, 10, 15),
    player("Kregor Hermet",    "14:29",  2,  1, 0, 0, 0, "1/2",  "0/0", "0/0", 0, 1, 0, 3, 14,  2),
    player("Maik-Kalev Kotsar", "22:19", 12, 12, 9, 0, 0, "6/9",  "0/0", "0/0", 5, 7, 0, 3, 22, 30),
    player("Stefan Vaaks",     "25:54", 20,  4, 7, 0, 0, "8/15", "2/8", "2/3", 1, 3, 1, 1, 24, 22),
    player("Kasper Suurorg",   "22:16",  8,  2, 4, 2, 1, "3/10", "1/4", "1/2", 0, 2, 0, 3, 12,  9),
    player("Janari Joesaar",   "21:30",  4,  4, 4, 1, 0, "2/5",  "0/3", "0/0", 0, 4, 0, 3, 18, 10),
    player("Leemet Bockler",    "7:09",  3,  1, 0, 1, 0, "1/3",  "1/3", "0/0", 0, 1, 1, 2,  3,  2),
    player("Joonas Riismaa",    "7:04",  3,  0, 0, 0, 0, "1/2",  "1/2", "0/0", 0, 0, 1, 2,  6,  1),
    player("Artur Konontsuk",  "19:16", 19,  1, 0, 2, 0, "6/11", "4/7", "3/4", 0, 1, 1, 0, 12, 15),
    player("Markus Ilver",     "14:45", 10,  4, 0, 1, 0, "3/6",  "2/4", "2/2", 1, 3, 0, 1, 17, 12),
]

SLOVENIA = [
    player("Mark Padjen",        "8:25",  0, 0, 0, 0, 0, "0/2",  "0/2", "0/0", 0, 0, 0, 0, -11, -2),
    player("Ziga Samar",        "19:55",  8, 1, 5, 1, 0, "4/9",  "0/2", "0/0", 1, 0, 1, 3, -13,  9),
    player("Edo Muric",         "21:35",  3, 4, 1, 1, 0, "1/5",  "1/5", "0/0", 1, 3, 4, 1, -15,  1),
    player("Rok Radovic",       "19:20",  2, 4, 2, 1, 0, "1/4",  "0/3", "0/0", 1, 3, 0, 4,  -8,  6),
    player("Gregor Hrovat",     "21:04", 11, 2, 1, 0, 1, "3/10", "3/3", "2/2", 1, 1, 1, 3, -11,  7),
    player("Urban Kroflic",     "24:17",  7, 2, 0, 0, 0, "2/6",  "0/2", "3/4", 1, 1, 1, 3,  -6,  3),
    player("Tim Tomazic",        "2:19",  1, 0, 0, 0, 0, "0/0",  "0/0", "1/2", 0, 0, 0, 1,  -3,  0),
    player("Miha Cerkvenik",    "24:13",  9, 4, 0, 0, 1, "3/5",  "2/3", "1/2", 2, 2, 1, 2, -23, 10),
    player("Sasa Ciani",         "7:07",  2, 1, 0, 1, 0, "1/2",  "0/0", "0/0", 0, 1, 0, 0,  -8,  3),
    player("Stefan Joksimovic", "17:13",  9, 3, 1, 1, 0, "2/8",  "0/4", "5/8", 0, 3, 0, 1, -23,  5),
    player("Alen Omic",         "25:47",  9, 8, 1, 0, 0, "4/7",  "0/1", "1/3", 2, 6, 1, 2, -23, 12),
    player("Vit Hrabar",         "8:44",  1, 1, 1, 0, 0, "0/1",  "0/1", "1/2", 0, 1, 1, 1, -11,  0),
]

HOME_SCORE, AWAY_SCORE = 93, 62
assert sum(p["pts"] for p in ESTONIA) == HOME_SCORE
assert sum(p["pts"] for p in SLOVENIA) == AWAY_SCORE

QUARTERS = [
    {"label": "Q1", "home": 22, "away": 16},
    {"label": "Q2", "home": 24, "away": 15},
    {"label": "Q3", "home": 27, "away": 20},
    {"label": "Q4", "home": 20, "away": 11},
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
    assert game["homeTeam"]["name"] == "Estonia" and game["awayTeam"]["name"] == "Slovenia"
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
        "awayPlayers": sorted(SLOVENIA, key=lambda p: p["pts"], reverse=True),
    }

    boxes = [b for b in load(db, "game_box_scores") if b["id"] != GAME_ID] + [box_score]
    boxes.sort(key=lambda b: b["date"], reverse=True)
    upsert(db, "game_box_scores", boxes)

    db.commit()
    print(f"Valmis — game_box_scores: {len(boxes)} box score'i.")
finally:
    db.close()
