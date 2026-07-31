from datetime import datetime, timedelta
import os
import secrets
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from sqlalchemy import func, inspect, text
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models.models import Candidate, JoiningForm, JoiningFormLink, Job, User
from app.services.joining_form_pdf import generate_joining_form_pdf


router = APIRouter(prefix="/joining-forms", tags=["Joining Forms"])
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


def get_current_user(
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

    return user


def ensure_joining_form_schema(db: Session):
    inspector = inspect(db.bind)

    if not inspector.has_table("joining_form_links"):
        db.execute(text("""
            CREATE TABLE joining_form_links (
                id VARCHAR(36) PRIMARY KEY,
                candidate_id VARCHAR(36) NOT NULL,
                slug VARCHAR(225) UNIQUE NOT NULL,
                title VARCHAR(200),
                expires_at DATETIME,
                is_active BOOLEAN DEFAULT TRUE,
                created_by VARCHAR(100),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
                INDEX idx_joining_link_candidate (candidate_id)
            )
        """))

    if not inspector.has_table("joining_forms"):
        db.execute(text("""
            CREATE TABLE joining_forms (
                id VARCHAR(36) PRIMARY KEY,
                link_id VARCHAR(36) NOT NULL,
                candidate_id VARCHAR(36) NOT NULL,
                employee_id VARCHAR(50) NOT NULL UNIQUE,
                edit_token VARCHAR(225) NOT NULL UNIQUE,
                additional_data JSON,
                status VARCHAR(50) DEFAULT 'Submitted',
                submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NULL,
                FOREIGN KEY (link_id) REFERENCES joining_form_links(id) ON DELETE CASCADE,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
                INDEX idx_joining_candidate (candidate_id),
                INDEX idx_joining_employee_id (employee_id)
            )
        """))

    db.commit()


def serialize_candidate(candidate: Candidate, job_title: str | None = None):
    return {
        "id": candidate.id,
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        "pan": candidate.pan,
        "aadhaar": candidate.aadhaar,
        "uan": candidate.uan,
        "dob": candidate.dob.isoformat() if candidate.dob else None,
        "current_company": candidate.current_company,
        "experience": candidate.experience,
        "current_location": candidate.current_location,
        "job_title": job_title,
    }


def serialize_link(link: JoiningFormLink, candidate: Candidate | None = None, submission: JoiningForm | None = None):
    return {
        "id": link.id,
        "candidate_id": link.candidate_id,
        "candidate_name": candidate.name if candidate else None,
        "candidate_email": candidate.email if candidate else None,
        "slug": link.slug,
        "title": link.title,
        "expires_at": link.expires_at.isoformat() if link.expires_at else None,
        "is_active": link.is_active,
        "created_by": link.created_by,
        "created_at": link.created_at.isoformat() if link.created_at else None,
        "submitted": submission is not None,
        "employee_id": submission.employee_id if submission else None,
    }


def serialize_submission(row: JoiningForm, candidate: Candidate | None = None):
    return {
        "id": row.id,
        "link_id": row.link_id,
        "candidate_id": row.candidate_id,
        "candidate_name": candidate.name if candidate else None,
        "candidate_email": candidate.email if candidate else None,
        "candidate_phone": candidate.phone if candidate else None,
        "employee_id": row.employee_id,
        "additional_data": row.additional_data or {},
        "status": row.status,
        "submitted_at": row.submitted_at.isoformat() if row.submitted_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def get_valid_link(slug: str, db: Session):
    ensure_joining_form_schema(db)
    link = db.query(JoiningFormLink).filter(JoiningFormLink.slug == slug).first()

    if not link:
        raise HTTPException(status_code=404, detail="Invalid joining form link")
    if not link.is_active:
        raise HTTPException(status_code=410, detail="This joining form link is disabled")
    if link.expires_at and link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="This joining form link is expired")

    return link


def generate_employee_id(db: Session):
    latest = (
        db.query(JoiningForm.employee_id)
        .filter(JoiningForm.employee_id.like("NEB%"))
        .order_by(JoiningForm.employee_id.desc())
        .first()
    )

    next_number = 1
    if latest and latest[0] and latest[0][3:].isdigit():
        next_number = int(latest[0][3:]) + 1

    while True:
        employee_id = f"NEB{next_number:04d}"
        exists = db.query(JoiningForm.id).filter(JoiningForm.employee_id == employee_id).first()
        if not exists:
            return employee_id
        next_number += 1


def validate_employee_id(employee_id: str):
    employee_id = (employee_id or "").strip().upper()
    if not employee_id:
        raise HTTPException(status_code=400, detail="Employee ID is required")
    if not employee_id.startswith("NEB"):
        raise HTTPException(status_code=400, detail="Employee ID must start with NEB")
    return employee_id


@router.get("/candidates")
def list_candidates_for_joining(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_joining_form_schema(db)
    rows = (
        db.query(Candidate, Job.title.label("job_title"))
        .outerjoin(Job, Candidate.job_match_id == Job.id)
        .order_by(Candidate.created_at.desc())
        .all()
    )
    return [serialize_candidate(candidate, job_title) for candidate, job_title in rows]


@router.post("/links")
def create_joining_form_link(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_joining_form_schema(db)

    candidate_id = (payload.get("candidate_id") or "").strip()
    expires_in_days = int(payload.get("expires_in_days") or 30)
    title = (payload.get("title") or "Joining Form").strip()
    send_email_flag = payload.get("send_email", True)

    if expires_in_days < 1 or expires_in_days > 365:
        raise HTTPException(status_code=400, detail="Expiry must be between 1 and 365 days")

    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    db.query(JoiningFormLink).filter(
        JoiningFormLink.candidate_id == candidate_id,
        JoiningFormLink.is_active == True,
    ).update({"is_active": False})

    link = JoiningFormLink(
        id=str(uuid4()),
        candidate_id=candidate_id,
        slug=secrets.token_urlsafe(16),
        title=title,
        expires_at=datetime.utcnow() + timedelta(days=expires_in_days),
        is_active=True,
        created_by=current_user.emp_id,
    )
    db.add(link)
    db.commit()
    db.refresh(link)

    if send_email_flag and candidate.email:
        from app.email_service import send_email
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        link_url = f"{frontend_url}/joining-form/{link.slug}"
        
        subject = f"Joining Form Link - {candidate.name}"
        body = f"""Dear {candidate.name},

Please click on the link below to fill out your Joining Form:
{link_url}

This link is valid for {expires_in_days} days.

Best regards,
HR Team"""
        try:
            send_email(candidate.email, subject, body)
        except Exception as e:
            print(f"Failed to send email to {candidate.email}: {e}")

    return serialize_link(link, candidate)


@router.get("/links")
def list_joining_form_links(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_joining_form_schema(db)
    links = db.query(JoiningFormLink).order_by(JoiningFormLink.created_at.desc()).all()
    candidate_ids = [link.candidate_id for link in links]
    candidates = {
        row.id: row
        for row in db.query(Candidate).filter(Candidate.id.in_(candidate_ids)).all()
    } if candidate_ids else {}
    submissions = {
        row.link_id: row
        for row in db.query(JoiningForm).filter(JoiningForm.link_id.in_([link.id for link in links])).all()
    } if links else {}
    return [serialize_link(link, candidates.get(link.candidate_id), submissions.get(link.id)) for link in links]


@router.patch("/links/{link_id}/disable")
def disable_joining_form_link(
    link_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_joining_form_schema(db)
    link = db.query(JoiningFormLink).filter(JoiningFormLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Joining form link not found")

    link.is_active = False
    db.commit()
    return {"message": "Joining form link disabled"}


@router.get("")
def list_joining_forms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_joining_form_schema(db)
    rows = db.query(JoiningForm).order_by(JoiningForm.submitted_at.desc()).all()
    candidate_ids = [row.candidate_id for row in rows]
    candidates = {
        row.id: row
        for row in db.query(Candidate).filter(Candidate.id.in_(candidate_ids)).all()
    } if candidate_ids else {}
    return [serialize_submission(row, candidates.get(row.candidate_id)) for row in rows]


@router.get("/public/{slug}")
def validate_joining_form_link(slug: str, db: Session = Depends(get_db)):
    link = get_valid_link(slug, db)
    candidate = db.query(Candidate).filter(Candidate.id == link.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    existing = db.query(JoiningForm).filter(JoiningForm.link_id == link.id).first()

    return {
        "id": link.id,
        "title": link.title or "Joining Form",
        "expires_at": link.expires_at.isoformat() if link.expires_at else None,
        "candidate": serialize_candidate(candidate),
        "suggested_employee_id": existing.employee_id if existing else generate_employee_id(db),
        "submitted": existing is not None,
    }


@router.get("/public/{slug}/submission")
def get_public_submission(slug: str, edit_token: str, db: Session = Depends(get_db)):
    link = get_valid_link(slug, db)
    row = db.query(JoiningForm).filter(
        JoiningForm.link_id == link.id,
        JoiningForm.edit_token == edit_token,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Submitted joining form not found")
    return serialize_submission(row)


@router.post("/public/{slug}")
def submit_joining_form(slug: str, payload: dict, db: Session = Depends(get_db)):
    link = get_valid_link(slug, db)
    employee_id = validate_employee_id(payload.get("employee_id") or generate_employee_id(db))

    existing_employee_id = db.query(JoiningForm).filter(JoiningForm.employee_id == employee_id).first()
    if existing_employee_id:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    additional_data = payload.get("additional_data") or {}
    required = ["father_name", "permanent_address", "mailing_address", "emergency_contact_number"]
    missing = [field for field in required if not str(additional_data.get(field) or "").strip()]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required fields: {', '.join(missing)}")

    existing = db.query(JoiningForm).filter(JoiningForm.link_id == link.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Joining form already submitted. Use your edit link to update it.")

    row = JoiningForm(
        id=str(uuid4()),
        link_id=link.id,
        candidate_id=link.candidate_id,
        employee_id=employee_id,
        edit_token=secrets.token_urlsafe(24),
        additional_data=additional_data,
        status="Submitted",
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return {
        "message": "Joining form submitted successfully",
        "form_id": row.id,
        "employee_id": row.employee_id,
        "edit_token": row.edit_token,
    }


@router.put("/public/{slug}")
def update_public_joining_form(slug: str, payload: dict, db: Session = Depends(get_db)):
    link = get_valid_link(slug, db)
    edit_token = (payload.get("edit_token") or "").strip()
    row = db.query(JoiningForm).filter(
        JoiningForm.link_id == link.id,
        JoiningForm.edit_token == edit_token,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Submitted joining form not found")

    if row.status == "Finalized":
        raise HTTPException(status_code=400, detail="This joining form has already been finalized and frozen.")

    employee_id = validate_employee_id(payload.get("employee_id") or row.employee_id)
    duplicate = db.query(JoiningForm).filter(
        JoiningForm.employee_id == employee_id,
        JoiningForm.id != row.id,
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    row.employee_id = employee_id
    row.additional_data = payload.get("additional_data") or {}
    
    status = payload.get("status")
    if status == "Finalized":
        row.status = "Finalized"
        
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)

    return {
        "message": "Joining form updated successfully",
        "form_id": row.id,
        "employee_id": row.employee_id,
        "edit_token": row.edit_token,
    }


@router.get("/public/{slug}/download")
def download_public_joining_form(slug: str, edit_token: str, db: Session = Depends(get_db)):
    link = get_valid_link(slug, db)
    row = db.query(JoiningForm).filter(
        JoiningForm.link_id == link.id,
        JoiningForm.edit_token == edit_token,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Submitted joining form not found")

    candidate = db.query(Candidate).filter(Candidate.id == row.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    output_dir = "uploads/joining_forms"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"JoiningForm_{row.employee_id}_{row.id}.pdf")
    candidate_data = serialize_candidate(candidate)
    candidate_data["employee_id"] = row.employee_id
    form_data = row.additional_data or {}
    form_data["employee_id"] = row.employee_id

    generate_joining_form_pdf(output_path, candidate_data, form_data)

    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename=f"JoiningForm_{row.employee_id}.pdf",
    )


@router.put("/{form_id}")
def hr_update_joining_form(
    form_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_joining_form_schema(db)
    row = db.query(JoiningForm).filter(JoiningForm.id == form_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Joining form submission not found")

    employee_id = validate_employee_id(payload.get("employee_id") or row.employee_id)
    duplicate = db.query(JoiningForm).filter(
        JoiningForm.employee_id == employee_id,
        JoiningForm.id != row.id,
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    row.employee_id = employee_id
    row.additional_data = payload.get("additional_data") or {}
    
    status = payload.get("status")
    if status:
        row.status = status

    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)

    return serialize_submission(row)
