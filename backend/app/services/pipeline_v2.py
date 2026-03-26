import logging
import asyncio
import random
from typing import List, Optional
import traceback
from datetime import datetime
import json
import os
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("DiscoveryEngine")

# Optional heavy deps — server boots even if missing
try:
    from jobspy import scrape_jobs
    import pandas as pd
    JOBSPY_AVAILABLE = True
except ImportError:
    JOBSPY_AVAILABLE = False
    logger.warning("jobspy/pandas not installed. Job scraping disabled.")

try:
    from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
    CRAWL4AI_AVAILABLE = True
except ImportError:
    CRAWL4AI_AVAILABLE = False
    logger.warning("crawl4ai not installed. URL parsing will use fallback.")

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    logger.warning("groq not installed.")

try:
    from scrapling.fetchers import AsyncStealthySession
    SCRAPLING_AVAILABLE = True
except ImportError:
    SCRAPLING_AVAILABLE = False
    logger.warning("scrapling not installed. Deep scraping fallback disabled.")

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
        self._groq = None
        self.timeout_seconds = 30 # Tighter timeout
        self.executor = ThreadPoolExecutor(max_workers=3)

    async def _refine_query(self, query: str) -> str:
        """Fixes typos using Groq to ensure scraping effectiveness."""
        if not self.groq:
            return query
        try:
            prompt = f"Fix any obvious typos and return ONLY the corrected job title: '{query}'"
            completion = self.groq.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            refined = completion.choices[0].message.content.strip().replace("'", "").replace("\"", "")
            logger.info(f"Refined query: '{query}' -> '{refined}'")
            return refined
        except Exception as e:
            logger.debug(f"Query refinement failed: {e}")
            return query

    async def get_suggestions(self, query: str) -> List[str]:
        """AI-powered job title suggestions for autocomplete."""
        if not self.groq:
            return [f"{query} Developer", f"Senior {query}", f"Remote {query}"]
            
        try:
            prompt = (
                f"Based on the input '{query}', provide the 5 most likely professional job titles. "
                "Return ONLY a JSON list of strings."
            )
            completion = self.groq.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            data = json.loads(completion.choices[0].message.content)
            # Find any list in the JSON
            for v in data.values():
                if isinstance(v, list):
                    return [str(x) for x in v][:5]
            return []
        except Exception as e:
            logger.error(f"Suggestions failed: {str(e)}")
            return [f"{query} Developer", f"Senior {query}", f"Lead {query}"]

    @property
    def groq(self):
        if self._groq is None:
            if not GROQ_AVAILABLE:
                logger.warning("Groq not installed. Falling back to default suggestions.")
                return None
            if not settings.GROQ_API_KEY:
                logger.warning("GROQ_API_KEY is not set. AI features disabled.")
                return None
            try:
                from groq import Groq
                self._groq = Groq(api_key=settings.GROQ_API_KEY)
            except Exception as e:
                logger.error(f"Failed to initialize Groq: {e}")
                return None
        return self._groq

    @property
    def crawler(self):
        if self._crawler is None:
            if not CRAWL4AI_AVAILABLE:
                return None
            try:
                from crawl4ai import AsyncWebCrawler
                self._crawler = AsyncWebCrawler()
            except:
                pass
        return self._crawler

    async def fetch_url(self, url: str) -> str:
        """Legacy compatibility (from processor.py): Fetches raw HTML via Requests."""
        import requests
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=15)
        return response.text

    async def process_html(self, html: str) -> str:
        """Legacy compatibility (from processor.py): Cleans HTML into plain text via BeautifulSoup."""
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')
        for tag in soup(['script', 'style', 'nav', 'footer']):
            tag.decompose()
        return soup.get_text(separator=' ', strip=True)

    async def _scrapling_search(self, query: str, location: str, limit: int) -> List[Job]:
        """
        Deep-scrape fallback using Scrapling (Targeting Indeed).
        """
        if not SCRAPLING_AVAILABLE:
            return []

        # Domain customization for India
        is_india = any(x in location.lower() for x in ["india", "hyderabad", "bangalore", "pune", "delhi", "mumbai"])
        base_domain = "in.indeed.com" if is_india else "www.indeed.com"
        
        logger.info(f"Starting Scrapling Indeed ({base_domain}) search for: {query} in {location}")
        scraped_jobs = []
        
        try:
            async with AsyncStealthySession(headless=True) as session:
                # Limit to 1-2 pages for speed in parallel mode
                max_pages = 2 
                for p_idx in range(max_pages):
                    start_val = p_idx * 10
                    url = f"https://{base_domain}/jobs?q={query.replace(' ', '+')}&l={location.replace(' ', '+')}&start={start_val}"
                    
                    page = await session.fetch(url)
                    job_cards = page.css('.job_seen_atlas') or page.css('.result') or page.css('.job-card-container')
                    
                    if not job_cards:
                        break
                        
                    for card in job_cards:
                        try:
                            title = (card.css('h2.jobTitle span::text').get() or 
                                     card.css('.jobTitle::text').get() or "").strip()
                            company = (card.css('.companyName::text').get() or 
                                       card.css('[data-testid="company-name"]::text').get() or "").strip()
                            loc = (card.css('.companyLocation::text').get() or 
                                   card.css('[data-testid="text-location"]::text').get() or location).strip()
                            link_raw = (card.css('a.jcs-JobTitle::attr(href)').get() or 
                                        card.css('a::attr(href)').get())
                            
                            if link_raw:
                                link = f"https://{base_domain}{link_raw}" if link_raw.startswith('/') else link_raw
                            else:
                                continue

                            # Salary Extraction (Wave 2 - Data Quality)
                            salary = (card.css('.salary-snippet-container span::text').get() or 
                                      card.css('.metadata.salary-snippet-container::text').get() or 
                                      card.css('[data-testid="attribute_snippet_testid"]::text').get() or "").strip()

                            if title and company:
                                job_id = Job.generate_id(company, title, loc)
                                logger.info(f"   [Indeed] Found: {title} @ {company}")
                                scraped_jobs.append(Job(
                                    id=job_id,
                                    company_name=company,
                                    job_title=title,
                                    source_url=link,
                                    location=loc,
                                    salary_extracted=salary,
                                    site="Indeed (Scrapling)",
                                    discovery_date=datetime.utcnow(),
                                    queue_status="review"
                                ))
                        except Exception as row_err:
                            logger.debug(f"Row skip: {str(row_err)}")
                            continue
                    
                    if len(scraped_jobs) >= limit:
                        break
                    # FIX 5: Random delay for scraper stealth
                    await asyncio.sleep(random.uniform(0.5, 1.5))
                    
            logger.info(f"Scrapling discovered {len(scraped_jobs)} results.")
        except NotImplementedError:
            logger.warning("Scrapling/Patchright subprocess not supported on this Windows environment. Skipping.")
            return []
        except Exception as e:
            logger.error(f"Scrapling search failed: {str(e)}")
            
        return scraped_jobs[:limit]

    async def _naukri_search(self, query: str, location: str, limit: int) -> List[Job]:
        """
        Naukri.com scraper focused on Indian market.
        Uses Scrapling for stealth and high-fidelity extraction.
        """
        if not SCRAPLING_AVAILABLE:
            return []

        logger.info(f"Starting Scrapling Naukri search for: {query} in {location}")
        scraped_jobs = []
        
        # Naukri's URL structure for search
        # https://www.naukri.com/associate-product-manager-jobs-in-hyderabad
        clean_query = query.lower().replace(" ", "-")
        clean_loc = location.lower().split(',')[0].strip().replace(" ", "-")
        url = f"https://www.naukri.com/{clean_query}-jobs-in-{clean_loc}"
        
        try:
            async with AsyncStealthySession(headless=True) as session:
                page = await session.fetch(url)
                # Naukri uses unique selectors
                job_tuples = page.css('.srp-jobtuple') or page.css('.cust-job-tuple')
                
                if not job_tuples:
                    logger.warning(f"Naukri.com: 0 results found at {url}. (DOM changed or Blocking active).")
                    return []
                    
                for card in job_tuples:
                    try:
                        title = (card.css('a.title::text').get() or "").strip()
                        company = (card.css('a.comp-name::text').get() or card.css('.companyName::text').get() or "").strip()
                        # Naukri location is often "Hyderabad/Secunderabad, Mumbai"
                        loc = (card.css('.locWraper span::text').get() or "").strip()
                        link = (card.css('a.title::attr(href)').get() or "")
                        
                        if title and company:
                            job_id = Job.generate_id(company, title, loc)
                            logger.info(f"   [Naukri] Found: {title} @ {company}")
                            scraped_jobs.append(Job(
                                id=job_id,
                                company_name=company,
                                job_title=title,
                                source_url=link,
                                location=loc,
                                site="Naukri",
                                discovery_date=datetime.utcnow(),
                                queue_status="review"
                            ))
                    except Exception as row_err:
                        logger.debug(f"Naukri Row Skip: {str(row_err)}")
                        continue
                        
            logger.info(f"Naukri.com discovered {len(scraped_jobs)} results.")
        except Exception as e:
            logger.error(f"Naukri search failure: {str(e)}")
            # Fallback warning if completely blocked
            if "Scrapling" in str(e):
                logger.warning("Naukri Scraper: Engine failure. Might need profile/session update.")
            
        return scraped_jobs[:limit]

    async def _jobspy_search(self, query: str, locations: List[str], limit: int) -> List[Job]:
        """Worker for JobSpy search."""
        if not JOBSPY_AVAILABLE:
            return []
            
        # REFINEMENT: Clean location for JobSpy (it prefers city name over full address)
        js_loc = locations[0].split(',')[0].strip() if locations else "Hyderabad"
        # Force India scope if it looks like an Indian city
        js_loc_full = f"{js_loc}, India" if any(x in js_loc.lower() for x in ["hyderabad", "bangalore", "pune", "delhi", "mumbai", "chennai", "gurgaon"]) else js_loc
        
        logger.info(f"   [JobSpy] Starting search: {query} in {js_loc_full}")

        try:
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(
                self.executor,
                lambda: scrape_jobs(
                    site_name=["linkedin", "indeed", "glassdoor", "google"], # Added Google
                    search_term=query,
                    location=js_loc_full,
                    results_wanted=30,
                    hours_old=None,         # Remove restriction to see if anything is found
                    country_indeed="india"  # Force India
                )
            )
            
            if results is None or results.empty:
                return []

            jobs = []
            for index, row in results.iterrows():
                try:
                    def clean(val, default=""):
                        if pd.isna(val): return default
                        return str(val).strip()

                    company = clean(row.get('company'), "Unknown")
                    title = clean(row.get('title'), "Unknown")
                    loc = clean(row.get('location'), "Remote")
                    job_url = clean(row.get('job_url'), "")
                    desc = clean(row.get('description'), "")
                    site_source = clean(row.get('site'), "Direct").capitalize()
                    
                    # Salary Formatting (Wave 2 - Data Quality)
                    min_val = clean(row.get('min_amount'), None)
                    max_val = clean(row.get('max_amount'), None)
                    currency = clean(row.get('currency'), "")
                    interval = clean(row.get('interval'), "")
                    
                    salary_str = ""
                    if min_val and max_val:
                        salary_str = f"{currency}{min_val} - {max_val} / {interval}"
                    elif min_val:
                        salary_str = f"{currency}{min_val} / {interval}"
                    
                    job_id = Job.generate_id(company, title, loc)
                    jobs.append(Job(
                        id=job_id,
                        company_name=company,
                        job_title=title,
                        source_url=job_url,
                        location=loc,
                        description=desc,
                        salary_extracted=salary_str,
                        site=site_source,
                        discovery_date=datetime.utcnow(),
                        queue_status="review"
                    ))
                except:
                    continue
            logger.info(f"JobSpy discovered {len(jobs)} results.")
            return jobs
        except Exception as e:
            logger.error(f"JobSpy task failed: {str(e)}")
            traceback.print_exc()
            return []

    async def search_jobs(self, query: str, locations: List[str], limit: int = 10):
        # Sanitize location: Remove UI-specific suffixes like " (All)"
        sanitized_location = locations[0] if locations else "India"
        if sanitized_location.endswith(" (All)"):
            sanitized_location = sanitized_location.replace(" (All)", "").strip()

        # Refine query
        refined_query = await self._refine_query(query)
        logger.info(f"Starting discovery for '{refined_query}' in '{sanitized_location}'")

        async def main_logic():
            # Use an async queue for true streaming between multiple scrapers
            queue = asyncio.Queue()
                       # WORKER: Wrap scrapers with logging for failure detection
            async def worker(task_coro, name):
                try:
                    result_jobs = await task_coro
                    for j in result_jobs:
                        if j: await queue.put(j)
                    logger.info(f"Worker {name} finished found {len(result_jobs) if result_jobs else 0} roles.")
                except Exception as e:
                    logger.error(f"Worker {name} failed: {str(e)}")
                finally:
                    await queue.put(None)

            scrape_tasks = [
                asyncio.create_task(worker(self._jobspy_search(refined_query, [sanitized_location], limit), "JobSpy")),
                asyncio.create_task(worker(self._scrapling_search(refined_query, sanitized_location, limit), "Scrapling (Indeed)")),
                asyncio.create_task(worker(self._naukri_search(refined_query, sanitized_location, limit), "Naukri"))
            ]
            
            # FIX 1: Explicit worker tracking
            tasks = scrape_tasks
            
            try:
                # Stream items as they arrive in the queue
                workers_done = 0
                returned_ids = set() # FIX 4: Backend de-duplication
                
                # Check if we are searching for an Indian city
                is_india_query = any(x in sanitized_location.lower() for x in ["hyderabad", "india", "bangalore", "pune", "mumbai", "delhi"])

                while workers_done < len(tasks):
                    try:
                        # Wait for any worker to put something in the queue
                        job = await asyncio.wait_for(queue.get(), timeout=20.0)
                        if job is None:
                            workers_done += 1
                        elif job is not None and hasattr(job, 'id'):
                            if job.id not in returned_ids:
                                # FIX: SMART Geographic Filter (User suggested)
                                job_loc = (job.location or "").lower()
                                job_title = (job.job_title or "").lower()
                                job_desc = (job.description or "").lower()
                                
                                # Combined text for full-context filtering
                                context_text = f"{job_loc} {job_title} {job_desc}"
                                
                                is_india_eligible = True # Default to True unless US signal found
                                if is_india_query:
                                    # 1. Accept explicitly India-tagged roles
                                    india_signals = ["india", "hyderabad", "telangana", "bangalore", "karnataka", "pune", "mumbai", "delhi", "gurgaon", "chennai"]
                                    has_india_signal = any(x in context_text for x in india_signals)
                                    
                                    # 2. Identify US-only signals (California, NYC, etc.)
                                    us_signals = ["united states", "usa", "new york", "california", "tx", "ca ", "nj ", "ma ", "illinois", "chicago"]
                                    has_us_signal = any(x in context_text for x in us_signals)

                                    # SMART LOGIC:
                                    if has_india_signal:
                                        is_india_eligible = True # High confidence
                                    elif has_us_signal:
                                        is_india_eligible = False # Reject US-specific
                                    elif "remote" in context_text:
                                        is_india_eligible = True # Allow neutral Remote
                                    else:
                                        # If no India signal and not neutral remote, likely global/US leak
                                        is_india_eligible = False

                                if not is_india_eligible:
                                    logger.info(f"   [GeoFilter] Dropping outside role: {job.job_title} @ {job.location}")
                                    continue

                                returned_ids.add(job.id)
                                logger.info(f">>> [SOURCE: {job.site}] Pushing: {job.job_title} @ {job.company_name}")
                                yield job
                                if len(returned_ids) >= limit:
                                    # FIX 2: Immediate worker cancellation on limit reached
                                    logger.info(f"Limit ({limit}) reached. Stopping workers.")
                                    break 
                    except asyncio.TimeoutError:
                        if workers_done >= len(tasks):
                            break
                        continue
            finally:
                # FIX 1 & 2: Ensure cancellation of all background tasks
                for t in tasks:
                    if not t.done():
                        t.cancel()
                if tasks:
                    await asyncio.gather(*tasks, return_exceptions=True)

        # FIX 3: Global discovery timeout (30s) logic for AsyncGenerator
        start_time = asyncio.get_event_loop().time()
        try:
            async for job in main_logic():
                if asyncio.get_event_loop().time() - start_time > 30.0:
                    logger.warning(f"Global discovery timeout for '{refined_query}'")
                    break
                yield job
        except Exception as e:
            logger.error(f"Discovery stream failed: {e}")

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
        # FIX 7: Truncate JD to 4000 characters to reduce tokens and latency
        truncated_content = html_content[:4000] if html_content else ""
        logger.info(f"Extracting structured profile from text (Sample: {truncated_content[:50]}...)")
        prompt = f"""Extract a structured JSON profile from this Job Description.
        
        JD TEXT (TRUNCATED):
        {truncated_content}
        
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
