# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from app.routes.auth import router
# from app.routes.jobs import router as jobs_router   # ✅ ADD
# from app.routes.job_links import router as job_links_router
# from app.routes.public_apply import router as public_apply_router
# from app.routes.candidates import router as candidates_router
# app = FastAPI() 

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.include_router(router, prefix="/api/auth")
# app.include_router(jobs_router, prefix="/api")   # ✅ ADD
# app.include_router(job_links_router, prefix="/api/job-links")
# app.include_router(public_apply_router, prefix="/api")
# app.include_router(candidates_router, prefix="/api")

# @app.get("/")
# def root():
#     return {"status": "ATS Backend Running"}

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from app.routes.auth import router as auth_router
# from app.routes.jobs import router as jobs_router

# # ✅ ADD THESE
# from app.routes.job_links import router as job_links_router
# from app.routes.public_apply import router as public_apply_router

# from app.routes.candidates import router as get_candidates

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ✅ Existing routers (UNCHANGED)
# app.include_router(auth_router, prefix="/api/auth")
# app.include_router(jobs_router, prefix="/api")

# # ✅ New routers (ADD ONLY THESE TWO)
# app.include_router(job_links_router, prefix="/api")
# app.include_router(public_apply_router, prefix="/api")
#  # ✅ ADD THIS
# app.include_router(get_candidates, prefix="/api")

# @app.get("/")
# def root():
#     return {"status": "ATS Backend Running"}

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes.auth import router as auth_router
from app.routes.jobs import router as jobs_router
from app.routes.job_links import router as job_links_router
from app.routes.public_apply import router as public_apply_router
from app.routes.candidates import router as candidates_router
from app.routes.resume_screening import router as resume_screening
from app.routes.walkin import router as walkin_router
from app.routes.interviews import router as interviews_router
from app.routes.offers import router as offers_router
from app.routes.blacklist import router as blacklist_router
from app.routes.candidate_status import router as candidates_status_router
from app.routes.dashboard import router as dashboard_router
from app.routes.admin import router as admin_router
from app.routes.transfer_requests import router as transfer_requests_router
from app.routes.ats_config import router as ats_config_router
from app.routes.letterhead_templates import router as letterhead_templates_router
from app.routes.joining_forms import router as joining_forms_router

app = FastAPI()

frontend_url = os.getenv("FRONTEND_URL")
allowed_origins = ["http://localhost:3000"]
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve resume files
app.mount("/resumes", StaticFiles(directory="uploads/resumes"), name="resumes")
# Routers
app.include_router(auth_router, prefix="/api/auth")
app.include_router(jobs_router, prefix="/api")
app.include_router(job_links_router, prefix="/api")
app.include_router(public_apply_router, prefix="/api")
app.include_router(candidates_router, prefix="/api")
app.include_router(resume_screening, prefix="/api") 
app.include_router(walkin_router, prefix="/api")    
app.include_router(interviews_router, prefix="/api")
app.include_router(offers_router, prefix="/api")
app.include_router(blacklist_router, prefix="/api")
app.include_router(candidates_status_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(transfer_requests_router, prefix="/api")
app.include_router(ats_config_router, prefix="/api")
app.include_router(letterhead_templates_router, prefix="/api")
app.include_router(joining_forms_router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ATS Backend Running"}
