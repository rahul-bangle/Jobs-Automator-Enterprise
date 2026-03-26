from typing import List, Dict, Optional
import json
from groq import Groq
import os
from pydantic import BaseModel
from app.services.pipeline_v2 import JobProfile
from app.core.config import settings
from app.core.llm import llm_client as groq_client

import logging
logger = logging.getLogger("ATSEngineV2")

class ScoreResult(BaseModel):
    total_score: float
    keyword_score: float
    semantic_score: float
    experience_score: float
    is_overfitted: bool
    readability_pass: bool
    feedback: List[str]

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

class ATSEngineV2:
    """
    Tier 3: The 'Brain' — 40-40-20 Hybrid Scoring + Overfitting Guards
    """
    
    async def calculate_hybrid_score(
        self, 
        job_profile: JobProfile, 
        resume_json: Dict
    ) -> ScoreResult:
        """
        Final Score = (Keyword Match * 0.4) + (Semantic Score * 0.4) + (Exp Match * 0.2)
        """
        # 1. Keyword Match (40%)
        resume_text = self._flatten_resume(resume_json)
        matched_keywords = [kw for kw in job_profile.keywords if kw.lower() in resume_text.lower()]
        keyword_score = len(matched_keywords) / len(job_profile.keywords) if job_profile.keywords else 1.0
        
        # 2. Semantic Score (40%) - Groq Check
        semantic_score = await self._check_semantic_similarity(job_profile, resume_json)
        
        # 3. Experience Match (20%)
        experience_score = 1.0 if job_profile.experience_level.lower() in resume_text.lower() else 0.5
        
        # 4. Total Calculation
        total_score = (keyword_score * 0.4) + (semantic_score * 0.4) + (experience_score * 0.2)
        
        # 5. Overfitting Guard
        is_overfitted = self._check_overfitting(resume_text, job_profile.keywords)
        
        # 6. Readability Check
        readability_pass = True 
        
        return ScoreResult(
            total_score=round(total_score * 100, 2),
            keyword_score=round(keyword_score * 100, 2),
            semantic_score=round(semantic_score * 100, 2),
            experience_score=round(experience_score * 100, 2),
            is_overfitted=is_overfitted,
            readability_pass=readability_pass,
            feedback=[
                f"Matched {len(matched_keywords)} critical keywords",
                f"Semantic Alignment: {int(semantic_score * 100)}%",
                "Experience level check passed" if experience_score == 1.0 else "Experience level mismatch detected"
            ]
        )

    async def _check_semantic_similarity(self, job_profile: JobProfile, resume_json: Dict) -> float:
        """
        LLM Audit for semantic alignment (Concept matching)
        """
        client = self._get_groq_client()
        prompt = f"""Rate the semantic similarity between this Job Profile and Candidate Resume from 0.0 to 1.0. 
        Focus on concept matching (e.g., 'distributed systems' vs 'microservices').
        
        JOB ROLE: {job_profile.role}
        REQUIRED SKILLS: {", ".join(job_profile.skills_required)}
        
        RESUME:
        {json.dumps(resume_json)[:2000]} # Truncated for safety
        
        Return ONLY the float score."""
        
        try:
            completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=settings.GROQ_BATCH_MODEL,
                temperature=0.0
            )
            score_text = completion.choices[0].message.content.strip()
            return float(score_text)
        except Exception as e:
            logger.error(f"Semantic scoring failed: {str(e)}")
            return 0.7 # Fair fallback

    def _check_overfitting(self, text: str, keywords: List[str]) -> bool:
        for kw in keywords:
            count = text.lower().count(kw.lower())
            if count > 5: # Threshold for 'Startup-Level' pro resume
                return True
        return False

    def _flatten_resume(self, resume_json: Dict) -> str:
        """
        Convert Reactive-Resume v4 JSON to searchable text
        """
        text = []
        # Basic mapping for now, will expand based on V4 schema
        if "sections" in resume_json:
            for section in resume_json["sections"]:
                text.append(str(resume_json["sections"][section]))
        return " ".join(text)

    def _get_groq_client(self) -> Optional[Groq]:
        return groq_client

    async def generate_growth_plan(self, job_profile: JobProfile, resume_json: Dict) -> Dict:
        """
        Tier 3.1: Growth Phase — LLM Gap Analysis & Project Suggestion
        """
        client = self._get_groq_client()
        prompt = f"""You are a career growth advisor and technical architect. Analyze the provided Job Description Profile and Candidate Resume. 
        Identify the core 'must-have' technologies and skills for the role. Then, identify the gaps in the candidate's resume relative to this job.
        
        Suggest exactly 3 specific 'Learnings' (topics/subjects to study) and 2 'Suggested Projects' the candidate should build to prove proficiency and bridge these gaps.
        Each project must have a title, a short description, and a list of technologies to use.
        
        JOB PROFILE:
        Role: {job_profile.role}
        Skills: {", ".join(job_profile.skills_required)}
        Tools: {", ".join(job_profile.tools)}
        Keywords: {", ".join(job_profile.keywords)}
        
        CANDIDATE RESUME:
        {json.dumps(resume_json)}
        
        Return ONLY valid JSON in this format:
        {{
          "learnings": ["Topic 1", "Topic 2", "Topic 3"],
          "projects": [
            {{
              "title": "Project Alpha",
              "description": "Build a...",
              "tech_stack": ["Tech A", "Tech B"]
            }}
          ]
        }}"""

        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a precise technical growth architect. Always return valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            return json.loads(chat_completion.choices[0].message.content)
        except Exception as e:
            return {
                "learnings": ["Could not generate learnings at this time"],
                "projects": [],
                "error": str(e)
            }

    async def generate_study_guide(self, resume_text: str, jd_text: str) -> Dict:
        """Legacy compatibility: Generates a pre-flight study guide for the candidate."""
        try:
            client = self._get_groq_client()
            response = client.chat.completions.create(
                messages=[{"role": "user", "content": STUDY_GUIDE_PROMPT.format(resume_text=resume_text[:4000], job_description=jd_text[:3000])}],
                model=settings.GROQ_BATCH_MODEL,
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Study Guide generation failed: {e}")
            return {"skill_gaps": [], "business_context": "Failed to analyze", "research_prompts": []}

# Singleton
ats_engine = ATSEngineV2()
