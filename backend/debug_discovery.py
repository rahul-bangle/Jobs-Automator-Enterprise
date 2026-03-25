import asyncio
import os
import sys

# Add the current directory to sys.path to allow imports from 'app'
sys.path.append(os.getcwd())

from app.services.pipeline_v2 import discovery_service
from app.models.base import Job
from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

async def debug_search():
    print("Starting debug search...")
    query = "assistant product manager"
    locations = ["hyderabad"]
    limit = 2
    
    try:
        jobs = await discovery_service.search_jobs(query, locations, limit)
        print(f"Discovered {len(jobs)} jobs.")
        
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with async_session() as session:
            for job in jobs:
                print(f"Processing job: {job.job_title} at {job.company_name} (Site: {job.site})")
                await session.merge(job)
            await session.commit()
            print("DB Commit successful.")
            
    except Exception as e:
        import traceback
        print("Crashed during search or DB commit:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_search())
