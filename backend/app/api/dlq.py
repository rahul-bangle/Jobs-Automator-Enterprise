"""
Dead-Letter Queue (DLQ) — Phase B8 Hardening
Stores failed scrape/apply attempts for manual review.
No failed job is silently dropped — everything lands in the DLQ.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_session
from app.models.base import SubmissionAttempt
from typing import Optional
from datetime import datetime

router = APIRouter()


@router.post("/log-failure")
async def log_failure(
    job_id: str,
    failure_type: str,  # "scrape_failed" | "apply_failed" | "parse_failed"
    reason: str,
    attempt_number: int = 1,
    session: AsyncSession = Depends(get_session)
):
    """
    Log a failure to the DLQ.
    Called automatically by scraper/apply retry logic after max retries exceeded.
    """
    attempt = SubmissionAttempt(
        job_id=job_id,
        outcome="failed",
        failure_reason=f"[{failure_type}] attempt #{attempt_number}: {reason}",
    )
    session.add(attempt)
    await session.commit()
    await session.refresh(attempt)

    return {
        "dlq_entry_id": attempt.id,
        "job_id": job_id,
        "failure_type": failure_type,
        "message": "Failure logged to DLQ for manual review"
    }


@router.get("/list")
async def list_dlq(session: AsyncSession = Depends(get_session)):
    """Return all DLQ entries — the manual review inbox."""
    result = await session.execute(
        select(SubmissionAttempt).where(SubmissionAttempt.outcome == "failed")
    )
    failures = result.scalars().all()

    return {
        "total_failures": len(failures),
        "items": [
            {
                "id": f.id,
                "job_id": f.job_id,
                "failure_reason": f.failure_reason,
                "created_at": str(f.created_at) if hasattr(f, "created_at") else "N/A"
            }
            for f in failures
        ]
    }


@router.delete("/clear/{attempt_id}")
async def clear_dlq_entry(attempt_id: str, session: AsyncSession = Depends(get_session)):
    """Mark a DLQ entry as manually resolved."""
    attempt = await session.get(SubmissionAttempt, attempt_id)
    if attempt:
        attempt.outcome = "manually_resolved"
        session.add(attempt)
        await session.commit()
    return {"status": "resolved", "attempt_id": attempt_id}
