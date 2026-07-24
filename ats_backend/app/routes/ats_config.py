from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models.models import ATSFilterConfig

router = APIRouter(prefix="/ats-config", tags=["ATS Config"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{job_id}")
def get_config(job_id: str, db: Session = Depends(get_db)):

    config = db.query(ATSFilterConfig).filter(
        ATSFilterConfig.job_id == job_id
    ).first()

    return config


@router.post("/{job_id}")
def update_config(job_id: str, payload: dict, db: Session = Depends(get_db)):

    config = db.query(ATSFilterConfig).filter(
        ATSFilterConfig.job_id == job_id
    ).first()

    if not config:
        config = ATSFilterConfig(job_id=job_id)
        db.add(config)

    config.enable_auto_filter = payload.get("enable_auto_filter")
    config.shortlist_score = payload.get("shortlist_score")
    config.reject_score = payload.get("reject_score")

    db.commit()

    return {"message": "Config saved"}