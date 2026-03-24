from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_session
from app.models.base import LearningOutcome, ScoringWeights
from app.services.learning_loop import learning_loop_service
from typing import List

router = APIRouter()

@router.post("/outcome")
async def record_job_outcome(
    job_id: str,
    is_shortlisted: bool = False,
    is_rejected: bool = False,
    feedback: str = None,
    session: AsyncSession = Depends(get_session)
):
    """Record an outcome and trigger the learning loop tuning."""
    await learning_loop_service.record_outcome(
        session=session,
        job_id=job_id,
        is_shortlisted=is_shortlisted,
        is_rejected=is_rejected,
        feedback_notes=feedback
    )
    return {"status": "recorded", "job_id": job_id}

@router.get("/weights", response_model=ScoringWeights)
async def get_current_weights(session: AsyncSession = Depends(get_session)):
    """View the current learned scoring weights."""
    return await learning_loop_service.get_current_weights(session)
