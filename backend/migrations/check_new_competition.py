"""
Checks FIBA's Estonia team page for a new competition/event that the site's
national team scraper doesn't know about yet (see 09_refresh_national_team.py).
Sends a Telegram notification when a new competition appears. Safe to re-run.
"""
import os
import sys

import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models
from scraper import scrape_fiba_team_competitions

TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
TELEGRAM_CHAT_ID = os.environ["TELEGRAM_CHAT_ID"]
CACHE_KEY = "known_competitions"


def send_telegram(text: str) -> None:
    requests.post(
        f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
        json={"chat_id": TELEGRAM_CHAT_ID, "text": text},
        timeout=10,
    ).raise_for_status()


competitions = scrape_fiba_team_competitions()
if not competitions:
    print("Ei leidnud võistluste nimekirja FIBA lehelt.")
    sys.exit(0)

db = SessionLocal()
row = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == CACHE_KEY).first()
known_ids = {c["competitionId"] for c in row.data} if row else set()

new_ones = [c for c in competitions if c["competitionId"] not in known_ids]

# Esimesel käivitusel pole "known_ids" veel olemas — ei teavita kogu ajaloost, salvestame vaikselt.
if known_ids and new_ones:
    for c in new_ones:
        send_telegram(
            f"Uus võistlus Eesti koondise FIBA lehel: {c['name']} (competitionId {c['competitionId']}).\n"
            "Kontrolli backend/migrations/09_refresh_national_team.py konstante — vaja võib minna uuendust.\n"
            "https://www.fiba.basketball/en/teams/609-estonia#calendar"
        )
    print(f"Teavitatud {len(new_ones)} uuest võistlusest.")
else:
    print("Uusi võistlusi ei leitud.")

if row:
    row.data = competitions
else:
    db.add(models.NationalTeamCache(key=CACHE_KEY, data=competitions))
db.commit()
db.close()
