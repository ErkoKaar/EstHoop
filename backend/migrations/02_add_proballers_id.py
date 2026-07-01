"""Lisa proballers_id veerg ja täida algsete 10 mängija ID-d. Käivita: python migrations/02_add_proballers_id.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import sqlalchemy as sa
from database import SessionLocal, engine
from models import Player

PROBALLERS_IDS = {
    "henri-drell":       69833,
    "janari-joesaar":    39990,
    "kaspar-treier":     68327,
    "kasper-suurorg":    75939,
    "kregor-hermet":     63870,
    "kristian-kullamae": 65745,
    "maik-kalev-kotsar": 62206,
    "matthias-tass":     65748,
    "sander-raieste":    65747,
    "stefan-vaaks":      272830,
}

with engine.connect() as conn:
    exists = conn.execute(sa.text(
        "SELECT 1 FROM information_schema.columns "
        "WHERE table_name='players' AND column_name='proballers_id'"
    )).fetchone()
    if not exists:
        conn.execute(sa.text("ALTER TABLE players ADD COLUMN proballers_id INTEGER"))
        conn.commit()
        print("Veerg proballers_id lisatud.")
    else:
        print("Veerg proballers_id juba olemas, jätkan.")

db = SessionLocal()
updated = 0
for slug, pid in PROBALLERS_IDS.items():
    player = db.query(Player).filter(Player.slug == slug).first()
    if player:
        player.proballers_id = pid
        updated += 1
    else:
        print(f"  HOIATUS: mängijat '{slug}' ei leitud")
db.commit()
db.close()
print(f"Uuendatud {updated}/{len(PROBALLERS_IDS)} mängijat.")
