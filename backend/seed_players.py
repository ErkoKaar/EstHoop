import unicodedata
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, Base, engine
import models

Base.metadata.create_all(bind=engine)

PLAYERS = [
    "Henri Drell",
    "Janari Jõesaar",
    "Kaspar Treier",
    "Kasper Suurorg",
    "Kregor Hermet",
    "Kristian Kullamäe",
    "Maik Kalev Kotsar",
    "Matthias Tass",
    "Sander Raieste",
    "Stefan Vaaks",
]

def slugify(name: str) -> str:
    normalized = unicodedata.normalize("NFD", name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    return ascii_name.lower().replace(" ", "-")

def seed():
    db = SessionLocal()
    try:
        existing = db.query(models.Player).count()
        if existing > 0:
            print(f"Andmebaasis on juba {existing} mängijat. Seed'imine vahele jäetud.")
            return
        for name in PLAYERS:
            slug = slugify(name)
            player = models.Player(name=name, slug=slug)
            db.add(player)
            print(f"  + {name} ({slug})")
        db.commit()
        print(f"\n{len(PLAYERS)} mängijat lisatud.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
