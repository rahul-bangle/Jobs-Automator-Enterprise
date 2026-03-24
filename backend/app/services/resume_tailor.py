import logging
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.models.base import ResumeVariant, Job, Campaign
from app.services.scoring import REASONING_MODEL, get_groq_client

logger = logging.getLogger(__name__)

class ResumeTailorService:
    async def get_best_resume_for_job(
        self, 
        session: AsyncSession, 
        job: Job
    ) -> Optional[ResumeVariant]:
        """
        AI logic to select the most relevant resume variant for a given job.
        Uses the job description and score breakdown to decide.
        """
        # Fetch all available variants
        statement = select(ResumeVariant)
        result = await session.execute(statement)
        variants = result.scalars().all()
        
        if not variants:
            logger.warning("No resume variants found in database")
            return None
            
        # Logic to pick the best variant:
        # For MVP: Simple keyword matching or AI reasoning if there are many.
        # Let's use a quick AI check to pick between Backend, PM, and Data.
        
        variant_names = [v.filename for v in variants]
        
        prompt = f"""
        Pick the most suitable resume variant for this job from the list.
        JOB TITLE: {job.job_title}
        DESCRIPTION: {job.fit_summary}
        VARIANTS: {', '.join(variant_names)}
        
        Return ONLY the name of the best variant.
        """
        
        try:
            client = get_groq_client()
            completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant"  # Speed model is fine for selection
            )
            selected_name = completion.choices[0].message.content.strip()
            
            # Find the variant with this name
            for v in variants:
                if selected_name in v.filename:
                    return v
                    
            return variants[0] # Fallback to first
        except Exception as e:
            logger.error(f"Resume selection failed: {e}")
            return variants[0]

    async def generate_tailored_bullets(self, job: Job, base_resume_content: str) -> str:
        """
        Generate 3 high-impact resume bullets tailored specifically to this job's requirements.
        This is used for 'Assisted Apply' mode where the user can see suggested changes.
        """
        prompt = f"""
        Tailor the following resume experiences to match this job requirement.
        JOB: {job.job_title} at {job.company_name}
        REQUIREMENTS: {job.fit_summary}
        BASE CONTENT: {base_resume_content}
        
        Generate 3 high-impact bullets (STAR format) that highlight relevant skills.
        Return ONLY the bullets.
        """
        
        client = get_groq_client()
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=REASONING_MODEL
        )
        return completion.choices[0].message.content.strip()

resume_tailor_service = ResumeTailorService()
