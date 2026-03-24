from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func
from app.core.db import get_session
from app.models.base import Job
from typing import List, Optional

router = APIRouter()

@router.get("/", response_model=List[Job])
async def read_jobs(
    session: AsyncSession = Depends(get_session),
    offset: int = 0,
    limit: int = 100,
    status: Optional[str] = None
):
    statement = select(Job)
    if status:
        statement = statement.where(Job.queue_status == status)
    
    result = await session.execute(statement.offset(offset).limit(limit))
    return result.scalars().all()

@router.get("/stats")
async def get_job_stats(session: AsyncSession = Depends(get_session)):
    """Return count of jobs by status."""
    statement = select(Job.queue_status, func.count(Job.id)).group_by(Job.queue_status)
    result = await session.execute(statement)
    stats = {row[0]: row[1] for row in result.all()}
    return stats

@router.patch("/{job_id}")
async def update_job_status(
    job_id: str,
    status: str,
    session: AsyncSession = Depends(get_session)
):
    """Manually update a job's status (The Learning Gate)."""
    job = await session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job.queue_status = status
    session.add(job)
    await session.commit()
    await session.refresh(job)
    return job

@router.get("/{job_id}", response_model=Job)
async def read_job(
    job_id: str,
    session: AsyncSession = Depends(get_session)
):
    job = await session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
