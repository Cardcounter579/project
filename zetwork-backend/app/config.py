"""Application configuration, read from environment variables."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # SQLite by default = zero-config local run. Point at Postgres (pgAdmin / RDS)
    # by setting DATABASE_URL, e.g.
    #   postgresql+psycopg2://USER:PASSWORD@localhost:5432/zetwork
    #   postgresql+psycopg2://USER:PASSWORD@<rds-endpoint>:5432/zetwork
    database_url: str = "sqlite:///./zetwork.db"

    # CHANGE in production. Used to sign JWT access tokens.
    secret_key: str = "dev-secret-change-me"
    access_token_expire_minutes: int = 60 * 24  # 1 day

    # Comma-separated list of allowed frontend origins for CORS.
    # In production set to your S3 site URL.
    cors_origins: str = "*"

    class Config:
        env_file = ".env"


settings = Settings()
