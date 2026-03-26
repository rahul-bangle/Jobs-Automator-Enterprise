import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.pipeline_v2 import discovery_service

async def test_discovery():
    query = "Python Developer"
    locations = ["India"]
    limit = 2
    
    print(f"Testing discovery for '{query}' in {locations}...")
    
    try:
        count = 0
        async for job in discovery_service.search_jobs(query, locations, limit):
            print(f"Found Job: {job.job_title} at {job.company_name}")
            count += 1
            if count >= limit:
                break
        
        if count > 0:
            print(f"Success: Found {count} jobs.")
        else:
            print("Warning: No jobs found, but no crash occurred.")
            
    except AttributeError as e:
        print(f"AttributeError detected: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_discovery())
