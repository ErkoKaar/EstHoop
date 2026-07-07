from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from dotenv import load_dotenv
import time
import unicodedata
import os
from anthropic import Anthropic
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

    # DB cache (populated by refresh script, works on Render)
    db_cached = db.query(models.PlayerClubStats).filter(models.PlayerClubStats.slug == slug).first()
    if db_cached:
        return db_cached.data

    # Fallback: live scraping (works locally, may be blocked on Render)
    if not player.proballers_id:
        raise HTTPException(status_code=404, detail="ProBallers ID puudub")

    mem_cached = _stats_cache.get(slug)
    if mem_cached and time.time() - mem_cached[0] < CACHE_TTL:
        return mem_cached[1]

    try:
        pb_slug = unicodedata.normalize("NFKD", player.name.lower()).encode("ascii", "ignore").decode("ascii").replace(" ", "-")
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

    # DB cache (populated daily by refresh script)
    db_cached = db.query(models.PlayerFibaStats).filter(models.PlayerFibaStats.slug == slug).first()
    if db_cached:
        return {"national_team": db_cached.data}

    # Fallback: live scraping with in-memory cache
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


# ── National team cache ───────────────────────────────────────────────────────

@app.get("/national-team/games")
def get_national_team_games(db: Session = Depends(get_db)):
    upcoming = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == "upcoming_games").first()
    recent = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == "recent_games").first()
    return {
        "upcoming": upcoming.data if upcoming else [],
        "recent": recent.data if recent else [],
    }

@app.get("/national-team/standings")
def get_national_team_standings(db: Session = Depends(get_db)):
    row = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == "standings").first()
    return row.data if row else {"name": None, "rows": []}

@app.get("/national-team/game-stats")
def get_national_team_game_stats(db: Session = Depends(get_db)):
    row = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == "game_box_scores").first()
    return row.data if row else []


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    games_context: str | None = None
    stats_context: str | None = None
    club_games_context: str | None = None

def _build_system(players: list, games_text: str, stats_text: str | None, club_games_text: str | None) -> str:
    player_list = "\n".join(
        f"- {p.name} ({p.position or '?'})" for p in players
    )
    stats_section = f"\n\n## Mängijate statistika\n{stats_text}" if stats_text else ""
    club_games_section = f"\n\n## Mängijate eelseisvad klubi mängud\n{club_games_text}" if club_games_text else ""
    return f"""Oled EstHoop AI abiline — Eesti korvpalli fännidele mõeldud vestlusrobot veebilehel esthoop.ee.

## Eesti koondise mängijad
{player_list}{stats_section}

## Koondise mängud ja seis
{games_text}{club_games_section}

Vasta alati eesti keeles. Ole lühike ja konkreetne — maksimaalselt 3-4 lauset kui pole vaja rohkem. Ära väljamõtle andmeid mis sul puuduvad."""

@app.post("/chat")
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY pole seadistatud")

    players = db.query(models.Player).order_by(models.Player.name).all()
    games_text = req.games_context or "Mängude andmed pole kättesaadavad."
    system = _build_system(players, games_text, req.stats_context, req.club_games_context)

    client = Anthropic(api_key=api_key)
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        system=system,
        messages=[{"role": m.role, "content": m.content} for m in req.messages],
    )
    return {"response": response.content[0].text}
