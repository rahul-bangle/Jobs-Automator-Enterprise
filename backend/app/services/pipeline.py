import logging
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.extractors.service import extractor_service
from app.services.processor import processor_service
from app.services.scoring import scoring_service
from app.services.ats import ats_service
from app.services.market_analysis import analyze_market
from app.models.base import Job

logger = logging.getLogger(__name__)

class UnifiedPipeline:
    async def process_job_url(
        self, 
        session: AsyncSession,
        url: str, 
        candidate_profile: str,
        html_content: Optional[str] = None
    ) -> Optional[Job]:
        """
        The full 5-tier pulse (partially automated):
        Scrape -> Process -> Dedupe (implicit) -> Score -> Record.
        """
        try:
            # 1. Scrape/Extract (Raw HTML -> Basic Metadata)
            # If html_content is provided, use it (pasted mode), otherwise scrape.
            # (Scraping logic to be expanded with Playwright/Scrapy in Phase 1)
            
            # For now, we assume we have the HTML or the extractor can get simple metadata.
            raw_metadata = await extractor_service.extract_job(url, html_content or "")
            if not raw_metadata:
                logger.error(f"Extraction failed for {url}")
                return None
            
            # 2. Process (Raw HTML -> Clean Markdown)
            # This is where Crawl4AI shines.
            markdown_content = await processor_service.process_html(html_content or "")
            
            # 3. Score (Markdown + Metadata -> White-Box Score)
            scoring_result = await scoring_service.score_job(
                session=session,
                job_title=raw_metadata.get("job_title", ""),
                company_name=raw_metadata.get("company_name", ""),
                location=raw_metadata.get("location", ""),
                description=markdown_content or raw_metadata.get("description", ""),
                candidate_profile=candidate_profile
            )
            
            # 4. Create/Update Job Record
            job_id = Job.generate_id(
                raw_metadata.get("company_name", ""),
                raw_metadata.get("job_title", ""),
                raw_metadata.get("location", "")
            )
            
            job = Job(
                id=job_id,
                company_name=raw_metadata.get("company_name", ""),
                job_title=raw_metadata.get("job_title", ""),
                source_url=url,
                location=raw_metadata.get("location", ""),
                fit_summary=scoring_result.get("why_this_job"),
                relevance_score=scoring_result.get("overall_score", 0),
                score_breakdown=scoring_result.get("score_breakdown", {}),
                risk_flags=scoring_result.get("risk_flags", []),
                queue_status="review"
            )
            
            session.add(job)
            await session.commit()
            await session.refresh(job)
            
            return job

        except Exception as e:
            logger.error(f"Pipeline failed for {url}: {e}")
            return None

pipeline = UnifiedPipeline()
