"""Zetwork API — FastAPI app: auth, profiles, and server-side matching."""
import json

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .config import settings
from .database import Base, engine, get_db
from . import models, schemas
from .auth import (hash_password, verify_password, create_access_token,
                   get_current_user)
from .matching import ARCHETYPES, assign_archetype, rank_matches
from .seed import seed_network

# create tables + seed the sample network at import time (runs under uvicorn and tests)
Base.metadata.create_all(bind=engine)


def _seed_once():
    db = next(get_db())
    try:
        n = seed_network(db)
        if n:
            print(f"[seed] inserted {n} sample developers")
    finally:
        db.close()


_seed_once()

app = FastAPI(title="Zetwork API", version="2.0",
              description="Developer team-matching: auth, profiles, real-data archetype matching.")

origins = ["*"] if settings.cors_origins.strip() == "*" else \
    [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)


@app.get("/", tags=["meta"])
def root():
    return {"app": "Zetwork API", "version": "2.0", "status": "ok"}


@app.get("/health", tags=["meta"])
def health():
    return {"status": "healthy"}


@app.get("/archetypes", response_model=list[schemas.ArchetypeOut], tags=["meta"])
def list_archetypes():
    """The five real-data developer archetypes."""
    return [{"id": a["id"], "name": a["name"], "share": a["share"], "blurb": a["blurb"]}
            for a in ARCHETYPES]


# ---------------- auth ----------------
@app.post("/auth/register", response_model=schemas.Token, tags=["auth"])
def register(body: schemas.RegisterIn, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(email=body.email, username=body.username,
                       password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.Token(access_token=create_access_token(user.id), username=user.username)


@app.post("/auth/login", response_model=schemas.Token, tags=["auth"])
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2 form uses 'username' field; we put the email there.
    user = db.query(models.User).filter(models.User.email == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password",
                            headers={"WWW-Authenticate": "Bearer"})
    return schemas.Token(access_token=create_access_token(user.id), username=user.username)


# ---------------- profile ----------------
def _profile_to_out(p: models.Profile) -> schemas.ProfileOut:
    return schemas.ProfileOut(
        id=p.id, name=p.name, role=p.role,
        languages=p.languages_list, interests=p.interests_list,
        build_text=p.build_text, zodiac=p.zodiac,
        archetype_id=p.archetype_id, archetype_name=p.archetype_name,
    )


@app.put("/profile", response_model=schemas.ProfileOut, tags=["profile"])
def upsert_profile(body: schemas.ProfileIn,
                   user: models.User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    """Create or update the logged-in user's profile. Assigns archetype from languages."""
    a = assign_archetype(body.languages)
    p = db.query(models.Profile).filter(models.Profile.user_id == user.id).first()
    if p is None:
        p = models.Profile(user_id=user.id, is_seed=False)
        db.add(p)
    p.name = body.name or user.username
    p.role = body.role
    p.languages = json.dumps(body.languages)
    p.interests = json.dumps(body.interests)
    p.build_text = body.build_text
    p.zodiac = body.zodiac
    p.archetype_id = a["id"]
    p.archetype_name = a["name"]
    db.commit()
    db.refresh(p)
    return _profile_to_out(p)


@app.get("/profile", response_model=schemas.ProfileOut, tags=["profile"])
def get_profile(user: models.User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    p = db.query(models.Profile).filter(models.Profile.user_id == user.id).first()
    if p is None:
        raise HTTPException(status_code=404, detail="No profile yet")
    return _profile_to_out(p)


# ---------------- matching ----------------
@app.get("/matches", response_model=list[schemas.MatchOut], tags=["matching"])
def get_matches(limit: int = 12,
                user: models.User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    """Rank everyone else in the DB (seed devs + other users) against your profile."""
    me = db.query(models.Profile).filter(models.Profile.user_id == user.id).first()
    if me is None:
        raise HTTPException(status_code=404, detail="Save your profile first")

    you = {
        "languages": me.languages_list, "interests": me.interests_list,
        "build_text": me.build_text, "zodiac": me.zodiac,
        "archetype_id": me.archetype_id, "archetype_name": me.archetype_name,
    }
    others = db.query(models.Profile).filter(models.Profile.id != me.id).all()
    candidates = [{
        "name": o.name, "role": o.role, "languages": o.languages_list,
        "interests": o.interests_list, "build_text": o.build_text, "zodiac": o.zodiac,
        "archetype_id": o.archetype_id, "archetype_name": o.archetype_name,
        "is_seed": o.is_seed,
    } for o in others]

    return rank_matches(you, candidates)[:limit]
