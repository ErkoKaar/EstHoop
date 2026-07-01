"""Lisa sofascore_id veerg ja täida kõigi 22 mängija SofaScore ID-d. Käivita: python migrations/06_add_sofascore_id.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import sqlalchemy as sa
from database import engine, SessionLocal
from models import Player

SOFASCORE_IDS = {
    "kerr-kriisa":        1002106,
    "kristian-kullamae":  1191801,
    "janari-joesaar":     1184713,
    "kasper-suurorg":     1636667,
    "leemet-bockler":     1473415,
    "mikk-jurkatamm":     1172890,
    "stefan-vaaks":       1514086,
    "joonas-riismaa":     1389791,
    "mart-rosenthal":     1433192,
    "erik-makke":         1514067,
    "henri-drell":        1083548,
    "artur-konontsuk":    1432746,
    "siim-sander-vene":   861961,
    "kaspar-treier":      1083501,
    "sander-raieste":     954930,
    "hugo-toom":          1432818,
    "kregor-hermet":      1187762,
    "karl-johan-lips":    1591076,
    "mihkel-kirves":      1406369,
    "maik-kalev-kotsar":  1143955,
    "matthias-tass":      1178097,
    "henri-veesaar":      1432815,
}

with engine.connect() as conn:
    try:
        conn.execute(sa.text("ALTER TABLE players ADD COLUMN sofascore_id INTEGER"))
        conn.commit()
        print("Veerg sofascore_id lisatud.")
    except Exception:
        print("Veerg sofascore_id juba olemas, jätkan.")

db = SessionLocal()
updated = 0
for slug, ss_id in SOFASCORE_IDS.items():
    player = db.query(Player).filter(Player.slug == slug).first()
    if player:
        player.sofascore_id = ss_id
        updated += 1
    else:
        print(f"  HOIATUS: mängijat '{slug}' ei leitud")
db.commit()
db.close()
print(f"Uuendatud {updated}/{len(SOFASCORE_IDS)} mängijat.")
