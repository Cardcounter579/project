"""Pydantic request/response models (the API contract)."""
from typing import List, Optional
from pydantic import BaseModel, EmailStr


# ---- auth ----
class RegisterIn(BaseModel):
    email: EmailStr
    username: str
    password: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


# ---- profile ----
class ProfileIn(BaseModel):
    name: str
    role: str = ""
    languages: List[str] = []
    interests: List[str] = []
    build_text: str = ""
    zodiac: str = ""


class ProfileOut(ProfileIn):
    id: int
    archetype_id: int
    archetype_name: str = ""


# ---- matching ----
class FactorBreakdown(BaseModel):
    semantic: float
    skill: float
    interest: float
    archetype: float
    zodiac: float


class MatchOut(BaseModel):
    name: str
    role: str
    zodiac: str
    element: str
    archetype_name: str
    languages: List[str]
    interests: List[str]
    total: float
    factors: FactorBreakdown
    why: str
    is_seed: bool


class ArchetypeOut(BaseModel):
    id: int
    name: str
    share: float
    blurb: str
