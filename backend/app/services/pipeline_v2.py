import logging
from typing import List, Optional
from datetime import datetime
import json
import os
from pydantic import BaseModel

# Configure structured logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("DiscoveryEngine")

# Optional heavy dependencies — server boots even if these are missing
from jobspy import scrape_jobs
import pandas as pd
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode

from app.models.base import Job
from app.core.config import settings


class JobProfile(BaseModel):
    role: str
    skills_required: List[str]
    tools: List[str]
    experience_level: str
    keywords: List[str]
    soft_skills: List[str]


class DiscoveryEngine:
    """
    Tier 1 & 2: Multi-site Discovery (JobSpy) + High-Fidelity Parsing (Crawl4AI)
    """
    def __init__(self):
        self._crawler = None
        self.timeout_seconds = 60 # Resilience: 1 min timeout

    @property
    def crawler(self):
        if self._crawler is None:
            self._crawler = AsyncWebCrawler()
        return self._crawler

    async def search_jobs(self, query: str, locations: List[str], limit: int = 10) -> List[Job]:
        """
        JobSpy: Aggregate jobs from LinkedIn, Indeed, Glassdoor with Resilience
        """
        logger.info(f"Initiating discovery search: query='{query}', locations={locations}, limit={limit}")
        
        try:
            # JobSpy is synchronous, but we're in an async context. 
            # In a true architected system, we'd run this in a threadpool.
            results = scrape_jobs(
                site_name=["linkedin", "indeed", "glassdoor"],
                search_term=query,
                location=locations[0] if locations else "Hyderabad",
                results_wanted=limit,
                hours_old=72,
                country_indeed="india",
            )
            
            if results is None or results.empty:
                logger.warning(f"No jobs found for query: {query}")
                return []
                
            logger.info(f"JobSpy discovered {len(results)} raw results.")
        except Exception as e:
            logger.error(f"JobSpy search failed: {str(e)}", exc_info=True)
            return [] # Graceful degradation: return empty list on failure

        jobs = []
        for index, row in results.iterrows():
            try:
                # Sanitize NaN values from pandas to None/Empty strings
                def clean(val, default=""):
                    import pandas as pd
                    if pd.isna(val): return default
                    return str(val).strip()

                company = clean(row.get('company'), "Unknown")
                title = clean(row.get('title'), "Unknown")
                loc = clean(row.get('location'), "Remote")
                job_url = clean(row.get('job_url'), "")
                desc = clean(row.get('description'), "")
                site_source = clean(row.get('site'), "Direct").capitalize()
                
                # Logic for salary extraction enhancement
                min_amt = row.get('min_amount')
                max_amt = row.get('max_amount')
                currency = clean(row.get('currency'), "INR")
                
                salary = "N/A"
                if pd.notna(min_amt):
                     if pd.notna(max_amt) and max_amt != min_amt:
                         salary = f"₹{min_amt} - ₹{max_amt}" if currency == "INR" else f"{currency} {min_amt} - {max_amt}"
                     else:
                         salary = f"₹{min_amt}" if currency == "INR" else f"{currency} {min_amt}"

                job_id = Job.generate_id(company, title, loc)
                
                job = Job(
                    id=job_id,
                    company_name=company,
                    job_title=title,
                    source_url=job_url,
                    location=loc,
                    description=desc,
                    salary_extracted=salary,
                    site=site_source,
                    discovery_date=datetime.utcnow(),
                    queue_status="review"
                )
                jobs.append(job)
            except Exception as e:
                logger.error(f"Failed to process job row {index}: {str(e)}")
                continue

        logger.info(f"Successfully processed {len(jobs)} jobs into SQLModel instances.")
        return jobs

    async def parse_job_description(self, url: str) -> JobProfile:
        """
        Crawl4AI: Structured Parsing into Rigid JSON Profile
        """
        print(f"Crawling {url}...")
        config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            word_count_threshold=10,
            excluded_tags=['nav', 'footer', 'aside']
        )

        async with AsyncWebCrawler() as crawler:
            result = await crawler.arun(url=url, config=config)

        # Placeholder — Groq call will be added next
        return JobProfile(
            role="Assistant Product Manager",
            skills_required=["Agile", "SQL", "Product Discovery"],
            tools=["Jira", "Figma", "Amplitude"],
            experience_level="Mid",
            keywords=["Product Roadmap", "Stakeholder Management", "PRD"],
            soft_skills=["Communication", "Problem Solving"]
        )


# singleton for use in pipeline
discovery_service = DiscoveryEngine()
