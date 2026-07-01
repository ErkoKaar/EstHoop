"""Lisa fiba_id veerg ja täida kõigi 22 mängija FIBA ID-d. Käivita: python migrations/05_add_fiba_id.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import sqlalchemy as sa
from database import engine, SessionLocal
from models import Player

FIBA_IDS = {
    "henri-drell":       227312,
    "mart-rosenthal":    218117,
    "sander-raieste":    211541,
    "kaspar-treier":     211550,
    "mikk-jurkatamm":    227315,
    "matthias-tass":     211546,
    "siim-sander-vene":  152257,
    "kregor-hermet":     204539,
    "janari-joesaar":    182086,
    "joonas-riismaa":    230568,
    "artur-konontsuk":   256650,
    "kristian-kullamae": 211544,
    "karl-johan-lips":   195785,
    "hugo-toom":         257308,
    "mihkel-kirves":     195790,
    "kasper-suurorg":    324692,
    "leemet-bockler":    238568,
    "kerr-kriisa":       227322,
    "maik-kalev-kotsar": 195793,
    "erik-makke":        288017,
    "stefan-vaaks":      274649,
    "henri-veesaar":     271666,
}

with engine.connect() as conn:
    try:
        conn.execute(sa.text("ALTER TABLE players ADD COLUMN fiba_id INTEGER"))
        conn.commit()
        print("Veerg fiba_id lisatud.")
    except Exception:
        print("Veerg fiba_id juba olemas, jätkan.")

db = SessionLocal()
updated = 0
for slug, fiba_id in FIBA_IDS.items():
    player = db.query(Player).filter(Player.slug == slug).first()
    if player:
        player.fiba_id = fiba_id
        updated += 1
    else:
        print(f"  HOIATUS: mängijat '{slug}' ei leitud")
db.commit()
db.close()
print(f"Uuendatud {updated}/{len(FIBA_IDS)} mängijat.")
