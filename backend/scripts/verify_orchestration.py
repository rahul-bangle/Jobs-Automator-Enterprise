import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.orchestrator import orchestrator
from app.core.db import engine
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import Job
from sqlmodel import select

async def verify_orchestration():
    print("[TEST] Testing Multi-Agent Orchestration Flow...")
    async with AsyncSession(engine) as session:
        # 1. Find a test job
        stmt = select(Job).limit(1)
        job = (await session.execute(stmt)).scalars().first()
        
        if not job:
            print("[ERROR] No jobs found to test.")
            return

        print(f"[INFO] Testing on Job: {job.job_title} ({job.id})")
        
        # 2. Run Flow
        result = await orchestrator.process_job_full_cycle(job.id, session)
        
        print("\n✅ Orchestration Protocol Analysis:")
        print(f"Status: {result.get('status')}")
        
        data = result.get('orchestration_data', {})
        print(f"Score Agent: {data.get('score', {}).get('score')}%")
        print(f"Tailor Agent: {data.get('tailoring', {}).get('status')}")
        print(f"Submission Agent: {data.get('submission', {}).get('message')}")
        
        if result.get("status") == "completed":
            print("\n🌟 MISSION SUCCESS: Multi-Agent coordination verified.")
        else:
            print(f"\n⚠️ MISSION PARTIAL: {result.get('error')}")

if __name__ == "__main__":
    asyncio.run(verify_orchestration())
