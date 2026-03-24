from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.models.base import LearningOutcome, ScoringWeights, Job
from datetime import datetime

class LearningLoopService:
    async def record_outcome(
        self, 
        session: AsyncSession,
        job_id: str,
        is_shortlisted: bool = False,
        is_rejected: bool = False,
        interview_stage: int = 0,
        feedback_notes: str = None
    ):
        """Record the outcome of a job application for future learning."""
        outcome = LearningOutcome(
            job_id=job_id,
            is_shortlisted=is_shortlisted,
            is_rejected=is_rejected,
            interview_stage=interview_stage,
            feedback_notes=feedback_notes
        )
        session.add(outcome)
        await session.commit()
        
        # After recording, we could trigger a weight re-tuning
        await self.tune_weights(session)

    async def tune_weights(self, session: AsyncSession):
        """Automatically tune scoring weights based on successful outcomes."""
        # Simple heuristic for MVP: If we have enough data, adjust weights.
        # This is the "AI moat" the user mentioned.
        
        # Logic to be implemented as data accumulates:
        # 1. Fetch all successful (shortlisted) jobs.
        # 2. Extract their common features (Skill, Exp, Loc, Keywords).
        # 3. Compare with rejected jobs.
        # 4. Shift weights in ScoringWeights table.
        pass

    async def get_current_weights(self, session: AsyncSession) -> ScoringWeights:
        """Fetch the latest scoring weights."""
        statement = select(ScoringWeights).order_by(ScoringWeights.updated_at.desc())
        results = await session.execute(statement)
        weights = results.scalars().first()
        
        if not weights:
            # Initialize default weights
            weights = ScoringWeights()
            session.add(weights)
            await session.commit()
            await session.refresh(weights)
            
        return weights

learning_loop_service = LearningLoopService()
