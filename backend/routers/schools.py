from fastapi import APIRouter
from database import db
from seed import HALLS_SEED

router = APIRouter()


@router.get("/")
async def root():
    return {"app": "PasseportEtudiant", "version": "1.0"}


@router.get("/halls")
async def get_halls():
    return HALLS_SEED


@router.get("/schools")
async def get_schools():
    schools = await db.schools.find({}, {"_id": 0}).to_list(500)
    return schools


@router.get("/schools/{school_id}")
async def get_school(school_id: str):
    from fastapi import HTTPException
    s = await db.schools.find_one({"id": school_id}, {"_id": 0})
    if not s:
        raise HTTPException(404, "School not found")
    return s
