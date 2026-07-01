from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
import time
import unicodedata
from database import Base, engine, SessionLocal
import models
from schemas import ItemCreate
from scraper import scrape_player, scrape_fiba_national_team





Base.metadata.create_all(bind=engine)

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
app = FastAPI()


#CORS loogika et backend saaks vastu võtta päringuid Frontendist(Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",  # Vite dev server (fallback port)
        "https://est-hoop.vercel.app",  # Vercel production
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    print(f"Database URL: {DATABASE_URL}")
    return {"status": "ok"}



#Avab sessiooni iga päringu jaoks ja sulgeb selle pärast päringut. 
# See on vajalik, et vältida sessioonide lekkimist ja tagada,
# et iga päring kasutab oma eraldi sessiooni.

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#Uue itemi loomine
@app.post("/items")
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    new_item = models.Item(name=item.name)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

#Itemi kustutamine ID alusel
@app.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    deleted_item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not deleted_item:
        raise HTTPException(status_code=404, detail="Item not found")
    else:
        db.delete(deleted_item)
        db.commit()
        return {"message": "Item deleted successfully"}

#Itemi uuendamine ID alusel
@app.put("/items/{item_id}")
def update_item(item_id: int, item: ItemCreate, db: Session = Depends(get_db)):
    existing_item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found")
    else:
        existing_item.name = item.name
        db.commit()
        db.refresh(existing_item)
        return existing_item

#Kõikide itemite listimine
@app.get("/items")
def list_items(db: Session = Depends(get_db)):
    return db.query(models.Item).all()

#Kõikide mängijate listimine
@app.get("/players")
def list_players(db: Session = Depends(get_db)):
    return db.query(models.Player).order_by(models.Player.name).all()

#Mängija leidmine slug'i alusel
@app.get("/players/{slug}")
def get_player(slug: str, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.slug == slug).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

# Lihtne in-memory cache: {slug: (timestamp, data)}
_stats_cache: dict = {}
CACHE_TTL = 3600  # 1 tund

#Mängija statistika ProBallersist
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
        # ProBallers slug tuletame nimest (lihtsustatud)
        pb_slug = player.name.lower().replace(" ", "-")
        data = scrape_player(player.proballers_id, pb_slug)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Scraping ebaõnnestus: {e}")

    _stats_cache[slug] = (time.time(), data)
    return data


_fiba_cache: dict = {}
FIBA_CACHE_TTL = 86400  # 24 tundi

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



