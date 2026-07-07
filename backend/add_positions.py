import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import engine
import sqlalchemy as sa

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

def migrate():
    with engine.connect() as conn:
        # Lisa veerg kui pole olemas
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

        rows = conn.execute(sa.text(
            "SELECT name, slug, position FROM players ORDER BY position, name"
        )).fetchall()
        print(f"\n{len(rows)} mängijat uuendatud:")
        for name, slug, pos in rows:
            print(f"  {pos or '?':3}  {name} ({slug})")

if __name__ == "__main__":
    migrate()
