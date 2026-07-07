"""Eemalda Kerr Kriisa mängijate nimekirjast. Käivita: python migrations/12_remove_kerr_kriisa.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
import models

SLUG = "kerr-kriisa"

db = SessionLocal()

player = db.query(models.Player).filter(models.Player.slug == SLUG).first()
if player:
    db.delete(player)
    print(f"Kustutatud players rida: {player.name} ({player.slug})")
else:
    print("Players reas ei leitud.")

club = db.query(models.PlayerClubStats).filter(models.PlayerClubStats.slug == SLUG).first()
if club:
    db.delete(club)
    print("Kustutatud player_club_stats rida.")

fiba = db.query(models.PlayerFibaStats).filter(models.PlayerFibaStats.slug == SLUG).first()
if fiba:
    db.delete(fiba)
    print("Kustutatud player_fiba_stats rida.")

db.commit()
db.close()
