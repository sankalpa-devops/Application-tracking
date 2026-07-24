# import uuid
# import shutil
# from fastapi import APIRouter, UploadFile, File, Form, Depends
# from sqlalchemy.orm import Session
# from app.db import SessionLocal
# from app.models.models import  Candidate

# router = APIRouter()

# UPLOAD_DIR = "uploads/resumes"

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# @router.post("/walkin")
# async def create_walkin_candidate(
#     name: str = Form(...),
#     email: str = Form(...),
#     phone: str = Form(...),
#     pan: str = Form(...),
#     aadhaar: str = Form(...),
#     experience: str = Form(...),
#     job_match_id: str = Form(...),
#     resume: UploadFile = File(...),
#     db: Session = Depends(get_db)
# ):

#     file_path = f"{UPLOAD_DIR}/{uuid.uuid4()}_{resume.filename}"

#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(resume.file, buffer)

#     candidate = Candidate(
#         id=str(uuid.uuid4()),
#         name=name,
#         email=email,
#         phone=phone,
#         pan=pan,
#         aadhaar=aadhaar,
#         experience=experience,
#         job_match_id=job_match_id,
#         resume_path=file_path,
#         source="walkin",
#         applied_by="hr"
#     )

#     db.add(candidate)
#     db.commit()

#     return {"message": "Walk-in candidate saved"}

import uuid
import shutil
import os

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models.models import Candidate, Job

router = APIRouter()

UPLOAD_DIR = "uploads/resumes"

# Ensure upload folder exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ---------------- DB DEPENDENCY ----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ================= GET JOBS (PUBLIC FOR DROPDOWN) =================
@router.get("/walkin/jobs")
def get_jobs_for_walkin(db: Session = Depends(get_db)):
    jobs = db.query(Job).filter(Job.status == "Open").all()

    return [
        {
            "id": job.id,
            "title": job.title
        }
        for job in jobs
    ]


# ================= CREATE WALKIN CANDIDATE =================
@router.post("/walkin")
async def create_walkin_candidate(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    pan: str = Form(...),
    aadhaar: str = Form(...),
    experience: str = Form(...),
    job_match_id: str = Form(...),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    # 🔒 Check job exists
    job = db.query(Job).filter(Job.id == job_match_id).first()
    if not job:
        raise HTTPException(status_code=400, detail="Invalid job selected")

    # 📁 Save resume
    file_name = f"{uuid.uuid4()}_{resume.filename}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(resume.file, buffer)

    # ⚠️ REQUIRED FIELDS FIX (your model has NOT NULL fields)
    candidate = Candidate(
        id=str(uuid.uuid4()),
        name=name,
        email=email,
        phone=phone,
        pan=pan,
        aadhaar=aadhaar,

        # ✅ REQUIRED missing fields FIXED
        uan=str(uuid.uuid4())[:10],  # dummy unique
        current_location="Not Provided",
        willing_to_relocate="Yes",

        experience=experience,
        job_match_id=job_match_id,
        resume_path=file_path,

        source="walkin",
        applied_by="hr"
    )

    db.add(candidate)
    db.commit()

    return {"message": "Walk-in candidate saved successfully"}