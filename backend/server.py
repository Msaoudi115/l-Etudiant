from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
import secrets
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="PasseportEtudiant API")
api_router = APIRouter(prefix="/api")


# ============== MODELS ==============
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class School(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hall_id: str
    name: str
    type: str
    initials: str
    qr_token: str


class Consents(BaseModel):
    l: bool = False  # Contenus personnalisés l'Étudiant
    d: bool = False  # Diplomeo
    c: bool = False  # Partenaires
    e: bool = False  # Enquêtes


class Student(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    serial: str
    name: str
    emoji: str = "🧑"
    classe: str = "Non renseigné"
    filieres: List[str] = Field(default_factory=list)
    formation: List[str] = Field(default_factory=list)
    nat: str = "NON SPÉCIFIÉE"
    dob_short: str = "—"
    sex: str = "—"
    lieu: str = "—"
    expire: str = "15/04/2031"
    consents: Consents = Field(default_factory=Consents)
    class_code: Optional[str] = None
    is_demo: bool = False
    is_anonymous: bool = False  # Théo case
    created_at: str = Field(default_factory=now_iso)


class StudentCreate(BaseModel):
    name: str
    emoji: str = "🧑"
    classe: str = "Non renseigné"
    filieres: List[str] = Field(default_factory=list)
    formation: List[str] = Field(default_factory=list)
    class_code: str


class StudentUpdate(BaseModel):
    emoji: Optional[str] = None
    name: Optional[str] = None
    classe: Optional[str] = None
    filieres: Optional[List[str]] = None
    formation: Optional[List[str]] = None
    consents: Optional[Consents] = None


class Stamp(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    school_id: str
    hall_id: str
    school_name: str
    time_label: str
    timestamp: str = Field(default_factory=now_iso)


class StampCreate(BaseModel):
    student_id: str
    qr_token: str


class ClassRoom(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    teacher_name: str
    school_name: str
    created_at: str = Field(default_factory=now_iso)


class ClassCreate(BaseModel):
    teacher_name: str
    school_name: str


# ============== SEED ==============
HALLS_SEED = [
    {"id": "i", "label": "Ingénierie", "color": "#1A237E"},
    {"id": "c", "label": "Commerce", "color": "#E3000B"},
    {"id": "p", "label": "Prépas", "color": "#6D28D9"},
    {"id": "k", "label": "Conférences", "color": "#047857"},
]

SCHOOLS_SEED = [
    {"id": "s1", "hall_id": "i", "name": "CentraleSupélec", "type": "Grande école · Saclay", "initials": "CS"},
    {"id": "s2", "hall_id": "i", "name": "INSA Lyon", "type": "École publique · Lyon", "initials": "IN"},
    {"id": "s3", "hall_id": "i", "name": "École des Ponts", "type": "Grande école · Paris", "initials": "EP"},
    {"id": "s4", "hall_id": "i", "name": "Arts et Métiers", "type": "Grande école · Paris", "initials": "AM"},
    {"id": "s5", "hall_id": "i", "name": "ISEP Paris", "type": "École privée · Paris", "initials": "IS"},
    {"id": "s6", "hall_id": "c", "name": "HEC Paris", "type": "Grande école · Jouy-en-Josas", "initials": "HC"},
    {"id": "s7", "hall_id": "c", "name": "ESSEC", "type": "Grande école · Cergy", "initials": "ES"},
    {"id": "s8", "hall_id": "c", "name": "ESCP", "type": "Grande école · Paris", "initials": "EC"},
    {"id": "s9", "hall_id": "c", "name": "emlyon", "type": "École de commerce · Lyon", "initials": "EM"},
    {"id": "s10", "hall_id": "p", "name": "Louis-le-Grand", "type": "CPGE MPSI-MP · Paris 5e", "initials": "LG"},
    {"id": "s11", "hall_id": "p", "name": "Henri IV", "type": "CPGE PCSI-PSI · Paris 5e", "initials": "H4"},
    {"id": "s12", "hall_id": "p", "name": "Janson de Sailly", "type": "CPGE MPSI · Paris 16e", "initials": "JS"},
    {"id": "c1", "hall_id": "k", "name": "Intégrer une école d'ingénieurs", "type": "Amphi A · 14h00–14h45", "initials": "▶"},
    {"id": "c2", "hall_id": "k", "name": "Parcoursup 2026", "type": "Amphi B · 15h00–15h30", "initials": "▶"},
    {"id": "c3", "hall_id": "k", "name": "Grandes écoles de commerce", "type": "Amphi A · 16h00–16h45", "initials": "▶"},
    {"id": "c4", "hall_id": "k", "name": "Financer ses études", "type": "Amphi B · 16h30–17h00", "initials": "▶"},
]


async def seed_database():
    # Schools
    if await db.schools.count_documents({}) == 0:
        docs = []
        for s in SCHOOLS_SEED:
            doc = {**s, "qr_token": f"STAND-{s['id'].upper()}-{secrets.token_hex(3).upper()}"}
            docs.append(doc)
        await db.schools.insert_many(docs)
        logger.info(f"Seeded {len(docs)} schools")

    # Demo class
    if await db.classes.count_documents({"code": "PROF2026"}) == 0:
        await db.classes.insert_one({
            "id": str(uuid.uuid4()),
            "code": "PROF2026",
            "teacher_name": "M. Bernard",
            "school_name": "Lycée Henri-IV · Terminale S3",
            "created_at": now_iso(),
        })
        logger.info("Seeded demo class PROF2026")

    # Demo student: Lucas
    if await db.students.count_documents({"id": "demo-lucas"}) == 0:
        lucas = {
            "id": "demo-lucas",
            "serial": "SAL-2026-04721",
            "name": "Lucas Martin",
            "emoji": "🎓",
            "classe": "Terminale générale",
            "filieres": ["Ingénierie", "Numérique"],
            "formation": ["École d'ingénieurs"],
            "nat": "FRANÇAISE",
            "dob_short": "12/03/2008",
            "sex": "M",
            "lieu": "Paris (75)",
            "expire": "15/04/2031",
            "consents": {"l": True, "d": True, "c": True, "e": False},
            "class_code": "PROF2026",
            "is_demo": True,
            "is_anonymous": False,
            "created_at": now_iso(),
        }
        await db.students.insert_one(lucas)

    # Demo student: Théo (anonyme)
    if await db.students.count_documents({"id": "demo-theo"}) == 0:
        theo = {
            "id": "demo-theo",
            "serial": "—",
            "name": "Théo",
            "emoji": "👥",
            "classe": "—",
            "filieres": [],
            "formation": [],
            "nat": "—",
            "dob_short": "—",
            "sex": "—",
            "lieu": "—",
            "expire": "—",
            "consents": {"l": False, "d": False, "c": False, "e": False},
            "class_code": None,
            "is_demo": True,
            "is_anonymous": True,
            "created_at": now_iso(),
        }
        await db.students.insert_one(theo)


# ============== HELPERS ==============
def clean_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc


def compute_score(stamp_count: int, consents_count: int, filieres_count: int) -> int:
    if stamp_count == 0:
        return 0
    base = 40
    base += min(stamp_count, 10) * 5
    base += consents_count * 2
    base += min(filieres_count, 3) * 3
    return min(98, base)


# ============== ROUTES ==============
@api_router.get("/")
async def root():
    return {"app": "PasseportEtudiant", "version": "1.0"}


@api_router.get("/halls")
async def get_halls():
    return HALLS_SEED


@api_router.get("/schools")
async def get_schools():
    schools = await db.schools.find({}, {"_id": 0}).to_list(500)
    return schools


@api_router.get("/schools/{school_id}")
async def get_school(school_id: str):
    s = await db.schools.find_one({"id": school_id}, {"_id": 0})
    if not s:
        raise HTTPException(404, "School not found")
    return s


# ------- Classes -------
@api_router.post("/classes")
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


@api_router.get("/classes/{code}")
async def get_class(code: str):
    c = await db.classes.find_one({"code": code.upper()}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Class not found")
    return c


@api_router.get("/classes/{code}/students")
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


# ------- Students -------
@api_router.post("/students")
async def create_student(body: StudentCreate):
    code = body.class_code.upper().strip()
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


@api_router.get("/students/{student_id}")
async def get_student(student_id: str):
    s = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not s:
        raise HTTPException(404, "Student not found")
    return s


@api_router.patch("/students/{student_id}")
async def update_student(student_id: str, body: StudentUpdate):
    update = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if "consents" in update and update["consents"] is not None:
        update["consents"] = dict(update["consents"])
    if not update:
        return await get_student(student_id)
    res = await db.students.update_one({"id": student_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Student not found")
    return await get_student(student_id)


# ------- Stamps -------
@api_router.get("/students/{student_id}/stamps")
async def list_stamps(student_id: str):
    stamps = await db.stamps.find({"student_id": student_id}, {"_id": 0}).sort("timestamp", 1).to_list(500)
    return stamps


@api_router.post("/stamps")
async def create_stamp(body: StampCreate):
    student = await db.students.find_one({"id": body.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(404, "Student not found")
    if student.get("is_anonymous"):
        raise HTTPException(403, "Profil anonyme — pas de tampon possible")
    school = await db.schools.find_one({"qr_token": body.qr_token}, {"_id": 0})
    if not school:
        # Allow direct school_id fallback
        school = await db.schools.find_one({"id": body.qr_token}, {"_id": 0})
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
    return {"stamp": clean_doc(doc), "duplicate": False, "school": school}


@api_router.delete("/stamps/{stamp_id}")
async def delete_stamp(stamp_id: str):
    res = await db.stamps.delete_one({"id": stamp_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Stamp not found")
    return {"ok": True}


# ------- Recap -------
@api_router.get("/students/{student_id}/recap")
async def recap(student_id: str):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(404, "Student not found")
    stamps = await db.stamps.find({"student_id": student_id}, {"_id": 0}).to_list(500)
    consents = student.get("consents", {})
    consents_count = sum(1 for v in consents.values() if v)
    filieres = student.get("filieres", [])
    score = compute_score(len(stamps), consents_count, len(filieres))

    # Static reco: match by filiere and stamps
    schools = await db.schools.find({}, {"_id": 0}).to_list(500)
    visited_ids = {s["school_id"] for s in stamps}

    recos = []
    if student.get("is_anonymous"):
        pass
    else:
        # Priority: schools in visited halls that match filieres
        visited_halls = {s["hall_id"] for s in stamps}
        for sc in schools:
            if sc["id"] in visited_ids:
                continue
            score_match = 60
            if sc["hall_id"] in visited_halls:
                score_match += 20
            if "Ingénierie" in filieres and sc["hall_id"] == "i":
                score_match += 14
            if "Commerce" in filieres and sc["hall_id"] == "c":
                score_match += 14
            if sc["hall_id"] == "k":
                continue
            recos.append({
                "name": sc["name"],
                "type": sc["type"],
                "m": min(98, score_match),
                "t": score_match >= 85,
            })
        recos.sort(key=lambda r: -r["m"])
        recos = recos[:3]

    # Next steps
    next_steps = []
    if not student.get("is_anonymous"):
        if filieres and "Ingénierie" in filieres:
            next_steps.append({"t": "JPO CentraleSupélec", "d": "14 mai 2026", "c": "#E3000B"})
        next_steps.append({"t": "Clôture Parcoursup", "d": "10 mai 2026", "c": "#1A237E"})
        next_steps.append({"t": "Webinaire Orientation", "d": "8 mai 2026", "c": "#6D28D9"})

    return {
        "student": student,
        "stamps": stamps,
        "score": score,
        "recos": recos,
        "next": next_steps,
        "duration_min": 30 + len(stamps) * 8 if len(stamps) > 0 else 0,
    }


# ------- Analytics -------
@api_router.get("/analytics/overview")
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
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    await seed_database()
    logger.info("Seed done.")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
