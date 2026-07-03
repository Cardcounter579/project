"""Seed the database with the built-in sample developer network."""
import json

from sqlalchemy.orm import Session

from .models import Profile
from .matching import assign_archetype

SEED_DEVS = [
    {"name": "Saruul", "role": "ML Engineer", "languages": ["Python", "PyTorch", "SQL", "Bash"],
     "interests": ["Computer Vision", "Research", "RAG"], "zodiac": "Aries",
     "build_text": "Training vision models, want a teammate for a medical imaging project."},
    {"name": "Diego", "role": "Data Scientist", "languages": ["Python", "R", "SQL", "Pandas"],
     "interests": ["Forecasting", "Startups", "NLP"], "zodiac": "Virgo",
     "build_text": "Building a demand forecasting product, need an engineer to ship it."},
    {"name": "Mei", "role": "Frontend Engineer", "languages": ["TypeScript", "React", "HTML/CSS", "JavaScript"],
     "interests": ["Design", "Web", "Startups"], "zodiac": "Libra",
     "build_text": "Crafting a clean web app, looking for a backend partner."},
    {"name": "Tom", "role": "Full-stack Dev", "languages": ["JavaScript", "Node", "SQL", "HTML/CSS"],
     "interests": ["Web", "SaaS", "Startups"], "zodiac": "Gemini",
     "build_text": "Shipping a SaaS MVP, want someone who loves data."},
    {"name": "Anh", "role": "Backend Engineer", "languages": ["Go", "SQL", "Bash", "Python"],
     "interests": ["Distributed Systems", "Cloud", "APIs"], "zodiac": "Capricorn",
     "build_text": "Designing scalable APIs, keen on a data/ML collaborator."},
    {"name": "Priya", "role": "ML Researcher", "languages": ["Python", "PyTorch", "NumPy", "SQL"],
     "interests": ["NLP", "RAG", "Research"], "zodiac": "Aquarius",
     "build_text": "Researching retrieval-augmented systems, want a builder."},
    {"name": "Lukas", "role": "Systems Engineer", "languages": ["C++", "C", "Rust", "Bash"],
     "interests": ["Embedded", "Performance", "Robotics"], "zodiac": "Scorpio",
     "build_text": "Low-latency robotics stack, need ML eyes on perception."},
    {"name": "Nara", "role": "Data Engineer", "languages": ["Python", "SQL", "Spark", "Bash"],
     "interests": ["Pipelines", "Cloud", "Analytics"], "zodiac": "Taurus",
     "build_text": "Standing up a data platform, want an analyst or ML partner."},
    {"name": "Oyun", "role": "AI Engineer", "languages": ["Python", "TypeScript", "SQL", "PyTorch"],
     "interests": ["RAG", "LLMs", "Startups"], "zodiac": "Leo",
     "build_text": "Building an LLM product end to end, looking for a frontend ally."},
    {"name": "Carlos", "role": ".NET Developer", "languages": ["C#", "SQL", "JavaScript", "HTML/CSS"],
     "interests": ["Enterprise", "Web", "Cloud"], "zodiac": "Cancer",
     "build_text": "Enterprise dashboard on Azure, want a data person."},
    {"name": "Hana", "role": "Cloud Engineer", "languages": ["Python", "SQL", "JavaScript", "Bash"],
     "interests": ["Cloud", "DevOps", "APIs"], "zodiac": "Pisces",
     "build_text": "Deploying ML services on AWS, need a model builder."},
    {"name": "Bilguun", "role": "CV Engineer", "languages": ["Python", "C++", "PyTorch", "SQL"],
     "interests": ["Computer Vision", "Robotics", "Research"], "zodiac": "Sagittarius",
     "build_text": "Edge vision on devices, want a systems collaborator."},
]


def seed_network(db: Session) -> int:
    """Insert seed developers if they aren't already present. Returns count inserted."""
    if db.query(Profile).filter(Profile.is_seed == True).count() > 0:  # noqa: E712
        return 0
    inserted = 0
    for d in SEED_DEVS:
        a = assign_archetype(d["languages"])
        db.add(Profile(
            is_seed=True, name=d["name"], role=d["role"],
            languages=json.dumps(d["languages"]), interests=json.dumps(d["interests"]),
            build_text=d["build_text"], zodiac=d["zodiac"],
            archetype_id=a["id"], archetype_name=a["name"],
        ))
        inserted += 1
    db.commit()
    return inserted
