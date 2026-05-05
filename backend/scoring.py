import re
from seed import FILIERE_TO_HALL, HALLS_SEED

# Keywords per filière used to match against school type descriptions
FILIERE_KEYWORDS = {
    "Ingénierie": ["ingénieurs", "ingénierie", "ingénieur"],
    "Numérique":  ["numérique", "informatique", "digital", "jeu vidéo", "cybersécurité", "tech"],
    "Commerce":   ["commerce", "management", "business", "marketing", "gestion", "finance", "communication", "logistique"],
    "Sciences Po": ["sciences po", "iep", "politique", "social"],
    "Santé":      ["santé", "médecine", "pharmacie", "paramédical", "ostéopathie", "kiné", "maïeutique", "chiro"],
    "Arts":       ["art", "design", "cinéma", "animation", "hôtellerie", "tourisme", "luxe", "audiovisuel"],
    "Droit":      ["droit", "juridique"],
}

BADGES_DEFS = [
    {"id": "first", "label": "Premier pas", "icon": "👣", "desc": "Ton 1er tampon"},
    {"id": "explorer", "label": "Explorer", "icon": "🧭", "desc": "1 stand par pôle"},
    {"id": "marathon", "label": "Marathonien", "icon": "🏃", "desc": "5+ stands visités"},
    {"id": "curieux", "label": "Curieux", "icon": "🎤", "desc": "1 conférence suivie"},
    {"id": "premium", "label": "Premium", "icon": "💎", "desc": "Stand d'une filière premium"},
    {"id": "completiste", "label": "Complétiste", "icon": "🏆", "desc": "10+ stands"},
]


def _filiere_type_score(filieres: list, school_type: str) -> int:
    """0-50pts: how well school's type description matches student's declared filières.
    Points are distributed equally across declared filières — matching all gives 50pts,
    matching only one out of two gives 25pts, etc. This creates individual scores per school."""
    if not filieres:
        return 0
    type_lower = school_type.lower()
    pts_per_filiere = 50 / len(filieres)
    total = sum(
        pts_per_filiere
        for f in filieres
        if f in FILIERE_KEYWORDS and any(kw in type_lower for kw in FILIERE_KEYWORDS[f])
    )
    return min(50, round(total))


def _type_similarity(type_a: str, type_b: str) -> float:
    """Jaccard similarity on description keywords (before ' · ').
    Returns 0-1. Used to weight rating signal per recommended school individually."""
    def keywords(t: str):
        desc = t.split(" · ")[0].lower() if " · " in t else t.lower()
        words = set(re.split(r"[\s&/\-,()]+", desc))
        return {w for w in words if len(w) > 2}
    kw_a = keywords(type_a)
    kw_b = keywords(type_b)
    if not kw_a or not kw_b:
        return 0.0
    return len(kw_a & kw_b) / len(kw_a | kw_b)


def score_breakdown(
    stamp_count: int,
    consents: dict,
    filieres,
    school_stamps: list = None,
    classe: str = None,
):
    """
    Lead scoring D1+D2+D3+D4 = 100pts max.
    D1 (25): intentionnalité déclarée — filières + profil
    D2 (40): comportement in-fair — nb stands visités (no diversity bonus)
    D3 (20): pertinence — % stands cohérents avec filières déclarées
    D4 (15): valeur commerciale — consentements
    Hard rule: stamp_count == 0 → total = 0. Capped at 98.
    """
    fil = list(filieres or [])
    cons = consents or {}
    stamps = school_stamps or []

    # D1 - Intentionnalité déclarée (25 pts max)
    n_fil = len(fil)
    d1_filieres = {0: 0, 1: 8, 2: 16}.get(n_fil, 22)
    d1_classe = 3 if classe and any(k in classe for k in ("Terminale", "Étudiant")) else 0
    d1_total = min(25, d1_filieres + d1_classe)

    # D2 - Comportement in-fair (40 pts max) — no diversity bonus
    d2_total = min(stamp_count, 10) * 4

    # D3 - Pertinence des visites (20 pts max)
    if stamps and fil:
        user_halls = {FILIERE_TO_HALL[f] for f in fil if f in FILIERE_TO_HALL}
        relevant = sum(1 for st in stamps if st.get("hall_id") in user_halls)
        pct = relevant / len(stamps)
        if pct >= 0.70:
            d3_total = 20
        elif pct >= 0.50:
            d3_total = 14
        elif pct >= 0.30:
            d3_total = 8
        else:
            d3_total = 0
    else:
        d3_total = 0

    # D4 - Valeur commerciale (15 pts max)
    d4_diplomeo = 6 if cons.get("d") else 0
    d4_partenaires = 4 if cons.get("c") else 0
    d4_letudiant = 3 if cons.get("l") else 0
    d4_enquetes = 2 if cons.get("e") else 0
    d4_total = d4_diplomeo + d4_partenaires + d4_letudiant + d4_enquetes

    raw = d1_total + d2_total + d3_total + d4_total
    capped = 0 if stamp_count == 0 else min(98, round(raw))

    return {
        "total": int(capped),
        "raw": round(raw, 1),
        "gating_zero": stamp_count == 0,
        "dimensions": [
            {
                "key": "D1",
                "label": "Intentionnalité déclarée",
                "weight": "25%",
                "value": round(d1_total, 1),
                "max": 25,
                "items": [
                    {"label": f"{n_fil} filière(s) → {d1_filieres}pts", "pts": d1_filieres, "max": 22},
                    {"label": "Profil Terminale/Étudiant", "pts": d1_classe, "max": 3},
                ],
            },
            {
                "key": "D2",
                "label": "Comportement in-fair",
                "weight": "40%",
                "value": round(d2_total, 1),
                "max": 40,
                "critical": True,
                "items": [
                    {"label": f"{min(stamp_count, 10)} stand(s) × 4", "pts": d2_total, "max": 40},
                ],
            },
            {
                "key": "D3",
                "label": "Pertinence des visites",
                "weight": "20%",
                "value": round(d3_total, 1),
                "max": 20,
                "items": [
                    {"label": "% stands dans filières déclarées", "pts": d3_total, "max": 20},
                ],
            },
            {
                "key": "D4",
                "label": "Valeur commerciale",
                "weight": "15%",
                "value": round(d4_total, 1),
                "max": 15,
                "items": [
                    {"label": "Diplomeo", "pts": d4_diplomeo, "max": 6},
                    {"label": "Partenaires", "pts": d4_partenaires, "max": 4},
                    {"label": "L'Étudiant", "pts": d4_letudiant, "max": 3},
                    {"label": "Enquêtes", "pts": d4_enquetes, "max": 2},
                ],
            },
        ],
    }


def compute_score(stamp_count: int, consents_count: int, filieres_count: int) -> int:
    # Legacy wrapper — passes minimal context, D3 will be 0
    breakdown = score_breakdown(
        stamp_count=stamp_count,
        consents={},
        filieres=[],
        school_stamps=[],
        classe=None,
    )
    return breakdown["total"]


def lead_temperature(score: int):
    if score >= 76:
        return {"label": "🔥 Hot", "color": "#dc2626", "value": "hot"}
    if score >= 55:
        return {"label": "♨️ Tiède", "color": "#f59e0b", "value": "warm"}
    if score >= 30:
        return {"label": "❄️ Froid", "color": "#3b82f6", "value": "cold"}
    return {"label": "🚫 Non-qualifié", "color": "#9ca3af", "value": "none"}


def lead_value_eur(score: int):
    """Diplomeo lead value range 40-80€ — applied progressively above 55."""
    if score >= 76:
        return 80
    if score >= 55:
        return 40 + round((score - 55) * 40 / 21)
    return 0  # below threshold = not transmissible


def compute_badges(stamps, schools_by_id, conf_count: int, filieres):
    """Return list of badge ids unlocked."""
    unlocked = set()
    if len(stamps) >= 1:
        unlocked.add("first")
    if len(stamps) >= 5:
        unlocked.add("marathon")
    if len(stamps) >= 10:
        unlocked.add("completiste")
    if conf_count >= 1:
        unlocked.add("curieux")
    # Explorer: at least 1 stamp in each non-conference hall
    halls_visited = set()
    for st in stamps:
        sc = schools_by_id.get(st.get("school_id"))
        if sc and sc.get("hall_id") and sc["hall_id"] != "k":
            halls_visited.add(sc["hall_id"])
    non_conf_halls = {h["id"] for h in HALLS_SEED if h["id"] != "k"}
    if non_conf_halls.issubset(halls_visited):
        unlocked.add("explorer")
    # Premium: visited at least one stamp in a hall matching their premium filière
    premium_hall_map = {"Ingénierie": "i", "Numérique": "i", "Commerce": "c", "Sciences Po": "s"}
    user_premium_halls = {premium_hall_map[f] for f in (filieres or []) if f in premium_hall_map}
    if any(
        (schools_by_id.get(st.get("school_id")) or {}).get("hall_id") in user_premium_halls
        for st in stamps
    ):
        unlocked.add("premium")
    return [b for b in BADGES_DEFS if b["id"] in unlocked]
