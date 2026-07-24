# from fastapi import APIRouter, Depends, HTTPException
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from sqlalchemy.orm import Session
# from sqlalchemy import func
# from datetime import datetime
# from jose import jwt
# import os

# from app.db import SessionLocal
# from app.models.models import Job, Candidate, User

# # ---------------- CONFIG ----------------

# router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
# security = HTTPBearer()

# SECRET = os.getenv("SECRET_KEY")
# if not SECRET:
#     raise RuntimeError("SECRET_KEY not set")

# # ---------------- DB DEPENDENCY ----------------

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# # ---------------- AUTH ----------------

# def get_current_user(
#     credentials: HTTPAuthorizationCredentials = Depends(security),
#     db: Session = Depends(get_db),
# ):
#     token = credentials.credentials

#     try:
#         payload = jwt.decode(token, SECRET, algorithms=["HS256"])
#     except Exception:
#         raise HTTPException(status_code=401, detail="Invalid token")

#     emp_id = payload.get("sub")
#     if not emp_id:
#         raise HTTPException(status_code=401, detail="Invalid payload")

#     user = db.query(User).filter(User.emp_id == emp_id).first()
#     if not user:
#         raise HTTPException(status_code=401, detail="User not found")

#     return user

# # =====================================================
# # HR DASHBOARD (PROTECTED)
# # =====================================================

# @router.get("/hr")
# def get_hr_dashboard(
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
# ):
#     today = datetime.utcnow().date()

#     # Open Jobs
#     open_jobs = (
#         db.query(func.count(Job.id))
#         .filter(Job.status == "Open")
#         .scalar()
#     )

#     # Total Candidates
#     total_candidates = db.query(func.count(Candidate.id)).scalar()

#     # Walk-ins Today
#     walkins_today = (
#         db.query(func.count(Candidate.id))
#         .filter(Candidate.source == "walkin")
#         .filter(func.date(Candidate.created_at) == today)
#         .scalar()
#     )

#     # Shortlisted Candidates
#     shortlisted = (
#         db.query(func.count(Candidate.id))
#         .filter(Candidate.status == "Shortlisted")
#         .scalar()
#     )

#     return {
#         "open_jobs": open_jobs or 0,
#         "total_candidates": total_candidates or 0,
#         "walkins_today": walkins_today or 0,
#         "shortlisted": shortlisted or 0,
#         "insights": insights
#     }
#     # =========================
# # AI INSIGHTS LOGIC
# # =========================

# insights = []

# # 1. High competition roles (more candidates per job)
# job_competition = (
#     db.query(
#         Job.title,
#         func.count(Candidate.id).label("candidate_count")
#     )
#     .join(Candidate, Candidate.job_match_id == Job.id)
#     .group_by(Job.id)
#     .order_by(func.count(Candidate.id).desc())
#     .limit(1)
#     .first()
# )

# if job_competition and job_competition.candidate_count > 10:
#     insights.append(
#         f"{job_competition.title} roles have high applicant competition"
#     )

# # 2. Skill gap detection (from ML data)
# skill_gap = (
#     db.query(
#         CandidateMLData.job_id,
#         func.avg(CandidateMLData.skill_score).label("avg_skill")
#     )
#     .group_by(CandidateMLData.job_id)
#     .order_by(func.avg(CandidateMLData.skill_score))
#     .limit(1)
#     .first()
# )

# if skill_gap and skill_gap.avg_skill < 50:
#     job = db.query(Job).filter(Job.id == skill_gap.job_id).first()
#     if job:
#         insights.append(
#             f"Skill gap detected in {job.title} hiring"
#         )

# # 3. Walk-in vs Online conversion
# walkin_shortlisted = (
#     db.query(func.count(Candidate.id))
#     .filter(Candidate.source == "walkin")
#     .filter(Candidate.status == "Shortlisted")
#     .scalar()
# )

# online_shortlisted = (
#     db.query(func.count(Candidate.id))
#     .filter(Candidate.source == "online")
#     .filter(Candidate.status == "Shortlisted")
#     .scalar()
# )

# if walkin_shortlisted > online_shortlisted:
#     insights.append("Walk-ins convert better than online applicants")

# # Fallback if no insights
# if not insights:
#     insights.append("Hiring pipeline is stable with no major gaps detected")

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import case, func
from datetime import datetime
from jose import jwt
import os

from app.db import SessionLocal
from app.models.models import Candidate, CandidateMLData, Interview, Job, Offer, User

# ---------------- CONFIG ----------------

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
security = HTTPBearer()

SECRET = os.getenv("SECRET_KEY")
if not SECRET:
    raise RuntimeError("SECRET_KEY not set")

# ---------------- DB DEPENDENCY ----------------

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
# HR DASHBOARD (PROTECTED)
# =====================================================

@router.get("/hr")
def get_hr_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = datetime.utcnow().date()

    # ---------------- BASIC METRICS ----------------

    open_jobs = (
        db.query(func.count(Job.id))
        .filter(Job.status == "Open")
        .scalar()
    )

    total_candidates = db.query(func.count(Candidate.id)).scalar()

    walkins_today = (
        db.query(func.count(Candidate.id))
        .filter(Candidate.source == "walkin")
        .filter(func.date(Candidate.created_at) == today)
        .scalar()
    )

    shortlisted = (
        db.query(func.count(Candidate.id))
        .filter(Candidate.status == "Shortlisted")
        .scalar()
    )

    # =========================
    # AI INSIGHTS LOGIC
    # =========================

    insights = []

    # 1. High competition roles
    job_competition = (
        db.query(
            Job.title,
            func.count(Candidate.id).label("candidate_count")
        )
        .join(Candidate, Candidate.job_match_id == Job.id)
        .group_by(Job.id)
        .order_by(func.count(Candidate.id).desc())
        .limit(1)
        .first()
    )

    if job_competition and job_competition.candidate_count > 10:
        insights.append(
            f"{job_competition.title} roles have high applicant competition"
        )

    # 2. Skill gap detection
    skill_gap = (
        db.query(
            CandidateMLData.job_id,
            func.avg(CandidateMLData.skill_score).label("avg_skill")
        )
        .group_by(CandidateMLData.job_id)
        .order_by(func.avg(CandidateMLData.skill_score))
        .limit(1)
        .first()
    )

    if skill_gap and skill_gap.avg_skill < 50:
        job = db.query(Job).filter(Job.id == skill_gap.job_id).first()
        if job:
            insights.append(
                f"Skill gap detected in {job.title} hiring"
            )

    # 3. Walk-in vs Online conversion
    walkin_shortlisted = (
        db.query(func.count(Candidate.id))
        .filter(Candidate.source == "walkin")
        .filter(Candidate.status == "Shortlisted")
        .scalar()
    )

    online_shortlisted = (
        db.query(func.count(Candidate.id))
        .filter(Candidate.source == "online")
        .filter(Candidate.status == "Shortlisted")
        .scalar()
    )

    if walkin_shortlisted > online_shortlisted:
        insights.append("Walk-ins convert better than online applicants")

    # Fallback
    if not insights:
        insights.append("Hiring pipeline is stable with no major gaps detected")

    # ---------------- RESPONSE ----------------

    return {
        "open_jobs": open_jobs or 0,
        "total_candidates": total_candidates or 0,
        "walkins_today": walkins_today or 0,
        "shortlisted": shortlisted or 0,
        "insights": insights
    }


@router.get("/analytics")
def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_candidates = db.query(func.count(Candidate.id)).scalar() or 0
    open_jobs = db.query(func.count(Job.id)).filter(Job.status == "Open").scalar() or 0
    total_openings = db.query(func.coalesce(func.sum(Job.openings), 0)).scalar() or 0
    interviews = db.query(func.count(Interview.interview_id)).scalar() or 0
    offers = db.query(func.count(Offer.offer_id)).scalar() or 0
    selected = db.query(func.count(Candidate.id)).filter(Candidate.status == "Selected").scalar() or 0
    rejected = db.query(func.count(Candidate.id)).filter(Candidate.status == "Rejected").scalar() or 0
    average_score = db.query(func.avg(CandidateMLData.ats_score)).scalar() or 0

    status_rows = (
        db.query(Candidate.status, func.count(Candidate.id))
        .group_by(Candidate.status)
        .order_by(func.count(Candidate.id).desc())
        .all()
    )

    source_rows = (
        db.query(Candidate.source, func.count(Candidate.id))
        .group_by(Candidate.source)
        .order_by(func.count(Candidate.id).desc())
        .all()
    )

    job_rows = (
        db.query(
            Job.title,
            Job.department,
            func.count(Candidate.id).label("candidate_count"),
            func.avg(CandidateMLData.ats_score).label("average_score"),
        )
        .outerjoin(Candidate, Candidate.job_match_id == Job.id)
        .outerjoin(CandidateMLData, CandidateMLData.candidate_id == Candidate.id)
        .group_by(Job.id)
        .order_by(func.count(Candidate.id).desc())
        .limit(8)
        .all()
    )

    score_rows = (
        db.query(
            func.sum(case((CandidateMLData.ats_score >= 80, 1), else_=0)).label("excellent"),
            func.sum(case((CandidateMLData.ats_score.between(60, 79), 1), else_=0)).label("good"),
            func.sum(case((CandidateMLData.ats_score.between(40, 59), 1), else_=0)).label("average"),
            func.sum(case((CandidateMLData.ats_score < 40, 1), else_=0)).label("low"),
        )
        .first()
    )

    interview_rows = (
        db.query(Interview.status, func.count(Interview.interview_id))
        .group_by(Interview.status)
        .order_by(func.count(Interview.interview_id).desc())
        .all()
    )

    department_rows = (
        db.query(
            Job.department,
            func.count(Job.id).label("jobs"),
            func.coalesce(func.sum(Job.openings), 0).label("openings"),
            func.count(Candidate.id).label("candidates"),
        )
        .outerjoin(Candidate, Candidate.job_match_id == Job.id)
        .group_by(Job.department)
        .order_by(func.count(Candidate.id).desc())
        .limit(8)
        .all()
    )

    return {
        "metrics": {
            "total_candidates": total_candidates,
            "open_jobs": open_jobs,
            "total_openings": int(total_openings or 0),
            "interviews": interviews,
            "offers": offers,
            "selected": selected,
            "rejected": rejected,
            "average_score": round(float(average_score or 0), 1),
            "conversion_rate": round((selected / total_candidates) * 100, 1) if total_candidates else 0,
            "rejection_rate": round((rejected / total_candidates) * 100, 1) if total_candidates else 0,
            "offer_rate": round((offers / total_candidates) * 100, 1) if total_candidates else 0,
        },
        "candidate_status": [
            {"label": status or "Unknown", "count": count} for status, count in status_rows
        ],
        "candidate_sources": [
            {"label": source or "Unknown", "count": count} for source, count in source_rows
        ],
        "top_jobs": [
            {
                "title": title or "Untitled",
                "department": department or "Unassigned",
                "candidate_count": candidate_count or 0,
                "average_score": round(float(avg_score or 0), 1),
            }
            for title, department, candidate_count, avg_score in job_rows
        ],
        "score_bands": [
            {"label": "Excellent 80+", "count": int(score_rows.excellent or 0)},
            {"label": "Good 60-79", "count": int(score_rows.good or 0)},
            {"label": "Average 40-59", "count": int(score_rows.average or 0)},
            {"label": "Low <40", "count": int(score_rows.low or 0)},
        ],
        "interviews_by_status": [
            {"label": status or "Unknown", "count": count} for status, count in interview_rows
        ],
        "departments": [
            {
                "label": department or "Unassigned",
                "jobs": jobs or 0,
                "openings": int(openings or 0),
                "candidates": candidates or 0,
            }
            for department, jobs, openings, candidates in department_rows
        ],
    }
