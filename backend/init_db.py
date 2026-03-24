import os
import sys
import traceback

# Add project root to path
sys.path.append(os.getcwd())

try:
    from sqlmodel import SQLModel
    from app.core.db import engine
    from app.models.base import User, Settings, Campaign, ImportBatch, Job, ResumeVariant, ApplicationPacket, SubmissionAttempt, LearningOutcome, ScoringWeights

    def init_db():
        print("🚀 Initializing Production Database...")
        
        db_path = "job_automator.db"
        if os.path.exists(db_path):
            print(f"🧹 Removing existing database: {db_path}")
            os.remove(db_path)
        
        print("🛠️ Creating tables...")
        SQLModel.metadata.create_all(engine)
        
        print("✅ Database initialized successfully.")

    if __name__ == "__main__":
        init_db()

except Exception:
    print("❌ Critical Failure during Database Initialization:")
    traceback.print_exc()
    sys.exit(1)
