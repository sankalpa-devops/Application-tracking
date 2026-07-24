from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from uuid import uuid4
from datetime import datetime
from typing import Optional, Annotated
import os, shutil

from app.ai.resume_parser import parse_resume
from app.models.models import CandidateMLData, CandidateBlacklist
from app.db import SessionLocal
from app.models.models import JobApplyLink, Job, Candidate

router = APIRouter(prefix="/apply", tags=["Public Apply"])

UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------- VALIDATE LINK ----------------
@router.get("/{slug}")
def validate_apply_link(slug: str, db: Session = Depends(get_db)):
    link = db.query(JobApplyLink).filter(JobApplyLink.slug == slug).first()

    if not link:
        raise HTTPException(status_code=404, detail="Invalid application link")

    if not link.is_active:
        raise HTTPException(status_code=410, detail="This link got expired")

    if link.expires_at and link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="This link got expired")

    job = db.query(Job).filter(Job.id == link.job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status == "Archived":
        raise HTTPException(status_code=410, detail="This job is no longer available")

    return {
        "job_id": job.id,
        "job_title": job.title
    }


# ---------------- SUBMIT APPLICATION ----------------
@router.post("/{slug}")
def submit_application(
    slug: str,

    name: Annotated[str, Form(...)],
    email: Annotated[str, Form(...)],
    phone: Annotated[str, Form(...)],

    pan: Annotated[str, Form(...)],
    aadhaar: Annotated[str, Form(...)],
    uan: Annotated[str, Form(...)],

    # ✅ NEW FIELDS
    current_company: Annotated[str, Form(...)],
    dob: Annotated[str, Form(...)],

    experience: Annotated[str, Form(...)],
    notice_period: Annotated[str, Form(...)],

    current_ctc: Annotated[str, Form(...)],
    expected_ctc: Annotated[str, Form(...)],

    current_location: Annotated[str, Form(...)],
    willing_to_relocate: Annotated[str, Form(...)],

    referral_type: Annotated[Optional[str], Form()] = None,
    referred_by: Annotated[Optional[str], Form()] = None,
    referral_value: Annotated[Optional[str], Form()] = None,

    resume: Annotated[Optional[UploadFile], File()] = None,

    db: Session = Depends(get_db)
):

    # ✅ Validate via slug ONLY
    link = db.query(JobApplyLink).filter(JobApplyLink.slug == slug).first()

    if not link:
        raise HTTPException(status_code=404, detail="Invalid application link")

    if not link.is_active:
        raise HTTPException(status_code=410, detail="This link got expired")

    if link.expires_at and link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="This link got expired")

    job = db.query(Job).filter(Job.id == link.job_id).first()

    if not job or job.status == "Archived":
        raise HTTPException(status_code=410, detail="This job is no longer available")


    # 🚫 BLACKLIST CHECK
    blacklisted = db.query(CandidateBlacklist).filter(
        (
            (CandidateBlacklist.pan == pan) |
            (CandidateBlacklist.aadhaar == aadhaar) |
            (CandidateBlacklist.uan == uan)
        ),
        CandidateBlacklist.is_active == True
    ).first()

    if blacklisted:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to apply for this job"
        )


    # ✅ prevent duplicate apply
    existing = db.query(Candidate).filter(
        Candidate.email == email,
        Candidate.job_match_id == job.id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You already applied for this job")


    # normalize referral fields
    if not referral_type:
        referral_type = None
        referred_by = None
        referral_value = None


    # ✅ convert DOB string → Date
    try:
        dob_parsed = datetime.strptime(dob, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid DOB format. Use YYYY-MM-DD")


    # save resume
    resume_path = None
    if resume:
        filename = f"{uuid4()}_{resume.filename}"
        resume_path = os.path.join(UPLOAD_DIR, filename)
        with open(resume_path, "wb") as buffer:
            shutil.copyfileobj(resume.file, buffer)


    # create candidate
    candidate = Candidate(
        id=str(uuid4()),

        name=name,
        email=email,
        phone=phone,

        pan=pan,
        aadhaar=aadhaar,
        uan=uan,

        current_company=current_company,
        dob=dob_parsed,

        experience=experience,
        notice_period=notice_period,

        current_ctc=current_ctc,
        expected_ctc=expected_ctc,

        current_location=current_location,
        willing_to_relocate=willing_to_relocate,

        referral_type=referral_type,
        referred_by=referred_by,
        referral_value=referral_value,

        resume_path=resume_path,
        job_match_id=job.id
    )

    db.add(candidate)
    db.commit()


    # ---------------- ML PROCESS ----------------
    ml_result = None

    if resume_path:
        ml_result = parse_resume(resume_path, job.skills, job.job_description)

        ml_record = CandidateMLData(
            id=str(uuid4()),
            candidate_id=candidate.id,
            job_id=job.id,
            extracted_text=ml_result["text"],
            extracted_skills=",".join(ml_result["skills"]),
            matched_skills=",".join(ml_result["matched"]),
            ats_score=ml_result["score"],
            experience_years=ml_result["experience"]
        )

        db.add(ml_record)
        db.commit()


    return {
        "message": "Application submitted successfully",
        "ats_score": ml_result["score"] if ml_result else None
    }