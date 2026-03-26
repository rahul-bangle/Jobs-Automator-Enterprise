import asyncio
import logging
import pandas as pd
from jobspy import scrape_jobs
from scrapling.fetchers import AsyncStealthySession

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ScraperDebug")

async def test_jobspy(query, location):
    logger.info(f"--- Testing JobSpy: {query} in {location} ---")
    try:
        results = scrape_jobs(
            site_name=["linkedin", "indeed", "glassdoor", "google"],
            search_term=query,
            location=f"{location}, India",
            results_wanted=10,
            hours_old=72,
            country_indeed="india"
        )
        if results is not None and not results.empty:
            logger.info(f"JobSpy found {len(results)} roles.")
            print(results[['title', 'company', 'location', 'site']])
        else:
            logger.warning("JobSpy found 0 roles.")
    except Exception as e:
        logger.error(f"JobSpy failed: {e}")

async def test_scrapling_indeed(query, location):
    logger.info(f"--- Testing Scrapling Indeed: {query} in {location} ---")
    base_domain = "in.indeed.com"
    url = f"https://{base_domain}/jobs?q={query.replace(' ', '+')}&l={location.replace(' ', '+')}"
    
    try:
        async with AsyncStealthySession(headless=True) as session:
            page = await session.fetch(url)
            job_cards = page.css('.job_seen_atlas') or page.css('.result') or page.css('.job-card-container')
            if job_cards:
                logger.info(f"Scrapling found {len(job_cards)} cards.")
                for i, card in enumerate(job_cards[:3]):
                    title = card.css('h2.jobTitle span::text').get() or card.css('.jobTitle::text').get()
                    company = card.css('.companyName::text').get() or card.css('[data-testid="company-name"]::text').get()
                    loc = card.css('.companyLocation::text').get() or card.css('[data-testid="text-location"]::text').get()
                    print(f"Row {i}: {title} @ {company} in {loc}")
            else:
                logger.warning("Scrapling found 0 cards.")
    except Exception as e:
        logger.error(f"Scrapling failed: {e}")

if __name__ == "__main__":
    q = "Associate Product Manager"
    l = "Hyderabad"
    asyncio.run(test_jobspy(q, l))
    asyncio.run(test_scrapling_indeed(q, l))
