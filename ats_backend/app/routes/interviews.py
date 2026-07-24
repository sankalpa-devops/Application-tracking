# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session
# from app.db import SessionLocal
# from app.models.models import Interview, Candidate, Job

# router = APIRouter()

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# # ✅ NEW API: Get shortlisted candidates
# @router.get("/shortlisted-candidates")
# def get_shortlisted_candidates(db: Session = Depends(get_db)):
#     results = (
#         db.query(Candidate, Job)
#         .join(Job, Candidate.job_match_id == Job.id)
#         .filter(Candidate.status == "Shortlisted")
#         .all()
#     )

#     data = []
#     for c, j in results:
#         data.append({
#             "candidate_id": c.id,
#             "candidate_name": c.name,
#             "job_id": j.id,
#             "job_title": j.title
#         })

#     return data


# @router.post("/schedule-interview")
# def schedule_interview(data: dict, db: Session = Depends(get_db)):

#     interview = Interview(
#         candidate_id=data["candidate_id"],
#         job_id=data["job_id"],
#         interview_date=data["interview_date"],
#         interview_round=data["interview_round"],
#         interviewer=data["interviewer"]
#     )

#     db.add(interview)
#     db.commit()

#     return {"message": "Interview Scheduled"}


# @router.get("/interviews")
# def get_interviews(db: Session = Depends(get_db)):
#     return db.query(Interview).all()


# @router.put("/update-interview/{id}")
# def update_interview(id: int, data: dict, db: Session = Depends(get_db)):

#     interview = db.query(Interview).filter(Interview.interview_id == id).first()

#     interview.status = data["status"]

#     db.commit()

#     return {"message": "Updated"}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models.models import Interview, Candidate, Job, Offer, JobInterviewFlow
from datetime import datetime
import json

from app.email_service import send_email  # already exists

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ✅ GET shortlisted candidates
@router.get("/shortlisted-candidates")
def get_shortlisted_candidates(db: Session = Depends(get_db)):
    results = (
        db.query(Candidate, Job)
        .join(Job, Candidate.job_match_id == Job.id)
        .filter(Candidate.status == "Shortlisted")
        .all()
    )

    return [
        {
            "candidate_id": c.id,
            "candidate_name": c.name,
            "job_id": j.id,
            "job_title": j.title,
            "email": c.email
        }
        for c, j in results
    ]


# ✅ SCHEDULE INTERVIEW (FIX FIELD NAME)
@router.post("/schedule-interview")
def schedule_interview(data: dict, db: Session = Depends(get_db)):
    if not data.get("candidate_id") or not data.get("job_id"):
        raise HTTPException(status_code=400, detail="Candidate and job are required")

    if not data.get("interview_date"):
        raise HTTPException(status_code=400, detail="Interview date is required")

    if not data.get("interview_round"):
        raise HTTPException(status_code=400, detail="Interview round is required")

    try:
        interview_date = datetime.fromisoformat(data["interview_date"])
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid interview date")

    interview = Interview(
        candidate_id=data["candidate_id"],
        job_id=data["job_id"],
        interview_date=interview_date,
        round_name=data["interview_round"],   # ✅ FIXED (was wrong before)
        round_order=data.get("round_order", 1),
        interviewers=data["interviewers"],
    )

    db.add(interview)
    db.commit()

    candidate = db.query(Candidate).filter(Candidate.id == data["candidate_id"]).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    send_email(
        to_email=candidate.email,
        subject="Interview Scheduled",
        body=f"""
        Hello {candidate.name},

        Your interview is scheduled on {data['interview_date']}.
        Round: {data['interview_round']}

        Interviewers: {", ".join(data['interviewers'])}

        Regards,
        HR Team
        """
    )

    return {"message": "Interview Scheduled"}


# ✅ GET ALL INTERVIEWS
# ✅ GET INTERVIEWS (WITH NAME + ROUND)
@router.get("/interviews")
def get_interviews(db: Session = Depends(get_db)):
    results = (
        db.query(Interview, Candidate)
        .join(Candidate, Interview.candidate_id == Candidate.id)
        .all()
    )

    return [
        {
            "interview_id": i.interview_id,
            "candidate_name": c.name,   # ✅ NAME
            "candidate_id": c.id,       # keep hidden use
            "job_id": i.job_id,
            "round_name": i.round_name, # ✅ FIXED
            "interview_date": i.interview_date.isoformat() if i.interview_date else None,
            "interviewers": i.interviewers or [],
            "status": i.status,
            "rating": i.rating,
            "feedback": i.feedback
        }
        for i, c in results
    ]


# ✅ UPDATE STATUS + AUTO OFFER
@router.put("/update-interview/{id}")
def update_interview(id: int, data: dict, db: Session = Depends(get_db)):

    interview = db.query(Interview).filter(Interview.interview_id == id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if "status" in data:
        interview.status = data["status"]

    if "feedback" in data:
        interview.feedback = data["feedback"] if data["feedback"] else None

    if "rating" in data:
        rating = data["rating"]
        interview.rating = int(rating) if rating not in [None, ""] else None

    db.commit()

    # 🔥 GET CURRENT ROUND FLOW
    flow = db.query(JobInterviewFlow).filter(
        JobInterviewFlow.job_id == interview.job_id
    ).order_by(JobInterviewFlow.round_order).all()

    current_index = next(
        (i for i, f in enumerate(flow) if f.round_name == interview.round_name),
        None
    )

    # 🔥 IF SELECTED → MOVE TO NEXT ROUND
    if data.get("status") == "Selected" and current_index is not None:

        # ✅ Check if next round exists
        if current_index + 1 < len(flow):
            next_round = flow[current_index + 1]

            new_interview = Interview(
                candidate_id=interview.candidate_id,
                job_id=interview.job_id,
                round_name=next_round.round_name,
                round_order=next_round.round_order,
                interview_date=datetime.now(),
                interviewers=[],
                status="Scheduled"
            )

            db.add(new_interview)
            db.commit()

        else:
            # ✅ FINAL ROUND → CREATE OFFER
            existing_offer = db.query(Offer).filter(
                Offer.candidate_id == interview.candidate_id,
                Offer.job_id == interview.job_id
            ).first()

            if not existing_offer:
                offer = Offer(
                    candidate_id=interview.candidate_id,
                    job_id=interview.job_id,
                    salary=500000
                )
                db.add(offer)

                candidate = db.query(Candidate).filter(
                    Candidate.id == interview.candidate_id
                ).first()

                send_email(
                    to_email=candidate.email,
                    subject="Offer Letter",
                    body=f"Congratulations {candidate.name}, you are selected!"
                )

                db.commit()

    return {"message": "Updated"}


# ✅ KANBAN DATA (PIPELINE)
@router.get("/pipeline")
def get_pipeline(db: Session = Depends(get_db)):
    candidates = db.query(Candidate).all()

    stages = ["Applied", "Shortlisted", "Interview", "Selected", "Rejected"]

    pipeline = {stage: [] for stage in stages}

    for c in candidates:
        pipeline[c.status].append({
            "id": c.id,
            "name": c.name
        })

    return pipeline


# ✅ DRAG UPDATE
@router.put("/update-status")
def update_status(data: dict, db: Session = Depends(get_db)):

    candidate = db.query(Candidate).filter(Candidate.id == data["candidate_id"]).first()
    candidate.status = data["status"]

    db.commit()

    return {"message": "Moved"}

@router.post("/interview-flow")
def save_interview_flow(data: dict, db: Session = Depends(get_db)):
    job_id = data.get("job_id")
    rounds = data.get("rounds") or []

    if not job_id:
        raise HTTPException(status_code=400, detail="Job is required")

    round_names = [
        str(item.get("round_name", "")).strip()
        for item in rounds
        if str(item.get("round_name", "")).strip()
    ]

    if not round_names:
        raise HTTPException(status_code=400, detail="At least one interview round is required")

    db.query(JobInterviewFlow).filter(JobInterviewFlow.job_id == job_id).delete()

    for index, round_name in enumerate(round_names, start=1):
        db.add(JobInterviewFlow(
            job_id=job_id,
            round_name=round_name,
            round_order=index,
            is_final=index == len(round_names)
        ))

    db.commit()
    return {"message": "Interview flow saved"}

@router.get("/interview-flow/{job_id}")
def get_interview_flow(job_id: str, db: Session = Depends(get_db)):
    flows = (
        db.query(JobInterviewFlow)
        .filter(JobInterviewFlow.job_id == job_id)
        .order_by(JobInterviewFlow.round_order)
        .all()
    )

    return [
        {
            "round_name": f.round_name,
            "round_order": f.round_order,
            "is_final": f.is_final
        }
        for f in flows
    ]
