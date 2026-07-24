from datetime import datetime
from uuid import uuid4
import os

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models.models import LetterheadTemplate, User


router = APIRouter(prefix="/letterhead-templates", tags=["Letterhead Templates"])
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


def ensure_letterhead_schema(db: Session):
    inspector = inspect(db.bind)
    if not inspector.has_table("letterhead_templates"):
        db.execute(text("""
            CREATE TABLE letterhead_templates (
                id VARCHAR(36) PRIMARY KEY,
                template_name VARCHAR(255) NOT NULL,
                template_type VARCHAR(100) NOT NULL,
                company_name VARCHAR(255),
                company_address TEXT,
                company_phone VARCHAR(50),
                company_email VARCHAR(255),
                company_logo_path TEXT,
                footer_text TEXT,
                signature_block TEXT,
                header_color VARCHAR(7) DEFAULT '#1a1a1a',
                footer_color VARCHAR(7) DEFAULT '#666666',
                is_active BOOLEAN DEFAULT TRUE,
                is_default BOOLEAN DEFAULT FALSE,
                created_by VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """))
        db.commit()


def serialize_template(template: LetterheadTemplate):
    return {
        "id": template.id,
        "template_name": template.template_name,
        "template_type": template.template_type,
        "company_name": template.company_name,
        "company_address": template.company_address,
        "company_phone": template.company_phone,
        "company_email": template.company_email,
        "company_logo_path": template.company_logo_path,
        "footer_text": template.footer_text,
        "signature_block": template.signature_block,
        "header_color": template.header_color,
        "footer_color": template.footer_color,
        "is_active": template.is_active,
        "is_default": template.is_default,
        "created_by": template.created_by,
        "created_at": template.created_at.isoformat() if template.created_at else None,
        "updated_at": template.updated_at.isoformat() if template.updated_at else None,
    }


@router.post("")
def create_letterhead_template(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_letterhead_schema(db)
    template = LetterheadTemplate(
        id=str(uuid4()),
        template_name=payload.get("template_name"),
        template_type=payload.get("template_type"),
        company_name=payload.get("company_name"),
        company_address=payload.get("company_address"),
        company_phone=payload.get("company_phone"),
        company_email=payload.get("company_email"),
        company_logo_path=payload.get("company_logo_path"),
        footer_text=payload.get("footer_text"),
        signature_block=payload.get("signature_block"),
        header_color=payload.get("header_color", "#1a1a1a"),
        footer_color=payload.get("footer_color", "#666666"),
        is_active=payload.get("is_active", True),
        is_default=payload.get("is_default", False),
        created_by=current_user.emp_id,
    )

    # If setting as default, unset other defaults of same type
    if template.is_default:
        db.query(LetterheadTemplate).filter(
            LetterheadTemplate.template_type == template.template_type,
            LetterheadTemplate.is_default == True
        ).update({"is_default": False})

    db.add(template)
    db.commit()
    db.refresh(template)

    return serialize_template(template)


@router.get("")
def list_letterhead_templates(
    template_type: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_letterhead_schema(db)
    query = db.query(LetterheadTemplate)
    if template_type:
        query = query.filter(LetterheadTemplate.template_type == template_type)

    templates = query.order_by(LetterheadTemplate.created_at.desc()).all()
    return [serialize_template(t) for t in templates]


@router.get("/{template_id}")
def get_letterhead_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_letterhead_schema(db)
    template = db.query(LetterheadTemplate).filter(LetterheadTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Letterhead template not found")

    return serialize_template(template)


@router.get("/default/{template_type}")
def get_default_template(
    template_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_letterhead_schema(db)
    template = db.query(LetterheadTemplate).filter(
        LetterheadTemplate.template_type == template_type,
        LetterheadTemplate.is_default == True,
        LetterheadTemplate.is_active == True
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail=f"No default template found for type: {template_type}")

    return serialize_template(template)


@router.patch("/{template_id}")
def update_letterhead_template(
    template_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_letterhead_schema(db)
    template = db.query(LetterheadTemplate).filter(LetterheadTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Letterhead template not found")

    # Update fields
    for field in ["template_name", "template_type", "company_name", "company_address",
                  "company_phone", "company_email", "company_logo_path", "footer_text",
                  "signature_block", "header_color", "footer_color", "is_active"]:
        if field in payload:
            setattr(template, field, payload[field])

    # Handle is_default
    if "is_default" in payload and payload["is_default"]:
        db.query(LetterheadTemplate).filter(
            LetterheadTemplate.template_type == template.template_type,
            LetterheadTemplate.is_default == True,
            LetterheadTemplate.id != template_id
        ).update({"is_default": False})
        template.is_default = True

    template.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(template)

    return serialize_template(template)


@router.delete("/{template_id}")
def delete_letterhead_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_letterhead_schema(db)
    template = db.query(LetterheadTemplate).filter(LetterheadTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Letterhead template not found")

    db.delete(template)
    db.commit()

    return {"message": "Letterhead template deleted successfully"}


@router.post("/{template_id}/upload-logo")
def upload_logo(
    template_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_letterhead_schema(db)
    template = db.query(LetterheadTemplate).filter(LetterheadTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Letterhead template not found")

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Create uploads directory if it doesn't exist
    logo_dir = "uploads/logos"
    os.makedirs(logo_dir, exist_ok=True)

    # Save file
    file_extension = file.filename.split(".")[-1]
    file_path = f"{logo_dir}/{template_id}_{uuid4()}.{file_extension}"

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    template.company_logo_path = file_path
    template.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(template)

    return serialize_template(template)
