"""
Kontrollib pärast koondise mänge, kas mõni ametlike mängude rekord või edetabelikoht muutus,
saadab muutustest Telegrami teate ja salvestab seisu NationalTeamCache.records alla (seda loeb
/national-team/records). Käib refresh_national_team.yml-is kohe pärast box score'ide uuendust.
Turvaline korduskäivitada: seis arvutatakse alati algseisust uuesti (vt records.py).
"""
import os
import sys

import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models
import records

CACHE_KEY = "records"


def send_telegram(text: str) -> None:
    requests.post(
        f"https://api.telegram.org/bot{os.environ['TELEGRAM_BOT_TOKEN']}/sendMessage",
        json={"chat_id": os.environ["TELEGRAM_CHAT_ID"], "text": text},
        timeout=10,
    ).raise_for_status()


baseline = records.load_baseline()
db = SessionLocal()
try:
    boxes_row = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == "game_box_scores").first()
    games, skipped = records.new_games(baseline, boxes_row.data if boxes_row else [])
    if skipped:
        print(f"Poolik box score, jäi praegu välja: {', '.join(skipped)}")

    row = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == CACHE_KEY).first()
    # Esimesel käivitusel võrreldakse algseisuga, et algseisu järel mängitud mängud ei jääks teavitamata
    prev = row.data if row else records.compute(baseline, [])
    cur = records.compute(baseline, games)

    lines = records.changes(prev, cur)
    if lines:
        # Teade enne salvestamist: kui saatmine kukub, proovib järgmine käivitus uuesti
        send_telegram("Koondise rekordid muutusid:\n\n" + "\n".join(f"• {line}" for line in lines))
        print("\n".join(lines))
    else:
        print(f"Rekordid ei muutunud ({len(games)} mängu algseisu järel).")

    if row is None:
        db.add(models.NationalTeamCache(key=CACHE_KEY, data=cur))
    elif row.data != cur:
        row.data = cur
    db.commit()
finally:
    db.close()
