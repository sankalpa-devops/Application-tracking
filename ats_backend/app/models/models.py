from sqlalchemy import (
    Column, Integer, String, DateTime, Text, Date,
    Boolean, ForeignKey, DECIMAL, Float, text
)
from sqlalchemy.sql import func
from sqlalchemy.dialects.mysql import JSON

from app.db import Base


# =========================================================
# USERS
# =========================================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    emp_id = Column(String(50), unique=True, nullable=False)
    user_name = Column(String(100), nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(10), nullable=False)

    email = Column(String(100))
    reset_token = Column(Text)
    reset_expiry = Column(DateTime)

    created_at = Column(DateTime, server_default=func.now())


# =========================================================
# JOBS
# =========================================================
class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True)

    title = Column(String(200))
    department = Column(String(200))
    type = Column(String(50))
    experience = Column(String(100))
    skills = Column(Text)

    location = Column(String(200))
    manager = Column(String(200))
    openings = Column(Integer)

    status = Column(String(50))
    job_description = Column(Text)

    created_by = Column(String(150))
    created_date = Column(Date)

    version = Column(Integer, default=1)


# =========================================================
# JOB APPLY LINK
# =========================================================
class JobApplyLink(Base):
    __tablename__ = "job_apply_links"

    id = Column(String(36), primary_key=True)
    job_id = Column(String(36), ForeignKey("jobs.id"))

    slug = Column(String(225), unique=True)
    expires_at = Column(DateTime)

    is_active = Column(Boolean, server_default=text("1"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


# =========================================================
# JOINING FORM LINKS
# =========================================================
class JoiningFormLink(Base):
    __tablename__ = "joining_form_links"

    id = Column(String(36), primary_key=True)
    candidate_id = Column(String(36), ForeignKey("candidates.id"), nullable=False)
    slug = Column(String(225), unique=True, nullable=False)
    title = Column(String(200))
    expires_at = Column(DateTime)
    is_active = Column(Boolean, server_default=text("1"), nullable=False)
    created_by = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())


# =========================================================
# JOINING FORMS
# =========================================================
class JoiningForm(Base):
    __tablename__ = "joining_forms"

    id = Column(String(36), primary_key=True)
    link_id = Column(String(36), ForeignKey("joining_form_links.id"), nullable=False)
    candidate_id = Column(String(36), ForeignKey("candidates.id"), nullable=False)

    employee_id = Column(String(50), unique=True, nullable=False)
    edit_token = Column(String(225), unique=True, nullable=False)
    additional_data = Column(JSON)

    status = Column(String(50), server_default="Submitted")
    submitted_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime)


# =========================================================
# EMPLOYEE TRANSFER REQUEST LINKS
# =========================================================
class TransferRequestLink(Base):
    __tablename__ = "transfer_request_links"

    id = Column(String(36), primary_key=True)
    slug = Column(String(225), unique=True, nullable=False)

    title = Column(String(200))
    expires_at = Column(DateTime)
    is_active = Column(Boolean, server_default=text("1"), nullable=False)

    created_by = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())


# =========================================================
# EMPLOYEE TRANSFER REQUESTS
# =========================================================
class EmployeeTransferRequest(Base):
    __tablename__ = "employee_transfer_requests"

    id = Column(String(36), primary_key=True)
    link_id = Column(String(36), ForeignKey("transfer_request_links.id"))

    employee_id = Column(String(50), nullable=False)
    employee_name = Column(String(200), nullable=False)
    email = Column(String(200))
    phone = Column(String(20))

    current_department = Column(String(200), nullable=False)
    requested_department = Column(String(200), nullable=False)
    current_location = Column(String(200), nullable=False)
    requested_location = Column(String(200), nullable=False)
    current_field = Column(String(200))
    requested_field = Column(String(200))

    reason = Column(Text, nullable=False)
    preferred_transfer_date = Column(Date)

    request_type = Column(String(50), nullable=False)  # "department", "management", "employee"
    status = Column(String(50), server_default="Pending")
    reviewed_by = Column(String(100))
    review_note = Column(Text)
    top_approver_role = Column(String(20))
    top_approver_name = Column(String(200))
    top_approved_at = Column(DateTime)
    transfer_letter_path = Column(Text)
    transfer_letter_sent_at = Column(DateTime)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime)


# =========================================================
# CANDIDATES
# =========================================================
class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String(36), primary_key=True)

    # Basic Info
    name = Column(String(200), nullable=False)
    email = Column(String(200), nullable=False)
    phone = Column(String(20), nullable=False)

    # Identity
    pan = Column(String(20), unique=True, nullable=False)
    aadhaar = Column(String(20), unique=True, nullable=False)
    uan = Column(String(20), unique=True, nullable=False)

    # Professional Info
    current_company = Column(String(200))
    experience = Column(String(100), nullable=False)

    # Location
    current_location = Column(String(200), nullable=False)
    willing_to_relocate = Column(String(10), nullable=False)

    # Personal
    dob = Column(Date)

    # Referral
    referral_type = Column(String(20))
    referred_by = Column(String(100))
    referral_value = Column(String(100))

    # Resume
    resume_path = Column(Text)

    # Compensation
    notice_period = Column(String(50))
    current_ctc = Column(DECIMAL(12, 2))
    expected_ctc = Column(DECIMAL(12, 2))

    # Job Mapping
    job_match_id = Column(String(36), ForeignKey("jobs.id"), nullable=False)

    # Source Tracking
    source = Column(String(20), default="online")
    applied_by = Column(String(20), default="candidate")

    # Status
    status = Column(String(50), server_default="Applied")
    status_updated_at = Column(DateTime)

    created_at = Column(DateTime, server_default=func.now())


# =========================================================
# CANDIDATE ML DATA
# =========================================================
class CandidateMLData(Base):
    __tablename__ = "candidate_ml_data"

    id = Column(String(36), primary_key=True)

    candidate_id = Column(String(36), ForeignKey("candidates.id"))
    job_id = Column(String(36), ForeignKey("jobs.id"))

    extracted_text = Column(Text)
    extracted_skills = Column(Text)
    matched_skills = Column(Text)

    ats_score = Column(Integer)
    experience_years = Column(Float)

    jd_score = Column(Integer)
    skill_score = Column(Integer)
    exp_score = Column(Integer)

    created_at = Column(DateTime, server_default=func.now())


# =========================================================
# ATS FILTER CONFIG
# =========================================================
class ATSFilterConfig(Base):
    __tablename__ = "ats_filter_config"

    id = Column(Integer, primary_key=True)
    job_id = Column(String(36))

    enable_auto_filter = Column(Boolean, default=False)

    shortlist_score = Column(Integer, default=70)
    reject_score = Column(Integer, default=40)

    created_at = Column(DateTime, server_default=func.now())


# =========================================================
# INTERVIEW FLOW (MASTER)
# =========================================================
class JobInterviewFlow(Base):
    __tablename__ = "job_interview_flow"

    id = Column(Integer, primary_key=True, autoincrement=True)

    job_id = Column(String(36))
    round_name = Column(String(100))
    round_order = Column(Integer)
    is_final = Column(Boolean, default=False)

    created_at = Column(DateTime, server_default=func.now())


# =========================================================
# INTERVIEWS
# =========================================================
class Interview(Base):
    __tablename__ = "interviews"

    interview_id = Column(Integer, primary_key=True, index=True)

    candidate_id = Column(String(36), ForeignKey("candidates.id"))
    job_id = Column(String(36), ForeignKey("jobs.id"))

    round_name = Column(String(100))
    round_order = Column(Integer)

    interview_date = Column(DateTime)

    interviewers = Column(JSON)  # Multiple interviewers
    meeting_link = Column(String(255))

    feedback = Column(Text)
    rating = Column(Integer)

    status = Column(String(50), default="Scheduled")

    created_at = Column(DateTime, server_default=func.now())


# =========================================================
# OFFERS
# =========================================================
class Offer(Base):
    __tablename__ = "offers"

    offer_id = Column(Integer, primary_key=True, index=True)

    candidate_id = Column(String(36), ForeignKey("candidates.id"))
    job_id = Column(String(36), ForeignKey("jobs.id"))

    salary = Column(DECIMAL(12, 2))
    offer_letter_path = Column(Text)

    offer_status = Column(String(50), default="Sent")

    created_at = Column(DateTime, server_default=func.now())


# =========================================================
# BLACKLIST
# =========================================================
class CandidateBlacklist(Base):
    __tablename__ = "candidate_blacklist"

    id = Column(String(36), primary_key=True)

    candidate_id = Column(String(36))

    name = Column(String(200))
    email = Column(String(200))
    phone = Column(String(20))

    pan = Column(String(20))
    aadhaar = Column(String(20))
    uan = Column(String(20))

    reason = Column(Text)
    blacklisted_by = Column(String(100))

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime)


# =========================================================
# LETTERHEAD TEMPLATES
# =========================================================
class LetterheadTemplate(Base):
    __tablename__ = "letterhead_templates"

    id = Column(String(36), primary_key=True)
    template_name = Column(String(200), nullable=False)
    template_type = Column(String(50), nullable=False)  # "loi", "transfer_letter", "general"

    # Header content
    company_name = Column(String(200))
    company_address = Column(Text)
    company_phone = Column(String(50))
    company_email = Column(String(200))
    company_logo_path = Column(Text)

    # Footer content
    footer_text = Column(Text)
    signature_block = Column(Text)

    # Styling
    header_color = Column(String(20), default="#1a1a1a")
    footer_color = Column(String(20), default="#666666")

    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)

    created_by = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime)


# =========================================================
# STATUS HISTORY
# =========================================================
class CandidateStatusHistory(Base):
    __tablename__ = "candidate_status_history"

    id = Column(Integer, primary_key=True)

    candidate_id = Column(String(36))
    old_status = Column(String(50))
    new_status = Column(String(50))

    changed_by = Column(String(100))
    changed_at = Column(DateTime, server_default=func.now())
