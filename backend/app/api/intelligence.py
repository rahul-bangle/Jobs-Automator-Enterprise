from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.core.db import get_session
from app.models.base import Job, Campaign
from app.services.scoring import scoring_service
from app.services.market_analysis import analyze_market
from app.services.ats_engine_v2 import ats_engine
from app.services.tailor_engine_v2 import tailor_service

router = APIRouter()

@router.post("/score/{job_id}")
async def score_single_job(
    job_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Score a single job and store the transparent breakdown."""
    job = await session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Fetch candidate profile from active campaign
    result = await session.execute(select(Campaign).where(Campaign.is_active == True))
    campaign = result.scalars().first()
    candidate_profile = f"Role: {campaign.target_role}, Tech: {campaign.tech_stack}, Experience: {campaign.experience_level}" if campaign else "Fresher Product Manager"

    result = await scoring_service.score_job(
        session=session,
        job_title=job.job_title,
        company_name=job.company_name,
        location=job.location or "",
        description=job.description or "",
        candidate_profile=candidate_profile
    )

    # Persist the score to the Job record
    job.relevance_score = result.get("overall_score", 0)
    job.fit_summary = result.get("why_this_job", "")
    job.score_breakdown = result.get("score_breakdown", {})
    job.risk_flags = result.get("risk_flags", [])

    # Auto-route to accepted/review based on score
    if job.relevance_score >= 70:
        job.queue_status = "accepted"
    elif job.relevance_score >= 40:
        job.queue_status = "review"
    else:
        job.queue_status = "rejected"

    session.add(job)
    await session.commit()
    await session.refresh(job)

    return {
        "job_id": job_id,
        "overall_score": job.relevance_score,
        "queue_status": job.queue_status,
        "score_breakdown": job.score_breakdown,
        "why_this_job": job.fit_summary,
        "risk_flags": job.risk_flags
    }

@router.post("/batch-score")
async def batch_score_jobs(
    session: AsyncSession = Depends(get_session)
):
    """Score all pending jobs in the review queue."""
    # Similar logic as above but for multiple jobs
    # (Simplified for now, using the updated score_job)
    stmt = select(Job).where(Job.queue_status == "review")
    jobs = (await session.execute(stmt)).scalars().all()
    
    # ... logic ...
    return {"message": f"Planned for {len(jobs)} jobs"}

@router.post("/market-analysis")
async def run_market_analysis(session: AsyncSession = Depends(get_session)):
    """Run Groq/Llama market analysis on all accepted/review jobs."""
    result = await session.execute(
        select(Job).where(Job.queue_status.in_(["accepted", "review"]))
    )
    jobs = result.scalars().all()

    jobs_data = [
        {
            "job_title": j.job_title,
            "company_name": j.company_name,
            "description": j.description or ""
        }
        for j in jobs
    ]

    analysis = await analyze_market(jobs_data)
    return analysis

@router.post("/optimize-resume/{job_id}")
async def optimize_resume_for_job(
    job_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Manually trigger the 3-iteration ATS optimization loop."""
    job = await session.get(Job, job_id)
    if not job: raise HTTPException(status_code=404, detail="Job not found")

    # Get candidate profile (Simple for now, can be expanded to full resume text)
    result = await session.execute(select(Campaign).where(Campaign.is_active == True))
    campaign = result.scalars().first()
    candidate_profile = f"Role: {campaign.target_role}, Tech: {campaign.tech_stack}" if campaign else "Fresher"

    variant = await tailor_service.legacy_optimize_resume(session, job_id, candidate_profile, job.description or "")
    return {
        "status": "PASS" if variant.ats_score >= 75 else "FAIL",
        "score": variant.ats_score,
        "variant_id": variant.id,
        "filename": variant.filename,
        "keywords": variant.keywords
    }

@router.get("/study-guide/{job_id}")
async def get_study_guide(
    job_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Fetch or generate the study guide for a specific job."""
    job = await session.get(Job, job_id)
    if not job: raise HTTPException(status_code=404, detail="Job not found")

    if not job.study_guide:
        # Generate on the fly if missing (e.g. for review-queue jobs)
        result = await session.execute(select(Campaign).where(Campaign.is_active == True))
        campaign = result.scalars().first()
        candidate_profile = f"Tech: {campaign.tech_stack}" if campaign else "Fresher"
        job.study_guide = await ats_engine.generate_study_guide(candidate_profile, job.description or "")
        session.add(job)
        await session.commit()

    return job.study_guide
