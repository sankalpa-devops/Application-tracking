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


# ---------------- GET CANDIDATES ----------------
@router.get("/", response_model=List[CandidateResponse])
def get_candidates(
    job: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
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

    # 🔹 Filter by Candidate Status
    if status and status != "ALL":
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