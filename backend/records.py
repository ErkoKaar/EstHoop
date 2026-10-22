"""
Koondise ametlike mängude rekordid: algseis (data/koondise_rekordid.json, sport24.ee seisuga
30.08.2026) + hilisemad mängud NationalTeamCache.game_box_scores'ist.

Seis arvutatakse alati algseisust uuesti, mitte eelmise seisu pealt edasi. Nii jõuab ka hiljem
parandatud box score (vt migrations 19–21) rekorditesse ja korduskäivitus ei loe mängu topelt.
sport24 robots.txt keelab automaatse kraapimise, seega algseisu ei uuendata sealt kunagi.
"""
import json
import os
import unicodedata
from datetime import datetime
from zoneinfo import ZoneInfo

BASELINE_PATH = os.path.join(os.path.dirname(__file__), "data", "koondise_rekordid.json")
TALLINN = ZoneInfo("Europe/Tallinn")
TOP = 10
TEAM_TOP = 5

# FIBA box score'is on riigid inglise keeles, algseisus eesti keeles
OPPONENT_ET = {
    "Latvia": "Läti", "Lithuania": "Leedu", "Finland": "Soome", "Sweden": "Rootsi",
    "Norway": "Norra", "Denmark": "Taani", "Iceland": "Island", "Poland": "Poola",
    "Germany": "Saksamaa", "France": "Prantsusmaa", "Spain": "Hispaania", "Italy": "Itaalia",
    "Portugal": "Portugal", "Belgium": "Belgia", "Netherlands": "Holland",
    "Great Britain": "Suurbritannia", "Ireland": "Iirimaa", "Ukraine": "Ukraina",
    "Czech Republic": "Tšehhi", "Czechia": "Tšehhi", "Slovakia": "Slovakkia",
    "Hungary": "Ungari", "Austria": "Austria", "Switzerland": "Šveits",
    "Slovenia": "Sloveenia", "Croatia": "Horvaatia", "Serbia": "Serbia",
    "Bosnia and Herzegovina": "Bosnia ja Hertsegoviina", "Montenegro": "Montenegro",
    "North Macedonia": "Põhja-Makedoonia", "Albania": "Albaania", "Kosovo": "Kosovo",
    "Greece": "Kreeka", "Turkey": "Türgi", "Türkiye": "Türgi", "Bulgaria": "Bulgaaria",
    "Romania": "Rumeenia", "Moldova": "Moldova", "Georgia": "Gruusia", "Armenia": "Armeenia",
    "Azerbaijan": "Aserbaidžaan", "Israel": "Iisrael", "Cyprus": "Küpros",
    "Luxembourg": "Luksemburg", "Belarus": "Valgevene", "Russia": "Venemaa",
}


def load_baseline():
    with open(BASELINE_PATH, encoding="utf-8") as f:
        return json.load(f)


def name_key(name):
    """FIBA kirjutab "Kullamae", sport24 "Kullamäe"; sidekriipsud ja suurtähed ei loe."""
    plain = unicodedata.normalize("NFKD", name)
    plain = "".join(c for c in plain if not unicodedata.combining(c))
    return " ".join(plain.replace("-", " ").lower().split())


def _played(p):
    # Kirja pandud, aga väljakule mitte jõudnud mängija ("0:00") ei saa mängu kirja
    try:
        mins, secs = str(p.get("min") or "").split(":")
        return int(mins) * 60 + int(secs) > 0
    except ValueError:
        return any(p.get(k) for k in ("pts", "reb", "ast"))


def _estonia_side(box):
    if box.get("homeTeam") == "Estonia":
        return box.get("homePlayers") or [], box["homeScore"], box["awayScore"], box.get("awayTeam")
    if box.get("awayTeam") == "Estonia":
        return box.get("awayPlayers") or [], box["awayScore"], box["homeScore"], box.get("homeTeam")
    return None


def game_date(box):
    return datetime.fromtimestamp(box["date"], TALLINN).date().isoformat()


def new_games(baseline, boxes):
    """Algseisu järel mängitud mängud, mille Eesti box score klapib lõppskooriga."""
    games, skipped = [], []
    for box in sorted(boxes, key=lambda b: b["date"]):
        if game_date(box) <= baseline["seisuga"]:
            continue
        side = _estonia_side(box)
        if side is None:
            continue
        players, est, opp, opp_name = side
        # Poolik box score annaks valed karjäärisummad; järgmine käivitus proovib uuesti
        if not players or sum(p.get("pts", 0) for p in players) != est:
            skipped.append(box["id"])
            continue
        games.append({
            "id": box["id"],
            "date": game_date(box),
            "opponent": OPPONENT_ET.get(opp_name, opp_name),
            "score": [est, opp],
            "players": [p for p in players if _played(p)],
        })
    return games, skipped


def _by_margin(g):
    return g["score"][0] - g["score"][1]


def compute(baseline, games):
    players = {name_key(p["name"]): {"name": p["name"], "games": p["games"], "points": p["points"]}
               for p in baseline["players"]}
    single = list(baseline["single_game_points"])
    team = list({(g["date"], g["opponent"]): g for g in
                 baseline["biggest_wins"] + baseline["biggest_losses"] + baseline["most_points"]}.values())

    for g in games:
        for p in g["players"]:
            entry = players.setdefault(name_key(p["name"]), {"name": p["name"], "games": 0, "points": 0})
            entry["games"] += 1
            entry["points"] += p.get("pts", 0)
            single.append({"name": entry["name"], "points": p.get("pts", 0),
                           "date": g["date"], "opponent": g["opponent"]})
        team.append({"date": g["date"], "opponent": g["opponent"], "score": g["score"]})

    # Kõik mängud (ka sõprus- ja ENSV mängud): uued ametlikud mängud lisanduvad ka siia,
    # uute sõprusmängude kohta automaatset allikat pole
    koik = baseline.get("koik") or {"players": [], "single_game_points": []}
    koik_players = {name_key(p["name"]): dict(p) for p in koik["players"]}
    koik_single = list(koik["single_game_points"])
    for g in games:
        for p in g["players"]:
            entry = koik_players.setdefault(name_key(p["name"]), {"name": p["name"], "games": 0})
            entry["games"] += 1
            koik_single.append({"name": entry["name"], "points": p.get("pts", 0),
                                "date": g["date"], "opponent": g["opponent"]})

    # Võrdse tulemuse korral jääb ettepoole see, kes selle esimesena saavutas
    single.sort(key=lambda s: (-s["points"], s["date"]))
    koik_single.sort(key=lambda s: (-s["points"], s["date"]))
    return {
        "seisuga": max([baseline["seisuga"]] + [g["date"] for g in games]),
        "games_counted": [g["id"] for g in games],
        "players": sorted(players.values(), key=lambda p: (-p["games"], -p["points"], p["name"])),
        "koik": {
            "players": sorted(koik_players.values(), key=lambda p: (-p["games"], p["name"])),
            "single_game_points": koik_single[:TOP + 5],
        },
        "single_game_points": single[:TOP + 5],
        "biggest_wins": sorted(team, key=lambda g: (-_by_margin(g), g["date"]))[:TEAM_TOP + 1],
        "biggest_losses": sorted(team, key=lambda g: (_by_margin(g), g["date"]))[:TEAM_TOP + 1],
        "most_points": sorted(team, key=lambda g: (-g["score"][0], g["date"]))[:TEAM_TOP + 1],
    }


def leaderboard(players, field, limit=TOP):
    """Edetabel jagatud kohtadega: võrdse arvuga mängijad saavad sama koha."""
    ordered = sorted(players, key=lambda p: (-p[field], p["name"]))
    rows = []
    for i, p in enumerate(ordered):
        rank = rows[-1]["rank"] if rows and rows[-1]["value"] == p[field] else i + 1
        rows.append({"rank": rank, "name": p["name"], "value": p[field]})
    return [r for r in rows if r["rank"] <= limit]


def public_view(state):
    """API ja lehe jaoks: edetabelid, mitte kõigi 100+ mängija summad."""
    koik = state.get("koik") or {"players": [], "single_game_points": []}
    return {
        "seisuga": state["seisuga"],
        "games": leaderboard(state["players"], "games"),
        "points": leaderboard(state["players"], "points"),
        "koik": {
            "games": leaderboard(koik["players"], "games"),
            "single_game_points": koik["single_game_points"][:TOP],
        },
        "single_game_points": state["single_game_points"][:TOP],
        "biggest_wins": state["biggest_wins"][:TEAM_TOP],
        "biggest_losses": state["biggest_losses"][:TEAM_TOP],
        "most_points": state["most_points"][:TEAM_TOP],
    }


def _game_label(g):
    est, opp = g["score"]
    return f"Eesti–{g['opponent']} {est}:{opp} ({g['date']})"


def changes(prev, cur):
    """Muutused eelmise seisuga võrreldes, inimloetavate ridadena Telegrami jaoks."""
    lines = []

    prev_names = {name_key(p["name"]) for p in prev["players"]}
    for p in cur["players"]:
        if name_key(p["name"]) not in prev_names:
            lines.append(f"Debüüt ametlikus mängus: {p['name']}")

    # Vanas salvestatud seisus "koik" puudub: siis seda edetabelit esimesel korral ei võrrelda
    boards = [(prev["players"], cur["players"], "games", "mängude", "mängu"),
              (prev["players"], cur["players"], "points", "punktide", "p")]
    if prev.get("koik"):
        boards.append((prev["koik"]["players"], cur["koik"]["players"], "games", "kõigi mängude", "mängu"))
    for prev_players, cur_players, field, label, unit in boards:
        before = {name_key(r["name"]): r for r in leaderboard(prev_players, field, limit=10_000)}
        after = leaderboard(cur_players, field)
        for row in after:
            old = before.get(name_key(row["name"]))
            old_rank = old["rank"] if old else None
            if old_rank is not None and old_rank <= row["rank"]:
                continue
            passed = [r["name"] for r in after
                      if r["rank"] > row["rank"] and before.get(name_key(r["name"]), {}).get("rank", 10_000) < (old_rank or 10_000)]
            text = f"{row['name']}: {label} edetabelis {old_rank or '–'}. → {row['rank']}. koht ({row['value']} {unit})"
            if passed:
                text += f", möödus: {', '.join(passed)}"
            if row["rank"] == 1:
                shared = sum(1 for r in after if r["rank"] == 1) > 1
                text = ("Jagab rekordit! " if shared else "UUS REKORD! ") + text
            lines.append(text)

    prev_single = {(s["name"], s["date"], s["points"]) for s in prev["single_game_points"][:TOP]}
    best = cur["single_game_points"][0]["points"]
    for i, s in enumerate(cur["single_game_points"][:TOP]):
        if (s["name"], s["date"], s["points"]) in prev_single:
            continue
        text = (f"{s['name']} viskas {s['points']} punkti (vs {s['opponent']}, {s['date']}): "
                f"{i + 1}. tulemus ametlike mängude ajaloos")
        prefix = "UUS REKORD! " if i == 0 else "Kordas rekordit! " if s["points"] == best else ""
        lines.append(prefix + text)

    for key, label in (("biggest_wins", "suurim võit"), ("biggest_losses", "suurim kaotus"),
                       ("most_points", "enim visatud punkte")):
        prev_games = {(g["date"], g["opponent"]) for g in prev[key][:TEAM_TOP]}
        for i, g in enumerate(cur[key][:TEAM_TOP]):
            if (g["date"], g["opponent"]) not in prev_games:
                lines.append(f"Meeskond, {label}: {_game_label(g)} on nüüd ajaloo {i + 1}. kohal")

    return lines
