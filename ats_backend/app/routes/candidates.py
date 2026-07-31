from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db import SessionLocal
from app.models.models import Candidate, CandidateMLData, Job
from app.schemas.candidate import CandidateResponse

router = APIRouter(prefix="/candidates", tags=["Candidates"])


# ---------------- DB DEPENDENCY ----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def cleanup_expired_rejected_candidates(db: Session):
    from datetime import datetime, timedelta
    import os
    from sqlalchemy import or_
    from app.models.models import ATSFilterConfig, Candidate, CandidateMLData, Interview, Offer, CandidateStatusHistory

    # Fetch retention configuration
    config = db.query(ATSFilterConfig).filter(
        ATSFilterConfig.job_id == "GLOBAL_RETENTION"
    ).first()
    months = config.reject_score if (config and config.reject_score is not None) else 3

    threshold_date = datetime.utcnow() - timedelta(days=months * 30)

    # Find candidates who have been in "Rejected" status longer than threshold
    expired_candidates = db.query(Candidate).filter(
        Candidate.status == "Rejected",
        or_(
            Candidate.status_updated_at < threshold_date,
            (Candidate.status_updated_at == None) & (Candidate.created_at < threshold_date)
        )
    ).all()

    if expired_candidates:
        for c in expired_candidates:
            # Delete resume file from filesystem
            if c.resume_path and os.path.exists(c.resume_path):
                try:
                    os.remove(c.resume_path)
                except Exception as file_err:
                    print(f"Failed to delete resume file {c.resume_path}: {file_err}")

            # Delete related children records
            db.query(CandidateMLData).filter(CandidateMLData.candidate_id == c.id).delete(synchronize_session=False)
            db.query(Interview).filter(Interview.candidate_id == c.id).delete(synchronize_session=False)
            db.query(Offer).filter(Offer.candidate_id == c.id).delete(synchronize_session=False)
            db.query(CandidateStatusHistory).filter(CandidateStatusHistory.candidate_id == c.id).delete(synchronize_session=False)
            
            # Delete main candidate record
            db.delete(c)
            
        db.commit()
        print(f"[Cleanup] Successfully deleted {len(expired_candidates)} candidate records older than {months} months.")


# ---------------- GET CANDIDATES ----------------
@router.get("/", response_model=List[CandidateResponse])
def get_candidates(
    job: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        cleanup_expired_rejected_candidates(db)
    except Exception as e:
        print(f"Error during candidate cleanup: {e}")
    query = (
        db.query(
            Candidate.id,
            Candidate.name,
            Candidate.email,
            Candidate.phone,
            Candidate.experience,
            Candidate.status,
            Candidate.notice_period,
            Candidate.current_ctc,
            Candidate.expected_ctc,
            Candidate.willing_to_relocate,

            Job.title.label("job_title"),

            CandidateMLData.ats_score,
            CandidateMLData.matched_skills
        )
        .outerjoin(Job, Candidate.job_match_id == Job.id)
        .outerjoin(
            CandidateMLData,
            Candidate.id == CandidateMLData.candidate_id
        )
    )

    # ---------------- FILTERS ----------------

    # 🔹 Filter by Job Title
    if job and job != "ALL":
        query = query.filter(Job.title == job)

    # 🔹 Filter by Candidate Status (excluding deleted candidates by default)
    if not status or status == "ALL":
        query = query.filter(Candidate.status != "Deleted")
    elif status and status != "ALL":
        query = query.filter(Candidate.status == status)

    # 🔹 Search from Name OR Matched Skills
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Candidate.name.ilike(search_pattern)) |
            (CandidateMLData.matched_skills.ilike(search_pattern))
        )

    rows = query.all()

    response = []

    for r in rows:
      response.append({
                "id": r.id,
                "name": r.name,
                "email": r.email,
                "phone": r.phone,

                "job": r.job_title or "N/A",

                "experience": r.experience,
                "status": r.status,

                "notice_period": f"{r.notice_period} Days" if r.notice_period else "N/A",

                "skills": (
                    r.matched_skills.split(",")
                    if r.matched_skills else []
                ),

                "fitScore": int(r.ats_score) if r.ats_score else 0,

                "current_ctc": float(r.current_ctc) if r.current_ctc else None,
                "expected_ctc": float(r.expected_ctc) if r.expected_ctc else None,

                "willing_to_relocate": r.willing_to_relocate
            })

    return response