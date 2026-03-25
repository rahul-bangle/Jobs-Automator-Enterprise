from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship, JSON, Column
import hashlib

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: Optional[str] = None
    is_active: bool = True

class Settings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    supabase_configured: bool = False
    sqlite_fallback_enabled: bool = True
    dark_mode_locked: bool = True
    auto_open_manual_steps: bool = True

class Campaign(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    target_role: str
    target_locations: str  # Comma separated
    experience_level: str = "fresher"
    tech_stack: str  # Comma separated
    apply_mode: str = "manual"  # manual, assisted, auto
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ImportBatch(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    source_type: str  # URL, XLS, etc.
    file_name: Optional[str] = None
    total_rows: int = 0
    accepted_rows: int = 0
    review_rows: int = 0
    rejected_rows: int = 0

class Job(SQLModel, table=True):
    id: Optional[str] = Field(default=None, primary_key=True)  # Using SHA-256 hash as ID
    company_name: str
    job_title: str
    source_url: str
    location: str
    description: Optional[str] = None
    ats_type: str = "unknown"
    trust_score: int = 0
    relevance_score: int = 0
    queue_status: str = "review"  # review, accepted, rejected, duplicate, snoozed
    fit_summary: Optional[str] = None
    salary_extracted: Optional[str] = None
    site: Optional[str] = None  # New field for "Pro Max" UI (LinkedIn, Indeed, etc.)
    discovery_date: datetime = Field(default_factory=datetime.utcnow)
    score_breakdown: Optional[dict] = Field(default={}, sa_column=Column(JSON))
    risk_flags: List[str] = Field(default=[], sa_column=Column(JSON))
    study_guide: Optional[dict] = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    @staticmethod
    def generate_id(company: str, title: str, location: str) -> str:
        payload = f"{company.lower()}|{title.lower()}|{location.lower()}"
        return hashlib.sha256(payload.encode()).hexdigest()

class ResumeVariant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: Optional[str] = Field(default=None, foreign_key="job.id")
    filename: str
    content: Optional[str] = None
    ats_score: int = 0
    version: int = 0  # 0: Original, 1-3: Optimized
    status: str = "PASS"  # PASS, FAIL, OPTIMIZING
    keywords: List[str] = Field(default=[], sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ApplicationPacket(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: str = Field(foreign_key="job.id")
    resume_variant_id: int = Field(foreign_key="resumevariant.id")
    approval_status: str = "ready"  # ready, approved
    warnings: List[str] = Field(default=[], sa_column=Column(JSON))
    fit_reasons: List[str] = Field(default=[], sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SubmissionAttempt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    packet_id: Optional[int] = Field(default=None, foreign_key="applicationpacket.id")
    job_id: Optional[str] = Field(default=None, foreign_key="job.id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    outcome: str = "pending"  # success, failure, pending
    failure_reason: Optional[str] = None

class LearningOutcome(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: str = Field(foreign_key="job.id")
    resume_variant_id: Optional[int] = Field(default=None, foreign_key="resumevariant.id")
    is_shortlisted: bool = False
    is_rejected: bool = False
    interview_stage: int = 0  # 0: None, 1: Phone, 2: Tech, etc.
    feedback_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ScoringWeights(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    skill_match_weight: float = 0.4
    keyword_match_weight: float = 0.3
    experience_match_weight: float = 0.2
    location_match_weight: float = 0.1
    updated_at: datetime = Field(default_factory=datetime.utcnow)
