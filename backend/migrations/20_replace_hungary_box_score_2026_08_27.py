"""
Asendab koondise mängu Ungari 85 : 67 Eesti (27.08.2026, FIBA gameId 127083) box score'i mängijate
nimekirjad täisstatistikaga. Olemasolev kirje NationalTeamCache.game_box_scores all oli vanas
vormingus (puudusid fg3, ft, oreb, dreb, to, pf); veerandid ja kuupäev jäävad DB-st alles.

Mängijate numbrid on võetud FIBA mängulehelt:
https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-european-qualifiers/games/127083-HUN-EST
Turvaline korduskäivitada.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models

GAME_ID = "fiba-127083"


def player(name, min_, pts, reb, ast, stl, blk, fg, fg3, ft, oreb, dreb, to, pf, pm, eff):
    return {
        "name": name, "min": min_, "pts": pts, "reb": reb, "ast": ast, "stl": stl, "blk": blk,
        "fg": fg, "fg3": fg3, "ft": ft, "oreb": oreb, "dreb": dreb, "to": to, "pf": pf,
        "pm": str(pm), "eff": eff,
    }


def dnp(name):
    return player(name, "0:00", 0, 0, 0, 0, 0, "0/0", "0/0", "0/0", 0, 0, 0, 0, 0, 0)


HUNGARY = [
    dnp("Marcell Pongo"),
    player("Tamas Pallai",          "9:54",  9, 1, 0, 0, 0, "3/5",   "2/4", "1/2", 1, 0, 0, 0,  2,  7),
    player("Benedek Varadi",       "17:57", 11, 2, 2, 1, 0, "4/8",   "3/6", "0/0", 0, 2, 0, 1,  2, 12),
    player("Szilard Benke",        "24:58",  3, 2, 1, 2, 0, "1/5",   "1/2", "0/0", 0, 2, 0, 4, 17,  4),
    player("Vincent Valerio-Bodon", "17:05", 4, 2, 0, 2, 0, "0/1",   "0/1", "4/6", 1, 1, 0, 1,  8,  5),
    player("Boris Krnjajski",      "18:49",  6, 3, 4, 2, 0, "2/5",   "1/3", "1/2", 1, 2, 1, 2, 12, 10),
    player("Gyorgy Goloman",       "17:43",  1, 4, 0, 1, 1, "0/0",   "0/0", "1/2", 3, 1, 3, 4, 11,  3),
    player("Gergo Meleg",           "1:33",  0, 0, 0, 0, 0, "0/0",   "0/0", "0/0", 0, 0, 0, 0, -2,  0),
    player("Norbert Lukacs",       "22:55",  8, 1, 1, 1, 1, "3/5",   "1/3", "1/3", 1, 0, 0, 1, 10,  8),
    player("Zoltan Perl",          "27:11", 22, 5, 2, 0, 2, "10/15", "1/4", "1/2", 0, 5, 1, 0, 15, 24),
    player("Adam Somogyi",         "21:11",  3, 6, 5, 1, 0, "1/4",   "0/1", "1/2", 1, 5, 7, 3,  6,  4),
    player("Nate Reuvers",         "20:44", 18, 8, 1, 0, 0, "5/14",  "1/3", "7/9", 1, 7, 2, 3,  9, 14),
]

ESTONIA = [
    player("Henri Drell",       "25:44",  4, 4, 2, 0, 0, "1/6",   "0/2", "2/2", 1, 3, 5, 4, -19,  0),
    player("Sander Raieste",    "25:03",  9, 6, 0, 1, 0, "4/6",   "0/1", "1/2", 0, 6, 1, 4, -12, 12),
    player("Kaspar Treier",     "11:49",  2, 1, 0, 0, 0, "1/4",   "0/3", "0/0", 1, 0, 0, 1, -15,  0),
    player("Matthias Tass",     "11:38",  2, 3, 1, 0, 0, "1/3",   "0/0", "0/0", 1, 2, 1, 3,  -3,  3),
    player("Kregor Hermet",      "8:39",  3, 1, 1, 1, 0, "1/4",   "1/1", "0/0", 0, 1, 2, 1,   4,  1),
    player("Maik-Kalev Kotsar", "21:34",  7, 4, 0, 0, 1, "3/5",   "0/0", "1/2", 0, 4, 2, 2,  -8,  7),
    player("Kasper Suurorg",    "20:15", 10, 2, 4, 1, 0, "3/6",   "2/2", "2/2", 1, 1, 2, 2,  -9, 12),
    player("Janari Joesaar",    "19:36",  0, 2, 1, 2, 0, "0/1",   "0/1", "0/0", 0, 2, 0, 3,  -2,  4),
    dnp("Joonas Riismaa"),
    player("Artur Konontsuk",   "19:04",  4, 5, 1, 0, 0, "1/4",   "1/3", "1/2", 0, 5, 1, 4,  -7,  5),
    player("Markus Ilver",       "9:42",  0, 1, 0, 1, 0, "0/1",   "0/0", "0/0", 0, 1, 2, 1,  -9, -1),
    player("Kristian Kullamae", "26:56", 26, 5, 3, 2, 0, "11/19", "4/9", "0/0", 2, 3, 3, 1, -10, 25),
]

HOME_SCORE, AWAY_SCORE = 85, 67
assert sum(p["pts"] for p in HUNGARY) == HOME_SCORE
assert sum(p["pts"] for p in ESTONIA) == AWAY_SCORE


db = SessionLocal()
try:
    row = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == "game_box_scores").first()
    boxes = list(row.data or []) if row else []
    box = next((b for b in boxes if b["id"] == GAME_ID), None)
    if box is None:
        sys.exit(f"Mängu {GAME_ID} box score'i pole DB-s — lisa see enne.")
    assert box["homeTeam"] == "Hungary" and box["awayTeam"] == "Estonia"
    assert box["homeScore"] == HOME_SCORE and box["awayScore"] == AWAY_SCORE

    updated = {
        **box,
        "homePlayers": sorted(HUNGARY, key=lambda p: p["pts"], reverse=True),
        "awayPlayers": sorted(ESTONIA, key=lambda p: p["pts"], reverse=True),
    }
    row.data = [updated if b["id"] == GAME_ID else b for b in boxes]
    db.commit()
    print(f"Valmis — {GAME_ID} mängijad asendatud, veerandid: {updated['quarters']}")
finally:
    db.close()
