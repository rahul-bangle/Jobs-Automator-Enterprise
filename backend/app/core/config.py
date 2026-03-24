from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Job Automator"
    API_V1_STR: str = "/api/v1"
    
    # Database Mode: "supabase" or "sqlite"
    DATABASE_MODE: str = "sqlite"
    
    # Supabase (Postgres)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SQLALCHEMY_DATABASE_URL: Optional[str] = None # postgresql+asyncpg://...
    
    # SQLite Fallback
    SQLITE_URL: str = "sqlite+aiosqlite:///./job_automator.db"
    
    @property
    def DATABASE_URL(self) -> str:
        if self.DATABASE_MODE == "supabase" and self.SQLALCHEMY_DATABASE_URL:
            return self.SQLALCHEMY_DATABASE_URL
        return self.SQLITE_URL
    
    # Redis for Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # LLM — Groq
    GROQ_API_KEY: Optional[str] = None
    GROQ_SCORING_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_BATCH_MODEL: str = "llama-3.1-8b-instant"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
