"""Matching engine: real-data archetypes + 5-factor scoring (server-side)."""
from typing import List, Optional
import math

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# --- Developer archetypes discovered via k-Means + PCA over 71,223 SO-2024 devs ---
ARCHETYPES = [
    {"id": 0, "name": "Data / ML Engineer",
     "langs": ["python", "javascript", "sql", "bash/shell", "bash", "shell"],
     "share": 0.272, "blurb": "Python-leaning data & backend builders."},
    {"id": 1, "name": "JavaScript Full-stack",
     "langs": ["javascript", "html/css", "html", "css", "typescript", "sql"],
     "share": 0.259, "blurb": "Front-to-back web on the JS/TS stack."},
    {"id": 2, "name": "Systems & Embedded",
     "langs": ["python", "c++", "c", "bash/shell", "bash", "rust", "assembly"],
     "share": 0.186, "blurb": "Low-level, performance-minded engineers."},
    {"id": 3, "name": "Microsoft .NET Enterprise",
     "langs": ["c#", "sql", "javascript", "html/css", "powershell", "visual basic"],
     "share": 0.149, "blurb": "C#/.NET on the Azure + SQL Server stack."},
    {"id": 4, "name": "Cloud Full-stack",
     "langs": ["javascript", "sql", "html/css", "python", "typescript"],
     "share": 0.134, "blurb": "Multi-cloud generalists across the stack."},
]

COMPLEMENT = {  # small bonus for classic complementary pairings
    (0, 1): .12, (0, 4): .10, (0, 2): .08,
    (1, 3): .08, (1, 4): .10, (2, 4): .06, (3, 4): .06,
}

ELEMENT = {
    "Aries": "Fire", "Leo": "Fire", "Sagittarius": "Fire",
    "Taurus": "Earth", "Virgo": "Earth", "Capricorn": "Earth",
    "Gemini": "Air", "Libra": "Air", "Aquarius": "Air",
    "Cancer": "Water", "Scorpio": "Water", "Pisces": "Water",
}

WEIGHTS = {"semantic": .30, "skill": .25, "interest": .15, "archetype": .15, "zodiac": .15}


def _norm(s: str) -> str:
    return (s or "").strip().lower()


def _set(items: List[str]):
    return {_norm(x) for x in items if x and x.strip()}


def jaccard(a: List[str], b: List[str]) -> float:
    A, B = _set(a), _set(b)
    if not A and not B:
        return 0.0
    inter = len(A & B)
    union = len(A | B)
    return inter / union if union else 0.0


def complementarity(a: List[str], b: List[str]) -> float:
    A, B = _set(a), _set(b)
    if not A or not B:
        return 0.0
    inter = len(A & B)
    union = len(A | B)
    overlap = inter / min(len(A), len(B))
    coverage = (len(A) + len(B) - 2 * inter) / union
    return max(0.0, min(1.0, 0.45 * overlap + 0.55 * coverage))


def assign_archetype(langs: List[str]) -> dict:
    u = _set(langs)
    best, best_score = ARCHETYPES[0], -1.0
    for a in ARCHETYPES:
        score = sum(1 for l in a["langs"] if l in u) + a["share"] * 0.5
        if score > best_score:
            best, best_score = a, score
    return best


def archetype_fit(a_id: int, b_id: int) -> float:
    if a_id == b_id:
        return 0.62
    key = (min(a_id, b_id), max(a_id, b_id))
    return min(1.0, 0.80 + COMPLEMENT.get(key, 0.0))


def element_fit(z_a: str, z_b: str) -> float:
    ea, eb = ELEMENT.get(z_a), ELEMENT.get(z_b)
    if not ea or not eb:
        return 0.5
    if ea == eb:
        return 1.0
    friendly = {"Fire": "Air", "Air": "Fire", "Earth": "Water", "Water": "Earth"}
    return 0.78 if friendly.get(ea) == eb else 0.45


def semantic_matrix(you_text: str, candidate_texts: List[str]) -> List[float]:
    """TF-IDF cosine similarity of the 'what I want to build' text vs each candidate."""
    docs = [you_text or ""] + [t or "" for t in candidate_texts]
    if not any(d.strip() for d in docs):
        return [0.0] * len(candidate_texts)
    try:
        tfidf = TfidfVectorizer(stop_words="english", min_df=1).fit_transform(docs)
        sims = cosine_similarity(tfidf[0:1], tfidf[1:]).flatten()
        return [float(max(0.0, s)) for s in sims]
    except ValueError:
        # happens if every doc is empty after stop-word removal
        return [0.0] * len(candidate_texts)


def _explain(you, cand, f) -> str:
    bits = []
    common = list(_set(you["languages"]) & _set(cand["languages"]))
    if f["archetype"] >= 0.80:
        bits.append(f"{cand['archetype_name']} complements your {you['archetype_name']} profile")
    elif cand["archetype_id"] == you["archetype_id"]:
        bits.append(f"fellow {you['archetype_name']} — you'll speak the same language")
    if common:
        bits.append("shared ground in " + ", ".join(common[:3]))
    if f["skill"] >= 0.55:
        bits.append("skills cover gaps in each other's stack")
    ci = list(_set(you["interests"]) & _set(cand["interests"]))
    if ci:
        bits.append("both into " + ", ".join(ci[:2]))
    ze, ce = ELEMENT.get(you["zodiac"]), ELEMENT.get(cand["zodiac"])
    if ze and ce and f["zodiac"] >= 0.78:
        bits.append(f"{ze}/{ce} elements get along")
    if not bits:
        bits.append("a fresh perspective from a different corner of the field")
    return " · ".join(bits)


def rank_matches(you: dict, candidates: List[dict]) -> List[dict]:
    """you/candidates are dicts with languages, interests, build_text, zodiac, archetype_*."""
    sem = semantic_matrix(you.get("build_text", ""),
                          [c.get("build_text", "") for c in candidates])
    results = []
    for c, s in zip(candidates, sem):
        f = {
            "semantic": round(s, 4),
            "skill": round(complementarity(you["languages"], c["languages"]), 4),
            "interest": round(jaccard(you["interests"], c["interests"]), 4),
            "archetype": round(archetype_fit(you["archetype_id"], c["archetype_id"]), 4),
            "zodiac": round(element_fit(you["zodiac"], c["zodiac"]), 4),
        }
        total = sum(WEIGHTS[k] * f[k] for k in WEIGHTS)
        results.append({
            "name": c["name"], "role": c.get("role", ""),
            "zodiac": c["zodiac"], "element": ELEMENT.get(c["zodiac"], ""),
            "archetype_name": c["archetype_name"],
            "languages": c["languages"], "interests": c["interests"],
            "total": round(total, 4), "factors": f,
            "why": _explain(you, c, f), "is_seed": c.get("is_seed", False),
        })
    results.sort(key=lambda r: r["total"], reverse=True)
    return results
