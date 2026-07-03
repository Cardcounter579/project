"""SQLAlchemy engine, session factory, and base class."""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings

# SQLite needs a special flag for multithreaded FastAPI; Postgres does not.
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a DB session and closes it afterward."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
