from datetime import datetime, timedelta
import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models.models import Candidate, CandidateMLData, CandidateStatusHistory, Interview, Job, User


router = APIRouter(prefix="/admin", tags=["Admin"])
security = HTTPBearer()

SECRET = os.getenv("SECRET_KEY")
if not SECRET:
    raise RuntimeError("SECRET_KEY not set")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(credentials.credentials, SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    emp_id = payload.get("sub")
    if not emp_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.emp_id == emp_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if (user.role or "").upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin access required")

    return user


def serialize_user(user: User):
    return {
        "id": user.id,
        "emp_id": user.emp_id,
        "user_name": user.user_name,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.get("/dashboard")
def get_admin_dashboard(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    today = datetime.utcnow().date()
    week_start = datetime.utcnow() - timedelta(days=7)

    total_users = db.query(func.count(User.id)).scalar() or 0
    hr_users = db.query(func.count(User.id)).filter(func.upper(User.role) == "HR").scalar() or 0
    admin_users = db.query(func.count(User.id)).filter(func.upper(User.role) == "ADMIN").scalar() or 0
    open_jobs = db.query(func.count(Job.id)).filter(Job.status == "Open").scalar() or 0
    archived_jobs = db.query(func.count(Job.id)).filter(Job.status == "Archived").scalar() or 0
    total_candidates = db.query(func.count(Candidate.id)).scalar() or 0
    interviews_scheduled = (
        db.query(func.count(Interview.interview_id))
        .filter(Interview.status == "Scheduled")
        .scalar()
        or 0
    )
    candidates_this_week = (
        db.query(func.count(Candidate.id))
        .filter(Candidate.created_at >= week_start)
        .scalar()
        or 0
    )
    walkins_today = (
        db.query(func.count(Candidate.id))
        .filter(Candidate.source == "walkin")
        .filter(func.date(Candidate.created_at) == today)
        .scalar()
        or 0
    )
    shortlisted = (
        db.query(func.count(Candidate.id))
        .filter(Candidate.status == "Shortlisted")
        .scalar()
        or 0
    )
    average_ats_score = db.query(func.avg(CandidateMLData.ats_score)).scalar()

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
    department_rows = (
        db.query(
            Job.department,
            func.count(Job.id).label("jobs"),
            func.coalesce(func.sum(Job.openings), 0).label("openings"),
        )
        .group_by(Job.department)
        .order_by(func.count(Job.id).desc())
        .limit(6)
        .all()
    )
    recent_jobs = (
        db.query(Job)
        .order_by(Job.created_date.desc(), Job.title.asc())
        .limit(5)
        .all()
    )
    recent_candidates = (
        db.query(Candidate, Job.title.label("job_title"))
        .outerjoin(Job, Candidate.job_match_id == Job.id)
        .order_by(Candidate.created_at.desc())
        .limit(5)
        .all()
    )

    conversion_row = (
        db.query(
            func.count(Candidate.id).label("total"),
            func.sum(case((Candidate.status == "Shortlisted", 1), else_=0)).label("shortlisted"),
        )
        .first()
    )
    conversion_rate = 0
    if conversion_row and conversion_row.total:
        conversion_rate = round(((conversion_row.shortlisted or 0) / conversion_row.total) * 100, 1)

    return {
        "generated_for": current_admin.user_name,
        "metrics": {
            "total_users": total_users,
            "hr_users": hr_users,
            "admin_users": admin_users,
            "open_jobs": open_jobs,
            "archived_jobs": archived_jobs,
            "total_candidates": total_candidates,
            "candidates_this_week": candidates_this_week,
            "walkins_today": walkins_today,
            "shortlisted": shortlisted,
            "interviews_scheduled": interviews_scheduled,
            "average_ats_score": round(float(average_ats_score or 0), 1),
            "conversion_rate": conversion_rate,
        },
        "candidate_status": [
            {"status": status or "Unknown", "count": count} for status, count in status_rows
        ],
        "candidate_sources": [
            {"source": source or "Unknown", "count": count} for source, count in source_rows
        ],
        "departments": [
            {
                "department": department or "Unassigned",
                "jobs": jobs,
                "openings": int(openings or 0),
            }
            for department, jobs, openings in department_rows
        ],
        "recent_jobs": [
            {
                "id": job.id,
                "title": job.title,
                "department": job.department,
                "status": job.status,
                "openings": job.openings,
                "created_by": job.created_by,
                "created_date": job.created_date.isoformat() if job.created_date else None,
            }
            for job in recent_jobs
        ],
        "recent_candidates": [
            {
                "id": candidate.id,
                "name": candidate.name,
                "job": job_title or "N/A",
                "source": candidate.source,
                "status": candidate.status,
                "created_at": candidate.created_at.isoformat() if candidate.created_at else None,
            }
            for candidate, job_title in recent_candidates
        ],
    }


@router.get("/users")
def get_users(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.created_at.desc(), User.user_name.asc()).all()
    return [serialize_user(user) for user in users]


@router.patch("/users/{emp_id}")
def update_user(
    emp_id: str,
    data: dict,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.emp_id == emp_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = data.get("role")
    email = data.get("email")
    user_name = data.get("user_name")

    if role is not None:
        normalized_role = str(role).upper()
        if normalized_role not in {"ADMIN", "HR"}:
            raise HTTPException(status_code=400, detail="Role must be ADMIN or HR")
        user.role = normalized_role

    if email is not None:
        user.email = email

    if user_name is not None:
        if not str(user_name).strip():
            raise HTTPException(status_code=400, detail="User name cannot be empty")
        user.user_name = str(user_name).strip()

    db.commit()
    db.refresh(user)
    return serialize_user(user)


@router.delete("/users/{emp_id}")
def delete_user(
    emp_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if emp_id == current_admin.emp_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account")

    user = db.query(User).filter(User.emp_id == emp_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


@router.get("/activity")
def get_recent_activity(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(CandidateStatusHistory)
        .order_by(CandidateStatusHistory.changed_at.desc())
        .limit(10)
        .all()
    )

    return [
        {
            "id": row.id,
            "candidate_id": row.candidate_id,
            "old_status": row.old_status,
            "new_status": row.new_status,
            "changed_by": row.changed_by,
            "changed_at": row.changed_at.isoformat() if row.changed_at else None,
        }
        for row in rows
    ]


@router.get("/candidates")
def admin_get_candidates(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    try:
        from app.routes.candidates import cleanup_expired_rejected_candidates
        cleanup_expired_rejected_candidates(db)
    except Exception as e:
        print(f"Error during admin candidate cleanup: {e}")

    rows = (
        db.query(
            Candidate.id,
            Candidate.name,
            Candidate.email,
            Candidate.phone,
            Candidate.experience,
            Candidate.status,
            Job.title.label("job_title")
        )
        .outerjoin(Job, Candidate.job_match_id == Job.id)
        .all()
    )
    return [
        {
            "id": r.id,
            "name": r.name,
            "email": r.email,
            "phone": r.phone,
            "experience": r.experience,
            "status": r.status,
            "job": r.job_title or "N/A"
        }
        for r in rows
    ]


@router.delete("/candidates/{candidate_id}")
def admin_delete_candidate(
    candidate_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    old_status = candidate.status or "Applied"
    candidate.status = "Deleted"
    candidate.status_updated_at = datetime.utcnow()

    history = CandidateStatusHistory(
        candidate_id=candidate.id,
        old_status=old_status,
        new_status="Deleted",
        changed_by="Admin"
    )
    db.add(history)
    db.commit()

    return {"message": "Candidate deleted successfully"}


@router.post("/candidates/{candidate_id}/restore")
def admin_restore_candidate(
    candidate_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    old_status = candidate.status or "Deleted"
    candidate.status = "Applied"
    candidate.status_updated_at = datetime.utcnow()

    history = CandidateStatusHistory(
        candidate_id=candidate.id,
        old_status=old_status,
        new_status="Applied",
        changed_by="Admin"
    )
    db.add(history)
    db.commit()

    return {"message": "Candidate restored successfully"}
