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
from groq import Groq
import asyncio
from concurrent.futures import ThreadPoolExecutor

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
        self.executor = ThreadPoolExecutor(max_workers=3)
        self._groq = None

    @property
    def groq(self):
        if self._groq is None:
            if not settings.GROQ_API_KEY:
                logger.error("GROQ_API_KEY is not set. JD Parsing will fail.")
            self._groq = Groq(api_key=settings.GROQ_API_KEY)
        return self._groq

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
            # JobSpy is synchronous, running in threadpool for resilience
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(
                self.executor,
                lambda: scrape_jobs(
                    site_name=["linkedin", "indeed", "glassdoor"],
                    search_term=query,
                    location=locations[0] if locations else "Hyderabad",
                    results_wanted=limit,
                    hours_old=72,
                    country_indeed="india",
                )
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
        Crawl4AI: Structured Parsing into Rigid JSON Profile (with Fallback for Windows)
        """
        logger.info(f"Parsing Job Description at {url}")
        html_content = ""
        
        try:
            # Attempt with Crawl4AI (Best fidelity)
            config = CrawlerRunConfig(
                cache_mode=CacheMode.BYPASS,
                word_count_threshold=10,
                excluded_tags=['nav', 'footer', 'aside']
            )
            async with AsyncWebCrawler() as crawler:
                result = await crawler.arun(url=url, config=config)
                html_content = result.markdown
        except Exception as e:
            # Persistent Fallback for Windows asyncio issues (NotImplementedError)
            logger.warning(f"Crawl4AI failed or inhibited. Using Requests/BeautifulSoup fallback. Error: {str(e)}")
            import requests
            from bs4 import BeautifulSoup
            try:
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
                response = requests.get(url, timeout=15, headers=headers)
                soup = BeautifulSoup(response.text, 'html.parser')
                for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
                    tag.decompose()
                html_content = soup.get_text(separator=' ', strip=True)
            except Exception as re:
                logger.error(f"Fallback parser failed for {url}: {str(re)}")
                return JobProfile(role="Error Parsing", skills_required=[], tools=[], experience_level="N/A", keywords=[], soft_skills=[])

        # Tier 2: Groq High-Fidelity Extraction
        logger.info(f"Extracting structured profile from text (Sample: {html_content[:50]}...)")
        prompt = f"""Extract a structured JSON profile from this Job Description.
        
        JD TEXT:
        {html_content}
        
        Return ONLY valid JSON in this format:
        {{
          "role": "Full Job Title",
          "skills_required": ["Skill 1", "Skill 2"],
          "tools": ["Tool 1", "Tool 2"],
          "experience_level": "Entry/Mid/Senior",
          "keywords": ["Domain Keyword 1", "Keyword 2"],
          "soft_skills": ["Skill 1"]
        }}"""

        try:
            completion = self.groq.chat.completions.create(
                model=settings.GROQ_BATCH_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            data = json.loads(completion.choices[0].message.content)
            return JobProfile(**data)
        except Exception as e:
            logger.error(f"JD Parsing failed: {str(e)}")
            # Fallback to generic profile
            return JobProfile(
                role="Unknown Role",
                skills_required=[],
                tools=[],
                experience_level="Unknown",
                keywords=[],
                soft_skills=[]
            )


# singleton for use in pipeline
discovery_service = DiscoveryEngine()
