from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import math
import time
import unicodedata
from database import Base, engine, SessionLocal
import models
import records
import club_highlights
from scraper import scrape_player, scrape_fiba_national_team, split_games_by_type, league_of_season

load_dotenv()
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://est-hoop.vercel.app",
        "https://esthoop.ee",
        "https://dashboard-six-beta-14.vercel.app",
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


@app.api_route("/health", methods=["GET", "HEAD"])
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


# ── Liiga protsentiilid ───────────────────────────────────────────────────────

PERCENTILE_METRICS = ["PTS", "REB", "AST", "FG%", "3P%", "EFF"]
# Väikese mänguajaga mängijad moonutaksid võrdlust
PERCENTILE_MIN_MINUTES = 10
PERCENTILE_MIN_SAMPLE = 20


def _per_game(p: dict) -> dict:
    gp = p["gp"]
    return {
        "PTS": p["pts"] / gp,
        "REB": p["reb"] / gp,
        "AST": p["ast"] / gp,
        "EFF": p["eff"] / gp,
        # Protsent ainult piisava visete arvuga, muidu tõuseks 1/1 = 100% tippu
        "FG%": p["fgm"] / p["fga"] * 100 if p["fga"] >= 2 * gp else None,
        "3P%": p["tpm"] / p["tpa"] * 100 if p["tpa"] >= gp else None,
    }


def league_percentiles(db: Session, seasons: list | None, proballers_id: int | None) -> dict | None:
    """Mitu protsenti sama liiga mängijatest on mängijast igas näitajas kehvemad.

    Võrdlus käib viimase hooaja liigas (LeagueStatsCache, täidab
    23_refresh_league_stats.py). Valimis on mängijad, kellel on vähemalt
    min(5, pool liiga suurimast mängude arvust) mängu ja 10 min mängu kohta.
    Ilma suhtelise piirita oleks valim hooaja esimestel nädalatel tühi.
    Kui mängija ise piiri ei ületa, protsentiile ei näidata.
    """
    if not proballers_id or not seasons:
        return None
    candidates = [(s, league_of_season(s)) for s in seasons]
    candidates = [(s, league) for s, league in candidates if league]
    if not candidates:
        return None
    latest = max(league[2] for _, league in candidates)

    # Kahe liiga korral samal hooajal võrreldakse selles, kus mängis rohkem
    best = None
    for season_row, (league_id, _, season) in candidates:
        if season != latest:
            continue
        cached = db.query(models.LeagueStatsCache).filter(
            models.LeagueStatsCache.key == f"{league_id}:{season}"
        ).first()
        if not cached:
            continue
        me = next((p for p in cached.data["players"] if p["id"] == proballers_id), None)
        if me and (best is None or me["gp"] > best[2]["gp"]):
            best = (season_row, cached.data, me)
    if not best:
        return None

    season_row, league, me = best
    players = [p for p in league["players"] if p["gp"] > 0]
    if me["gp"] <= 0:
        return None
    min_games = min(5, math.ceil(max(p["gp"] for p in players) / 2))

    def qualifies(p):
        return p["gp"] >= min_games and p["min"] / p["gp"] >= PERCENTILE_MIN_MINUTES

    if not qualifies(me):
        return None
    others = [_per_game(p) for p in players if p["id"] != me["id"] and qualifies(p)]
    mine = _per_game(me)

    metrics = []
    for key in PERCENTILE_METRICS:
        if mine[key] is None:
            continue
        values = [o[key] for o in others if o[key] is not None]
        if len(values) < PERCENTILE_MIN_SAMPLE:
            continue
        below = sum(v < mine[key] for v in values)
        metrics.append({
            "key": key,
            "value": round(mine[key], 1),
            "percentile": round(100 * below / len(values)),
        })
    if not metrics:
        return None

    return {
        # "Poland - PLK" -> "PLK"
        "league": league["leagueName"].split(" - ", 1)[-1],
        "season": season_row.get("SEASON"),
        "sample": len(others),
        "minGames": min_games,
        "minMinutes": PERCENTILE_MIN_MINUTES,
        "metrics": metrics,
    }


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
        return {
            **db_cached.data,
            "leaguePercentiles": league_percentiles(db, db_cached.data.get("seasons"), player.proballers_id),
        }

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

    data["clubGames"], data["nationalGames"] = split_games_by_type(data.pop("games", []))
    data["leaguePercentiles"] = league_percentiles(db, data.get("seasons"), player.proballers_id)

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

# Arvutatakse iga kord algseisust + box score'idest (odav): nii on vastus alati sama kujuga
# kui records.py praegune versioon. Salvestatud seisu kasutab ainult check_records.py teavitusteks.
@app.get("/national-team/records")
def get_national_team_records(db: Session = Depends(get_db)):
    row = db.query(models.NationalTeamCache).filter(models.NationalTeamCache.key == "game_box_scores").first()
    baseline = records.load_baseline()
    games, _ = records.new_games(baseline, row.data if row else [])
    return records.public_view(records.compute(baseline, games))


# ── Klubikorvpall ─────────────────────────────────────────────────────────────

# Kuus, mitte kolm: frontend peidab osa mängijaid (clubSchedule.js HIDDEN_PLAYERS)
# ja näitab ülejäänutest kolme parimat
@app.get("/club/highlights")
def get_club_highlights(db: Session = Depends(get_db)):
    players = db.query(models.Player).all()
    stats = {row.slug: row.data for row in db.query(models.PlayerClubStats).all()}
    return club_highlights.top_performances(players, stats, count=6)
