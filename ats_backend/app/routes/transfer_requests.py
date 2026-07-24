from datetime import datetime, timedelta
import os
import secrets
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models.models import EmployeeTransferRequest, TransferRequestLink, User, LetterheadTemplate
from app.utils.pdf_generator import generate_transfer_letter_pdf
from app.email_service import send_email


router = APIRouter(prefix="/transfer-requests", tags=["Transfer Requests"])
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


def ensure_transfer_request_schema(db: Session):
    inspector = inspect(db.bind)

    if not inspector.has_table("transfer_request_links"):
        db.execute(text("""
            CREATE TABLE transfer_request_links (
                id VARCHAR(36) PRIMARY KEY,
                slug VARCHAR(225) UNIQUE NOT NULL,
                title VARCHAR(200),
                expires_at DATETIME,
                is_active BOOLEAN DEFAULT TRUE,
                created_by VARCHAR(100),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))

    if not inspector.has_table("employee_transfer_requests"):
        db.execute(text("""
            CREATE TABLE employee_transfer_requests (
                id VARCHAR(36) PRIMARY KEY,
                link_id VARCHAR(36),
                employee_id VARCHAR(50) NOT NULL,
                employee_name VARCHAR(200) NOT NULL,
                email VARCHAR(200),
                phone VARCHAR(20),
                current_department VARCHAR(200) NOT NULL,
                requested_department VARCHAR(200) NOT NULL,
                current_location VARCHAR(200) NOT NULL,
                requested_location VARCHAR(200) NOT NULL,
                current_field VARCHAR(200),
                requested_field VARCHAR(200),
                reason TEXT NOT NULL,
                preferred_transfer_date DATE,
                request_type VARCHAR(50) NOT NULL DEFAULT 'employee',
                status VARCHAR(50) DEFAULT 'Pending',
                reviewed_by VARCHAR(100),
                review_note TEXT,
                top_approver_role VARCHAR(20),
                top_approver_name VARCHAR(200),
                top_approved_at DATETIME,
                transfer_letter_path TEXT,
                transfer_letter_sent_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NULL,
                FOREIGN KEY (link_id) REFERENCES transfer_request_links(id) ON DELETE SET NULL,
                INDEX idx_transfer_status (status),
                INDEX idx_transfer_employee (employee_id)
            )
        """))
        db.commit()
        return

    db.commit()
    inspector = inspect(db.bind)
    columns = {column["name"] for column in inspector.get_columns("employee_transfer_requests")}
    column_definitions = {
        "request_type": "ALTER TABLE employee_transfer_requests ADD COLUMN request_type VARCHAR(50) NOT NULL DEFAULT 'employee' AFTER preferred_transfer_date",
        "top_approver_role": "ALTER TABLE employee_transfer_requests ADD COLUMN top_approver_role VARCHAR(20) AFTER review_note",
        "top_approver_name": "ALTER TABLE employee_transfer_requests ADD COLUMN top_approver_name VARCHAR(200) AFTER top_approver_role",
        "top_approved_at": "ALTER TABLE employee_transfer_requests ADD COLUMN top_approved_at DATETIME AFTER top_approver_name",
        "transfer_letter_path": "ALTER TABLE employee_transfer_requests ADD COLUMN transfer_letter_path TEXT AFTER top_approved_at",
        "transfer_letter_sent_at": "ALTER TABLE employee_transfer_requests ADD COLUMN transfer_letter_sent_at DATETIME AFTER transfer_letter_path",
    }

    for column_name, ddl in column_definitions.items():
        if column_name not in columns:
            db.execute(text(ddl))

    db.commit()


def serialize_link(link: TransferRequestLink):
    return {
        "id": link.id,
        "slug": link.slug,
        "title": link.title,
        "expires_at": link.expires_at.isoformat() if link.expires_at else None,
        "is_active": link.is_active,
        "created_by": link.created_by,
        "created_at": link.created_at.isoformat() if link.created_at else None,
    }


def serialize_request(row: EmployeeTransferRequest):
    return {
        "id": row.id,
        "link_id": row.link_id,
        "employee_id": row.employee_id,
        "employee_name": row.employee_name,
        "email": row.email,
        "phone": row.phone,
        "current_department": row.current_department,
        "requested_department": row.requested_department,
        "current_location": row.current_location,
        "requested_location": row.requested_location,
        "current_field": row.current_field,
        "requested_field": row.requested_field,
        "reason": row.reason,
        "preferred_transfer_date": (
            row.preferred_transfer_date.isoformat() if row.preferred_transfer_date else None
        ),
        "request_type": row.request_type,
        "status": row.status,
        "reviewed_by": row.reviewed_by,
        "review_note": row.review_note,
        "top_approver_role": row.top_approver_role,
        "top_approver_name": row.top_approver_name,
        "top_approved_at": row.top_approved_at.isoformat() if row.top_approved_at else None,
        "transfer_letter_path": row.transfer_letter_path,
        "transfer_letter_sent_at": row.transfer_letter_sent_at.isoformat() if row.transfer_letter_sent_at else None,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def get_valid_link(slug: str, db: Session):
    ensure_transfer_request_schema(db)

    link = db.query(TransferRequestLink).filter(TransferRequestLink.slug == slug).first()
    if not link:
        raise HTTPException(status_code=404, detail="Invalid transfer request link")

    if not link.is_active:
        raise HTTPException(status_code=410, detail="This transfer request link is disabled")

    if link.expires_at and link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="This transfer request link is expired")

    return link


@router.post("/links")
def create_transfer_request_link(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_transfer_request_schema(db)

    title = (payload.get("title") or "Employee Transfer Request").strip()
    expires_in_days = int(payload.get("expires_in_days") or 30)

    if expires_in_days < 1 or expires_in_days > 365:
        raise HTTPException(status_code=400, detail="Expiry must be between 1 and 365 days")

    link = TransferRequestLink(
        id=str(uuid4()),
        slug=secrets.token_urlsafe(16),
        title=title,
        expires_at=datetime.utcnow() + timedelta(days=expires_in_days),
        is_active=True,
        created_by=current_user.emp_id,
    )

    db.add(link)
    db.commit()
    db.refresh(link)

    return serialize_link(link)


@router.get("/links")
def list_transfer_request_links(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_transfer_request_schema(db)

    rows = (
        db.query(TransferRequestLink)
        .order_by(TransferRequestLink.created_at.desc())
        .all()
    )
    return [serialize_link(row) for row in rows]


@router.patch("/links/{link_id}/disable")
def disable_transfer_request_link(
    link_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_transfer_request_schema(db)

    link = db.query(TransferRequestLink).filter(TransferRequestLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Transfer request link not found")

    link.is_active = False
    db.commit()

    return {"message": "Transfer request link disabled"}


@router.get("/public/{slug}")
def validate_transfer_request_link(slug: str, db: Session = Depends(get_db)):
    link = get_valid_link(slug, db)
    return {
        "id": link.id,
        "title": link.title or "Employee Transfer Request",
        "expires_at": link.expires_at.isoformat() if link.expires_at else None,
    }


@router.post("/public/{slug}")
def submit_transfer_request(slug: str, payload: dict, db: Session = Depends(get_db)):
    link = get_valid_link(slug, db)

    required_fields = [
        "employee_id",
        "employee_name",
        "current_department",
        "requested_department",
        "current_location",
        "requested_location",
        "reason",
        "request_type",
    ]
    missing = [field for field in required_fields if not str(payload.get(field) or "").strip()]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required fields: {', '.join(missing)}")

    # Validate request_type
    request_type = payload.get("request_type")
    if request_type not in ["department", "management", "employee"]:
        raise HTTPException(status_code=400, detail="Invalid request_type. Must be 'department', 'management', or 'employee'")

    preferred_date = None
    if payload.get("preferred_transfer_date"):
        try:
            preferred_date = datetime.strptime(payload["preferred_transfer_date"], "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Preferred date must be YYYY-MM-DD")

    transfer_request = EmployeeTransferRequest(
        id=str(uuid4()),
        link_id=link.id,
        employee_id=str(payload["employee_id"]).strip(),
        employee_name=str(payload["employee_name"]).strip(),
        email=(payload.get("email") or "").strip() or None,
        phone=(payload.get("phone") or "").strip() or None,
        current_department=str(payload["current_department"]).strip(),
        requested_department=str(payload["requested_department"]).strip(),
        current_location=str(payload["current_location"]).strip(),
        requested_location=str(payload["requested_location"]).strip(),
        current_field=(payload.get("current_field") or "").strip() or None,
        requested_field=(payload.get("requested_field") or "").strip() or None,
        reason=str(payload["reason"]).strip(),
        preferred_transfer_date=preferred_date,
        request_type=request_type,
        status="Pending",
    )

    db.add(transfer_request)
    db.commit()
    db.refresh(transfer_request)

    return {
        "message": "Transfer request submitted successfully",
        "request_id": transfer_request.id,
    }


@router.get("")
def list_transfer_requests(
    status: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_transfer_request_schema(db)

    query = db.query(EmployeeTransferRequest)
    if status:
        query = query.filter(EmployeeTransferRequest.status == status)

    rows = query.order_by(EmployeeTransferRequest.created_at.desc()).all()
    return [serialize_request(row) for row in rows]


@router.patch("/{request_id}")
def update_transfer_request(
    request_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_transfer_request_schema(db)

    row = (
        db.query(EmployeeTransferRequest)
        .filter(EmployeeTransferRequest.id == request_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Transfer request not found")

    status = payload.get("status")
    if status is not None:
        if status not in {"Pending", "Under Review", "Approved", "Rejected", "Completed"}:
            raise HTTPException(status_code=400, detail="Invalid transfer request status")
        row.status = status

    if "review_note" in payload:
        row.review_note = (payload.get("review_note") or "").strip() or None

    row.reviewed_by = current_user.emp_id
    row.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(row)

    return serialize_request(row)


@router.post("/{request_id}/md-approve")
def md_approve_transfer_request(
    request_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_transfer_request_schema(db)

    # Only MD can approve
    if current_user.role.lower() != "md":
        raise HTTPException(status_code=403, detail="Only MD can approve transfer requests")

    row = (
        db.query(EmployeeTransferRequest)
        .filter(EmployeeTransferRequest.id == request_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Transfer request not found")

    # Can only approve if status is Under Review
    if row.status != "Under Review":
        raise HTTPException(status_code=400, detail="Can only approve requests that are Under Review")

    action = payload.get("action")  # "approve" or "reject"
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")

    row.top_approver_role = current_user.role
    row.top_approver_name = current_user.user_name
    row.top_approved_at = datetime.utcnow()

    if action == "approve":
        row.status = "Approved"
    else:
        row.status = "Rejected"

    if "review_note" in payload:
        row.review_note = (payload.get("review_note") or "").strip() or None

    row.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(row)

    return serialize_request(row)


@router.post("/{request_id}/generate-letter")
def generate_transfer_letter(
    request_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_transfer_request_schema(db)

    row = (
        db.query(EmployeeTransferRequest)
        .filter(EmployeeTransferRequest.id == request_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Transfer request not found")

    # Only generate letter if approved
    if row.status != "Approved":
        raise HTTPException(status_code=400, detail="Can only generate letter for approved transfers")

    # Get default transfer letter template or use specified one
    template_id = payload.get("template_id")
    if template_id:
        template = db.query(LetterheadTemplate).filter(
            LetterheadTemplate.id == template_id,
            LetterheadTemplate.is_active == True
        ).first()
    else:
        template = db.query(LetterheadTemplate).filter(
            LetterheadTemplate.template_type == "transfer_letter",
            LetterheadTemplate.is_default == True,
            LetterheadTemplate.is_active == True
        ).first()

    if not template:
        raise HTTPException(status_code=404, detail="No active transfer letter template found")

    # Create uploads directory if it doesn't exist
    transfer_letters_dir = "uploads/transfer_letters"
    os.makedirs(transfer_letters_dir, exist_ok=True)

    # Generate PDF
    file_path = f"{transfer_letters_dir}/TransferLetter_{row.id}_{uuid4()}.pdf"
    
    template_data = {
        "company_name": template.company_name,
        "company_address": template.company_address,
        "company_phone": template.company_phone,
        "company_email": template.company_email,
        "company_logo_path": template.company_logo_path,
        "footer_text": template.footer_text,
        "signature_block": template.signature_block,
        "header_color": template.header_color,
        "footer_color": template.footer_color,
    }

    transfer_data = {
        "employee_name": row.employee_name,
        "employee_id": row.employee_id,
        "email": row.email,
        "current_department": row.current_department,
        "requested_department": row.requested_department,
        "current_location": row.current_location,
        "requested_location": row.requested_location,
        "current_field": row.current_field,
        "requested_field": row.requested_field,
        "reason": row.reason,
        "preferred_transfer_date": row.preferred_transfer_date.isoformat() if row.preferred_transfer_date else None,
        "request_type": row.request_type,
    }

    generate_transfer_letter_pdf(file_path, transfer_data, template_data)

    # Update transfer request with letter path
    row.transfer_letter_path = file_path
    row.transfer_letter_sent_at = datetime.utcnow()
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)

    # Send email if requested
    if payload.get("send_email", True) and row.email:
        send_email(
            row.email,
            "Transfer Order - Approved",
            f"Your transfer request has been approved. Please find the transfer letter attached.",
            file_path
        )

    return {
        "message": "Transfer letter generated successfully",
        "file_path": file_path,
        "request": serialize_request(row)
    }
