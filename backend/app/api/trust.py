"""
Trust & Scoring API — Phase B5
Routes: source trust heuristics, risk flagging, and queue auto-routing.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.core.db import get_session
from app.models.base import Job

router = APIRouter()

# Known trusted ATS platforms
TRUSTED_ATS = {"greenhouse", "lever", "ashby", "workday", "jobvite"}
SUSPICIOUS_KEYWORDS = ["urgent", "work from home unlimited", "earn $", "no experience needed", "100k guaranteed"]


def calculate_trust_score(job: Job) -> int:
    """Rule-based trust scoring 0-100."""
    score = 50  # Baseline

    # ATS platform bonus
    if job.ats_type and job.ats_type.lower() in TRUSTED_ATS:
        score += 30

    # URL quality check
    if job.source_url:
        url = job.source_url.lower()
        if any(ats in url for ats in ["greenhouse.io", "lever.co", "ashbyhq.com"]):
            score += 10
        if "linkedin.com" in url:
            score += 5

    # Suspicion penalty
    title_lower = (job.job_title or "").lower()
    desc_lower = (job.description or "").lower()
    combined = title_lower + " " + desc_lower

    risk_flags = []
    for kw in SUSPICIOUS_KEYWORDS:
        if kw in combined:
            score -= 20
            risk_flags.append(f"suspicious_keyword: '{kw}'")

    job.trust_score = max(0, min(100, score))
    job.risk_flags = str(risk_flags) if risk_flags else "[]"
    return job.trust_score


@router.post("/score-trust/{job_id}")
async def score_trust(job_id: str, session: AsyncSession = Depends(get_session)):
    """Apply trust scoring rules to a single job."""
    job = await session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    trust = calculate_trust_score(job)
    session.add(job)
    await session.commit()

    return {
        "job_id": job_id,
        "trust_score": trust,
        "risk_flags": job.risk_flags,
        "ats_type": job.ats_type
    }


@router.post("/batch-trust")
async def batch_trust_score(session: AsyncSession = Depends(get_session)):
    """Apply trust scoring to all unscored jobs."""
    result = await session.execute(select(Job).where(Job.trust_score == None))
    jobs = result.scalars().all()

    for job in jobs:
        calculate_trust_score(job)
        session.add(job)

    await session.commit()
    return {"scored": len(jobs)}
