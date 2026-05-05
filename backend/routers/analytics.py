import io
import csv
from typing import Optional
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from database import db
from scoring import score_breakdown, lead_temperature, lead_value_eur
from seed import HALLS_SEED, DEMO_QR_BOOTHS, DEMO_QR_STUDENT_ID

router = APIRouter()


def _passes_lead_filter(student, filiere, consent, min_stamps, stamp_count):
    if filiere and filiere != "all":
        if filiere not in (student.get("filieres") or []):
            return False
    if consent and consent != "all":
        if not student.get("consents", {}).get(consent):
            return False
    if stamp_count < min_stamps:
        return False
    return True


@router.get("/analytics/overview")
async def analytics_overview():
    total_students = await db.students.count_documents({"is_anonymous": {"$ne": True}})
    total_stamps = await db.stamps.count_documents({})
    total_classes = await db.classes.count_documents({})

    # Top schools
    pipeline = [
        {"$group": {"_id": "$school_id", "count": {"$sum": 1}, "name": {"$first": "$school_name"}, "hall_id": {"$first": "$hall_id"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]
    top_schools = []
    async for row in db.stamps.aggregate(pipeline):
        top_schools.append({"school_id": row["_id"], "name": row["name"], "hall_id": row["hall_id"], "count": row["count"]})

    # Stamps per hall
    hall_pipeline = [
        {"$group": {"_id": "$hall_id", "count": {"$sum": 1}}},
    ]
    hall_counts_raw = []
    async for row in db.stamps.aggregate(hall_pipeline):
        hall_counts_raw.append({"hall_id": row["_id"], "count": row["count"]})
    hall_counts = [
        {
            "hall_id": h["id"],
            "label": h["label"],
            "color": h["color"],
            "count": next((x["count"] for x in hall_counts_raw if x["hall_id"] == h["id"]), 0),
        }
        for h in HALLS_SEED
    ]

    # Consents aggregate
    consent_pipeline = [
        {"$match": {"is_anonymous": {"$ne": True}}},
        {"$group": {
            "_id": None,
            "l": {"$sum": {"$cond": ["$consents.l", 1, 0]}},
            "d": {"$sum": {"$cond": ["$consents.d", 1, 0]}},
            "c": {"$sum": {"$cond": ["$consents.c", 1, 0]}},
            "e": {"$sum": {"$cond": ["$consents.e", 1, 0]}},
        }},
    ]
    consents = {"l": 0, "d": 0, "c": 0, "e": 0}
    async for row in db.students.aggregate(consent_pipeline):
        consents = {"l": row["l"], "d": row["d"], "c": row["c"], "e": row["e"]}

    # Filières distribution
    fil_pipeline = [
        {"$match": {"is_anonymous": {"$ne": True}}},
        {"$unwind": "$filieres"},
        {"$group": {"_id": "$filieres", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    filieres_dist = []
    async for row in db.students.aggregate(fil_pipeline):
        filieres_dist.append({"filiere": row["_id"], "count": row["count"]})

    # Recent activity
    recent = await db.stamps.find({}, {"_id": 0}).sort("timestamp", -1).limit(10).to_list(10)

    # Demo QR board status: per-booth status for the presentation QR codes.
    demo_booths = []
    for booth in DEMO_QR_BOOTHS:
        school = await db.schools.find_one({"id": booth["school_id"]}, {"_id": 0})
        demo_stamp = await db.stamps.find_one(
            {"student_id": DEMO_QR_STUDENT_ID, "school_id": booth["school_id"]},
            {"_id": 0},
            sort=[("timestamp", -1)],
        )
        total_visits = await db.stamps.count_documents({"school_id": booth["school_id"]})
        demo_booths.append({
            "school_id": booth["school_id"],
            "label": booth["label"],
            "name": school["name"] if school else booth["school_id"],
            "visited": demo_stamp is not None,
            "time_label": demo_stamp.get("time_label") if demo_stamp else None,
            "timestamp": demo_stamp.get("timestamp") if demo_stamp else None,
            "total_visits": total_visits,
        })

    return {
        "total_students": total_students,
        "total_stamps": total_stamps,
        "total_classes": total_classes,
        "avg_stamps": round(total_stamps / total_students, 1) if total_students > 0 else 0,
        "top_schools": top_schools,
        "hall_counts": hall_counts,
        "consents": consents,
        "filieres_dist": filieres_dist,
        "recent": recent,
        "demo_booths": demo_booths,
    }


@router.get("/analytics/leads")
async def leads(
    filiere: Optional[str] = "all",
    consent: Optional[str] = "all",
    min_stamps: int = 0,
    limit: int = 200,
):
    students = await db.students.find(
        {"is_anonymous": {"$ne": True}}, {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    rows = []
    for s in students:
        stamp_count = await db.stamps.count_documents({"student_id": s["id"]})
        if not _passes_lead_filter(s, filiere, consent, min_stamps, stamp_count):
            continue
        consents = s.get("consents") or {}
        school_stamps_list = await db.stamps.find(
            {"student_id": s["id"], "hall_id": {"$ne": "k"}},
            {"hall_id": 1, "_id": 0},
        ).to_list(500)
        breakdown = score_breakdown(
            stamp_count=len(school_stamps_list),
            consents=consents,
            filieres=s.get("filieres") or [],
            school_stamps=school_stamps_list,
            classe=s.get("classe"),
        )
        score = breakdown["total"]
        rows.append({
            "id": s["id"],
            "name": s["name"],
            "serial": s["serial"],
            "classe": s["classe"],
            "filieres": s.get("filieres") or [],
            "formation": s.get("formation") or [],
            "class_code": s.get("class_code"),
            "consents": consents,
            "stamp_count": stamp_count,
            "score": score,
            "score_breakdown": breakdown,
            "temperature": lead_temperature(score),
            "lead_value_eur": lead_value_eur(score),
            "is_demo": s.get("is_demo", False),
        })
    rows.sort(key=lambda r: (-r["score"], -r["stamp_count"]))
    return rows[:limit]


@router.get("/analytics/leads.csv")
async def leads_csv(
    filiere: Optional[str] = "all",
    consent: Optional[str] = "all",
    min_stamps: int = 0,
):
    rows = await leads(filiere=filiere, consent=consent, min_stamps=min_stamps, limit=10000)
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow([
        "Nom", "Serial", "Classe", "Filières", "Formation", "Code classe",
        "Tampons", "Score",
        "Consent_lEtudiant", "Consent_Diplomeo", "Consent_Partenaires", "Consent_Enquetes",
    ])
    for r in rows:
        c = r.get("consents") or {}
        writer.writerow([
            r["name"], r["serial"], r["classe"],
            ", ".join(r["filieres"]),
            ", ".join(r["formation"]),
            r.get("class_code") or "",
            r["stamp_count"], r["score"],
            "oui" if c.get("l") else "non",
            "oui" if c.get("d") else "non",
            "oui" if c.get("c") else "non",
            "oui" if c.get("e") else "non",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="leads_passeport_etudiant.csv"'
        },
    )


@router.get("/admin/stats")
async def admin_stats():
    return {
        "students": {
            "total": await db.students.count_documents({}),
            "real": await db.students.count_documents(
                {"is_demo": {"$ne": True}, "is_anonymous": {"$ne": True}}
            ),
            "demo": await db.students.count_documents({"is_demo": True}),
            "anonymous": await db.students.count_documents({"is_anonymous": True}),
        },
        "stamps": await db.stamps.count_documents({}),
        "classes": await db.classes.count_documents({}),
        "schools": await db.schools.count_documents({}),
    }


@router.get("/admin/all-students")
async def admin_all_students():
    students = await db.students.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for s in students:
        s["stamp_count"] = await db.stamps.count_documents({"student_id": s["id"]})
    return students


@router.get("/admin/all-classes")
async def admin_all_classes():
    classes = await db.classes.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for c in classes:
        c["student_count"] = await db.students.count_documents({"class_code": c["code"]})
    return classes


@router.post("/admin/reset")
async def admin_reset(keep_demo: bool = True):
    """DANGER: Wipe all non-demo data. Keeps demo students and PROF2026/PROF2026B by default."""
    student_filter = {"is_demo": {"$ne": True}} if keep_demo else {}
    students_deleted = await db.students.delete_many(student_filter)
    if keep_demo:
        # Keep stamps for all demo students
        demo_student_ids = ["demo-lucas", "demo-theo", "demo-emma", "demo-nadia", "demo-hugo", "demo-sarah", "demo-malik", "demo-lea"]
        stamps_deleted = await db.stamps.delete_many(
            {"student_id": {"$nin": demo_student_ids}}
        )
        classes_deleted = await db.classes.delete_many({"code": {"$nin": ["PROF2026", "PROF2026B"]}})
    else:
        stamps_deleted = await db.stamps.delete_many({})
        classes_deleted = await db.classes.delete_many({})
    return {
        "ok": True,
        "keep_demo": keep_demo,
        "students_deleted": students_deleted.deleted_count,
        "stamps_deleted": stamps_deleted.deleted_count,
        "classes_deleted": classes_deleted.deleted_count,
    }
