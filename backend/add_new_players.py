import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
import models

NEW_PLAYERS = [
    {"name": "Artur Konontšuk",  "slug": "artur-konontsuk",   "proballers_id": 75838},
    {"name": "Erik Makke",        "slug": "erik-makke",         "proballers_id": 255979},
    {"name": "Henri Veesaar",     "slug": "henri-veesaar",      "proballers_id": 180245},
    {"name": "Hugo Toom",         "slug": "hugo-toom",          "proballers_id": 175875},
    {"name": "Joonas Riismaa",    "slug": "joonas-riismaa",     "proballers_id": 74937},
    {"name": "Karl-Johan Lips",   "slug": "karl-johan-lips",    "proballers_id": 57350},
    {"name": "Kerr Kriisa",       "slug": "kerr-kriisa",        "proballers_id": 70817},
    {"name": "Leemet Bockler",    "slug": "leemet-bockler",     "proballers_id": 181144},
    {"name": "Märt Rosenthal",    "slug": "mart-rosenthal",     "proballers_id": 68332},
    {"name": "Mihkel Kirves",     "slug": "mihkel-kirves",      "proballers_id": 60323},
    {"name": "Mikk Jurkatamm",    "slug": "mikk-jurkatamm",     "proballers_id": 70819},
    {"name": "Siim-Sander Vene",  "slug": "siim-sander-vene",   "proballers_id": 48091},
]

def add():
    db = SessionLocal()
    try:
        added = 0
        skipped = 0
        for p in NEW_PLAYERS:
            existing = db.query(models.Player).filter(models.Player.slug == p["slug"]).first()
            if existing:
                print(f"  ~ {p['name']} ({p['slug']}) — juba olemas, vahelejäetud")
                skipped += 1
                continue
            player = models.Player(
                name=p["name"],
                slug=p["slug"],
                proballers_id=p["proballers_id"],
            )
            db.add(player)
            print(f"  + {p['name']} ({p['slug']}) → ProBallers #{p['proballers_id']}")
            added += 1
        db.commit()
        print(f"\n{added} mängijat lisatud, {skipped} vahele jäetud.")
    finally:
        db.close()

if __name__ == "__main__":
    add()
