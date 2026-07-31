import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models.models import ATSFilterConfig, User

router = APIRouter(prefix="/ats-config", tags=["ATS Config"])
security = HTTPBearer()
SECRET = os.getenv("SECRET_KEY", "ff8666d4c263c405f23c192c6dcddc41bfcce15cdc4808851cb9b37cd68a6b07")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/global/hr-service")
def get_hr_service_status(db: Session = Depends(get_db)):
    config = db.query(ATSFilterConfig).filter(
        ATSFilterConfig.job_id == "GLOBAL"
    ).first()
    if not config:
        return {"hr_service_enabled": True}
    return {"hr_service_enabled": config.enable_auto_filter}


@router.post("/global/hr-service")
def set_hr_service_status(
    payload: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        decoded = jwt.decode(token, SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    emp_id = decoded.get("sub")
    user = db.query(User).filter(User.emp_id == emp_id).first()
    if not user or user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    config = db.query(ATSFilterConfig).filter(
        ATSFilterConfig.job_id == "GLOBAL"
    ).first()
    if not config:
        config = ATSFilterConfig(job_id="GLOBAL", enable_auto_filter=True)
        db.add(config)

    enabled = payload.get("hr_service_enabled", True)
    config.enable_auto_filter = enabled
    db.commit()

    return {"message": "HR service status updated", "hr_service_enabled": enabled}


@router.get("/global/blocked-features")
def get_blocked_features(db: Session = Depends(get_db)):
    features = [
        "Job Management",
        "Job Links",
        "Candidates",
        "Resume Screening",
        "Walk-ins",
        "Interviews",
        "Joining Forms",
        "Blacklist",
        "Analytics",
        "Transfer Requests"
    ]

    records = db.query(ATSFilterConfig).filter(
        ATSFilterConfig.job_id.like("GLOBAL_BLOCK_%")
    ).all()

    blocked_map = {f: False for f in features}
    for r in records:
        feature_name = r.job_id.replace("GLOBAL_BLOCK_", "")
        if feature_name in blocked_map:
            blocked_map[feature_name] = r.enable_auto_filter

    return blocked_map


@router.post("/global/blocked-features")
def set_blocked_features(
    payload: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        decoded = jwt.decode(token, SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    emp_id = decoded.get("sub")
    user = db.query(User).filter(User.emp_id == emp_id).first()
    if not user or user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    for feature_name, is_blocked in payload.items():
        job_id = f"GLOBAL_BLOCK_{feature_name}"
        config = db.query(ATSFilterConfig).filter(
            ATSFilterConfig.job_id == job_id
        ).first()
        if not config:
            config = ATSFilterConfig(job_id=job_id)
            db.add(config)
        config.enable_auto_filter = bool(is_blocked)

    db.commit()
    return {"message": "Blocked features updated"}


@router.get("/global/retention")
def get_global_retention(db: Session = Depends(get_db)):
    config = db.query(ATSFilterConfig).filter(
        ATSFilterConfig.job_id == "GLOBAL_RETENTION"
    ).first()
    months = config.reject_score if (config and config.reject_score is not None) else 3
    return {"retention_months": months}


@router.post("/global/retention")
def set_global_retention(
    payload: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        decoded = jwt.decode(token, SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    emp_id = decoded.get("sub")
    user = db.query(User).filter(User.emp_id == emp_id).first()
    if not user or user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    months = payload.get("retention_months", 3)
    try:
        months = int(months)
    except ValueError:
        raise HTTPException(status_code=400, detail="retention_months must be an integer")

    config = db.query(ATSFilterConfig).filter(
        ATSFilterConfig.job_id == "GLOBAL_RETENTION"
    ).first()
    if not config:
        config = ATSFilterConfig(job_id="GLOBAL_RETENTION")
        db.add(config)

    config.reject_score = months
    db.commit()
    return {"message": "Retention period updated", "retention_months": months}


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