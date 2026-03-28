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
from sqlalchemy.ext.asyncio import AsyncSession

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

    async def _scrapling_search(self, query: str, location: str, limit: int):
        """
        Deep-scrape fallback using Scrapling (Targeting Indeed).
        Now an async generator for real-time yielding.
        """
        if not SCRAPLING_AVAILABLE:
            return

        is_india = any(x in location.lower() for x in ["india", "hyderabad", "bangalore", "pune", "delhi", "mumbai"])
        base_domain = "in.indeed.com" if is_india else "www.indeed.com"
        
        logger.info(f"Starting Scrapling Indeed ({base_domain}) search for: {query} in {location}")
        
        found_count = 0
        try:
            async with AsyncStealthySession(headless=True) as session:
                max_pages = 5 
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
                            link_raw = (card.css('a.jcs-JobTitle::attr(href)').get() or card.css('a::attr(href)').get())
                            
                            if link_raw:
                                link = f"https://{base_domain}{link_raw}" if link_raw.startswith('/') else link_raw
                                job_id = Job.generate_id(company, title, loc)
                                logger.info(f"   [Indeed] Found: {title} @ {company}")
                                
                                found_count += 1
                                yield Job(
                                    id=job_id,
                                    company_name=company,
                                    job_title=title,
                                    source_url=link,
                                    location=loc,
                                    site="Indeed (Scrapling)",
                                    discovery_date=datetime.utcnow(),
                                    queue_status="review"
                                )
                                if found_count >= limit: break
                        except: continue
                    
                    if found_count >= limit: break
                    await asyncio.sleep(random.uniform(0.5, 1.5))
                    
            logger.info(f"Scrapling Indeed discovered {found_count} results.")
        except Exception as e:
            logger.error(f"Scrapling search failed: {str(e)}")

    async def _naukri_search(self, query: str, location: str, limit: int):
        """
        Naukri.com scraper for Indian market. Async generator.
        """
        if not SCRAPLING_AVAILABLE:
            return

        logger.info(f"Starting Scrapling Naukri search for: {query} in {location}")
        clean_query = query.lower().replace(" ", "-")
        clean_loc = location.lower().split(',')[0].strip().replace(" ", "-")
        url = f"https://www.naukri.com/{clean_query}-jobs-in-{clean_loc}"
        
        found_count = 0
        try:
            async with AsyncStealthySession(headless=True) as session:
                page = await session.fetch(url)
                job_tuples = page.css('.srp-jobtuple') or page.css('.cust-job-tuple')
                
                if not job_tuples:
                    logger.warning(f"Naukri.com: 0 results found at {url}")
                    return
                    
                for card in job_tuples:
                    try:
                        title = (card.css('a.title::text').get() or "").strip()
                        company = (card.css('a.comp-name::text').get() or card.css('.companyName::text').get() or "").strip()
                        loc = (card.css('.locWraper span::text').get() or "").strip()
                        link = (card.css('a.title::attr(href)').get() or "")
                        
                        if title and company:
                            job_id = Job.generate_id(company, title, loc)
                            logger.info(f"   [Naukri] Found: {title} @ {company}")
                            found_count += 1
                            yield Job(
                                id=job_id,
                                company_name=company,
                                job_title=title,
                                source_url=link,
                                location=loc,
                                site="Naukri",
                                discovery_date=datetime.utcnow(),
                                queue_status="review"
                            )
                            if found_count >= limit: break
                    except: continue
            logger.info(f"Naukri.com discovered {found_count} results.")
        except Exception as e:
            logger.error(f"Naukri search failure: {str(e)}")

    def _map_hours_old(self, date_posted: str) -> Optional[int]:
        mapping = {
            "24h": 24,
            "7d": 24 * 7,
            "30d": 24 * 30,
        }
        return mapping.get((date_posted or "").lower())

    def _passes_filters(self, job: Job, filters: Optional[dict]) -> bool:
        if not filters:
            return True

        remote = (filters.get("remote") or "all").lower()
        job_type = (filters.get("job_type") or "all").lower()
        experience = (filters.get("experience") or "all").lower()

        text_blob = f"{(job.location or '').lower()} {(job.description or '').lower()} {(job.job_title or '').lower()}"

        if remote == "remote" and "remote" not in text_blob:
            return False
        if remote == "onsite" and "remote" in text_blob:
            return False

        if job_type != "all":
            if job_type == "full-time" and all(x not in text_blob for x in ["full time", "full-time"]):
                return False
            if job_type == "contract" and "contract" not in text_blob:
                return False
            if job_type == "internship" and all(x not in text_blob for x in ["intern", "internship"]):
                return False

        if experience != "all":
            if experience == "fresher" and all(x not in text_blob for x in ["fresher", "entry", "junior", "0-1", "1 year"]):
                return False
            if experience == "mid" and all(x not in text_blob for x in ["mid", "2 year", "3 year", "4 year", "5 year"]):
                return False
            if experience == "senior" and all(x not in text_blob for x in ["senior", "lead", "principal", "staff", "6 year", "7 year", "8 year"]):
                return False

        return True

    async def _jobspy_search(self, query: str, locations: List[str], limit: int, filters: Optional[dict] = None):
        """JobSpy search. Async generator."""
        if not JOBSPY_AVAILABLE:
            return
            
        js_loc = locations[0].split(',')[0].strip() if locations else "Hyderabad"
        js_loc_full = f"{js_loc}, India" if any(x in js_loc.lower() for x in ["hyderabad", "bangalore", "pune", "delhi", "mumbai"]) else js_loc
        
        logger.info(f"   [JobSpy] Starting search: {query} in {js_loc_full}")

        try:
            loop = asyncio.get_event_loop()
            hours_old = self._map_hours_old((filters or {}).get("date_posted", "any"))
            # Guard blocking scrape call so one provider cannot stall entire discovery stream.
            results = await asyncio.wait_for(
                loop.run_in_executor(
                    self.executor,
                    lambda: scrape_jobs(
                        site_name=["linkedin", "indeed"],
                        search_term=query,
                        location=js_loc_full,
                        results_wanted=max(10, min(limit, 30)),
                        hours_old=hours_old,
                        country_indeed="india"
                    )
                )
                ,
                timeout=45.0
            )
            
            if results is None or results.empty:
                return

            for _, row in results.iterrows():
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
                    
                    job_id = Job.generate_id(company, title, loc)
                    yield Job(
                        id=job_id,
                        company_name=company,
                        job_title=title,
                        source_url=job_url,
                        location=loc,
                        description=desc,
                        site=site_source,
                        discovery_date=datetime.utcnow(),
                        queue_status="review"
                    )
                except: continue
        except asyncio.TimeoutError:
            logger.warning(f"JobSpy timed out for query='{query}' location='{js_loc_full}'.")
        except Exception as e:
            logger.error(f"JobSpy failed: {str(e)}")

    async def search_jobs(
        self,
        query: str,
        locations: List[str],
        limit: int = 200,
        filters: Optional[dict] = None,
        session: Optional[AsyncSession] = None,
    ):
        sanitized_location = locations[0] if locations else "India"
        if sanitized_location.endswith(" (All)"):
            sanitized_location = sanitized_location.replace(" (All)", "").strip()

        refined_query = await self._refine_query(query)
        logger.info(f"Starting discovery for '{refined_query}' in '{sanitized_location}'")

        async def main_logic():
            queue = asyncio.Queue()
            semaphore = asyncio.Semaphore(5)
            async def worker(gen_func, name):
                try:
                    async with semaphore:
                        async for j in gen_func:
                            if j: await queue.put(j)
                except Exception as e:
                    logger.error(f"Worker {name} failed: {str(e)}")
                finally:
                    await queue.put(None)

            geo_locations = [sanitized_location]
            geo_locations = list(dict.fromkeys([loc.strip() for loc in geo_locations if loc and loc.strip()]))
            enable_deep_scrape = os.getenv("ENABLE_DEEP_SCRAPE_DISCOVERY", "0") == "1"

            tasks = []
            for loc in geo_locations:
                tasks.append(asyncio.create_task(worker(self._jobspy_search(refined_query, [loc], limit, filters), f"JobSpy:{loc}")))
                if enable_deep_scrape:
                    tasks.append(asyncio.create_task(worker(self._scrapling_search(refined_query, loc, limit), f"Indeed:{loc}")))
                    tasks.append(asyncio.create_task(worker(self._naukri_search(refined_query, loc, limit), f"Naukri:{loc}")))
            
            try:
                workers_done = 0
                returned_keys = set()
                is_india_query = any(x in sanitized_location.lower() for x in ["hyderabad", "india", "bangalore", "pune", "delhi", "mumbai"])
                deadline = asyncio.get_event_loop().time() + float(self.timeout_seconds)

                while workers_done < len(tasks):
                    remaining = deadline - asyncio.get_event_loop().time()
                    if remaining <= 0:
                        logger.warning("Discovery deadline reached before all workers finished.")
                        break
                    try:
                        job = await asyncio.wait_for(queue.get(), timeout=min(remaining, 5.0))
                        if job is None:
                            workers_done += 1
                        elif job is not None and hasattr(job, 'id'):
                            dedupe_key = (
                                (job.job_title or "").strip().lower(),
                                (job.company_name or "").strip().lower(),
                                (job.location or "").strip().lower(),
                            )
                            if dedupe_key not in returned_keys:
                                # GEO-FILTER RELAXED
                                job_loc = (job.location or "").lower()
                                job_title = (job.job_title or "").lower()
                                job_desc = (job.description or "").lower()
                                context_text = f"{job_loc} {job_title} {job_desc}"
                                
                                is_india_eligible = True 
                                if is_india_query:
                                    if job.site in ["Naukri", "Indeed (Scrapling)"]:
                                        is_india_eligible = True
                                    else:
                                        india_signals = ["india", "hyderabad", "telangana", "bangalore", "karnataka", "pune", "mumbai", "delhi"]
                                        has_india_signal = any(x in context_text for x in india_signals)
                                        if has_india_signal or "remote" in context_text:
                                            is_india_eligible = True
                                        else:
                                            is_india_eligible = False

                                if is_india_eligible and self._passes_filters(job, filters):
                                    returned_keys.add(dedupe_key)
                                    yield job
                                    if len(returned_keys) >= limit: break
                    except asyncio.TimeoutError:
                        continue
            finally:
                for t in tasks:
                    if not t.done(): t.cancel()
                if tasks:
                    done, pending = await asyncio.wait(tasks, timeout=1.5)
                    if pending:
                        logger.warning(f"Discovery cleanup left {len(pending)} background worker(s) pending.")

        start_time = asyncio.get_event_loop().time()
        try:
            async for job in main_logic():
                if asyncio.get_event_loop().time() - start_time > float(self.timeout_seconds):
                    logger.warning(f"Discovery timeout reached ({self.timeout_seconds}s).")
                    break
                if session is not None and job and job.id:
                    existing = await session.get(Job, job.id)
                    if not existing:
                        session.add(job)
                        await session.commit()
                yield job
        except Exception as e:
            logger.error(f"Discovery stream failure: {e}")


    async def parse_job_description(self, url: str) -> JobProfile:
        """
        Structured Parsing into Rigid JSON Profile using Requests/BeautifulSoup.
        """
        logger.info(f"Parsing Job Description at {url}")
        html_content = ""
        
        import requests
        from bs4 import BeautifulSoup
        try:
            # Persistent Fallback for Windows asyncio issues
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
            response = requests.get(url, timeout=15, headers=headers)
            soup = BeautifulSoup(response.text, 'html.parser')
            for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
                tag.decompose()
            html_content = soup.get_text(separator=' ', strip=True)
        except Exception as re:
            logger.error(f"Parser failed for {url}: {str(re)}")
            return JobProfile(role="Error Parsing", skills_required=[], tools=[], experience_level="N/A", keywords=[], soft_skills=[])

        # Tier 2: Groq High-Fidelity Extraction
        if not self.groq:
            logger.warning("Groq not available for JD parsing. Returning raw extracted text.")
            return JobProfile(role="Unknown", skills_required=[], tools=[], experience_level="N/A", keywords=[], soft_skills=[])

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
            return {"raw_text": truncated_content, "profile": JobProfile(**data)}
        except Exception as e:
            logger.error(f"JD Parsing failed: {str(e)}")
            # Fallback to generic profile
            return {
                "raw_text": truncated_content,
                "profile": JobProfile(
                    role="Unknown Role",
                    skills_required=[],
                    tools=[],
                    experience_level="Unknown",
                    keywords=[],
                    soft_skills=[]
                )
            }


# singleton for use in pipeline
discovery_service = DiscoveryEngine()
