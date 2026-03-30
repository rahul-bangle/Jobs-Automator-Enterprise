import asyncio
import json
import logging
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.pipeline_v2 import JobProfile
from app.services.ats_engine_v2 import ats_engine, ScoreResult
from app.models.base import ResumeVariant
from app.core.config import settings
from app.core.llm import llm_client as groq_client

logger = logging.getLogger("TailorEngineV2")

class TailorEngineV2:
    """
    Tier 3: The 'Master Tailor' — Recursive Self-Healing Loop for Reactive-Resume JSON
    """
    
    def __init__(self):
        pass

    @property
    def client(self):
        return groq_client

    async def optimize_resume(
        self, 
        base_resume_json: Dict, 
        job_profile: JobProfile, 
        max_iterations: int = 3
    ) -> Dict:
        """
        Recursive Loop: Tailor -> Score -> Heal -> Repeat
        """
        logger.info(f"Starting Recursive Tailoring for {job_profile.role}...")
        
        current_resume = base_resume_json
        history = []
        
        for v in range(1, max_iterations + 1):
            version_id = f"v{v}"
            logger.info(f"VERSION {version_id} -- Optimizing...")
            
            # Step 1: Tailor (Groq Call)
            current_resume = await self._tailor_logic(current_resume, job_profile, history)
            
            # Step 2: Score (ATS Engine)
            score_result = await ats_engine.calculate_hybrid_score(job_profile, current_resume)
            logger.info(f"Score: {score_result.total_score}% | Overfitted: {score_result.is_overfitted}")
            
            # Step 3: Logistics (Version Tracking)
            history.append({
                "version": version_id,
                "score": score_result.total_score,
                "resume_json": current_resume,
                "feedback": score_result.feedback
            })
            
            # Step 4: Gatekeeper (75+ threshold)
            if score_result.total_score >= 75 and not score_result.is_overfitted:
                logger.info(f"PASS! Threshold met in Version {version_id}.")
                break
            else:
                logger.info(f"FAIL. Feedback: {score_result.feedback}")
        
        return {
            "final_resume": current_resume,
            "version_history": history,
            "best_score": max([h["score"] for h in history]) if history else 0
        }

    async def _tailor_logic(self, resume: Dict, profile: JobProfile, history: List) -> Dict:
        """
        Groq Prompt to transform Reactive-Resume JSON to match Job Profile.
        """
        feedback_context = ""
        if history:
            last = history[-1]
            feedback_context = f"PREVIOUS FEEDBACK: {', '.join(last['feedback'])}"

        prompt = f"""You are an expert PM resume writer specializing in career transitions.

CANDIDATE BACKGROUND: Sales & Customer Success → Associate Product Manager

JOB ROLE: {profile.role}
REQUIRED SKILLS: {', '.join(profile.skills_required)}
TOOLS: {', '.join(profile.tools)}
KEYWORDS FOR ATS: {', '.join(profile.keywords)}

BASE RESUME JSON:
{json.dumps(resume)}

PREVIOUS FEEDBACK (if any):
{feedback_context}

YOUR TASK:
Step 1 - Extract from JD:
  - Must-have skills list
  - ATS keywords (exact phrases from JD)
  - Tools required
  
Step 2 - Map candidate strengths:
  - Sales metrics → Product impact framing
  - Customer complaints handled → User research experience  
  - Team leadership → Stakeholder management
  - CRM usage → Data-driven decision making

Step 3 - Rewrite resume:
  - basics.summary: 3 lines, mention role + top 2 JD keywords + transition story
  - Each experience bullet: rewrite using STAR format, inject 1-2 JD keywords naturally
  - Skills section: add missing JD tools candidate has exposure to
  - Do NOT stuff keywords — max 2 per bullet
  - Do NOT lie — only reframe real experience

Step 4 - Return ONLY valid JSON, same structure as input resume.
No explanation. No markdown. Just JSON."""

        try:
            loop = asyncio.get_event_loop()
            completion = await loop.run_in_executor(
                None, 
                lambda: self.client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model=settings.GROQ_BATCH_MODEL,
                    temperature=0.2,
                    response_format={"type": "json_object"}
                )
            )
            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            logger.error(f"Tailoring LLM Error: {e}")
            return resume

    async def legacy_optimize_resume(
        self, 
        session: AsyncSession,
        job_id: str,
        resume_text: str,
        jd_text: str
    ) -> ResumeVariant:
        """Legacy compatibility: String-based optimization loop that returns a ResumeVariant."""
        # Map string inputs to v2 structured logic
        job_profile = JobProfile(
            role="Optimized Role",
            skills_required=[],
            tools=[],
            experience_level="N/A",
            keywords=[],
            soft_skills=[]
        )
        # Convert resume_text (markdown) to a dummy dict for v2 logic
        # Ideally, we should parse it, but for a thin wrapper, we can treat it as 'basics.summary'
        base_resume = {"sections": {"summary": resume_text}}
        
        result = await self.optimize_resume(base_resume, job_profile, max_iterations=1)
        optimized_content = json.dumps(result["final_resume"])
        
        variant = ResumeVariant(
            job_id=job_id,
            filename=f"optimized_v2_{job_id[:8]}.md",
            content=optimized_content,
            ats_score=result["best_score"],
            version=1,
            status="PASS" if result["best_score"] >= 75 else "FAIL",
            keywords=[]
        )
        
        session.add(variant)
        await session.commit()
        await session.refresh(variant)
        return variant

# Singleton
tailor_service = TailorEngineV2()
