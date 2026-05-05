from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid


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
    l: bool = False  # Contenus personnalisés l'Étudiant  # noqa: E741
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
    # Engagement signals (D2 / D3)
    scan_exposant: bool = False
    email_opened: bool = False
    clicked_reco: bool = False
    returned_site: bool = False
    created_at: str = Field(default_factory=now_iso)


class StudentCreate(BaseModel):
    name: str
    emoji: str = "🧑"
    classe: str = "Non renseigné"
    filieres: List[str] = Field(default_factory=list)
    formation: List[str] = Field(default_factory=list)
    class_code: Optional[str] = None


class StudentUpdate(BaseModel):
    emoji: Optional[str] = None
    name: Optional[str] = None
    classe: Optional[str] = None
    filieres: Optional[List[str]] = None
    formation: Optional[List[str]] = None
    consents: Optional[Consents] = None
    scan_exposant: Optional[bool] = None
    email_opened: Optional[bool] = None
    clicked_reco: Optional[bool] = None
    returned_site: Optional[bool] = None


class Stamp(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    school_id: str
    hall_id: str
    school_name: str
    time_label: str
    rating: Optional[int] = None  # 1-5, given by student after visit
    timestamp: str = Field(default_factory=now_iso)


class StampCreate(BaseModel):
    student_id: str
    qr_token: str


class StampRating(BaseModel):
    rating: int  # 1-5


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
