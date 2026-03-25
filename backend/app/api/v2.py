from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.core.db import get_session
from app.models.base import Job, Campaign, ResumeVariant
from app.services.pipeline_v2 import discovery_service
from app.services.ats_engine_v2 import ats_engine
from app.services.tailor_engine_v2 import tailor_service
from app.services.submission_agent import submission_agent
from typing import List, Dict
import logging

logger = logging.getLogger("V2Router")

router = APIRouter(tags=["V2 Pipeline"])

@router.post("/jobs/discovery")
async def run_discovery(
    query: str,
    locations: List[str] = Body(default=["Hyderabad"]),
    limit: int = 10,
    session: AsyncSession = Depends(get_session)
):
    """Tier 1: Discover jobs across LinkedIn, Indeed, Glassdoor (REST Aligned)."""
    logger.info(f"V2 Discovery Route Triggered: {query} in {locations}")
    jobs = await discovery_service.search_jobs(query, locations, limit)
    for job in jobs:
        await session.merge(job)
    await session.commit()
    return {"discovered_count": len(jobs), "jobs": jobs}

@router.post("/optimize/{job_id}")
async def optimize_application(
    job_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Tier 2 & 3: Structured Parsing + Recursive Self-Healing Tailor."""
    job = await session.get(Job, job_id)
    if not job: raise HTTPException(status_code=404, detail="Job not found")
    
    # 1. Parse JD if not already structured
    profile = await discovery_service.parse_job_description(job.source_url)
    
    # 2. Get base resume (simplified: fetching first user resume for now)
    # [Logic to fetch actual user base resume]
    base_resume = {"basics": {"name": "User"}} 
    
    # 3. Recursive Loop
    result = await tailor_service.optimize_resume(base_resume, profile)
    
    # 4. Save best variant
    variant = ResumeVariant(
        job_id=job.id,
        filename=f"version_{result['best_score']}.json",
        ats_score=result['best_score'],
        status="PASS" if result['best_score'] >= 75 else "FAIL",
        version=len(result['version_history'])
    )
    session.add(variant)
    await session.commit()
    await session.refresh(variant)
    
    return {
        "variant_id": variant.id,
        "score": variant.ats_score,
        "history": [h["score"] for h in result["version_history"]]
    }

@router.post("/apply/{job_id}")
async def submit_application(
    job_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Tier 4: Safety Gate + Lazy Render + BrowserUse Submit."""
    # 1. Get best variant
    stmt = select(ResumeVariant).where(ResumeVariant.job_id == job_id).order_by(ResumeVariant.ats_score.desc())
    variant = (await session.execute(stmt)).scalars().first()
    if not variant: raise HTTPException(status_code=400, detail="No optimized variant found")
    
    job = await session.get(Job, job_id)
    
    # 2. Process via Submission Agent
    # [Passing data for Safety Gate and Rendering]
    outcome = await submission_agent.process_submission(
        {"url": job.source_url},
        {"best_score": variant.ats_score, "final_resume": {"basics": {"name": "User"}}}
    )
    
    return outcome

@router.get("/history")
async def get_audit_history(
    session: AsyncSession = Depends(get_session),
    limit: int = 100
):
    """Fetch high-performance data for ResultTable.jsx."""
    stmt = select(Job).order_by(Job.discovery_date.desc()).limit(limit)
    jobs = (await session.execute(stmt)).scalars().all()
    
    # Map to frontend columns
    history = []
    for j in jobs:
        history.append({
            "id": j.id,
            "discovery_date": j.discovery_date.strftime("%Y-%m-%d"),
            "job_title": j.job_title,
            "company_name": j.company_name,
            "location": j.location,
            "salary_extracted": j.salary_extracted,
            "site": j.site,
            "source_url": j.source_url,
            "ats_score": j.relevance_score, # Mapping score breakdown total
            "status": "applied" if j.queue_status == "accepted" else "discovered"
        })
    return history
