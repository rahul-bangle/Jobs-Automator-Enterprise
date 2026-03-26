import asyncio
import sys
import os

# Set up path to import app modules
sys.path.append(os.getcwd())

from app.services.pipeline_v2 import DiscoveryEngine

async def run_verify():
    engine = DiscoveryEngine()
    query = "Associate Product Manager"
    # Testing with Hyderabad (India)
    location = ["Hyderabad, Telangana, India"]
    
    print(f"--- Starting Discovery Stream for {query} in {location} ---")
    count = 0
    try:
        async for job in engine.search_jobs(query, location, limit=5):
            count += 1
            print(f"[{count}] {job.job_title} @ {job.company_name}")
            print(f"    Location: {job.location}")
            print(f"    Site: {job.site}")
            print("-" * 30)
    except Exception as e:
        print(f"Stream failed: {e}")
    
    if count == 0:
        print("No jobs found. Check logs for scraping details.")
    else:
        print(f"Successfully streamed {count} jobs.")

if __name__ == "__main__":
    asyncio.run(run_verify())
