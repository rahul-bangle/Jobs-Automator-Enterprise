import asyncio
import logging
import sys
from datetime import datetime

# Adjust path to import app modules
sys.path.append("d:/Projects/Workspaces/job automatic appllications/backend")

from app.services.pipeline_v2 import DiscoveryEngine
from app.models.base import Job

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TestDiscovery")

async def test_search():
    engine = DiscoveryEngine()
    query = "Full Stack Developer"
    location = "Hyderabad"
    limit = 10
    
    print(f"--- Starting Isolated Discovery Test ---")
    print(f"Query: {query}")
    print(f"Location: {location}")
    print(f"Time: {datetime.now()}")
    
    found_count = 0
    async for job in engine.search_jobs(query, [location], limit):
        print(f"MATCH FOUND: [{job.site}] {job.job_title} @ {job.company_name} ({job.location})")
        found_count += 1
    
    print(f"--- Test Finished ---")
    print(f"Total Results: {found_count}")

if __name__ == "__main__":
    asyncio.run(test_search())
