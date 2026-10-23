"""
Nädalakiri "Eestlased välismaal": möödunud nädala (E-P Eesti aja järgi) klubimängud
ja parimad sooritused, saadetakse Resend Broadcastina uudiskirja segmendile.

Käivitub esmaspäeva hommikul (.github/workflows/send_newsletter.yml), pärast öist
klubistatistika värskendust. Andmed tulevad PlayerClubStats cache'ist. Eesti klubides
mängijad jäävad välja, klubi riik tuleb klubide graafiku JSON-ist. Nädalal ilma
mängudeta kirja ei saadeta.

    python backend/send_newsletter.py                      # saada kõigile tellijatele
    python backend/send_newsletter.py --test aadress@x.ee  # ainult testkiri
    python backend/send_newsletter.py --preview kiri.html  # kirjuta HTML faili

Broadcasti nimes on nädala alguskuupäev. Kui sama nimega broadcast on Resendis juba
olemas, kirja uuesti ei saadeta (nt korduskäivitus pärast poolikut tõrget).
"""
import argparse
import html
import json
import os
import re
import sys
from datetime import datetime, timedelta, time as dtime
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models
import newsletter
from club_highlights import TALLINN, _game_timestamp, _number, club_name

SCHEDULE_DIR = Path(__file__).resolve().parent.parent / "frontend" / "src" / "data"
SITE_URL = newsletter.SITE_URL
UNSUBSCRIBE = "{{{RESEND_UNSUBSCRIBE_URL}}}"
TOP_COUNT = 3
WEEKDAYS = ["E", "T", "K", "N", "R", "L", "P"]
MONTHS = ["jaanuar", "veebruar", "märts", "aprill", "mai", "juuni", "juuli",
          "august", "september", "oktoober", "november", "detsember"]

FONT_HEADING = "'Bebas Neue',Impact,'Arial Narrow',Arial,sans-serif"
FONT_BODY = "Arial,Helvetica,sans-serif"
BLUE = "#0072ce"
NAVY = "#06111f"
DARK = "#08060d"
TEXT = "#3f4654"
MUTED = "#6b7280"
LINE = "#e5e7eb"


# ── Andmed ────────────────────────────────────────────────────────────────────

def last_week(now: datetime) -> tuple[datetime, datetime]:
    """Viimane täisnädal Eesti aja järgi: [esmaspäev 00:00, järgmine esmaspäev 00:00)."""
    today = now.astimezone(TALLINN).date()
    end = today - timedelta(days=today.weekday())
    start = end - timedelta(days=7)
    return datetime.combine(start, dtime(), TALLINN), datetime.combine(end, dtime(), TALLINN)


def domestic_players() -> set[str]:
    """Eesti klubides mängijate nimed uusimast klubide graafikust."""
    files = sorted(SCHEDULE_DIR.glob("klubide_graafikud_*.json"))
    if not files:
        print("Hoiatus: klubide graafikut ei leitud, Eesti klubide mängijad jäävad kirja sisse")
        return set()
    data = json.loads(files[-1].read_text(encoding="utf-8"))
    return {
        name
        for club in data.get("clubs", []) if club.get("country") == "Eesti"
        for name in club.get("players", [])
    }


def week_games(players, stats_by_slug, start_ts: float, end_ts: float, skip_names: set[str]) -> list[dict]:
    games = []
    for player in players:
        if player.name in skip_names:
            continue
        data = stats_by_slug.get(player.slug) or {}
        club = club_name(data)

        for g in data.get("clubGames") or []:
            ts = _game_timestamp(g.get("DATE"))
            if ts is None or not start_ts <= ts < end_ts:
                continue
            score = re.fullmatch(r"\s*(\d+)-(\d+)\s*", g.get("SCORE") or "")
            if not score:
                continue  # mängimata või poolik rida

            opponent_field = (g.get("OPPONENT") or "").strip()
            home = opponent_field.startswith("vs")
            # SCORE on kodu-võõrsil, kirjas näitame oma meeskonna skoori ees
            own, opp = (score.group(1), score.group(2)) if home else (score.group(2), score.group(1))
            result = (g.get("RESULT") or "").strip().upper()
            if result not in ("W", "L"):
                result = "W" if int(own) > int(opp) else "L" if int(own) < int(opp) else ""
            games.append({
                "slug": player.slug,
                "name": player.name,
                "club": club,
                "ts": ts,
                "home": home,
                "opponent": re.sub(r"^(@|vs)\s*", "", opponent_field) or "?",
                "outcome": {"W": "Võit", "L": "Kaotus"}.get(result, "Lõpp"),
                "score": f"{own}:{opp}",
                "pts": _number(g.get("PTS")),
                "reb": _number(g.get("REB")),
                "ast": _number(g.get("AST")),
                "eff": _number(g.get("EFF")),
            })
    return games


def top_games(games: list[dict], count: int) -> list[dict]:
    """Igalt mängijalt parim mäng, järjestus EFF, punktid, uuem mäng (nagu club_highlights)."""
    best = {}
    for g in games:
        if g["eff"] is None:
            continue
        rank = (g["eff"], g["pts"] or 0, g["ts"])
        if g["slug"] not in best or rank > best[g["slug"]][0]:
            best[g["slug"]] = (rank, g)
    return [g for _, g in sorted(best.values(), key=lambda item: item[0], reverse=True)[:count]]


def by_player(games: list[dict]) -> list[list[dict]]:
    """Mängud mängijate kaupa ajalises järjekorras, nädala parima EFF-iga mängija ees."""
    groups = {}
    for g in sorted(games, key=lambda g: g["ts"]):
        groups.setdefault(g["slug"], []).append(g)
    return sorted(groups.values(), key=lambda gs: max((g["eff"] for g in gs if g["eff"] is not None), default=float("-inf")), reverse=True)


# ── Vormindus ─────────────────────────────────────────────────────────────────

def num(value) -> str:
    if value is None:
        return "–"
    return str(int(value)) if value == int(value) else f"{value:g}"


def week_label(start: datetime, end: datetime) -> str:
    last = (end - timedelta(days=1)).date()
    first = start.date()
    if first.month == last.month:
        return f"{first.day}.–{last.day}. {MONTHS[last.month - 1]}"
    return f"{first.day}. {MONTHS[first.month - 1]} – {last.day}. {MONTHS[last.month - 1]}"


def day_label(ts: int) -> str:
    d = datetime.fromtimestamp(ts, TALLINN)
    return f"{WEEKDAYS[d.weekday()]} {d.day}.{d.month}."


def plural(n: int, one: str, many: str) -> str:
    return f"{n} {one if n == 1 else many}"


def player_url(slug: str) -> str:
    return f"{SITE_URL}/mangijad/{slug}"


def matchup(g: dict) -> str:
    return f"{'vs' if g['home'] else '@'} {g['opponent']}"


def statline(g: dict) -> str:
    return f"{num(g['pts'])} PTS · {num(g['reb'])} REB · {num(g['ast'])} AST"


def build(games: list[dict], label: str) -> tuple[str, str, str]:
    """(teema, HTML, tekst). Loobumislink on Resendi kohatäitena UNSUBSCRIBE."""
    e = html.escape
    top = top_games(games, TOP_COUNT)
    groups = by_player(games)
    intro = (
        f"Möödunud nädalal pidas välisklubides mänge {plural(len(groups), 'eestlane', 'eestlast')}, "
        f"kokku {plural(len(games), 'mäng', 'mängu')}."
    )
    subject = f"Eestlased välismaal {label}"
    if top:
        subject += f": nädala parim {top[0]['name']}"

    def heading(text):
        return (
            f'<tr><td style="padding:28px 28px 10px;font-family:{FONT_HEADING};font-size:26px;'
            f'letter-spacing:1px;color:{DARK};">{e(text)}</td></tr>'
        )

    top_rows = "".join(
        f"""<tr><td style="padding:0 28px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid {LINE};">
    <tr>
      <td width="36" valign="top" style="padding:14px 0;font-family:{FONT_HEADING};font-size:30px;line-height:1;color:{BLUE};">{i}</td>
      <td valign="top" style="padding:14px 8px 14px 0;font-family:{FONT_BODY};font-size:15px;line-height:1.5;color:{TEXT};">
        <a href="{e(player_url(g['slug']))}" style="color:{DARK};font-weight:700;font-size:17px;text-decoration:none;">{e(g['name'])}</a><br>
        {e(g['club'] or '')} {e(matchup(g))} · {e(g['outcome'])} {e(g['score'])} · {e(day_label(g['ts']))}<br>
        <span style="color:{DARK};font-weight:700;">{e(statline(g))}</span>
      </td>
      <td width="64" valign="top" align="right" style="padding:14px 0;font-family:{FONT_BODY};">
        <span style="font-family:{FONT_HEADING};font-size:34px;line-height:1;color:{DARK};">{e(num(g['eff']))}</span><br>
        <span style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:{MUTED};">EFF</span>
      </td>
    </tr>
  </table>
</td></tr>"""
        for i, g in enumerate(top, 1)
    )

    def game_line(g):
        eff = f" · EFF {num(g['eff'])}" if g["eff"] is not None else ""
        return (
            f"{e(day_label(g['ts']))} {e(matchup(g))} · {e(g['outcome'])} {e(g['score'])}<br>"
            f'<span style="color:{DARK};">{e(statline(g))}{e(eff)}</span>'
        )

    player_rows = "".join(
        f"""<tr><td style="padding:12px 28px;border-bottom:1px solid {LINE};font-family:{FONT_BODY};font-size:14px;line-height:1.55;color:{TEXT};">
  <a href="{e(player_url(gs[0]['slug']))}" style="color:{DARK};font-weight:700;font-size:16px;text-decoration:none;">{e(gs[0]['name'])}</a>
  <span style="color:{MUTED};">{e(gs[0]['club'] or '')}</span><br>
  {'<br>'.join(game_line(g) for g in gs)}
</td></tr>"""
        for gs in groups
    )

    body = f"""\
<!doctype html>
<html lang="et">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#eef1f5;">
  <div style="display:none;max-height:0;overflow:hidden;">{e(intro)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f5;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:{NAVY};padding:28px 28px 24px;">
          <a href="{SITE_URL}/" style="font-family:{FONT_BODY};font-size:12px;font-weight:700;letter-spacing:3px;color:#7fc4ff;text-decoration:none;">ESTHOOP</a>
          <div style="font-family:{FONT_HEADING};font-size:44px;line-height:1;letter-spacing:1px;color:#ffffff;margin-top:8px;">Eestlased välismaal</div>
          <div style="font-family:{FONT_BODY};font-size:15px;font-weight:700;color:#8a97ac;margin-top:8px;">{e(label)}</div>
        </td></tr>
        <tr><td style="height:6px;line-height:6px;font-size:0;background:{BLUE};">&nbsp;</td></tr>
        <tr><td style="height:6px;line-height:6px;font-size:0;background:#0a0a1a;">&nbsp;</td></tr>
        <tr><td style="padding:24px 28px 0;font-family:{FONT_BODY};font-size:16px;line-height:1.6;color:{TEXT};">{e(intro)}</td></tr>
        {heading('Nädala parimad') + top_rows if top else ''}
        {heading('Kõik mängud')}
        {player_rows}
        <tr><td align="center" style="padding:28px;">
          <a href="{SITE_URL}/klubikorvpall" style="display:inline-block;background:{BLUE};color:#ffffff;font-family:{FONT_BODY};font-size:16px;font-weight:700;text-decoration:none;padding:14px 26px;border-radius:8px;">Vaata klubikorvpalli lehte</a>
        </td></tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr><td style="padding:18px 28px;font-family:{FONT_BODY};font-size:12px;line-height:1.6;color:{MUTED};text-align:center;">
          Said selle kirja, sest tellisid EstHoopi nädalakirja. <a href="{UNSUBSCRIBE}" style="color:{MUTED};">Loobu tellimusest</a>.<br>
          EstHoop on fännileht, mitte Eesti Korvpalliliidu ametlik väljaanne. Haldab Severun OÜ, Töökoja 1.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    lines = [f"EESTLASED VÄLISMAAL {label}", "", intro, ""]
    if top:
        lines.append("NÄDALA PARIMAD")
        for i, g in enumerate(top, 1):
            lines.append(f"{i}. {g['name']}, EFF {num(g['eff'])}: {statline(g)}")
            lines.append(f"   {g['club'] or ''} {matchup(g)}, {g['outcome']} {g['score']}, {day_label(g['ts'])}")
        lines.append("")
    lines.append("KÕIK MÄNGUD")
    for gs in groups:
        lines.append(f"{gs[0]['name']} ({gs[0]['club'] or '?'}) {player_url(gs[0]['slug'])}")
        for g in gs:
            eff = f", EFF {num(g['eff'])}" if g["eff"] is not None else ""
            lines.append(f"   {day_label(g['ts'])} {matchup(g)}, {g['outcome']} {g['score']}: {statline(g)}{eff}")
    lines += ["", f"Kõik klubimängud: {SITE_URL}/klubikorvpall", "", f"Loobu tellimusest: {UNSUBSCRIBE}"]

    return subject, body, "\n".join(lines)


# ── Saatmine ──────────────────────────────────────────────────────────────────

def find_broadcast(name: str) -> dict | None:
    after = None
    while True:
        params = {"limit": 100, **({"after": after} if after else {})}
        page = newsletter.raise_for(newsletter.resend("GET", "/broadcasts", params=params)).json()
        data = page.get("data") or []
        match = next((b for b in data if b.get("name") == name), None)
        if match or not page.get("has_more") or not data:
            return match
        after = data[-1]["id"]


def send_broadcast(name: str, subject: str, body: str, text: str) -> None:
    existing = find_broadcast(name)
    if existing:
        print(f"Broadcast {name} on juba olemas (staatus {existing.get('status')}), uuesti ei saada")
        return
    created = newsletter.raise_for(newsletter.resend("POST", "/broadcasts", json={
        "segment_id": newsletter.env("RESEND_SEGMENT_ID"),
        "from": newsletter.FROM,
        "subject": subject,
        "html": body,
        "text": text,
        "name": name,
        "send": True,
    })).json()
    print(f"Saadetud: {subject} (broadcast {created.get('id')})")


def send_test(to: str, subject: str, body: str, text: str) -> None:
    # Kohatäide töötab ainult broadcastis, testkirjas viib link uudiskirja lehele
    stub = f"{SITE_URL}/uudiskiri"
    newsletter.raise_for(newsletter.resend("POST", "/emails", json={
        "from": newsletter.FROM,
        "to": [to],
        "subject": f"[TEST] {subject}",
        "html": body.replace(UNSUBSCRIBE, stub),
        "text": text.replace(UNSUBSCRIBE, stub),
    }))
    print(f"Testkiri saadetud aadressile {to}: {subject}")


def main() -> None:
    parser = argparse.ArgumentParser(description='Nädalakiri "Eestlased välismaal"')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--test", metavar="EMAIL", help="saada ainult testkiri sellele aadressile")
    mode.add_argument("--preview", metavar="FAIL", help="kirjuta kirja HTML faili, ära saada")
    args = parser.parse_args()

    start, end = last_week(datetime.now(TALLINN))
    label = week_label(start, end)

    db = SessionLocal()
    try:
        players = db.query(models.Player).all()
        stats = {row.slug: row.data for row in db.query(models.PlayerClubStats).all()}
    finally:
        db.close()

    games = week_games(players, stats, start.timestamp(), end.timestamp(), domestic_players())
    if not games:
        print(f"{label}: välisklubides mänge polnud, kirja ei saadeta")
        return

    subject, body, text = build(games, label)
    if args.preview:
        Path(args.preview).write_text(body.replace(UNSUBSCRIBE, "#"), encoding="utf-8")
        print(f"Eelvaade: {args.preview} ({subject})")
    elif args.test:
        send_test(args.test, subject, body, text)
    else:
        send_broadcast(f"eestlased-valismaal-{start:%Y-%m-%d}", subject, body, text)


if __name__ == "__main__":
    main()
