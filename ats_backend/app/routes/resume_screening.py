# from fastapi import APIRouter, Depends, Query
# from sqlalchemy.orm import Session
# from sqlalchemy import desc
# from datetime import datetime
# import os
# from app.email_service import send_status_email
# from app.db import SessionLocal
# from app.models.models import Candidate, CandidateMLData, Job

# router = APIRouter(tags=["Resume Screening"])


# # ---------------- DB DEPENDENCY ----------------
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# # ==============================
# # GET JOB LIST FOR FILTER
# # ==============================
# @router.get("/jobs-list")
# def get_jobs_list(db: Session = Depends(get_db)):

#     jobs = db.query(Job.id, Job.title).all()

#     return [
#         {
#             "id": j.id,
#             "title": j.title
#         }
#         for j in jobs
#     ]


# # ==============================
# # GET CANDIDATES FOR SCREENING
# # ==============================
# @router.get("/resume-screening")
# def get_resume_screening_candidates(
#     job_id: str = Query(None),
#     db: Session = Depends(get_db)
# ):

#     query = (
#         db.query(
#             Candidate.id,
#             Candidate.name,
#             Candidate.email,
#             Candidate.phone,
#             Candidate.experience,
#             Candidate.status,
#             Candidate.resume_path,
#             CandidateMLData.ats_score,
#             CandidateMLData.matched_skills,
#             Job.title.label("job_title")
#         )
#         .outerjoin(
#             CandidateMLData,
#             Candidate.id == CandidateMLData.candidate_id
#         )
#         .join(Job, Candidate.job_match_id == Job.id)
#     )

#     if job_id:
#         query = query.filter(Candidate.job_match_id == job_id)

#     query = query.order_by(desc(CandidateMLData.ats_score))

#     candidates = query.all()

#     results = []

#     for c in candidates:

#         resume_url = None

#         if c.resume_path:
#             filename = os.path.basename(c.resume_path)
#             resume_url = f"http://127.0.0.1:8000/resumes/{filename}"

#         results.append({
#             "id": c.id,
#             "name": c.name,
#             "email": c.email,
#             "phone": c.phone,
#             "experience": c.experience,
#             "resume_path": resume_url,
#             "status": c.status,
#             "ats_score": c.ats_score if c.ats_score else 0,
#             "matched_skills": c.matched_skills if c.matched_skills else "",
#             "job_title": c.job_title
#         })

#     return results


# # ==============================
# # UPDATE SINGLE CANDIDATE STATUS
# # ==============================
# @router.put("/candidates/{candidate_id}/status")
# def update_candidate_status(
#     candidate_id: str,
#     payload: dict,
#     db: Session = Depends(get_db)
# ):

#     candidate = (
#         db.query(Candidate, Job.title)
#         .join(Job, Candidate.job_match_id == Job.id)
#         .filter(Candidate.id == candidate_id)
#         .first()
#     )

#     if not candidate:
#         return {"error": "Candidate not found"}

#     candidate_obj = candidate[0]
#     job_title = candidate[1]

#     status = payload.get("status")

#     candidate_obj.status = status
#     candidate_obj.status_updated_at = datetime.utcnow()

#     db.commit()

#     # Send email
#     send_status_email(
#         candidate_obj.email,
#         candidate_obj.name,
#         status,
#         job_title
#     )

#     return {"message": "Candidate status updated"}


# # ==============================
# # BULK STATUS UPDATE
# # ==============================
# @router.put("/candidates/bulk-status")
# def bulk_update_candidate_status(
#     payload: dict,
#     db: Session = Depends(get_db)
# ):

#     candidate_ids = payload.get("candidate_ids")
#     status = payload.get("status")

#     if not candidate_ids:
#         return {"error": "No candidates selected"}

#     candidates = (
#         db.query(Candidate, Job.title)
#         .join(Job, Candidate.job_match_id == Job.id)
#         .filter(Candidate.id.in_(candidate_ids))
#         .all()
#     )

#     for record in candidates:

#         candidate = record[0]
#         job_title = record[1]

#         candidate.status = status
#         candidate.status_updated_at = datetime.utcnow()

#         # send email
#         send_status_email(
#             candidate.email,
#             candidate.name,
#             status,
#             job_title
#         )

#     db.commit()

#     return {"message": f"{len(candidates)} candidates updated and emailed"}

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
import os

from app.services.auto_screening import run_auto_screening
from app.email_service import send_status_email
from app.db import SessionLocal
from app.models.models import Candidate, CandidateMLData, Job

router = APIRouter(tags=["Resume Screening"])


# ---------------- DB DEPENDENCY ----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==============================
# GET JOB LIST FOR FILTER
# ==============================
@router.get("/jobs-list")
def get_jobs_list(db: Session = Depends(get_db)):

    jobs = db.query(Job.id, Job.title).all()

    return [{"id": j.id, "title": j.title} for j in jobs]


# ==============================
# GET CANDIDATES FOR SCREENING
# ==============================
@router.get("/resume-screening")
def get_resume_screening_candidates(
    job_id: str = Query(None),
    db: Session = Depends(get_db)
):

    query = (
        db.query(
            Candidate.id,
            Candidate.name,
            Candidate.email,
            Candidate.phone,
            Candidate.experience,
            Candidate.status,
            Candidate.resume_path,
            CandidateMLData.ats_score,
            CandidateMLData.matched_skills,
            Job.title.label("job_title")
        )
        .outerjoin(
            CandidateMLData,
            Candidate.id == CandidateMLData.candidate_id
        )
        .join(
            Job,
            Candidate.job_match_id == Job.id
        )
        .filter(Candidate.status == "Applied")
    )

    # ✅ Filter by job if provided
    if job_id:
        run_auto_screening(db, job_id)
        query = query.filter(Candidate.job_match_id == job_id)

    # ✅ Order by ATS score
    query = query.order_by(desc(CandidateMLData.ats_score))

    candidates = query.all()

    results = []

    for c in candidates:

        resume_url = None

        if c.resume_path:
            filename = os.path.basename(c.resume_path)
            resume_url = f"/resumes/{filename}"

        results.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "experience": c.experience,
            "resume_path": resume_url,
            "status": c.status,
            "ats_score": c.ats_score if c.ats_score else 0,
            "matched_skills": c.matched_skills if c.matched_skills else "",
            "job_title": c.job_title
        })

    return results


# ==============================
# UPDATE SINGLE CANDIDATE STATUS
# ==============================
@router.put("/candidates/{candidate_id}/status")
def update_candidate_status(
    candidate_id: str,
    payload: dict,
    db: Session = Depends(get_db)
):

    candidate = (
        db.query(Candidate, Job.title)
        .join(Job, Candidate.job_match_id == Job.id)
        .filter(Candidate.id == candidate_id)
        .first()
    )

    if not candidate:
        return {"error": "Candidate not found"}

    candidate_obj = candidate[0]
    job_title = candidate[1]

    status = payload.get("status")

    candidate_obj.status = status
    candidate_obj.status_updated_at = datetime.utcnow()

    try:
        send_status_email(
            candidate_obj.email,
            candidate_obj.name,
            status,
            job_title
        )
    except Exception as e:
        print("Email failed:", e)

    db.commit()

    return {"message": "Candidate status updated"}


# ==============================
# BULK STATUS UPDATE
# ==============================
@router.put("/candidates/bulk-status")
def bulk_update_candidate_status(
    payload: dict,
    db: Session = Depends(get_db)
):

    candidate_ids = payload.get("candidate_ids")
    status = payload.get("status")

    if not candidate_ids:
        return {"error": "No candidates selected"}

    candidates = (
        db.query(Candidate, Job.title)
        .join(Job, Candidate.job_match_id == Job.id)
        .filter(Candidate.id.in_(candidate_ids))
        .all()
    )

    for record in candidates:

        candidate = record[0]
        job_title = record[1]

        candidate.status = status
        candidate.status_updated_at = datetime.utcnow()

        try:
            send_status_email(
                candidate.email,
                candidate.name,
                status,
                job_title
            )
        except Exception as e:
            print("Email failed:", e)

    db.commit()

    return {"message": f"{len(candidates)} candidates updated"}