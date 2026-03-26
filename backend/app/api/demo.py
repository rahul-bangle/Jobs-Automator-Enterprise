from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict
from app.core.db import get_db
from app.models.base import Job
from app.services.tailor_engine_v2 import tailor_service
from app.services.pipeline_v2 import discovery_service, JobProfile

router = APIRouter(prefix="/demo", tags=["demo"])

@router.get("/job/{job_id}")
async def get_demo_job(job_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch real job data for the demo."""
    result = await db.execute(select(Job).filter(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/optimize")
async def optimize_demo(payload: Dict, db: AsyncSession = Depends(get_db)):
    """Trigger the real TailorEngineV2 loop."""
    job_id = payload.get("job_id")
    job_desc = payload.get("description")
    job_title = payload.get("job_title")

    # 1. Create a JobProfile
    # In a real scenario, we'd use discovery_service.parse_job_description
    # For the speed of the demo, we'll use a semi-mocked profile based on the description
    profile = JobProfile(
        role=job_title or "Target Role",
        skills_required=["Sales", "Operations", "Management"],
        tools=["Excel", "CRM"],
        experience_level="Mid-Level",
        keywords=["Revenue", "Efficiency"],
        soft_skills=["Leadership"]
    )

    # 2. Base Resume (Mocked for Demo)
    base_resume = {
        "basics": {
            "name": "Rahul Bangle",
            "label": "Full Stack Developer",
            "summary": "Experienced professional looking for a transition."
        },
        "sections": {
            "experience": "Lead Developer with experience in automation.",
            "skills": ["Python", "JavaScript"]
        }
    }

    # 3. Run Optimization
    result = await tailor_service.optimize_resume(base_resume, profile, max_iterations=2)
    return result
