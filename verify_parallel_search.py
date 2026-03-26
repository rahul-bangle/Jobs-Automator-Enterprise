import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.pipeline_v2 import discovery_service

async def test_parallel_search():
    print("Testing Parallel Search (JobSpy + Scrapling)...")
    query = "Software Engineer"
    locations = ["Hyderabad"]
    limit = 6
    
    jobs = await discovery_service.search_jobs(query, locations, limit)
    
    print(f"\nTotal Unique Jobs found: {len(jobs)}")
    
    scrapling_count = 0
    jobspy_count = 0
    
    for idx, job in enumerate(jobs):
        print(f"{idx+1}. [{job.site}] {job.job_title} @ {job.company_name} ({job.location})")
        if "Scrapling" in job.site:
            scrapling_count += 1
        else:
            jobspy_count += 1
            
    print(f"\nStats: JobSpy={jobspy_count}, Scrapling={scrapling_count}")
    
    if len(jobs) > 0:
        print("\n✅ Verification PASSED: Results retrieved successfully.")
    else:
        print("\n❌ Verification FAILED: No results found.")

if __name__ == "__main__":
    asyncio.run(test_parallel_search())
