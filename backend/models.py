from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
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


class PlayerClubStats(Base):
    __tablename__ = "player_club_stats"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, nullable=False, unique=True)
    data = Column(JSON, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class NationalTeamCache(Base):
    __tablename__ = "national_team_cache"

    key = Column(String, primary_key=True)
    data = Column(JSON, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
