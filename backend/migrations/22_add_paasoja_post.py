"""Lisa Martin Paasoja ja Siim-Markus Post mängijate nimekirja. Käivita: python migrations/22_add_paasoja_post.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models

PLAYERS = [
    {
        "name": "Martin Paasoja",
        "slug": "martin-paasoja",
        "proballers_id": 50103,
        "fiba_id": 168643,
        "position": "PG",
    },
    {
        "name": "Siim-Markus Post",
        "slug": "siim-markus-post",
        "proballers_id": 16412,
        "fiba_id": 204544,
        "position": "PG",
    },
]

db = SessionLocal()

for data in PLAYERS:
    existing = db.query(models.Player).filter(models.Player.slug == data["slug"]).first()
    if existing:
        print(f"  ~ {data['name']} — juba olemas")
        continue
    db.add(models.Player(**data))
    db.commit()
    print(f"  + {data['name']} ({data['slug']}) lisatud")

db.close()
