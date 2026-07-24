from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
import os
import secrets

from app.db import SessionLocal
from app.models.models import User
from app.security import decrypt_data, hash_password, verify_password
from app.email_service import send_reset_email
from app.validator import validate_password


router = APIRouter()

SECRET = os.getenv("SECRET_KEY")
FRONTEND = os.getenv("FRONTEND_URL")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------- FORGOT PASSWORD ----------------
@router.post("/forgot-password")
def forgot_password(data: dict, db: Session = Depends(get_db)):

    emp_id = data.get("emp_id")
    email = data.get("email")

    user = db.query(User).filter(
        User.emp_id == emp_id,
        User.email == email
    ).first()

    if not user:
        raise HTTPException(400, "Invalid Details")

    token = secrets.token_urlsafe(32)

    user.reset_token = token
    user.reset_expiry = datetime.utcnow() + timedelta(minutes=10)

    db.commit()

    link = f"{FRONTEND}/reset-password?token={token}"

    send_reset_email(email, link)

    return {"message": "Reset link sent"}


# ---------------- RESET PASSWORD ----------------
@router.post("/reset-password")
def reset_password(data: dict, db: Session = Depends(get_db)):

    token = (data.get("token") or "").strip()
    new_password = data.get("new_password")

    if not token or not new_password:
        raise HTTPException(400, "Token and new password are required")

    user = db.query(User).filter(User.reset_token == token).first()

    if not user:
        try:
            payload = jwt.decode(token, SECRET, algorithms=["HS256"])

            emp_id = payload.get("sub")
            if not emp_id and payload.get("emp"):
                emp_id = decrypt_data(payload.get("emp"))

            if emp_id:
                user = db.query(User).filter(
                    User.emp_id == emp_id,
                    User.reset_token == token
                ).first()
        except Exception:
            user = None

    if not user:
        raise HTTPException(400, "Invalid / Expired Token")

    if user.reset_expiry < datetime.utcnow():
        raise HTTPException(400, "Link Expired")

    if not validate_password(new_password):
        raise HTTPException(400, "Weak Password")

    user.password = hash_password(new_password)
    user.reset_token = None
    user.reset_expiry = None

    db.commit()

    return {"message": "Password Reset Successful"}

# ---------------- LOGIN ----------------
@router.post("/login")
def login(data: dict, db: Session = Depends(get_db)):

    emp_id = data.get("emp_id")
    password = data.get("password")

    if not emp_id or not password:
        raise HTTPException(400, "Missing credentials")

    user = db.query(User).filter(
        User.emp_id == emp_id
    ).first()

    if not user:
        raise HTTPException(401, "Invalid credentials")

    if not verify_password(password, user.password):
        raise HTTPException(401, "Invalid credentials")

    payload = {
        "sub": user.emp_id,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(hours=8)
    }

    token = jwt.encode(payload, SECRET, algorithm="HS256")

    return {
          "access_token": token,
        "role": user.role,
        "emp_id": user.emp_id,          # ✅ ADD THIS
        "user_name": user.user_name,   # ✅ ADD THIS
        "token_type": "bearer"
    }
# ---------------- REGISTER USER ----------------
@router.post("/register")
def register_user(data: dict, db: Session = Depends(get_db)):

    emp_id = data.get("emp_id")
    user_name = data.get("user_name")
    role = data.get("role")
    email = data.get("email")
    password = data.get("password")

    if not all([emp_id, user_name, role, password]):
        raise HTTPException(400, "Missing required fields")

    existing_user = db.query(User).filter(
        User.emp_id == emp_id
    ).first()

    if existing_user:
        raise HTTPException(400, "Employee ID already exists")

    hashed_password = hash_password(password)

    new_user = User(
        emp_id=emp_id,
        user_name=user_name,
        role=role,
        email=email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()

    return {"message": "User registered successfully"}
