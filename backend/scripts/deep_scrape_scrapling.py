import asyncio
import sys
import hashlib
from scrapling.fetchers import AsyncStealthySession
from app.models.base import Job
from app.core.db import async_session_maker
from sqlalchemy import select

async def scrape_with_scrapling(search_query: str, max_pages: int = 10):
    """
    Pro Max Adaptive Scraper using Scrapling (D4Vinci) - Targeting Indeed
    """
    print(f"Starting Indeed Adaptive Scrape for: {search_query}")
    
    all_jobs = []
    
    # Use AsyncStealthySession for native asyncio support
    async with AsyncStealthySession(headless=True) as session:
        for p_idx in range(max_pages):
            # Indeed pagination is start=0, 10, 20...
            start_val = p_idx * 10
            url = f"https://www.indeed.com/jobs?q={search_query.replace(' ', '+')}&start={start_val}"
            
            print(f"Fetching Indeed Page {p_idx + 1}... ({url})")
            page = await session.fetch(url)
            
            # Indeed CSS Selectors (Common patterns)
            job_cards = page.css('.job_seen_atlas') or page.css('.result') or page.css('.job-card-container')
            
            if not job_cards:
                print(f"No job cards found on page {p_idx + 1}. Checking for block or end of results.")
                # Diagnostic screenshot
                try:
                    await session.page.screenshot(path=f"debug_indeed_p{p_idx+1}.png")
                    print(f"Debug screenshot saved as debug_indeed_p{p_idx+1}.png")
                except:
                    pass
                break
                
            for card in job_cards:
                try:
                    # Title
                    title = (card.css('h2.jobTitle span::text').get() or 
                             card.css('.jobTitle::text').get() or "").strip()
                    
                    # Company
                    company = (card.css('.companyName::text').get() or 
                               card.css('[data-testid="company-name"]::text').get() or 
                               card.css('.company_location [data-testid="company-name"]::text').get() or "").strip()
                    
                    # Location
                    location = (card.css('.companyLocation::text').get() or 
                                card.css('[data-testid="text-location"]::text').get() or "Remote").strip()
                    
                    # Link (Indeed uses relative links usually)
                    link_raw = (card.css('a.jcs-JobTitle::attr(href)').get() or 
                                card.css('a::attr(href)').get())
                    
                    if link_raw:
                        if link_raw.startswith('/'):
                            link = f"https://www.indeed.com{link_raw}"
                        else:
                            link = link_raw
                    else:
                        link = ""

                    if title and company and link:
                        all_jobs.append({
                            "title": title,
                            "company": company,
                            "url": link,
                            "location": location
                        })
                except Exception as e:
                    continue
            
            # Random delay
            await asyncio.sleep(5)

    print(f"Extracted {len(all_jobs)} jobs. Committing to DB...")
    
    # Async Persistence
    async with async_session_maker() as db:
        new_count = 0
        for j in all_jobs:
            job_id = Job.generate_id(j['company'], j['title'], j['location'])
            result = await db.execute(select(Job).where(Job.id == job_id))
            existing = result.scalar_one_or_none()
            
            if not existing:
                job = Job(
                    id=job_id,
                    company_name=j['company'],
                    job_title=j['title'],
                    source_url=j['url'],
                    location=j['location'],
                    site="Indeed"
                )
                db.add(job)
                new_count += 1
        
        await db.commit()
    
    print(f"Done! Stored {new_count} new jobs in the database.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        # Default query if none provided
        target_query = "associate product manager"
    else:
        target_query = sys.argv[1]
    
    m_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    asyncio.run(scrape_with_scrapling(target_query, m_pages))
