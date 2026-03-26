import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.pipeline_v2 import discovery_service

async def reproduce():
    # Exactly what the user was searching for
    query = "Associate Product Manager"
    locations = ["Hyderabad, Telangana, India"]
    limit = 5
    
    print(f"--- REPRODUCTION TEST ---")
    print(f"Query: {query}")
    print(f"Location: {locations[0]}")
    
    # Check Refinement
    refined = await discovery_service._refine_query(query)
    print(f"Refined Query: {refined}")
    
    try:
        count = 0
        print("\nStarting Discovery Fetch...")
        async for job in discovery_service.search_jobs(query, locations, limit):
            print(f"[{job.site}] Found: {job.job_title} @ {job.company_name} ({job.location})")
            count += 1
            if count >= limit:
                break
        
        print(f"\nTotal jobs found: {count}")
            
    except Exception as e:
        print(f"Error during reproduction: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(reproduce())
