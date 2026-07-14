import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine
import sqlalchemy as sa

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

def migrate():
    with engine.connect() as conn:
        # Lisa veerg kui pole olemas (PostgreSQL)
        exists = conn.execute(sa.text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name='players' AND column_name='proballers_id'"
        )).fetchone()
        if not exists:
            conn.execute(sa.text("ALTER TABLE players ADD COLUMN proballers_id INTEGER"))
            conn.commit()
            print("Veerg proballers_id lisatud.")
        else:
            print("Veerg proballers_id juba olemas.")

        # Uuenda ID-d
        for slug, pid in PROBALLERS_IDS.items():
            conn.execute(
                sa.text("UPDATE players SET proballers_id = :pid WHERE slug = :slug"),
                {"pid": pid, "slug": slug}
            )
        conn.commit()
        print("ProBallers ID-d uuendatud:")
        rows = conn.execute(sa.text("SELECT name, slug, proballers_id FROM players ORDER BY name")).fetchall()
        for name, slug, pid in rows:
            print(f"  {name} ({slug}) → {pid}")

if __name__ == "__main__":
    migrate()
