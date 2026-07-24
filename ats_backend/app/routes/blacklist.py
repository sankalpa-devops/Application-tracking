from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.db import SessionLocal
from app.models.models import Candidate, CandidateBlacklist, User
from app.routes.jobs import get_current_user
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(dependencies=[Depends(HTTPBearer())])

# ---------------- DB ----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ================= ADD TO BLACKLIST =================
@router.post("/blacklist")
def add_to_blacklist(
    data: dict,
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: Session = Depends(get_db)
):
    user = get_current_user(credentials.credentials, db)

    candidate = db.query(Candidate).filter(Candidate.id == data["candidate_id"]).first()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # 🔹 Duplicate detection via govt IDs
    existing = db.query(CandidateBlacklist).filter(
        (CandidateBlacklist.pan == candidate.pan) |
        (CandidateBlacklist.aadhaar == candidate.aadhaar) |
        (CandidateBlacklist.uan == candidate.uan)
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already blacklisted")

    record = CandidateBlacklist(
        id=str(uuid.uuid4()),
        candidate_id=candidate.id,
        name=candidate.name,
        email=candidate.email,
        phone=candidate.phone,
        pan=candidate.pan,
        aadhaar=candidate.aadhaar,
        uan=candidate.uan,
        reason=data.get("reason"),
        blacklisted_by=user.user_name,
        is_active=True
    )

    db.add(record)
    db.commit()

    return {"message": "Candidate Blacklisted"}

# ================= GET BLACKLISTED CANDIDATES =================
@router.get("/blacklist")
def get_blacklist(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: Session = Depends(get_db)
):
    get_current_user(credentials.credentials, db)

    records = db.query(CandidateBlacklist).order_by(CandidateBlacklist.created_at.desc()).all()
    return records
# ================= REMOVE FROM BLACKLIST =================
@router.patch("/blacklist/{id}/whitelist")
def whitelist_candidate(
    id: str,
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: Session = Depends(get_db)
):
    get_current_user(credentials.credentials, db)

    record = db.query(CandidateBlacklist).filter(CandidateBlacklist.id == id).first()

    if not record:
        raise HTTPException(status_code=404, detail="Not found")

    record.is_active = False
    record.updated_at = datetime.utcnow()

    db.commit()

    return {"message": "Candidate Whitelisted"}