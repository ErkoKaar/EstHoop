"""Eemalda sofascore_id veerg players tabelist (SofaScore pole enam kasutusel). Käivita: python migrations/11_drop_sofascore_id.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import sqlalchemy as sa
from database import engine

with engine.connect() as conn:
    try:
        conn.execute(sa.text("ALTER TABLE players DROP COLUMN sofascore_id"))
        conn.commit()
        print("Veerg sofascore_id eemaldatud.")
    except Exception as e:
        print(f"Veergu ei õnnestunud eemaldada (võib juba puududa): {e}")
