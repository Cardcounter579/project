# Zetwork API (Backend)

FastAPI backend for Zetwork — developer team-matching with real-data archetypes.
Handles auth (register/login), profiles, and server-side 5-factor matching.

## Stack
- **FastAPI** — REST API
- **SQLAlchemy** — ORM (SQLite for local dev, PostgreSQL for real / RDS)
- **JWT + bcrypt** — auth
- **scikit-learn** — TF-IDF semantic similarity
- Archetypes from k-Means + PCA over 71,223 Stack Overflow 2024 developers

## Run locally (zero config)
```bash
cd zetwork-backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Opens at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.
With no `.env`, it uses a local SQLite file (`zetwork.db`) and auto-seeds 12 sample developers.

## Use your local Postgres (pgAdmin)
1. In pgAdmin, create a database named `zetwork`.
2. Copy `.env.example` to `.env` and set:
   ```
   DATABASE_URL=postgresql+psycopg2://postgres:YOURPASSWORD@localhost:5432/zetwork
   SECRET_KEY=some-long-random-string
   ```
3. Restart uvicorn. Tables are created and seeded automatically.

## Point at AWS RDS (later, for deployment)
Same as above, but the host becomes your RDS endpoint:
```
DATABASE_URL=postgresql+psycopg2://postgres:YOURPASSWORD@your-rds-endpoint.rds.amazonaws.com:5432/zetwork
```

## API
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET  | `/health` | – | health check |
| GET  | `/archetypes` | – | the 5 real-data archetypes |
| POST | `/auth/register` | – | create account → returns JWT |
| POST | `/auth/login` | – | log in (form: `username`=email) → returns JWT |
| GET  | `/profile` | Bearer | your profile |
| PUT  | `/profile` | Bearer | create/update profile (assigns archetype) |
| GET  | `/matches` | Bearer | ranked matches vs everyone in the DB |

Send the token as `Authorization: Bearer <token>`.

## Notes
- Registered users are stored and become matchable against each other.
- Semantic similarity uses TF-IDF (light, reliable on a t2.micro). To upgrade to
  sentence-transformers later, swap the `semantic_matrix` function in `app/matching.py`.
