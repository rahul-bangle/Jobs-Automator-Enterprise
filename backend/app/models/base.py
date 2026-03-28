from datetime import datetime
from typing import List, Optional
import hashlib
from sqlmodel import Column, Field, JSON, SQLModel


class Job(SQLModel, table=True):
    __tablename__ = "jobs"

    id: Optional[str] = Field(default=None, primary_key=True)
    company_name: str
    job_title: str
    source_url: str
    location: str
    description: Optional[str] = None
    site: Optional[str] = None
    salary_extracted: Optional[str] = None
    relevance_score: int = 0
    queue_status: str = "review"
    discovery_date: datetime = Field(default_factory=datetime.utcnow)
    study_guide: Optional[dict] = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @staticmethod
    def generate_id(company: str, title: str, location: str) -> str:
        payload = f"{company.lower()}|{title.lower()}|{location.lower()}"
        return hashlib.sha256(payload.encode()).hexdigest()


class MasterResume(SQLModel, table=True):
    __tablename__ = "master_resumes"

    id: Optional[int] = Field(default=1, primary_key=True)
    filename: str
    raw_text: str
    parsed_json: dict = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ResumeVariant(SQLModel, table=True):
    __tablename__ = "resume_variants"

    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: Optional[str] = Field(default=None, foreign_key="jobs.id")
    filename: str
    content: Optional[str] = None
    ats_score: int = 0
    version: int = 0
    status: str = "PASS"
    keywords: List[str] = Field(default=[], sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class JobApplication(SQLModel, table=True):
    __tablename__ = "job_applications"

    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: str = Field(foreign_key="jobs.id")
    resume_variant_id: Optional[int] = Field(default=None, foreign_key="resume_variants.id")
    approval_status: str = "ready"
    warnings: List[str] = Field(default=[], sa_column=Column(JSON))
    fit_reasons: List[str] = Field(default=[], sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Compatibility alias for existing imports in packets API.
ApplicationPacket = JobApplication


# Minimal compatibility models used by legacy routes.
class Campaign(SQLModel, table=True):
    __tablename__ = "campaigns"

    id: Optional[int] = Field(default=None, primary_key=True)
    target_role: str = "Generalist"
    target_locations: str = "India"
    experience_level: str = "fresher"
    tech_stack: str = "Python,FastAPI"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ImportBatch(SQLModel, table=True):
    __tablename__ = "import_batches"

    id: Optional[int] = Field(default=None, primary_key=True)
    source_type: str = "CSV"
    file_name: Optional[str] = None
    total_rows: int = 0
    accepted_rows: int = 0
    review_rows: int = 0
    rejected_rows: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
