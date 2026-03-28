from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.core.db import get_session
from app.models.base import Job, Campaign, ResumeVariant, MasterResume
from app.services.pipeline_v2 import discovery_service
from app.services.ats_engine_v2 import ats_engine
from app.services.tailor_engine_v2 import tailor_service
from app.services.submission_agent import submission_agent
from app.services.resume_parser import resume_parser
from app.core.orchestrator import orchestrator
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

logger = logging.getLogger("V2Router")

router = APIRouter(tags=["V2 Pipeline"])

from fastapi.responses import StreamingResponse
import json

@router.get("/jobs/suggest")
async def get_job_suggestions(q: str = ""):
    """Returns AI-powered job title suggestions for autocomplete."""
    suggestions = await discovery_service.get_suggestions(q)
    return {"suggestions": suggestions}


@router.get("/jobs")
async def get_jobs(session: AsyncSession = Depends(get_session)):
    stmt = select(Job).order_by(Job.created_at.desc())
    jobs = (await session.execute(stmt)).scalars().all()
    return jobs

class DiscoveryRequest(BaseModel):
    locations: List[str] = ["India"]
    filters: Optional[Dict[str, str]] = None

@router.post("/jobs/discovery")
async def run_discovery(
    query: str,
    payload: DiscoveryRequest,
    limit: int = 50,
    session: AsyncSession = Depends(get_session)
):
    """Tier 1: Streamed Discovery across LinkedIn, Indeed, Glassdoor."""
    locations = payload.locations
    logger.info(f"V2 Streamed Discovery Started: {query} in {locations}")

    async def stream_results():
        # NDJSON format: One JSON object per line, no surrounding array
        # This is much easier and more robust for the frontend to parse
        
        # We'll use a local active campaign check for scoring
        campaign = None
        try:
            from sqlalchemy.future import select as fselect
            res = await session.execute(fselect(Campaign).where(Campaign.is_active == True))
            campaign = res.scalars().first()
        except Exception as e:
            logger.debug(f"Campaign fetch failed for scoring: {e}")

        async for job in discovery_service.search_jobs(query, locations, limit, payload.filters, session):
            # Check if job already exists in DB
            existing_job = await session.get(Job, job.id)
            is_new = existing_job is None
            
            # Auto-score if possible
            if campaign:
                try:
                    from app.services.scoring import scoring_service
                    profile = f"Role: {campaign.target_role}, Tech: {campaign.tech_stack}"
                    score_data = await scoring_service.score_job(
                        session=session,
                        job_title=job.job_title,
                        company_name=job.company_name,
                        candidate_profile=profile
                    )
                    job.relevance_score = int(score_data.get("overall_score", 0) * 100)
                except Exception as score_err:
                    logger.debug(f"Scoring failed for {job.job_title}: {score_err}")

            # Yield to client with 'is_new' status
            job_dict = json.loads(job.json())
            job_dict["is_new"] = is_new
            
            # NDJSON: JSON + Newline
            yield json.dumps(job_dict) + "\n"

    return StreamingResponse(stream_results(), media_type="application/x-ndjson")

@router.post("/optimize/{job_id}")
async def optimize_application(
    job_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Tier 2 & 3: Structured Parsing + Recursive Self-Healing Tailor."""
    job = await session.get(Job, job_id)
    if not job: raise HTTPException(status_code=404, detail="Job not found")
    
    # 1. Parse JD if not already structured
    result = await discovery_service.parse_job_description(job.source_url)
    profile = result["profile"]
    if not job.description:
        job.description = result["raw_text"]
        session.add(job)
    
    # 2. Get base resume from MasterResume
    master_resume = await session.get(MasterResume, 1)
    if not master_resume:
        raise HTTPException(
            status_code=400, 
            detail="Please import your resume first"
        )
    base_resume = master_resume.parsed_json
    
    # 3. Recursive Loop: Tailor -> Score -> Heal
    result = await tailor_service.optimize_resume(base_resume, profile)
    
    # 4. Save best variant with content
    variant = ResumeVariant(
        job_id=job.id,
        filename=f"version_{result['best_score']}.json",
        content=json.dumps(result["final_resume"]),
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
        "history": [h["score"] for h in result["version_history"]],
        "tailored_resume": result["final_resume"]
    }

@router.post("/apply/{job_id}")
async def apply_to_job(job_id: str, session: AsyncSession = Depends(get_session)):
    """
    Tier 4: The 'Closer' — Now powered by Multi-Agent Orchestration.
    """
    return await orchestrator.process_job_full_cycle(job_id, session)

@router.post("/batch-apply")
async def batch_apply_to_jobs(job_ids: List[str], session: AsyncSession = Depends(get_session)):
    """
    Tier 5: High-Performance Batch Automation.
    """
    return await orchestrator.process_batch_jobs(job_ids, session)

@router.post("/growth/{job_id}")
async def generate_job_growth_plan(
    job_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Tier 3.1: Generate Learning Subjects and Suggested Projects based on JD gaps."""
    logger.info(f"🚀 V2 Growth Route Triggered for Job: {job_id}")
    job = await session.get(Job, job_id)
    if not job:
        logger.warning(f"❌ Job {job_id} not found in database.")
        raise HTTPException(status_code=404, detail="Job not found")
    
    # 1. Parse JD to JobProfile
    result = await discovery_service.parse_job_description(job.source_url)
    profile = result["profile"]
    if not job.description:
        job.description = result["raw_text"]
    
    # 2. Get base resume (simplified: fetching first version)
    # In a real app, this would be the user's primary/master resume json
    base_resume = {"basics": {"name": "User", "label": "Full Stack Developer"}, "sections": {}} 
    
    # 3. Generate Growth Plan
    growth_data = await ats_engine.generate_growth_plan(profile, base_resume)
    
    # 4. Save to Job table
    job.study_guide = growth_data
    session.add(job)
    await session.commit()
    await session.refresh(job)
    
    return growth_data

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

@router.get("/resumes/master")
async def get_master_resume(session: AsyncSession = Depends(get_session)):
    """Fetch the single active MasterResume for the Profiling page."""
    resume = await session.get(MasterResume, 1)
    if not resume:
        return {"id": None, "status": "empty", "message": "No master resume found"}
    return resume

@router.post("/resumes/import")
async def import_resume(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session)
):
    """Tier 2: Universal Parser (PDF -> Structured JSON -> MasterResume)."""
    logger.info(f"🚀 Import Triggered for file: {file.filename}")
    
    # 1. Read file
    content = await file.read()
    
    if file.filename.endswith(".pdf"):
        import pypdf
        import io
        pdf = pypdf.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf.pages:
            text += page.extract_text() or ""
    else:
        # content is bytes, decode to string
        text = content.decode("utf-8", errors="ignore")
        
    # 2. Parse via LLM
    structured_json = await resume_parser.parse_text_to_json(text)
    
    # 3. Overwrite the single active master resume
    existing_resume = await session.get(MasterResume, 1)
    now = datetime.utcnow()

    if existing_resume:
        existing_resume.filename = file.filename
        existing_resume.raw_text = text
        existing_resume.parsed_json = structured_json
        existing_resume.updated_at = now
        master_resume = existing_resume
    else:
        master_resume = MasterResume(
            id=1,
            filename=file.filename,
            raw_text=text,
            parsed_json=structured_json,
            created_at=now,
            updated_at=now,
        )
        session.add(master_resume)

    await session.commit()
    await session.refresh(master_resume)

    return {
        "id": master_resume.id,
        "filename": file.filename,
        "message": "Master resume imported successfully",
        "uploaded_at": master_resume.updated_at.isoformat(),
        "resume": master_resume.parsed_json
    }
@router.post("/jobs/{job_id}/sync")
async def sync_job_description(job_id: str, session: AsyncSession = Depends(get_session)):
    """Background sync for missing job descriptions."""
    job = await session.get(Job, job_id)
    if not job: raise HTTPException(status_code=404, detail="Job not found")

    result = await discovery_service.parse_job_description(job.source_url)
    job.description = result["raw_text"]
    
    session.add(job)
    await session.commit()
    await session.refresh(job)
    return job
