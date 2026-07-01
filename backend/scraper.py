import re
import requests
from bs4 import BeautifulSoup
import json

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

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

    return {
        # Tühi TH (W/L veerg) nimetatakse RESULT-iks; duplikaatpäised saavad _1 suffiksi
        "games":    parse_table(tables[0], empty_header_name="RESULT"),
        "seasons":  parse_table(tables[1]),
        "playoffs": parse_table(tables[2]) if len(tables) > 2 else [],
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
