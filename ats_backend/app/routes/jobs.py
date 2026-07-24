from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from datetime import date
from jose import jwt
import os
import uuid
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.db import SessionLocal
from app.models.models import Job, User

security = HTTPBearer()

router = APIRouter(
    dependencies=[Depends(security)]
)

security = HTTPBearer()

SECRET = os.getenv("SECRET_KEY")
if not SECRET:
    raise RuntimeError("SECRET_KEY not set in environment variables")

# ---------------- DB DEPENDENCY ----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------- AUTH CHECK ----------------
def get_current_user(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    emp_id = payload.get("sub")
    if not emp_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.emp_id == emp_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

# ---------------- SCHEMA GUARD ----------------
def ensure_jobs_schema(db: Session):
    columns = {column["name"] for column in inspect(db.bind).get_columns("jobs")}

    if "job_description" not in columns:
        db.execute(text("ALTER TABLE jobs ADD COLUMN job_description TEXT AFTER status"))
        db.commit()

# ================= CREATE JOB =================
@router.post("/jobs")
def create_job(
    data: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    user = get_current_user(credentials.credentials, db)
    ensure_jobs_schema(db)

    job = Job(
        id=data.get("id") or str(uuid.uuid4()),
        title=data.get("title"),
        department=data.get("department"),
        type=data.get("type"),
        experience=data.get("experience"),
        skills=data.get("skills"),
        location=data.get("location"),
        manager=data.get("manager"),
        openings=data.get("openings"),
        status=data.get("status"),
        job_description=data.get("job_description"),  # ✅ ADD
        created_by=user.user_name,
        created_date=date.today(),
        version=1,
    )

    db.add(job)
    db.commit()
    return {"message": "Job Created"}

# ================= GET ALL JOBS =================
@router.get("/jobs")
def get_jobs(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    get_current_user(credentials.credentials, db)
    ensure_jobs_schema(db)

    jobs = db.query(Job).order_by(Job.created_date.desc()).all()
    return jobs

# ================= UPDATE JOB =================
@router.put("/jobs/{job_id}")
def update_job(
    job_id: str,
    data: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    user = get_current_user(credentials.credentials, db)
    ensure_jobs_schema(db)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    for key, value in data.items():
        if hasattr(job, key):
            setattr(job, key, value)

    job.version += 1
    job.created_by = user.user_name

    db.commit()
    return {"message": "Job Updated"}

# ================= DELETE JOB =================
@router.delete("/jobs/{job_id}")
def delete_job(
    job_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    get_current_user(credentials.credentials, db)
    ensure_jobs_schema(db)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(job)
    db.commit()
    return {"message": "Job Deleted"}

# ================= ARCHIVE JOB =================
@router.patch("/jobs/{job_id}/archive")
def archive_job(
    job_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    get_current_user(credentials.credentials, db)
    ensure_jobs_schema(db)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.status = "Archived" if job.status != "Archived" else "Open"
    db.commit()
    return {"message": "Job Status Updated"}

# ================= CLONE JOB =================
@router.post("/jobs/{job_id}/clone")
def clone_job(
    job_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    user = get_current_user(credentials.credentials, db)
    ensure_jobs_schema(db)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    new_job = Job(
        id=str(uuid.uuid4()),
        title=job.title + " (Copy)",
        department=job.department,
        type=job.type,
        experience=job.experience,
        skills=job.skills,
        location=job.location,
        manager=job.manager,
        openings=job.openings,
        status="Open",
        job_description=job.job_description,  # ✅ ADD
        created_by=user.user_name,
        created_date=date.today(),
        version=1,
    )

    db.add(new_job)
    db.commit()
    return {"message": "Job Cloned"}
