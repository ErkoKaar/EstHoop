import re
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

NATIONAL_TEAM_LEAGUE = "WC-QR"


def split_games_by_type(games: list[dict]) -> tuple[list[dict], list[dict]]:
    """Jagab ProBallersi mängude nimekirja klubi- ja koondisemängudeks LEAGUE koodi järgi."""
    club = [g for g in games if g.get("LEAGUE") != NATIONAL_TEAM_LEAGUE]
    national = [g for g in games if g.get("LEAGUE") == NATIONAL_TEAM_LEAGUE]
    return club, national


def scrape_player(proballers_id: int, slug: str) -> dict:
    url = f"https://www.proballers.com/basketball/player/{proballers_id}/{slug}"
    resp = requests.get(url, headers=HEADERS, timeout=10)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    tables = soup.find_all("table")

    if len(tables) < 2:
        raise ValueError("Ei leidnud statistika tabeleid")

    def parse_table(table, empty_header_name=None):
        # HTML kasutab mixed case, CSS teeb need uppercase — normaliseerime
        raw = [th.get_text(strip=True).upper() for th in table.select("thead th")]
        if empty_header_name is None:
            # Vana käitumine sezoni tabelite jaoks: filtreeri tühjad välja
            headers = [h for h in raw if h]
        else:
            # Mängude tabel: säilita tühjad (anna neile nimi) ja tee duplikaadid unikaalseks
            seen = {}
            headers = []
            for h in raw:
                h = h or empty_header_name
                n = seen.get(h, 0)
                headers.append(h if n == 0 else f'{h}_{n}')
                seen[h] = n + 1
        rows = []
        for tr in table.select("tbody tr"):
            cells = [td.get_text(strip=True) for td in tr.find_all("td")]
            if cells:
                rows.append(dict(zip(headers, cells)))
        return rows

    # Sünniaeg ja pikkus profiili bio-plokkidest (title/info paarid)
    bio = {}
    for block in soup.select(".identity__stats__profil"):
        for div in block.select("div"):
            title = div.select_one(".title")
            info = div.select_one(".info")
            if title and info:
                bio[title.get_text(strip=True)] = info.get_text(strip=True)

    birth_date = None
    if bio.get("Date of birth"):
        try:
            birth_date = datetime.strptime(bio["Date of birth"], "%b %d, %Y").date().isoformat()
        except ValueError:
            birth_date = None

    height_cm = None
    height_match = re.search(r"(\d)m(\d{2})", bio.get("Height", ""))
    if height_match:
        height_cm = int(height_match.group(1)) * 100 + int(height_match.group(2))

    return {
        # Tühi TH (W/L veerg) nimetatakse RESULT-iks; duplikaatpäised saavad _1 suffiksi
        "games":     parse_table(tables[0], empty_header_name="RESULT"),
        "seasons":   parse_table(tables[1]),
        "playoffs":  parse_table(tables[2]) if len(tables) > 2 else [],
        "birthDate": birth_date,
        "heightCm":  height_cm,
    }


def scrape_fiba_national_team(fiba_id: int, name_slug: str) -> list[dict]:
    """Kraabib FIBA lehelt 'National Team: Senior' hooaja keskmised."""
    url = f"https://www.fiba.basketball/en/players/{fiba_id}-{name_slug}"
    headers = {**HEADERS, "RSC": "1"}
    resp = requests.get(url, headers=headers, timeout=15)
    resp.raise_for_status()
    text = resp.text

    idx = text.find("national-senior")
    if idx < 0:
        return []

    chunk = text[idx:]
    blocks = re.split(r'(?=\{"ageType":"S")', chunk)

    results = []
    for block in blocks:
        m = re.search(
            r'"gp":(\d+),"ppg":([\d.]+),"rpg":([\d.]+),"apg":([\d.]+),"eff":([\d.]+),"team":"([^"]+)"',
            block,
        )
        if not m:
            continue
        year_m = re.search(r'"color":"primary-400","children":(\d{4})', block)
        event_m = re.search(r'"styleName":"paragraphXXS","children":"([^"]+)"', block)
        results.append({
            "year":  int(year_m.group(1)) if year_m else None,
            "event": event_m.group(1) if event_m else None,
            "gp":    int(m.group(1)),
            "ppg":   float(m.group(2)),
            "rpg":   float(m.group(3)),
            "apg":   float(m.group(4)),
            "eff":   float(m.group(5)),
            "team":  m.group(6),
        })
        if "national-youth" in block or "player-career-stats-club" in block:
            break

    return results


def scrape_fiba_standings(competition_slug: str, team_slug: str) -> dict:
    """Kraabib FIBA meeskonna lehelt kvalifikatsioonigrupi tabeli."""
    url = f"https://www.fiba.basketball/en/events/{competition_slug}/teams/{team_slug}"
    headers = {**HEADERS, "RSC": "1"}
    resp = requests.get(url, headers=headers, timeout=15)
    resp.raise_for_status()
    text = resp.text

    name_m = re.search(r'"group":\{"groupName":"([^"]+)"', text)
    if not name_m:
        return {"name": None, "rows": []}

    rows = []
    for m in re.finditer(
        r'"rank":(\d+),"team":\{"teamId":\d+,"organisationId":\d+,"code":"[A-Z]+",'
        r'"officialName":"([^"]+)"[^}]*\},'
        r'"gamesPlayed":\d+,"gamesLost":(\d+),"gamesWon":(\d+),"points":(\d+)',
        text,
    ):
        rows.append({
            "position": int(m.group(1)),
            "team":     {"name": m.group(2)},
            "wins":     int(m.group(4)),
            "losses":   int(m.group(3)),
            "points":   int(m.group(5)),
        })
    rows.sort(key=lambda r: r["position"])

    return {"name": f"Group {name_m.group(1)}", "rows": rows}


def scrape_fiba_schedule(competition_slug: str, team_id: int, tournament_name: str) -> tuple[list, list]:
    """Kraabib FIBA turniiri mängude lehelt meeskonna eelseisvad ja hiljutised mängud."""
    url = f"https://www.fiba.basketball/en/events/{competition_slug}/games"
    headers = {**HEADERS, "RSC": "1"}
    resp = requests.get(url, headers=headers, timeout=15)
    resp.raise_for_status()
    text = resp.text

    blocks = re.split(r'(?=\{"gameId":\d+,"gameName")', text)

    seen = set()
    games = []
    for block in blocks:
        m = re.match(
            r'\{"gameId":(\d+),"gameName":"[^"]*","gameNumber":"[^"]*","statusCode":"([^"]*)",'
            r'"teamA":\{"teamId":(\d+),"organisationId":\d+,"code":"[A-Z]+","officialName":"([^"]+)"[^}]*\},'
            r'"teamB":\{"teamId":(\d+),"organisationId":\d+,"code":"[A-Z]+","officialName":"([^"]+)"[^}]*\},'
            r'"teamAScore":(\d+|null),"teamBScore":(\d+|null).*?'
            r'"gameDateTimeUTC":"([^"]+)"',
            block,
        )
        if not m:
            continue

        game_id = int(m.group(1))
        if game_id in seen:
            continue

        team_a_id, team_b_id = int(m.group(3)), int(m.group(5))
        if team_id not in (team_a_id, team_b_id):
            continue
        seen.add(game_id)

        # "INIT" = mängimata (skoor on API-s platshoidjana 0, mitte null)
        played = m.group(2) == "VALID"
        score_a = int(m.group(7)) if played else None
        score_b = int(m.group(8)) if played else None
        dt = datetime.fromisoformat(m.group(9)).replace(tzinfo=timezone.utc)

        event = {
            "id": f"fiba-{game_id}",
            "gameId": game_id,
            "homeTeam": {"name": m.group(4), "teamId": team_a_id},
            "awayTeam": {"name": m.group(6), "teamId": team_b_id},
            "startTimestamp": int(dt.timestamp()),
            "tournament": {"name": tournament_name},
        }
        # FIBA tagastab mängimata mängudele kellaaja platshoidjana 00:00:00 UTC,
        # kuni tegelik mänguaeg on kinnitatud — kuvame sel juhul ainult kuupäeva.
        if not played and dt.hour == 0 and dt.minute == 0 and dt.second == 0:
            event["timeTBD"] = True
        if score_a is not None and score_b is not None:
            event["homeScore"] = {"current": score_a}
            event["awayScore"] = {"current": score_b}
        games.append(event)

    games.sort(key=lambda e: e["startTimestamp"])
    upcoming = [e for e in games if "homeScore" not in e]
    recent = [e for e in games if "homeScore" in e]
    recent.reverse()
    return upcoming, recent[:5]


def scrape_fiba_team_competitions(team_slug: str = "609-estonia") -> list[dict]:
    """Kraabib FIBA meeskonna lehelt võistluste nimekirja (uusim esimesena)."""
    url = f"https://www.fiba.basketball/en/teams/{team_slug}"
    headers = {**HEADERS, "RSC": "1"}
    resp = requests.get(url, headers=headers, timeout=15)
    resp.raise_for_status()
    text = resp.text

    m = re.search(r'"eventsByGender":\{"men":(\[.*?\])(?=,"women")', text)
    if not m:
        return []

    return [
        {"name": cm.group(1), "competitionId": int(cm.group(2))}
        for cm in re.finditer(r'\{"label":"([^"]+)","value":"(\d+)"\}', m.group(1))
    ]


FIBA_API_BASE = "https://digital-api.fiba.basketball/hapi"
# Avalik klotsivõti, mida fiba.basketball enda brauseripoolne kood saadab igas päringus
FIBA_API_KEY = "898cd5e7389140028ecb42943c47eb74"


def _fiba_api_get(path: str) -> dict:
    resp = requests.get(
        f"{FIBA_API_BASE}/{path}",
        headers={**HEADERS, "Ocp-Apim-Subscription-Key": FIBA_API_KEY},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def scrape_fiba_team_roster(team_id: int) -> list[dict]:
    """Kraabib FIBA meeskonna hetke koosseisu (mängijate personId, nimi, positsioon)."""
    data = _fiba_api_get(f"getgdapcompetitionteamlatestrosterbyteamid?gdapTeamId={team_id}")
    return data.get("players") or []


def scrape_fiba_player_game_stats(person_id: int, competition_id: int) -> list[dict]:
    """Kraabib ühe mängija mängu-põhised statistikad (kõik mängud antud turniiril)."""
    data = _fiba_api_get(
        f"getgdapplayergamestatisticsbyplayerid?gdapPlayerId={person_id}&gdapCompetitionId={competition_id}"
    )
    return data.get("gameStatistics") or []


def scrape_fiba_game_periods(game_id: int) -> list[dict]:
    """Kraabib mängu veerandite/lisaaegade skoorid."""
    data = _fiba_api_get(f"getgdapgamebyid?gdapGameId={game_id}")
    return data.get("periods") or []


def _format_minutes(seconds) -> str:
    if not seconds:
        return "0:00"
    m, s = divmod(int(seconds), 60)
    return f"{m}:{s:02d}"


def scrape_fiba_box_scores(games: list[dict], competition_id: int) -> list[dict]:
    """
    Ehitab mõlema meeskonna täieliku boxscore'i etteantud mängude jaoks.
    `games` peab olema scrape_fiba_schedule() väljundi kirjed (koos teamId ja gameId väljadega).
    """
    team_ids = {g["homeTeam"]["teamId"] for g in games} | {g["awayTeam"]["teamId"] for g in games}
    rosters = {tid: scrape_fiba_team_roster(tid) for tid in team_ids}

    # gameId -> teamId -> personId -> (roster mängija, mängu statistika)
    stats_by_game: dict[int, dict[int, dict[int, tuple]]] = {}
    for tid, players in rosters.items():
        for player in players:
            for game_stat in scrape_fiba_player_game_stats(player["personId"], competition_id):
                stats_by_game.setdefault(game_stat["gameId"], {}).setdefault(tid, {})[player["personId"]] = (player, game_stat)

    def build_players(team_id, game_id):
        entries = stats_by_game.get(game_id, {}).get(team_id, {})
        players = [
            {
                "name": f'{player["firstName"]} {player["lastName"]}',
                "min":  _format_minutes(s.get("playDurationInSeconds")),
                "pts":  s.get("points", 0),
                "reb":  s.get("rebounds", 0),
                "ast":  s.get("assists", 0),
                "stl":  s.get("steals", 0),
                "blk":  s.get("blockedShots", 0),
                "fg":   f'{s.get("fieldGoalsMade", 0)}/{s.get("fieldGoalsAttempted", 0)}',
                "pm":   str(s.get("plusMinus", 0)),
                "eff":  s.get("efficiency", 0),
            }
            for player, s in entries.values()
        ]
        players.sort(key=lambda p: p["pts"], reverse=True)
        return players

    box_scores = []
    for g in games:
        game_id = g["gameId"]
        home_id, away_id = g["homeTeam"]["teamId"], g["awayTeam"]["teamId"]
        home_players = build_players(home_id, game_id)
        away_players = build_players(away_id, game_id)

        # "Latest roster" ei kata mängijaid, kes on hilisemaks aknaks koondisest väljas —
        # vanemate mängude puhul jääb seetõttu osa mängijaid leidmata. Kuvame boxscore'i
        # ainult siis, kui leitud mängijate punktisumma klapib täpselt lõppskooriga.
        home_covered = sum(p["pts"] for p in home_players) == g["homeScore"]["current"]
        away_covered = sum(p["pts"] for p in away_players) == g["awayScore"]["current"]
        if not (home_covered and away_covered):
            continue

        quarters = [
            {"label": p["name"], "home": p["teamAScore"], "away": p["teamBScore"]}
            for p in scrape_fiba_game_periods(game_id)
        ]

        box_scores.append({
            "id": g["id"],
            "date": g["startTimestamp"],
            "homeTeam": g["homeTeam"]["name"],
            "awayTeam": g["awayTeam"]["name"],
            "homeScore": g["homeScore"]["current"],
            "awayScore": g["awayScore"]["current"],
            "quarters": quarters,
            "homePlayers": home_players,
            "awayPlayers": away_players,
        })

    return box_scores


if __name__ == "__main__":
    data = scrape_player(69833, "henri-drell")

    print("=== Viimased 3 mängu ===")
    for game in data["games"][:3]:
        print(f"  {game.get('DATE')} vs {game.get('OPPONENT')} | "
              f"PTS:{game.get('PTS')} REB:{game.get('REB')} AST:{game.get('AST')}")

    print("\n=== Hooaja keskmised (viimased 3 hooaega) ===")
    for season in data["seasons"][-3:]:
        print(f"  {season.get('SEASON')} {season.get('TEAM')} ({season.get('LEAGUE')}) | "
              f"PTS:{season.get('PTS')} REB:{season.get('REB')} AST:{season.get('AST')} GP:{season.get('GP')}")

    print(f"\nKokku: {len(data['games'])} mängu, {len(data['seasons'])} hooaega")
