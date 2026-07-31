from pydantic import BaseModel, EmailStr
from typing import Optional, List
from decimal import Decimal


class CandidateCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    experience: Optional[str] = None

    pan: Optional[str] = None
    aadhaar: Optional[str] = None
    uan: Optional[str] = None

    referral_type: Optional[str] = None
    referred_by: Optional[str] = None
    referral_value: Optional[str] = None

class CandidateResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str

    job: str
    experience: str

    skills: List[str]
    fitScore: int
    status: str
    notice_period: Optional[str] 
    current_ctc: Optional[float]
    expected_ctc: Optional[float]
    willing_to_relocate: str

    class Config:
        from_attributes = True