"""
Asendab koondise mängu Tšehhi 75 : 73 Eesti (06.07.2026, FIBA gameId 127611) box score'i mängijate
nimekirjad täisstatistikaga. Olemasolev kirje NationalTeamCache.game_box_scores all oli vanas
vormingus (puudusid fg3, ft, oreb, dreb, to, pf); veerandid ja kuupäev jäävad DB-st alles.

Mängijate numbrid on võetud FIBA mängulehelt:
https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-european-qualifiers/games/127611-CZE-EST
Turvaline korduskäivitada.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models

GAME_ID = "fiba-127611"


def player(name, min_, pts, reb, ast, stl, blk, fg, fg3, ft, oreb, dreb, to, pf, pm, eff):
    return {
        "name": name, "min": min_, "pts": pts, "reb": reb, "ast": ast, "stl": stl, "blk": blk,
        "fg": fg, "fg3": fg3, "ft": ft, "oreb": oreb, "dreb": dreb, "to": to, "pf": pf,
        "pm": str(pm), "eff": eff,
    }


def dnp(name):
    return player(name, "0:00", 0, 0, 0, 0, 0, "0/0", "0/0", "0/0", 0, 0, 0, 0, 0, 0)


CZECHIA = [
    player("Jan Zidek",         "8:24",  0, 1, 0, 0, 0, "0/2",  "0/2", "0/0", 0, 1, 0, 1,  1, -1),
    player("Patrick Samoura",   "5:50",  1, 2, 0, 1, 0, "0/2",  "0/1", "1/2", 1, 1, 0, 1,  1,  1),
    player("Jakub Necas",      "16:37",  4, 3, 0, 1, 0, "1/4",  "0/1", "2/2", 1, 2, 1, 1, -6,  4),
    player("Vojtech Sykora",    "4:06",  0, 1, 0, 1, 0, "0/1",  "0/1", "0/0", 0, 1, 1, 1, -3,  0),
    player("Adam Kejval",       "4:25",  0, 0, 0, 0, 0, "0/0",  "0/0", "0/0", 0, 0, 0, 1, -1,  0),
    player("Martin Peterka",   "31:36", 10, 7, 3, 0, 0, "4/6",  "2/4", "0/0", 1, 6, 1, 3,  1, 17),
    player("Ondrej Sehnal",    "31:46", 15, 5, 8, 1, 0, "6/13", "3/6", "0/1", 1, 4, 1, 1, 12, 20),
    player("Vit Krejci",       "35:02", 12, 5, 3, 1, 1, "3/10", "2/8", "4/5", 1, 4, 4, 2,  1, 10),
    player("Richard Balint",   "26:48",  9, 1, 1, 2, 0, "3/8",  "3/5", "0/0", 1, 0, 4, 3,  1,  4),
    player("James Karnik",     "21:26", 14, 3, 0, 0, 0, "6/10", "0/0", "2/2", 1, 2, 1, 3, -1, 12),
    player("Martin Svoboda",   "13:59", 10, 2, 1, 0, 0, "3/4",  "0/0", "4/6", 1, 1, 0, 4,  4, 10),
    dnp("Frantisek Rylich"),
]

ESTONIA = [
    player("Sander Raieste",    "20:34",  4, 3, 1, 2, 1, "2/3",  "0/0",  "0/0", 2, 1, 3, 4,   3,  7),
    player("Kaspar Treier",     "15:07",  5, 1, 0, 0, 0, "2/5",  "0/3",  "1/2", 0, 1, 1, 0,  -4,  1),
    player("Matthias Tass",     "11:27",  4, 6, 2, 1, 1, "1/1",  "0/0",  "2/2", 3, 3, 0, 2,  -6, 14),
    player("Kregor Hermet",      "3:16",  0, 0, 0, 0, 0, "0/0",  "0/0",  "0/0", 0, 0, 0, 0,  -3,  0),
    player("Maik-Kalev Kotsar", "28:24", 19, 9, 2, 3, 0, "8/14", "0/0",  "3/5", 4, 5, 2, 1,   4, 23),
    player("Stefan Vaaks",      "25:35", 19, 1, 5, 1, 1, "7/16", "5/12", "0/2", 0, 1, 2, 1,   7, 14),
    player("Kasper Suurorg",    "17:44",  6, 2, 2, 0, 0, "3/9",  "0/4",  "0/0", 1, 1, 1, 3, -12,  3),
    player("Janari Joesaar",    "29:12",  4, 5, 3, 1, 1, "2/9",  "0/5",  "0/0", 0, 5, 1, 3,  -6,  6),
    player("Leemet Bockler",    "12:51",  3, 2, 1, 0, 0, "1/3",  "1/2",  "0/0", 1, 1, 0, 1,  14,  4),
    player("Joonas Riismaa",     "2:08",  0, 0, 0, 0, 0, "0/0",  "0/0",  "0/0", 0, 0, 1, 0,   0, -1),
    player("Artur Konontsuk",   "29:39",  9, 6, 1, 0, 0, "2/6",  "1/4",  "4/4", 2, 4, 0, 4,  -2, 12),
    player("Markus Ilver",       "4:03",  0, 0, 0, 0, 0, "0/1",  "0/0",  "0/0", 0, 0, 1, 2,  -5, -2),
]

HOME_SCORE, AWAY_SCORE = 75, 73
assert sum(p["pts"] for p in CZECHIA) == HOME_SCORE
assert sum(p["pts"] for p in ESTONIA) == AWAY_SCORE


def load(db, key):
    row = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == key).first()
    return (row.data or []) if row else []


db = SessionLocal()
try:
    row = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == "game_box_scores").first()
    boxes = list(row.data or []) if row else []
    box = next((b for b in boxes if b["id"] == GAME_ID), None)
    if box is None:
        sys.exit(f"Mängu {GAME_ID} box score'i pole DB-s — lisa see enne.")
    assert box["homeTeam"] == "Czechia" and box["awayTeam"] == "Estonia"
    assert box["homeScore"] == HOME_SCORE and box["awayScore"] == AWAY_SCORE

    updated = {
        **box,
        "homePlayers": sorted(CZECHIA, key=lambda p: p["pts"], reverse=True),
        "awayPlayers": sorted(ESTONIA, key=lambda p: p["pts"], reverse=True),
    }
    row.data = [updated if b["id"] == GAME_ID else b for b in boxes]
    db.commit()
    print(f"Valmis — {GAME_ID} mängijad asendatud, veerandid: {updated['quarters']}")
finally:
    db.close()
