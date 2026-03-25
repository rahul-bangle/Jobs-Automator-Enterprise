import asyncio
from typing import List, Optional
from datetime import datetime
import json
import os
from pydantic import BaseModel
from jobspy import scrape_jobs
from crawl4ai import WebCrawler, CrawlerRunConfig, CacheMode
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
            self._crawler = WebCrawler()
            self._crawler.warmup()
        return self._crawler

    async def search_jobs(self, query: str, locations: List[str], limit: int = 10) -> List[Job]:
        """
        JobSpy: Aggregate jobs from LinkedIn, Indeed, Glassdoor
        """
        print(f"🛰️ Searching for: {query} in {locations}...")
        results = scrape_jobs(
            site_name=["linkedin", "indeed", "glassdoor"],
            search_term=query,
            location=locations[0] if locations else "Remote",
            results_wanted=limit,
            hours_old=24, # Freshness check
            country_裁e="usa", # Default
        )
        
        jobs = []
        for index, row in results.iterrows():
            job_id = Job.generate_id(row['company'], row['title'], row['location'])
            job = Job(
                id=job_id,
                company_name=row['company'],
                job_title=row['title'],
                source_url=row['job_url'],
                location=row['location'] or "Remote",
                description=row['description'] or "",
                salary_extracted=f"{row['min_amount']}-{row['max_amount']} {row['currency']}" if row['min_amount'] else "N/A",
                discovery_date=datetime.utcnow()
            )
            jobs.append(job)
        
        return jobs

    async def parse_job_description(self, url: str) -> JobProfile:
        """
        Crawl4AI: Structured Parsing into Rigid JSON Profile
        """
        print(f"🕷️ Crawling {url}...")
        config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            word_count_threshold=10,
            excluded_tags=['nav', 'footer', 'aside']
        )
        
        result = await self.crawler.arun(url=url, config=config)
        
        # NOTE: We'll use Groq to transform the Crawl4AI markdown into our JobProfile schema
        # For now, implementing the prompt infrastructure
        prompt = f"""
        Extract the following structured JSON from this job description:
        {result.markdown_v2.raw_markdown}
        
        Schema:
        {{
            "role": "Exact title",
            "skills_required": ["List of core technical skills"],
            "tools": ["Software/Systems mentioned"],
            "experience_level": "Entry/Mid/Senior",
            "keywords": ["Top 10 ATS keywords"],
            "soft_skills": ["Critical soft skills"]
        }}
        """
        # [Placeholder for Groq API call - integrating with existing llm service next]
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
