from fastapi import APIRouter, HTTPException
from database import db
from scoring import (
    score_breakdown, lead_temperature, lead_value_eur, compute_badges,
    BADGES_DEFS, _filiere_type_score,
)

router = APIRouter()


@router.get("/students/{student_id}/recap")
async def recap(student_id: str):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(404, "Student not found")
    stamps = await db.stamps.find({"student_id": student_id}, {"_id": 0}).to_list(500)
    consents = student.get("consents", {})
    filieres = student.get("filieres", [])

    # Split stamps: schools vs conferences (hall_id == "k")
    school_stamps = [s for s in stamps if s.get("hall_id") != "k"]
    conf_stamps = [s for s in stamps if s.get("hall_id") == "k"]

    breakdown = score_breakdown(
        stamp_count=len(school_stamps),
        consents=consents,
        filieres=filieres,
        school_stamps=school_stamps,
        classe=student.get("classe"),
    )
    score = breakdown["total"]

    # Recos
    schools = await db.schools.find({}, {"_id": 0}).to_list(500)
    schools_by_id = {sc["id"]: sc for sc in schools}

    # Score each visited school: filière match + star rating + consents → top 5
    recos = []
    if not student.get("is_anonymous"):
        for st in school_stamps:
            sc = schools_by_id.get(st["school_id"])
            if not sc:
                continue
            score_match = 0
            why = []

            # 0-50pts: filière-type keyword match
            fil_pts = _filiere_type_score(filieres, sc["type"])
            if fil_pts > 0:
                score_match += fil_pts
                why.append(f"+{fil_pts} correspondance filière")

            # 0-40pts: student's own star rating
            if st.get("rating"):
                rating_pts = st["rating"] * 8
                score_match += rating_pts
                why.append(f"+{rating_pts} ta note ({st['rating']}⭐)")

            # 0-10pts: consentements lead
            if consents.get("d") or consents.get("c"):
                score_match += 10
                why.append("+10 lead qualifié")

            recos.append({
                "name": sc["name"],
                "type": sc["type"],
                "school_id": sc["id"],
                "m": min(98, score_match),
                "t": score_match >= 70,
                "why": why,
            })
        recos.sort(key=lambda r: -r["m"])
        recos = recos[:5]

    # Next steps
    next_steps = []
    if not student.get("is_anonymous"):
        if filieres and "Ingénierie" in filieres:
            next_steps.append({"t": "JPO CentraleSupélec", "d": "14 mai 2026", "c": "#E3000B"})
        if filieres and "Commerce" in filieres:
            next_steps.append({"t": "JPO HEC Paris", "d": "20 mai 2026", "c": "#E3000B"})
        next_steps.append({"t": "Clôture vœux Parcoursup", "d": "10 mai 2026", "c": "#1A237E"})
        next_steps.append({"t": "Webinaire Orientation", "d": "8 mai 2026", "c": "#6D28D9"})

    badges = compute_badges(stamps, schools_by_id, len(conf_stamps), filieres)

    return {
        "student": student,
        "stamps": stamps,
        "school_stamps_count": len(school_stamps),
        "conf_stamps_count": len(conf_stamps),
        "score": score,
        "score_breakdown": breakdown,
        "temperature": lead_temperature(score),
        "lead_value_eur": lead_value_eur(score),
        "recos": recos,
        "next": next_steps,
        "badges": badges,
        "all_badges": BADGES_DEFS,
        "duration_min": 30 + len(stamps) * 8 if len(stamps) > 0 else 0,
    }
