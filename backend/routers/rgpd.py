import io
import json as _json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from database import db

router = APIRouter()


@router.get("/students/{student_id}/rgpd")
async def rgpd_view(student_id: str):
    """Returns everything stored about a student + audit trail. Right to access."""
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(404, "Student not found")
    stamps = await db.stamps.find({"student_id": student_id}, {"_id": 0}).to_list(500)
    audit = (
        await db.consent_audit.find({"student_id": student_id}, {"_id": 0})
        .sort("timestamp", -1)
        .to_list(500)
    )
    return {
        "student": student,
        "stamps": stamps,
        "consent_audit": audit,
        "rights": {
            "access": "Right to access your data — this endpoint",
            "portability": f"GET /api/students/{student_id}/rgpd?export=json",
            "rectification": f"PATCH /api/students/{student_id}",
            "erasure": f"DELETE /api/students/{student_id}",
        },
    }


@router.get("/students/{student_id}/rgpd/export")
async def rgpd_export(student_id: str):
    """Right to data portability — downloadable JSON."""
    data = await rgpd_view(student_id)
    payload = io.StringIO()
    _json.dump(data, payload, ensure_ascii=False, indent=2, default=str)
    payload.seek(0)
    return StreamingResponse(
        iter([payload.getvalue()]),
        media_type="application/json; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="rgpd_export_{student_id}.json"'
        },
    )


@router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    """Right to erasure (RGPD Art. 17). Demo profiles protected."""
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(404, "Student not found")
    if student.get("is_demo"):
        raise HTTPException(403, "Demo profiles can't be deleted")
    await db.stamps.delete_many({"student_id": student_id})
    await db.consent_audit.delete_many({"student_id": student_id})
    await db.students.delete_one({"id": student_id})
    return {"ok": True}
