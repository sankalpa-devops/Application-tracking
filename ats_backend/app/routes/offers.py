from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from sqlalchemy.orm import Session
import os
from uuid import uuid4

from app.db import SessionLocal
from app.models.models import Candidate, Job, Offer, LetterheadTemplate, User
from app.utils.pdf_generator import generate_loi_pdf
from app.email_service import send_email

router = APIRouter(prefix="/offers", tags=["Offers"])
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


@router.post("/send-loi")
def send_loi(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = db.query(Candidate).filter(Candidate.id == data["candidate_id"]).first()
    job = db.query(Job).filter(Job.id == data["job_id"]).first()

    if not candidate or not job:
        raise HTTPException(status_code=404, detail="Candidate or job not found")

    # Get default LOI template or use the specified one
    template_id = data.get("template_id")
    if template_id:
        template = db.query(LetterheadTemplate).filter(
            LetterheadTemplate.id == template_id,
            LetterheadTemplate.is_active == True
        ).first()
    else:
        template = db.query(LetterheadTemplate).filter(
            LetterheadTemplate.template_type == "loi",
            LetterheadTemplate.is_default == True,
            LetterheadTemplate.is_active == True
        ).first()

    if not template:
        raise HTTPException(status_code=404, detail="No active LOI template found")

    # Create uploads directory if it doesn't exist
    loi_dir = "uploads/loi"
    os.makedirs(loi_dir, exist_ok=True)

    # Generate PDF
    file_path = f"{loi_dir}/LOI_{candidate.id}_{uuid4()}.pdf"
    
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

    candidate_data = {
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
    }

    job_data = {
        "title": job.title,
        "department": job.department,
        "location": job.location,
        "type": job.type,
        "experience": job.experience,
    }

    salary_details = {
        "ctc": data.get("ctc", "As per discussion"),
        "benefits": data.get("benefits", "As per company policy"),
        "response_days": data.get("response_days", 7),
    }

    generate_loi_pdf(file_path, candidate_data, job_data, template_data, salary_details)

    # Send email
    if data.get("send_email", True):
        send_email(
            candidate.email,
            "Letter of Intent - Job Offer",
            f"Congratulations! We are pleased to offer you the position of {job.title}. Please find the Letter of Intent attached.",
            file_path
        )

    # Create or update offer record
    existing_offer = db.query(Offer).filter(
        Offer.candidate_id == data["candidate_id"],
        Offer.job_id == data["job_id"]
    ).first()

    if existing_offer:
        existing_offer.offer_letter_path = file_path
        existing_offer.offer_status = "Sent"
        existing_offer.salary = data.get("ctc")
    else:
        offer = Offer(
            candidate_id=data["candidate_id"],
            job_id=data["job_id"],
            salary=data.get("ctc"),
            offer_letter_path=file_path,
            offer_status="Sent"
        )
        db.add(offer)

    db.commit()

    return {"message": "Letter of Intent sent successfully", "file_path": file_path}


@router.post("/send-offer")
def send_offer(data: dict, db: Session = Depends(get_db)):

    candidate = db.query(Candidate).filter(Candidate.id == data["candidate_id"]).first()
    job = db.query(Job).filter(Job.id == data["job_id"]).first()

    file_path = generate_offer(candidate.name, job.title, data["salary"])

    send_email(
        candidate.email,
        "Offer Letter",
        "Congratulations! Offer attached.",
        file_path
    )

    offer = Offer(
        candidate_id=data["candidate_id"],
        job_id=data["job_id"],
        salary=data["salary"],
        offer_letter_path=file_path
    )

    db.add(offer)
    db.commit()

    return {"message": "Offer Sent"}