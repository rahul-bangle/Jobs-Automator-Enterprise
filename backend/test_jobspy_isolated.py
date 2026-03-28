import asyncio
from jobspy import scrape_jobs
import pandas as pd

async def test_jobspy():
    print("Testing JobSpy (LinkedIn/Indeed/Google)...")
    try:
        results = scrape_jobs(
            site_name=["linkedin", "indeed", "google"],
            search_term="Full Stack Developer",
            location="Hyderabad, India",
            results_wanted=10,
            country_indeed="india"
        )
        if results is None or results.empty:
            print("No jobs found via JobSpy.")
        else:
            print(f"Found {len(results)} jobs via JobSpy.")
            print(results[['title', 'company', 'location', 'site']].head())
    except Exception as e:
        print(f"JobSpy error: {e}")

if __name__ == "__main__":
    asyncio.run(test_jobspy())
