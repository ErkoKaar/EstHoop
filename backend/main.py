from fastapi import FastAPI
from dotenv import load_dotenv
import os
from database import Base, engine
import models
from database import SessionLocal
from fastapi import Depends
from sqlalchemy.orm import Session
from schemas import ItemCreate




Base.metadata.create_all(bind=engine)

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
app = FastAPI()

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


#Kõikide itemite listimine
@app.get("/items")
def list_items(db: Session = Depends(get_db)):
    return db.query(models.Item).all()



