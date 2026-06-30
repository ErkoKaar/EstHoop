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

    def parse_table(table):
        # HTML kasutab mixed case, CSS teeb need uppercase — normaliseerime
        headers = [th.get_text(strip=True).upper() for th in table.select("thead th") if th.get_text(strip=True)]
        rows = []
        for tr in table.select("tbody tr"):
            cells = [td.get_text(strip=True) for td in tr.find_all("td")]
            if cells:
                rows.append(dict(zip(headers, cells)))
        return rows

    return {
        "games":   parse_table(tables[0]),   # mäng-mängult
        "seasons": parse_table(tables[1]),   # hooaja keskmised (regulaar)
        "playoffs": parse_table(tables[2]) if len(tables) > 2 else [],
    }


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
