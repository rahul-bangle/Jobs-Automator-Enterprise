import asyncio
from playwright.async_api import async_playwright
import json
from app.models.base import Job
from app.db.session import SessionLocal
import hashlib

async def deep_scrape_linkedin(search_query: str, max_pages: int = 20):
    """
    Industrial Deep Scraper for LinkedIn (Headless Console Version)
    """
    async with async_playwright() as p:
        # 1. Launch Headless Browser
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        )
        
        page = await context.new_page()
        
        # 2. Load LinkedIn (Assumes existing search URL or constructs one)
        url = f"https://www.linkedin.com/jobs/search/?keywords={search_query.replace(' ', '%20')}&location=India"
        print(f"🚀 Navigating to: {url}")
        await page.goto(url)
        await page.wait_for_timeout(3000)
        
        all_jobs = []
        
        for p_idx in range(1, max_pages + 1):
            print(f"📄 Scraping Page {p_idx}...")
            
            # 3. Extract Job Cards
            jobs = await page.query_selector_all(".job-card-container")
            for job in jobs:
                title_elem = await job.query_selector(".job-card-list__title")
                company_elem = await job.query_selector(".job-card-container__primary-description")
                link_elem = await job.query_selector("a.job-card-list__title")
                
                if title_elem and company_elem and link_elem:
                    all_jobs.append({
                        "title": (await title_elem.inner_text()).strip(),
                        "company": (await company_elem.inner_text()).strip(),
                        "url": await link_elem.get_attribute("href")
                    })
            
            # 4. Handle Pagination (Click 'Next')
            next_button = await page.query_selector(f"button[aria-label='Page {p_idx + 1}']")
            if next_button:
                await next_button.click()
                await page.wait_for_timeout(2000) # Randomized human delay
            else:
                print("🛑 No more pages found.")
                break
                
        print(f"✅ Found {len(all_jobs)} jobs. Saving to database...")
        
        # 5. Database Persistence
        db = SessionLocal()
        for j_data in all_jobs:
            job_id = Job.generate_id(j_data['company'], j_data['title'], "India")
            existing = db.query(Job).filter(Job.id == job_id).first()
            if not existing:
                job = Job(
                    id=job_id,
                    company_name=j_data['company'],
                    job_title=j_data['title'],
                    source_url=j_data['url'],
                    location="India",
                    site="LinkedIn"
                )
                db.add(job)
        db.commit()
        db.close()
        
        await browser.close()

if __name__ == "__main__":
    import sys
    query = sys.argv[1] if len(sys.argv) > 1 else "Product Manager"
    asyncio.run(deep_scrape_linkedin(query))
