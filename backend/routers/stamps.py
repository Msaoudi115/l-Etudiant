from datetime import datetime, timezone
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException
from database import db, clean_doc
from models import Stamp, StampCreate, StampRating

router = APIRouter()


def qr_payload_to_school_lookup(value: str) -> str:
    payload = (value or "").strip()
    if "/scan/" not in payload:
        return payload
    try:
        parsed = urlparse(payload)
        path = parsed.path or payload
    except Exception:
        path = payload
    marker = "/scan/"
    if marker not in path:
        return payload
    return path.split(marker, 1)[1].split("/", 1)[0].split("?", 1)[0].split("#", 1)[0]


@router.get("/students/{student_id}/stamps")
async def list_stamps(student_id: str):
    stamps = await db.stamps.find({"student_id": student_id}, {"_id": 0}).sort("timestamp", 1).to_list(500)
    return stamps


@router.post("/stamps")
async def create_stamp(body: StampCreate):
    student = await db.students.find_one({"id": body.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(404, "Student not found")
    if student.get("is_anonymous"):
        raise HTTPException(403, "Profil anonyme — pas de tampon possible")
    school_lookup = qr_payload_to_school_lookup(body.qr_token)
    school = await db.schools.find_one({"qr_token": school_lookup}, {"_id": 0})
    if not school:
        # Allow direct school_id fallback
        school = await db.schools.find_one({"id": school_lookup}, {"_id": 0})
    if not school:
        raise HTTPException(400, "QR inconnu")

    existing = await db.stamps.find_one({"student_id": body.student_id, "school_id": school["id"]}, {"_id": 0})
    if existing:
        return {"stamp": existing, "duplicate": True, "school": school}

    now = datetime.now(timezone.utc)
    stamp = Stamp(
        student_id=body.student_id,
        school_id=school["id"],
        hall_id=school["hall_id"],
        school_name=school["name"],
        time_label=f"{now.hour}h{str(now.minute).zfill(2)}",
    )
    doc = stamp.model_dump()
    await db.stamps.insert_one(dict(doc))
    await db.students.update_one({"id": body.student_id}, {"$set": {"scan_exposant": True}})
    return {"stamp": clean_doc(doc), "duplicate": False, "school": school}


@router.delete("/stamps/{stamp_id}")
async def delete_stamp(stamp_id: str):
    res = await db.stamps.delete_one({"id": stamp_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Stamp not found")
    return {"ok": True}


@router.patch("/stamps/{stamp_id}/rating")
async def rate_stamp(stamp_id: str, body: StampRating):
    if not 1 <= body.rating <= 5:
        raise HTTPException(400, "Rating must be between 1 and 5")
    res = await db.stamps.update_one({"id": stamp_id}, {"$set": {"rating": body.rating}})
    if res.matched_count == 0:
        raise HTTPException(404, "Stamp not found")
    stamp = await db.stamps.find_one({"id": stamp_id}, {"_id": 0})
    return clean_doc(stamp)
