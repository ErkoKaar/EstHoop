"""
Asendab koondise mängu Eesti 67 : 96 Soome (30.08.2026, FIBA gameId 127085) box score'i mängijate
nimekirjad täisstatistikaga. Olemasolev kirje NationalTeamCache.game_box_scores all oli vanas
vormingus (puudusid fg3, ft, oreb, dreb, to, pf); veerandid ja kuupäev jäävad DB-st alles.

Mängijate numbrid on võetud FIBA mängulehelt:
https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-european-qualifiers/games/127085-EST-FIN
Turvaline korduskäivitada.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models

GAME_ID = "fiba-127085"


def player(name, min_, pts, reb, ast, stl, blk, fg, fg3, ft, oreb, dreb, to, pf, pm, eff):
    return {
        "name": name, "min": min_, "pts": pts, "reb": reb, "ast": ast, "stl": stl, "blk": blk,
        "fg": fg, "fg3": fg3, "ft": ft, "oreb": oreb, "dreb": dreb, "to": to, "pf": pf,
        "pm": str(pm), "eff": eff,
    }


def dnp(name):
    return player(name, "0:00", 0, 0, 0, 0, 0, "0/0", "0/0", "0/0", 0, 0, 0, 0, 0, 0)


ESTONIA = [
    player("Henri Drell",       "16:02",  2, 3, 3, 0, 0, "1/10", "0/4", "0/0", 1, 2, 3, 4, -19, -4),
    player("Sander Raieste",    "26:01",  7, 5, 3, 1, 0, "3/5",  "1/2", "0/0", 2, 3, 2, 3, -21, 12),
    player("Kaspar Treier",      "7:09",  7, 1, 0, 0, 0, "2/4",  "1/3", "2/2", 1, 0, 0, 2,  -7,  6),
    player("Matthias Tass",     "14:19",  6, 1, 2, 0, 0, "2/2",  "0/0", "2/2", 1, 0, 1, 0, -10,  8),
    player("Kregor Hermet",     "18:40", 10, 4, 0, 0, 0, "4/7",  "2/4", "0/0", 0, 4, 0, 1, -13, 11),
    player("Maik-Kalev Kotsar", "25:05",  8, 5, 1, 2, 0, "3/5",  "0/0", "2/4", 2, 3, 0, 3, -17, 12),
    player("Kasper Suurorg",    "18:48",  3, 0, 2, 0, 0, "0/2",  "0/0", "3/3", 0, 0, 4, 0, -10, -1),
    player("Janari Joesaar",    "15:51",  2, 1, 1, 0, 0, "0/1",  "0/1", "2/2", 1, 0, 0, 3,  -4,  3),
    player("Joonas Riismaa",     "9:40",  5, 0, 0, 3, 0, "2/3",  "1/2", "0/0", 0, 0, 0, 2, -10,  7),
    player("Artur Konontsuk",   "16:02",  2, 5, 1, 0, 0, "1/7",  "0/3", "0/0", 1, 4, 0, 5, -16,  2),
    player("Markus Ilver",       "7:15",  0, 0, 0, 0, 0, "0/2",  "0/2", "0/0", 0, 0, 0, 0,  -3, -2),
    player("Kristian Kullamae", "25:08", 15, 4, 5, 0, 0, "4/12", "2/6", "5/5", 1, 3, 4, 4, -15, 12),
]

FINLAND = [
    player("Miro Little",       "21:19", 15,  4, 0, 0, 0, "5/7",  "1/3", "4/4", 0, 4, 2, 3, 21, 15),
    player("Olivier Nkamhoua",  "33:11", 18,  8, 4, 3, 0, "7/14", "0/4", "4/6", 2, 6, 1, 1, 26, 23),
    dnp("Henri Kantonen"),
    player("Perttu Blomgren",    "2:15",  0,  0, 0, 0, 0, "0/1",  "0/1", "0/0", 0, 0, 0, 1, -2, -1),
    player("Mikael Jantunen",   "29:55", 10,  3, 1, 1, 0, "4/7",  "0/2", "2/4", 0, 3, 1, 3, 25,  9),
    player("Elias Valtonen",    "29:00", 11,  4, 2, 0, 0, "4/8",  "2/6", "1/1", 1, 3, 0, 3, 13, 13),
    player("Alexander Madsen",  "13:45",  3,  4, 0, 4, 0, "1/1",  "0/0", "1/2", 3, 1, 0, 3, 14, 10),
    player("Edon Maxhuni",      "27:22", 18,  1, 3, 0, 0, "6/10", "4/6", "2/3", 0, 1, 3, 2, 26, 14),
    player("Lauri Markkanen",   "25:30", 21, 10, 2, 0, 2, "6/13", "3/5", "6/8", 4, 6, 0, 2, 22, 26),
    player("Mustapha Amzil",    "17:43",  0,  2, 2, 1, 0, "0/3",  "0/0", "0/0", 1, 1, 1, 2,  0,  1),
    dnp("Ilari Seppala"),
]

HOME_SCORE, AWAY_SCORE = 67, 96
assert sum(p["pts"] for p in ESTONIA) == HOME_SCORE
assert sum(p["pts"] for p in FINLAND) == AWAY_SCORE


db = SessionLocal()
try:
    row = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == "game_box_scores").first()
    boxes = list(row.data or []) if row else []
    box = next((b for b in boxes if b["id"] == GAME_ID), None)
    if box is None:
        sys.exit(f"Mängu {GAME_ID} box score'i pole DB-s — lisa see enne.")
    assert box["homeTeam"] == "Estonia" and box["awayTeam"] == "Finland"
    assert box["homeScore"] == HOME_SCORE and box["awayScore"] == AWAY_SCORE

    updated = {
        **box,
        "homePlayers": sorted(ESTONIA, key=lambda p: p["pts"], reverse=True),
        "awayPlayers": sorted(FINLAND, key=lambda p: p["pts"], reverse=True),
    }
    row.data = [updated if b["id"] == GAME_ID else b for b in boxes]
    db.commit()
    print(f"Valmis — {GAME_ID} mängijad asendatud, veerandid: {updated['quarters']}")
finally:
    db.close()
