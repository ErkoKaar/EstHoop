"""
Klubikorvpalli parimad sooritused: viimase `days` päeva (vaikimisi kahe nädala) kõrgeim
EFF, igalt mängijalt üks (parim) mäng. Järjestus: EFF, siis punktid, siis uuem mäng.

Varem arvutas sama klubikorvpalli leht brauseris ~40 mängija päringu pealt. Nüüd
kasutavad seda klubikorvpalli leht ja avaleht (/club/highlights). Andmed tulevad
PlayerClubStats cache'ist (ProBallers, uueneb öösel refresh_club_stats.yml-iga).

Väljundi kuju on sama, mida frontendi TopPerformances komponent varem kasutas.
"""
import re
import time
from datetime import datetime
from zoneinfo import ZoneInfo

TALLINN = ZoneInfo("Europe/Tallinn")

def _number(value):
    try:
        return float(str(value).strip())
    except (TypeError, ValueError):
        return None


def _game_timestamp(date_str):
    """ProBallers annab kuupäeva kujul "Oct 21, 2026"; loeme selle Eesti päeva alguseks."""
    try:
        return int(datetime.strptime(date_str.strip(), "%b %d, %Y").replace(tzinfo=TALLINN).timestamp())
    except (AttributeError, ValueError):
        return None


def top_performances(players, stats_by_slug, count=3, now=None, days=14):
    cutoff = (now or time.time()) - days * 86400
    best = {}

    for player in players:
        data = stats_by_slug.get(player.slug) or {}
        seasons = data.get("seasons") or []
        club = (seasons[-1] or {}).get("TEAM") if seasons else None

        for g in data.get("clubGames") or []:
            ts = _game_timestamp(g.get("DATE"))
            eff = _number(g.get("EFF"))
            if ts is None or ts < cutoff or eff is None:
                continue
            try:
                home_score, away_score = (int(x) for x in (g.get("SCORE") or "").split("-"))
            except ValueError:
                continue  # mängimata või poolik rida

            opponent_field = (g.get("OPPONENT") or "").strip()
            is_home = opponent_field.startswith("vs")
            opponent = re.sub(r"^(@|vs)\s*", "", opponent_field) or "?"
            own = club or ("Kodu" if is_home else "Võõrsil")
            rank = (eff, _number(g.get("PTS")) or 0, ts)

            if player.slug in best and best[player.slug][0] >= rank:
                continue
            best[player.slug] = (rank, {
                "player": {"slug": player.slug, "name": player.name},
                "eff": eff,
                "stats": {k: g.get(k) for k in ("EFF", "PTS", "REB", "AST")},
                "result": (g.get("RESULT") or "").strip().upper(),
                "playerIsHome": is_home,
                "event": {
                    "id": f"pb-{player.slug}-{g.get('DATE')}-{opponent_field}",
                    "startTimestamp": ts,
                    "homeTeam": {"name": own if is_home else opponent},
                    "awayTeam": {"name": opponent if is_home else own},
                    "tournament": {"name": g.get("LEAGUE")},
                    "homeScore": {"current": home_score},
                    "awayScore": {"current": away_score},
                    "gameUrl": g.get("GAME_URL"),
                },
            })

    ranked = sorted(best.values(), key=lambda item: item[0], reverse=True)
    return [entry for _, entry in ranked[:count]]
