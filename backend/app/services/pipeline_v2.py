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
    JOBSPY_AVAILABLE = True
except ImportError:
    JOBSPY_AVAILABLE = False
    logger.warning("jobspy not installed. Job scraping disabled.")



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
        self.timeout_seconds = 90  # Increased for multi-site search
        self.executor = ThreadPoolExecutor(max_workers=3)

    def _static_refine(self, query: str) -> List[str]:
        """Hardcoded fallback for common roles when Groq is unavailable."""
        base = query.strip()
        expansions = {
            "associate product manager": [
                "Associate Product Manager",
                "Junior Product Manager", 
                "APM product"
            ],
            "product manager": [
                "Product Manager",
                "APM fresher",
                "Product Analyst"
            ]
        }
        for key, variants in expansions.items():
            if key in base.lower():
                return list(dict.fromkeys([base] + variants))
        return list(dict.fromkeys([base, f"junior {base}", f"{base} fresher"]))

    async def _refine_query(self, query: str) -> List[str]:
        """
        Primary: Groq-powered semantic expansion.
        Fallback: _static_refine.
        """
        if not self.groq:
            return self._static_refine(query)
            
        try:
            logger.info(f"   [AI] Expanding semantic variants for: {query}")
            prompt = (
                f"Given the job search query '{query}', provide 3-6 professional variants or abbreviations "
                "commonly used in the industry (e.g., 'APM' for 'Associate Product Manager'). "
                "Return a JSON object with a key 'variants' containing the list of strings."
            )
            logger.info(f"   [AI] Groq Prompt: {prompt}")
            
            # 5-second deadline for query expansion—failure triggers static fallback
            completion = await asyncio.wait_for(
                asyncio.to_thread(
                    self.groq.chat.completions.create,
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    response_format={"type": "json_object"}
                ),
                timeout=30.0
            )

            raw_content = completion.choices[0].message.content
            logger.info(f"   [AI] Groq Raw Response: {raw_content}")
            data = json.loads(raw_content)
            
            # Extract list from "variants" key
            variants = data.get("variants", [])
            if not isinstance(variants, list):
                # Fallback: Find any list in the JSON if key is wrong
                for v in data.values():
                    if isinstance(v, list):
                        variants = v
                        break
            
            if variants:
                final_list = list(dict.fromkeys([query] + [str(x) for x in variants]))
                logger.info(f"   [AI] Expanded to {len(final_list)} variants: {final_list}")
                return final_list
                
        except Exception as e:
            logger.warning(f"   [Query] Semantic expansion failed ({type(e).__name__}). Using static fallback.")
            
        return self._static_refine(query)

    async def get_suggestions(self, query: str) -> List[str]:
        """AI-powered job title suggestions for autocomplete."""
        if not self.groq:
            return [f"{query} Developer", f"Senior {query}", f"Remote {query}"]
            
        try:
            prompt = (
                f"Based on the input '{query}', provide the 5 most likely professional job titles. "
                "Return a JSON object with a key 'titles' containing the list of strings."
            )
            completion = self.groq.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            raw_content = completion.choices[0].message.content
            logger.info(f"   [AI] Raw Suggestions: {raw_content}")
            data = json.loads(raw_content)
            
            # Extract list from "titles" key
            titles = data.get("titles", [])
            if not isinstance(titles, list):
                for v in data.values():
                    if isinstance(v, list):
                        titles = v
                        break
            
            if titles:
                return [str(x) for x in titles][:5]
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




    async def _scrapling_search(self, query: str, location: str, limit: int):
        """
        Deep-scrape fallback using Scrapling (Targeting Indeed).
        Now an async generator for real-time yielding.
        """
        if not SCRAPLING_AVAILABLE:
            return

        base_domain = "www.indeed.com"
        
        logger.info(f"Starting Indeed Scrapling search for: {query}")
        
        found_count = 0
        try:
            async with AsyncStealthySession(headless=True) as session:
                max_pages = 10 
                for p_idx in range(max_pages):
                    start_val = p_idx * 10
                    url = f"https://www.indeed.com/jobs?q={query.replace(' ', '+')}&l=India&sc=0kf%3Ajt(fulltime)%3B&sort=date&start={start_val}"
                    
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
                        except Exception as e:
                            logger.warning(f"Skipping job row: {e}")
                            continue
                    
                    if found_count >= limit: break
                    await asyncio.sleep(random.uniform(0.5, 1.5))
                    
            logger.info(f"Indeed Scrapling discovered {found_count} results.")
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
        url = f"https://www.naukri.com/{clean_query}-jobs?jobAge=7"
        
        found_count = 0
        try:
            async with AsyncStealthySession(headless=True) as session:
                page = await session.fetch(url)
                # Corrected to target article.jobTuple based on modern Naukri structure
                job_tuples = page.css('article.jobTuple') or page.css('.srp-jobtuple')
                
                if not job_tuples:
                    logger.warning(f"Naukri.com: 0 results found at {url}")
                    return
                    
                for card in job_tuples:
                    try:
                        title = (card.css('.title::text').get() or "").strip()
                        company = (card.css('.subTitle::text').get() or "").strip()
                        loc = (card.css('.ellipsis::text').get() or "").strip()
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
                    except Exception as e:
                        logger.warning(f"Skipping job row: {e}")
                        continue
            logger.info(f"Naukri.com discovered {found_count} results.")
        except Exception as e:
            logger.error(f"Naukri search failure: {str(e)}")

    async def _cutshort_search(self, query: str, location: str, limit: int):
        """
        Cutshort.io scraper. Specialized for high-quality startups/product roles.
        """
        if not SCRAPLING_AVAILABLE:
            return
        
        logger.info(f"Starting Cutshort search for: {query}")
        # URL formatting per request
        url = f"https://cutshort.io/jobs?query={query.replace(' ', '+')}&location=India"
        
        found_count = 0
        try:
            async with AsyncStealthySession(headless=True) as session:
                page = await session.fetch(url)
                cards = page.css('.job-card') or page.css('[class*="JobCard"]')
                
                for card in cards:
                    try:
                        title = (card.css('h3::text').get() or 
                                 card.css('[class*="title"]::text').get() or "").strip()
                        company = (card.css('[class*="company"]::text').get() or "").strip()
                        loc = (card.css('[class*="location"]::text').get() or location).strip()
                        link = (card.css('a::attr(href)').get() or "")
                        if link and not link.startswith('http'):
                            link = f"https://cutshort.io{link}"
                        
                        if title and company:
                            job_id = Job.generate_id(company, title, loc)
                            logger.info(f"   [Cutshort] Found: {title} @ {company}")
                            found_count += 1
                            yield Job(
                                id=job_id,
                                company_name=company,
                                job_title=title,
                                source_url=link,
                                location=loc,
                                site="Cutshort",
                                discovery_date=datetime.utcnow(),
                                queue_status="review"
                            )
                            if found_count >= limit:
                                break
                    except Exception as e:
                        logger.warning(f"Skipping job row: {e}")
                        continue
        except Exception as e:
            logger.error(f"Cutshort search failed: {str(e)}")


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
            if experience == "fresher" and all(x not in text_blob for x in ["fresher", "entry", "junior", "0-1", "0-2", "1 year", "graduate", "trainee", "intern"]):
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
            # User Preference: 7 days history
            hours_old = 168 
            # User Preference: Removed 'naukri' and 'glassdoor' from JobSpy (Naukri is handled via separate RSS worker). 
            site_name = ["indeed", "linkedin", "google"]
            
            # Dynamic Results Wanted
            results_wanted = 30 * len(site_name)
            
            logger.info(f"   [JobSpy] Dispatching multi-site worker:")
            logger.info(f"     > Query: {query}")
            logger.info(f"     > Sites: {site_name}")
            logger.info(f"     > History: {hours_old} hours (7 days)")
            logger.info(f"     > Aiming for: {results_wanted} total results")

            # Guard blocking scrape call so one provider cannot stall entire discovery stream.
            results = await asyncio.wait_for(
                loop.run_in_executor(
                    self.executor,
                    lambda: scrape_jobs(
                        site_name=site_name,
                        search_term=query,
                        location=js_loc_full,
                        results_wanted=results_wanted,
                        hours_old=hours_old,
                        country_indeed="India",
                        linkedin_fetch_description=False,
                        verbose=0
                    )
                ),
                timeout=self.timeout_seconds
            )

            if results is None or results.empty:
                logger.info(f"   [JobSpy] No results for '{query}' in the last 7 days.")
                return

            found_in_batch = 0
            for _, row in results.iterrows():
                try:
                    title = str(row.get('title', 'Unknown Title'))
                    company = str(row.get('company', 'Unknown Company'))
                    location = str(row.get('location', js_loc_full))
                    link = str(row.get('job_url', ''))
                    
                    if not link: continue
                    
                    job_id = Job.generate_id(company, title, location)
                    site_src = str(row.get('site', 'JobSpy'))
                    
                    if found_in_batch % 10 == 0:
                        logger.info(f"   [JobSpy] Processing batch: Found {title} @ {company} ({site_src})")
                    
                    found_in_batch += 1
                    yield Job(
                        id=job_id,
                        company_name=company,
                        job_title=title,
                        source_url=link,
                        location=location,
                        site=site_src.capitalize(),
                        discovery_date=datetime.utcnow(),
                        queue_status="review"
                    )
                except Exception as e:
                    logger.warning(f"   [JobSpy] Parsing row failed: {e}")
                    continue
            
            logger.info(f"   [JobSpy] Search complete for '{query}': Discovered {found_in_batch} raw matches.")
        except asyncio.TimeoutError:
            logger.warning(f"JobSpy timed out for query='{query}' location='{js_loc_full}'.")
        except Exception as e:
            logger.error(f"JobSpy failed: {str(e)}")

    async def _naukri_rss_search(self, query: str, location: str, limit: int):
        """
        Naukri semi-public JSON API — no recaptcha, no headless browser.
        Kya hai: JobSpy wala Naukri block ho jaata hai (406).
        Yeh direct JSON endpoint hit karta hai jo publicly accessible hai.
        """
        import requests
        
        clean_query = query.replace(" ", "%20")
        clean_loc = location.split(',')[0].strip().replace(" ", "%20")
        
        url = (
            f"https://www.naukri.com/jobapi/v2/search"
            f"?noOfResults={min(limit, 20)}"
            f"&urlType=search_by_keyword"
            f"&searchType=adv"
            f"&keyword={clean_query}"
            f"&location={clean_loc}"
            f"&pageNo=1"
        )
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
            "appid": "109",
            "systemid": "109",
        }
        
        logger.info(f"[Naukri RSS] Searching: {query} in {location}")
        
        try:
            loop = asyncio.get_event_loop()
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    self.executor,
                    lambda: requests.get(url, headers=headers, timeout=15)
                ),
                timeout=20.0
            )
            
            if response.status_code != 200:
                logger.warning(f"[Naukri RSS] Status {response.status_code} — skipping")
                return
                
            data = response.json()
            jobs_list = data.get("jobDetails", []) or data.get("jobs", [])
            
            if not jobs_list:
                logger.warning(f"[Naukri RSS] 0 results for {query}")
                return
                
            found = 0
            for item in jobs_list:
                try:
                    title = (item.get("title") or item.get("jobTitle") or "").strip()
                    company = (item.get("companyName") or item.get("company") or "").strip()
                    loc = (item.get("placeholders", [{}])[0].get("label") 
                           or item.get("location") or location).strip()
                    link = item.get("jdURL") or item.get("url") or ""
                    
                    if not title or not company:
                        continue
                        
                    job_id = Job.generate_id(company, title, loc)
                    logger.info(f"   [Naukri RSS] Found: {title} @ {company}")
                    found += 1
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
                    if found >= limit:
                        break
                except Exception as e:
                    logger.warning(f"Skipping Naukri job row: {e}")
                    continue
                    
            logger.info(f"[Naukri RSS] Discovered {found} results.")
            
        except asyncio.TimeoutError:
            logger.warning("[Naukri RSS] Timed out.")
        except Exception as e:
            logger.error(f"[Naukri RSS] Failed: {e}")

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

        refined_queries = await self._refine_query(query)
        logger.info(f"Starting discovery for '{refined_queries}' in '{sanitized_location}'")

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
            enable_deep_scrape = True

            tasks = []
            site_counts = {}
            for loc in geo_locations:
                # Add JobSpy tasks for ALL refined queries
                for q in refined_queries:
                    logger.info(f"   [Worker] Queuing JobSpy: {q} ({loc})")
                    tasks.append(asyncio.create_task(worker(self._jobspy_search(q, [loc], limit, filters), f"JobSpy:{q}:{loc}")))
                
                # Use the primary query for deep scrapers to avoid redundant heavy scraping
                primary_q = refined_queries[0]
                logger.info(f"   [Worker] Queuing Scrapling Indeed: {primary_q}")
                tasks.append(asyncio.create_task(worker(self._scrapling_search(primary_q, loc, limit), "Indeed:Scrapling")))
                
                if enable_deep_scrape:
                    logger.info(f"   [Worker] Queuing Cutshort: {primary_q}")
                    tasks.append(asyncio.create_task(worker(self._cutshort_search(primary_q, loc, limit), "Cutshort")))
            
            try:
                workers_done = 0
                returned_keys = set()
                is_india_query = any(x in sanitized_location.lower() for x in ["hyderabad", "india", "bangalore", "pune", "delhi", "mumbai"])
                deadline = asyncio.get_event_loop().time() + float(self.timeout_seconds)

                logger.info(f"   [Discovery] {len(tasks)} workers initialized. Streaming results...")

                while workers_done < len(tasks):
                    remaining = deadline - asyncio.get_event_loop().time()
                    if remaining <= 0:
                        logger.warning("   [Discovery] Deadline reached. Terminating remaining workers.")
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
                                    # Log per-site counts as requested
                                    site_source = job.site or "Unknown"
                                    site_counts[site_source] = site_counts.get(site_source, 0) + 1
                                    yield job
                                    if len(returned_keys) >= limit: break
                    except asyncio.TimeoutError:
                        continue

                # Final log in console of high-level totals as requested
                logger.info("="*40)
                logger.info("DISCOVERY SUMMARY (CONSOLIDATED)")
                for site, count in site_counts.items():
                    logger.info(f"   - {site}: {count} jobs")
                logger.info(f"   TOTAL UNIQUE JOBS: {len(returned_keys)}")
                logger.info("="*40)
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
