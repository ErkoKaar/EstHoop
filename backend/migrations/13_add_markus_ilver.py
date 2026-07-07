"""Lisa Markus Ilver mängijate nimekirja. Käivita: python migrations/13_add_markus_ilver.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models

PLAYER = {
    "name": "Markus Ilver",
    "slug": "markus-ilver",
    "proballers_id": 175877,
    "fiba_id": 257309,
    "position": "SF",
}

db = SessionLocal()

existing = db.query(models.Player).filter(models.Player.slug == PLAYER["slug"]).first()
if existing:
    print(f"  ~ {PLAYER['name']} — juba olemas")
else:
    player = models.Player(**PLAYER)
    db.add(player)
    db.commit()
    print(f"  + {PLAYER['name']} ({PLAYER['slug']}) lisatud")

db.close()
