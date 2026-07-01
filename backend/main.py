from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import time
import unicodedata
from database import Base, engine, SessionLocal
import models
from scraper import scrape_player, scrape_fiba_national_team

load_dotenv()
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://est-hoop.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/players")
def list_players(db: Session = Depends(get_db)):
    return db.query(models.Player).order_by(models.Player.name).all()


@app.get("/players/{slug}")
def get_player(slug: str, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.slug == slug).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


_stats_cache: dict = {}
CACHE_TTL = 3600

@app.get("/players/{slug}/stats")
def get_player_stats(slug: str, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.slug == slug).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    if not player.proballers_id:
        raise HTTPException(status_code=404, detail="ProBallers ID puudub")

    cached = _stats_cache.get(slug)
    if cached and time.time() - cached[0] < CACHE_TTL:
        return cached[1]

    try:
        pb_slug = player.name.lower().replace(" ", "-")
        data = scrape_player(player.proballers_id, pb_slug)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Scraping ebaõnnestus: {e}")

    _stats_cache[slug] = (time.time(), data)
    return data


_fiba_cache: dict = {}
FIBA_CACHE_TTL = 86400

@app.get("/players/{slug}/fiba-stats")
def get_player_fiba_stats(slug: str, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.slug == slug).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    if not player.fiba_id:
        raise HTTPException(status_code=404, detail="FIBA ID puudub")

    cached = _fiba_cache.get(slug)
    if cached and time.time() - cached[0] < FIBA_CACHE_TTL:
        return cached[1]

    try:
        normalized = unicodedata.normalize("NFKD", player.name.lower())
        name_slug = normalized.encode("ascii", "ignore").decode("ascii").replace(" ", "-")
        data = scrape_fiba_national_team(player.fiba_id, name_slug)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FIBA scraping ebaõnnestus: {e}")

    result = {"national_team": data}
    _fiba_cache[slug] = (time.time(), result)
    return result
