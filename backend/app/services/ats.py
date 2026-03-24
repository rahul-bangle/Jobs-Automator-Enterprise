import os
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from groq import Groq
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import Job, ResumeVariant

logger = logging.getLogger(__name__)

REASONING_MODEL = "llama-3.3-70b-versatile"
SPEED_MODEL = "llama-3.1-8b-instant"

ATS_SCORING_PROMPT = """You are an ATS (Applicant Tracking System) Expert. 
Score the following Resume against the Job Description.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Return ONLY a JSON object with:
{{
  "ats_score": <0-100>,
  "matched_keywords": ["list of strings"],
  "missing_keywords": ["list of strings"],
  "alignment_summary": "1-sentence summary of fit"
}}"""

STUDY_GUIDE_PROMPT = """You are a Technical Mentor for a Fresher Product Manager. 
Analyze the Job Description against the Candidate's Resume. Identify what they need to LEARN before applying.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Return ONLY a JSON object with:
{{
  "skill_gaps": ["list of tech/skills missing"],
  "business_context": "Brief summary of the company's product/market",
  "research_prompts": ["3 specific topics to research to impress the interviewer"]
}}"""

TAILORING_PROMPT = """You are a Professional Resume Writer specializing in ATS bypass.
Improve the resume to better match the Job Description.

CONSTRAINTS:
1. DO NOT add fake experience or skills.
2. Weave in the missing keywords naturally.
3. Use a single-column layout (Markdown).
4. NO tables or complex formatting.
5. Focus on the most relevant {missing_keywords}.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Return ONLY the improved resume text in clean Markdown format. 
NO conversational filler, NO "Here is your resume", JUST the resume content."""

class ATSService:
    def _get_groq_client(self) -> Groq:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set")
        return Groq(api_key=api_key)

    async def calculate_ats_score(self, resume_text: str, jd_text: str) -> Dict[str, Any]:
        """Calculates semantic ATS match score and extracts keywords."""
        try:
            client = self._get_groq_client()
            response = client.chat.completions.create(
                messages=[{"role": "user", "content": ATS_SCORING_PROMPT.format(resume_text=resume_text[:4000], job_description=jd_text[:3000])}],
                model=SPEED_MODEL,
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"ATS Scoring failed: {e}")
            return {"ats_score": 0, "matched_keywords": [], "missing_keywords": [], "alignment_summary": "Scoring failed"}

    async def generate_study_guide(self, resume_text: str, jd_text: str) -> Dict[str, Any]:
        """Generates a pre-flight study guide for the candidate."""
        try:
            client = self._get_groq_client()
            response = client.chat.completions.create(
                messages=[{"role": "user", "content": STUDY_GUIDE_PROMPT.format(resume_text=resume_text[:4000], job_description=jd_text[:3000])}],
                model=REASONING_MODEL,
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Study Guide generation failed: {e}")
            return {"skill_gaps": [], "business_context": "Failed to analyze", "research_prompts": []}

    async def optimize_resume(
        self, 
        session: AsyncSession,
        job_id: str,
        original_resume: str,
        jd_text: str,
        max_iterations: int = 3
    ) -> ResumeVariant:
        """The 3-iteration optimization loop."""
        current_text = original_resume
        best_variant = None
        
        for i in range(1, max_iterations + 1):
            # 1. Analyze current version
            analysis = await self.calculate_ats_score(current_text, jd_text)
            score = analysis.get("ats_score", 0)
            
            # 2. Stop if already strong
            if score >= 75:
                status = "PASS"
                break
            
            # 3. Tailor (Improvement)
            try:
                client = self._get_groq_client()
                tailor_response = client.chat.completions.create(
                    messages=[{"role": "user", "content": TAILORING_PROMPT.format(
                        resume_text=current_text[:4000], 
                        job_description=jd_text[:3000],
                        missing_keywords=", ".join(analysis.get("missing_keywords", [])[:5])
                    )}],
                    model=REASONING_MODEL,
                    temperature=0.3
                )
                current_text = tailor_response.choices[0].message.content
            except Exception as e:
                logger.error(f"Tailoring iteration {i} failed: {e}")
                break
            
        # Final pass analysis
        final_analysis = await self.calculate_ats_score(current_text, jd_text)
        final_score = final_analysis.get("ats_score", 0)
        
        # 4. Save the Final Optimized Variant
        variant = ResumeVariant(
            job_id=job_id,
            filename=f"ats_optimized_v{i}_{job_id[:8]}.md",
            content=current_text,
            ats_score=final_score,
            version=i,
            status="PASS" if final_score >= 75 else "FAIL",
            keywords=final_analysis.get("matched_keywords", [])
        )
        
        session.add(variant)
        await session.commit()
        await session.refresh(variant)
        return variant

ats_service = ATSService()
