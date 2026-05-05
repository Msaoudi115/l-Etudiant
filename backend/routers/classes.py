import secrets
import uuid
from fastapi import APIRouter, HTTPException
from database import db, clean_doc
from models import ClassCreate, now_iso

router = APIRouter()


@router.post("/classes")
async def create_class(body: ClassCreate):
    code = "PROF" + secrets.token_hex(2).upper()
    while await db.classes.find_one({"code": code}):
        code = "PROF" + secrets.token_hex(2).upper()
    doc = {
        "id": str(uuid.uuid4()),
        "code": code,
        "teacher_name": body.teacher_name,
        "school_name": body.school_name,
        "created_at": now_iso(),
    }
    await db.classes.insert_one(dict(doc))
    return clean_doc(doc)


@router.get("/classes/{code}")
async def get_class(code: str):
    c = await db.classes.find_one({"code": code.upper()}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Class not found")
    return c


@router.get("/classes/{code}/students")
async def get_class_students(code: str):
    c = await db.classes.find_one({"code": code.upper()}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Class not found")
    students = await db.students.find({"class_code": code.upper()}, {"_id": 0}).to_list(500)
    # Attach stamp counts
    for s in students:
        count = await db.stamps.count_documents({"student_id": s["id"]})
        s["stamp_count"] = count
    return {"class": c, "students": students}


@router.delete("/classes/{code}")
async def delete_class(code: str, cascade: bool = False):
    """Delete a class. If cascade=true, also deletes its students and stamps.
    Demo classes PROF2026 and PROF2026B are protected."""
    code_u = code.upper()
    if code_u in ("PROF2026", "PROF2026B"):
        raise HTTPException(403, f"Demo class {code_u} is protected")
    c = await db.classes.find_one({"code": code_u})
    if not c:
        raise HTTPException(404, "Class not found")
    deleted_students = 0
    deleted_stamps = 0
    if cascade:
        student_ids = [
            s["id"]
            async for s in db.students.find({"class_code": code_u}, {"id": 1, "_id": 0})
        ]
        if student_ids:
            sres = await db.stamps.delete_many({"student_id": {"$in": student_ids}})
            deleted_stamps = sres.deleted_count
            stres = await db.students.delete_many({"class_code": code_u})
            deleted_students = stres.deleted_count
    await db.classes.delete_one({"code": code_u})
    return {
        "ok": True,
        "deleted_class": code_u,
        "deleted_students": deleted_students,
        "deleted_stamps": deleted_stamps,
    }


@router.get("/leaderboard")
async def classes_leaderboard():
    """Ranked list of classes by avg stamps/student. Returns up to 20."""
    classes = await db.classes.find({}, {"_id": 0}).to_list(200)
    rows = []
    for c in classes:
        students = await db.students.find(
            {"class_code": c["code"], "is_anonymous": {"$ne": True}},
            {"id": 1, "_id": 0},
        ).to_list(500)
        total_stamps = 0
        for s in students:
            total_stamps += await db.stamps.count_documents({"student_id": s["id"]})
        n = len(students)
        rows.append({
            "code": c["code"],
            "school_name": c["school_name"],
            "teacher_name": c["teacher_name"],
            "students": n,
            "stamps": total_stamps,
            "avg": round(total_stamps / n, 2) if n else 0.0,
        })
    rows.sort(key=lambda r: (-r["avg"], -r["stamps"], -r["students"]))
    for i, r in enumerate(rows):
        r["rank"] = i + 1
    return rows[:20]
