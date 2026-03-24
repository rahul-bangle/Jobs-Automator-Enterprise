"""
Learning Gate & Application Packets — Phase B6 + B7
The hard stop before any submission can occur.

State machine:
  job accepted → packet created → user approves → ready_to_apply → (BrowserUse)

The gate CANNOT be bypassed programmatically. approval_status must be 'approved'
before any submission endpoint is permitted to run.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_session
from app.models.base import Job, ApplicationPacket
from typing import Optional

router = APIRouter()


@router.post("/create/{job_id}")
async def create_packet(job_id: str, session: AsyncSession = Depends(get_session)):
    """
    Build an application packet for an accepted job.
    Packet starts in 'pending_review' — user MUST approve before apply.
    """
    job = await session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.queue_status not in ("accepted",):
        raise HTTPException(
            status_code=400,
            detail=f"Only accepted jobs can have packets. Current status: {job.queue_status}"
        )

    # Check if packet already exists
    existing = await session.execute(
        select(ApplicationPacket).where(ApplicationPacket.job_id == job_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Packet already exists for this job")

    packet = ApplicationPacket(
        job_id=job_id,
        approval_status="pending_review",
        warnings=f"Trust score: {job.trust_score}/100 | {job.risk_flags}"
    )
    session.add(packet)

    # Advance job state
    job.queue_status = "packet_created"
    session.add(job)

    await session.commit()
    await session.refresh(packet)

    return {
        "packet_id": packet.id,
        "job_id": job_id,
        "approval_status": packet.approval_status,
        "message": "Packet created. Awaiting user approval before apply is permitted."
    }


@router.patch("/approve/{packet_id}")
async def approve_packet(packet_id: str, session: AsyncSession = Depends(get_session)):
    """
    USER explicitly approves a packet. This is the Learning Gate checkpoint.
    After approval, the job transitions to 'ready_to_apply'.
    """
    packet = await session.get(ApplicationPacket, packet_id)
    if not packet:
        raise HTTPException(status_code=404, detail="Packet not found")

    if packet.approval_status == "approved":
        raise HTTPException(status_code=409, detail="Packet already approved")

    packet.approval_status = "approved"
    session.add(packet)

    # Update job state to ready
    job = await session.get(Job, packet.job_id)
    if job:
        job.queue_status = "ready_to_apply"
        session.add(job)

    await session.commit()

    return {
        "packet_id": packet_id,
        "approval_status": "approved",
        "job_id": packet.job_id,
        "message": "✅ Learning Gate cleared. Job is now ready to apply."
    }


@router.patch("/reject/{packet_id}")
async def reject_packet(packet_id: str, reason: Optional[str] = None, session: AsyncSession = Depends(get_session)):
    """USER rejects a packet — job goes back to review."""
    packet = await session.get(ApplicationPacket, packet_id)
    if not packet:
        raise HTTPException(status_code=404, detail="Packet not found")

    packet.approval_status = "rejected"
    session.add(packet)

    job = await session.get(Job, packet.job_id)
    if job:
        job.queue_status = "review"
        session.add(job)

    await session.commit()
    return {"packet_id": packet_id, "approval_status": "rejected", "reason": reason}


@router.get("/list")
async def list_packets(session: AsyncSession = Depends(get_session)):
    """List all packets and their approval status."""
    result = await session.execute(select(ApplicationPacket))
    packets = result.scalars().all()
    return [
        {
            "packet_id": p.id,
            "job_id": p.job_id,
            "approval_status": p.approval_status,
            "warnings": p.warnings
        }
        for p in packets
    ]
