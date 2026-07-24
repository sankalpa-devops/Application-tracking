from pydantic import BaseModel
from datetime import datetime

class JobLinkResponse(BaseModel):
    id: str
    job_id: str
    slug: str
    expires_at: datetime
    is_active: bool

    class Config:
        from_attributes = True