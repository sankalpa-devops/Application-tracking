from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
import uuid
import secrets
import os

from app.db import SessionLocal
from app.models.models import JobApplyLink, Job, User

# ---------------- CONFIG ----------------

router = APIRouter(prefix="/jobs", tags=["Job Links"])
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

# ---------------- SCHEMA GUARD ----------------

def ensure_job_links_schema(db: Session):
    inspector = inspect(db.bind)

    if not inspector.has_table("job_apply_links"):
        db.execute(text("""
            CREATE TABLE job_apply_links (
                id VARCHAR(36) PRIMARY KEY,
                job_id VARCHAR(36),
                slug VARCHAR(225) UNIQUE,
                expires_at DATETIME,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
            )
        """))
        db.commit()
        return

    columns = {column["name"] for column in inspector.get_columns("job_apply_links")}
    column_definitions = {
        "job_id": "ALTER TABLE job_apply_links ADD COLUMN job_id VARCHAR(36) AFTER id",
        "slug": "ALTER TABLE job_apply_links ADD COLUMN slug VARCHAR(225) UNIQUE AFTER job_id",
        "expires_at": "ALTER TABLE job_apply_links ADD COLUMN expires_at DATETIME AFTER slug",
        "is_active": "ALTER TABLE job_apply_links ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER expires_at",
        "created_at": "ALTER TABLE job_apply_links ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER is_active",
    }

    for column_name, ddl in column_definitions.items():
        if column_name not in columns:
            db.execute(text(ddl))

    db.commit()

# =====================================================
# GENERATE APPLY LINK (only when needed)
# =====================================================

@router.post("/{job_id}/apply-link")
def generate_apply_link(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_job_links_schema(db)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Disable old active links
    db.query(JobApplyLink).filter(
        JobApplyLink.job_id == job_id,
        JobApplyLink.is_active == True
    ).update({"is_active": False})

    link = JobApplyLink(
        id=str(uuid.uuid4()),
        job_id=job_id,
        slug=secrets.token_urlsafe(16),
        expires_at=datetime.utcnow() + timedelta(days=7),
        is_active=True,
    )

    db.add(link)
    db.commit()
    db.refresh(link)

    return link

# =====================================================
# FETCH ACTIVE LINK FOR A JOB (IMPORTANT FIX)
# =====================================================

@router.get("/{job_id}/apply-link")
def get_active_apply_link(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_job_links_schema(db)

    link = (
        db.query(JobApplyLink)
        .filter(
            JobApplyLink.job_id == job_id,
            JobApplyLink.is_active == True,
            JobApplyLink.expires_at > datetime.utcnow()
        )
        .first()
    )

    if not link:
        return {"message": "No active link"}

    return link

# =====================================================
# FETCH ALL LINKS (Admin View)
# =====================================================

@router.get("/apply-links")
def list_all_links(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_job_links_schema(db)

    links = (
        db.query(JobApplyLink)
        .order_by(JobApplyLink.created_at.desc())
        .all()
    )
    
    # Serialize to ensure only job link data is returned
    return [
        {
            "id": link.id,
            "job_id": link.job_id,
            "slug": link.slug,
            "expires_at": link.expires_at.isoformat() if link.expires_at else None,
            "is_active": link.is_active,
            "created_at": link.created_at.isoformat() if link.created_at else None,
        }
        for link in links
    ]

# =====================================================
# DISABLE LINK
# =====================================================

@router.patch("/apply-link/{link_id}/disable")
def disable_link(
    link_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_job_links_schema(db)

    link = db.query(JobApplyLink).filter(JobApplyLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    link.is_active = False
    db.commit()

    return {"message": "Link disabled successfully"}

# =====================================================
# PUBLIC APPLY PAGE (NO AUTH)
# =====================================================

# @router.get("/apply/{slug}", tags=["Public"])
# def public_apply(slug: str, db: Session = Depends(get_db)):
#     link = (
#         db.query(JobApplyLink)
#         .filter(
#             JobApplyLink.slug == slug,
#             JobApplyLink.is_active == True,
#             JobApplyLink.expires_at > datetime.utcnow()
#         )
#         .first()
#     )

#     if not link:
#         raise HTTPException(status_code=404, detail="Link expired or invalid")

#     return {
#         "job_id": link.job_id,
#         "expires_at": link.expires_at,
#     }

