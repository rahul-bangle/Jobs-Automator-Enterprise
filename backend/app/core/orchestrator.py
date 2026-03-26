import asyncio
import logging
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import Job, ResumeVariant
from app.services.ats_engine_v2 import ats_engine
from app.services.tailor_engine_v2 import tailor_service
from app.services.submission_agent import submission_agent
from app.services.scoring import scoring_service

logger = logging.getLogger("AgentOrchestrator")

class AgentManager:
    """
    The 'Brain' — Coordinates specialized agents to achieve zero-intervention goals.
    """
    
    async def process_job_full_cycle(self, job_id: str, session: AsyncSession) -> Dict[str, Any]:
        """
        Flow: 
        1. Parallel [Score + Gap Analysis] + [Tailoring Initial Pass]
        2. Evaluate Safety Gate
        3. Submit (if safe)
        """
        # 1. Fetch Job
        job = await session.get(Job, job_id)
        if not job:
            return {"status": "error", "message": "Job not found"}

        logger.info(f"🚀 Orchestrating full cycle for Job: {job.job_title} @ {job.company_name}")

        # 2. Parallel Intellectual Processing
        # We run Scoring and Tailoring in parallel to save time
        try:
            score_task = scoring_service.score_job(job_id, session)
            tailor_task = tailor_service.optimize_resume(job_id, session)
            
            score_result, tailor_result = await asyncio.gather(score_task, tailor_task)
            
            logger.info(f"📊 Analysis Complete. Score: {score_result.get('score')}%. Variant Created: {tailor_result.get('variant_id')}")
            
            # 3. Decision Gate
            variant_id = tailor_result.get("variant_id")
            if not variant_id:
                 return {"status": "error", "message": "Tailoring failed to produce a variant."}

            # 4. Final Submission Agent
            submission_outcome = await submission_agent.process_submission(
                job_url=job.source_url,
                variant_id=variant_id,
                session=session
            )
            
            # 5. Final Status Update
            if submission_outcome["status"] == "success":
                job.queue_status = "accepted"
                await session.commit()
                
            return {
                "status": "completed",
                "orchestration_data": {
                    "score": score_result,
                    "tailoring": tailor_result,
                    "submission": submission_outcome
                }
            }

        except Exception as e:
            logger.error(f"❌ Orchestration Failure for Job {job_id}: {str(e)}")
            return {"status": "failed", "job_id": job_id, "error": str(e)}

    async def process_batch_jobs(self, job_ids: list[str], session: AsyncSession) -> Dict[str, Any]:
        """
        Runs multiple job cycles in parallel. 
        Note: We use gather but with a semaphore or limit if needed to avoid rate limits.
        """
        logger.info(f"📦 Starting Batch Orchestration for {len(job_ids)} jobs.")
        tasks = [self.process_job_full_cycle(jid, session) for jid in job_ids]
        results = await asyncio.gather(*tasks)
        
        success_count = sum(1 for r in results if r.get("status") == "completed")
        return {
            "status": "batch_completed",
            "total": len(job_ids),
            "success": success_count,
            "failed": len(job_ids) - success_count,
            "results": results
        }

orchestrator = AgentManager()
