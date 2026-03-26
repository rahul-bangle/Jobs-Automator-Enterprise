import asyncio
import json
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.pipeline_v2 import JobProfile
from app.services.ats_engine_v2 import ats_engine, ScoreResult
from app.models.base import ResumeVariant, Job
from app.core.config import settings
from app.core.llm import llm_client as groq_client

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
        print(f"Starting Recursive Tailoring for {job_profile.role}...")
        
        current_resume = base_resume_json
        history = []
        
        for v in range(1, max_iterations + 1):
            version_id = f"v{v}"
            print(f"VERSION {version_id} -- Optimizing...")
            
            # Step 1: Tailor (Groq Call)
            current_resume = await self._tailor_logic(current_resume, job_profile, history)
            
            # Step 2: Score (ATS Engine)
            score_result = await ats_engine.calculate_hybrid_score(job_profile, current_resume)
            print(f"Score: {score_result.total_score}% | Overfitted: {score_result.is_overfitted}")
            
            # Step 3: Logistics (Version Tracking)
            history.append({
                "version": version_id,
                "score": score_result.total_score,
                "resume_json": current_resume,
                "feedback": score_result.feedback
            })
            
            # Step 4: Gatekeeper (75+ threshold)
            if score_result.total_score >= 75 and not score_result.is_overfitted:
                print(f"PASS! Threshold met in Version {version_id}.")
                break
            else:
                print(f"FAIL. Feedback: {score_result.feedback}")
        
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

        prompt = f"""You are an elite Resume Architect. Tailor the provideed Reactive-Resume JSON to perfectly match the Job Profile.
        
        JOB ROLE: {profile.role}
        KEYWORDS: {', '.join(profile.keywords)}
        TOOLS: {', '.join(profile.tools)}
        
        {feedback_context}
        
        RESUME JSON:
        {json.dumps(resume)}
        
        INSTRUCTIONS:
        1. Update 'basics.summary' to highlight relevant experience.
        2. Adjust 'sections.experience' descriptions to use the provided keywords.
        3. Match the skills list to the 'TOOLS' and 'KEYWORDS' provided.
        4. Maintain strictly valid JSON format.
        
        Return ONLY the updated JSON object."""

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
            print(f"Tailoring LLM Error: {e}")
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
