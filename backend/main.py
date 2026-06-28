from fastapi import FastAPI
from dotenv import load_dotenv
import os
from database import Base, engine
import models
from database import SessionLocal
from fastapi import Depends
from sqlalchemy.orm import Session
from schemas import ItemCreate
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException





Base.metadata.create_all(bind=engine)

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
app = FastAPI()


#CORS loogika et backend saaks vastu võtta päringuid Frontendist(Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
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



