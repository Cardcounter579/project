"""Database tables: users and their developer profiles."""
import datetime as dt
import json

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    profile = relationship("Profile", back_populates="user", uselist=False,
                           cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)
    # is_seed=True rows are the built-in sample developers (not real accounts)
    is_seed = Column(Boolean, default=False)

    name = Column(String, nullable=False)
    role = Column(String, default="")
    languages = Column(Text, default="[]")   # JSON-encoded list[str]
    interests = Column(Text, default="[]")   # JSON-encoded list[str]
    build_text = Column(Text, default="")
    zodiac = Column(String, default="")
    archetype_id = Column(Integer, default=0)
    archetype_name = Column(String, default="")
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)

    user = relationship("User", back_populates="profile")

    # convenience: decode/encode the JSON list columns
    @property
    def languages_list(self):
        return json.loads(self.languages or "[]")

    @property
    def interests_list(self):
        return json.loads(self.interests or "[]")
