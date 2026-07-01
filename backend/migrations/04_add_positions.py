"""Lisa position veerg ja täida kõigi 22 mängija positsioonid. Käivita: python migrations/04_add_positions.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import sqlalchemy as sa
from database import engine

POSITIONS = {
    "henri-drell":       "SF",
    "janari-joesaar":    "SG",
    "kaspar-treier":     "PF",
    "kasper-suurorg":    "PG",
    "kregor-hermet":     "PF",
    "kristian-kullamae": "PG",
    "maik-kalev-kotsar": "C",
    "matthias-tass":     "C",
    "sander-raieste":    "SF",
    "stefan-vaaks":      "SG",
    "artur-konontsuk":   "SF",
    "erik-makke":        "PG",
    "henri-veesaar":     "C",
    "hugo-toom":         "SF",
    "joonas-riismaa":    "SG",
    "karl-johan-lips":   "PF",
    "kerr-kriisa":       "PG",
    "leemet-bockler":    "SG",
    "mart-rosenthal":    "PG",
    "mihkel-kirves":     "PF",
    "mikk-jurkatamm":    "SG",
    "siim-sander-vene":  "PF",
}

with engine.connect() as conn:
    try:
        conn.execute(sa.text("ALTER TABLE players ADD COLUMN position VARCHAR"))
        conn.commit()
        print("Veerg position lisatud.")
    except Exception:
        conn.rollback()
        print("Veerg position juba olemas.")

    for slug, pos in POSITIONS.items():
        conn.execute(
            sa.text("UPDATE players SET position = :pos WHERE slug = :slug"),
            {"pos": pos, "slug": slug}
        )
    conn.commit()
    print(f"{len(POSITIONS)} mängijat uuendatud.")
