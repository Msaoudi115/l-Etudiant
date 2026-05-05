import secrets
import uuid
from fastapi import APIRouter, HTTPException
from database import db, clean_doc
from models import Student, StudentCreate, StudentUpdate, now_iso

router = APIRouter()


@router.get("/students")
async def list_students(include_demo: bool = False, limit: int = 50):
    """List all students (excluding anonymous). Used to populate the Select page."""
    query = {"is_anonymous": {"$ne": True}}
    if not include_demo:
        query["is_demo"] = {"$ne": True}
    students = (
        await db.students.find(query, {"_id": 0})
        .sort("created_at", -1)
        .to_list(limit)
    )
    for s in students:
        s["stamp_count"] = await db.stamps.count_documents({"student_id": s["id"]})
    return students


@router.post("/students")
async def create_student(body: StudentCreate):
    code = body.class_code.upper().strip() if body.class_code else None
    if code:
        c = await db.classes.find_one({"code": code})
        if not c:
            raise HTTPException(400, "Code professeur invalide")
    serial = f"SAL-2026-{secrets.randbelow(90000) + 10000}"
    student = Student(
        serial=serial,
        name=body.name,
        emoji=body.emoji,
        classe=body.classe,
        filieres=body.filieres,
        formation=body.formation,
        class_code=code,
    )
    doc = student.model_dump()
    await db.students.insert_one(dict(doc))
    return clean_doc(doc)


@router.get("/students/{student_id}")
async def get_student(student_id: str):
    s = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not s:
        raise HTTPException(404, "Student not found")
    return s


@router.patch("/students/{student_id}")
async def update_student(student_id: str, body: StudentUpdate):
    current = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not current:
        raise HTTPException(404, "Student not found")
    update = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if "consents" in update and update["consents"] is not None:
        update["consents"] = dict(update["consents"])
        # Audit trail: log every consent change
        old_c = current.get("consents") or {}
        new_c = update["consents"]
        for key in ("l", "d", "c", "e"):
            if old_c.get(key) != new_c.get(key):
                await db.consent_audit.insert_one({
                    "id": str(uuid.uuid4()),
                    "student_id": student_id,
                    "consent_key": key,
                    "from": bool(old_c.get(key)),
                    "to": bool(new_c.get(key)),
                    "timestamp": now_iso(),
                })
    if not update:
        return await get_student(student_id)
    await db.students.update_one({"id": student_id}, {"$set": update})
    return await get_student(student_id)
