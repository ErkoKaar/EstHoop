from sqlalchemy import Column, Integer, String
from database import Base


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, nullable=False, unique=True)
    proballers_id = Column(Integer, nullable=True)
    fiba_id = Column(Integer, nullable=True)
    sofascore_id = Column(Integer, nullable=True)
    position = Column(String, nullable=True)
