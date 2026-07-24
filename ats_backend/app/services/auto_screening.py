from datetime import datetime
from app.models.models import Candidate, CandidateMLData, ATSFilterConfig, Job
from app.email_service import send_status_email


def run_auto_screening(db, job_id):

    rule = db.query(ATSFilterConfig).filter(
        ATSFilterConfig.job_id == job_id
    ).first()

    if not rule or not rule.enable_auto_filter:
        return

    candidates = (
        db.query(Candidate, CandidateMLData, Job.title)
        .join(CandidateMLData, Candidate.id == CandidateMLData.candidate_id)
        .join(Job, Candidate.job_match_id == Job.id)
        .filter(Candidate.job_match_id == job_id)
        .filter(Candidate.status == "Applied")
        .all()
    )

    for record in candidates:

        candidate = record[0]
        ml = record[1]
        job_title = record[2]

        score = ml.ats_score or 0

        if score >= rule.shortlist_score:

            candidate.status = "Shortlisted"
            candidate.status_updated_at = datetime.utcnow()

            send_status_email(
                candidate.email,
                candidate.name,
                "Shortlisted",
                job_title
            )

        elif score <= rule.reject_score:

            candidate.status = "Rejected"
            candidate.status_updated_at = datetime.utcnow()

            send_status_email(
                candidate.email,
                candidate.name,
                "Rejected",
                job_title
            )

    db.commit()