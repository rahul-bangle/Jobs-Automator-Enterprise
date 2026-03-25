import asyncio
from typing import List, Optional
from datetime import datetime
import json
import os
from pydantic import BaseModel

# Optional heavy dependencies — server boots even if these are missing
try:
    from jobspy import scrape_jobs
    JOBSPY_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ WARNING: jobspy not available ({e}). Discovery will be disabled.")
    JOBSPY_AVAILABLE = False
    scrape_jobs = None

try:
    from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
    CRAWL4AI_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ WARNING: crawl4ai not available ({e}). Parsing will be mocked.")
    CRAWL4AI_AVAILABLE = False
    AsyncWebCrawler = None

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

    @property
    def crawler(self):
        if self._crawler is None:
            self._crawler = AsyncWebCrawler()
        return self._crawler

    async def search_jobs(self, query: str, locations: List[str], limit: int = 10) -> List[Job]:
        """
        JobSpy: Aggregate jobs from LinkedIn, Indeed, Glassdoor
        """
        print(f"Searching for: {query} in {locations}...")
        results = scrape_jobs(
            site_name=["linkedin", "indeed", "glassdoor"],
            search_term=query,
            location=locations[0] if locations else "Remote",
            results_wanted=limit,
            hours_old=24,
            country_indeed="usa",  # FIXED: was country_裁e (broken unicode)
        )

        jobs = []
        for index, row in results.iterrows():
            job_id = Job.generate_id(
                str(row.get('company', 'unknown')),
                str(row.get('title', 'unknown')),
                str(row.get('location', 'remote'))
            )
            job = Job(
                id=job_id,
                company_name=str(row.get('company', 'Unknown')),
                job_title=str(row.get('title', 'Unknown')),
                source_url=str(row.get('job_url', '')),
                location=str(row.get('location', 'Remote')),
                description=str(row.get('description', '')),
                salary_extracted=(
                    f"{row.get('min_amount')}-{row.get('max_amount')} {row.get('currency')}"
                    if row.get('min_amount') else "N/A"
                ),
                discovery_date=datetime.utcnow()
            )
            jobs.append(job)

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
