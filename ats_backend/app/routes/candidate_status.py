from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime
from jose import jwt
import os

from app.db import SessionLocal
from app.models.models import Candidate, User, CandidateStatusHistory, Job

router = APIRouter(prefix="/candidates", tags=["Candidate Status"])
security = HTTPBearer()

SECRET = os.getenv("SECRET_KEY")
if not SECRET:
    raise RuntimeError("SECRET_KEY not set")


# ---------------- DB ----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------- AUTH ----------------
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    emp_id = payload.get("sub")
    if not emp_id:
        raise HTTPException(status_code=401, detail="Invalid payload")

    user = db.query(User).filter(User.emp_id == emp_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


# =====================================================
# ✅ GET JOBS (ONLY REJECTED CANDIDATES)
# =====================================================
@router.get("/jobs-from-candidates")
def get_jobs_from_candidates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    jobs = (
        db.query(Job.id, Job.title)
        .join(Candidate, Candidate.job_match_id == Job.id)
        .filter(Candidate.status == "Rejected")   # ✅ important
        .distinct()
        .all()
    )

    return [{"id": j.id, "title": j.title} for j in jobs]


# =====================================================
# ✅ GET REJECTED CANDIDATES BY JOB
# =====================================================
@router.get("/rejected/{job_id}")
def get_rejected_candidates(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidates = (
        db.query(Candidate)
        .filter(
            Candidate.job_match_id == job_id,
            Candidate.status == "Rejected"
        )
        .all()
    )

    return candidates


# =====================================================
# ✅ UNDO REJECT
# =====================================================
@router.patch("/{candidate_id}/undo-reject")
def undo_reject_candidate(
    candidate_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id
    ).first()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if candidate.status != "Rejected":
        raise HTTPException(status_code=400, detail="Candidate is not rejected")

    old_status = candidate.status
    new_status = "Applied"

    candidate.status = new_status
    candidate.status_updated_at = datetime.utcnow()

    history = CandidateStatusHistory(
        candidate_id=candidate.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=current_user.emp_id,
        changed_at=datetime.utcnow()
    )

    db.add(history)
    db.commit()

    return {"message": "Candidate restored to Applied"}