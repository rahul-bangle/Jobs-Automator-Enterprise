from typing import List, Dict
import json
from pydantic import BaseModel
from app.services.pipeline_v2 import JobProfile

class ScoreResult(BaseModel):
    total_score: float
    keyword_score: float
    semantic_score: float
    experience_score: float
    is_overfitted: bool
    readability_pass: bool
    feedback: List[str]

class ATSEngineV2:
    """
    Tier 3: The 'Brain' — 40-40-20 Hybrid Scoring + Overfitting Guards
    """
    
    def calculate_hybrid_score(
        self, 
        job_profile: JobProfile, 
        resume_json: Dict
    ) -> ScoreResult:
        """
        Final Score = (Keyword Match * 0.4) + (Semantic Score * 0.4) + (Exp Match * 0.2)
        """
        # 1. Keyword Match (40%)
        # Extract keywords from resume_json (Reactive-Resume v4 mapping)
        resume_text = self._flatten_resume(resume_json)
        matched_keywords = [kw for kw in job_profile.keywords if kw.lower() in resume_text.lower()]
        keyword_score = len(matched_keywords) / len(job_profile.keywords) if job_profile.keywords else 1.0
        
        # 2. Semantic Score (40%)
        # [Integrating with Groq API for Semantic Similarity check next]
        semantic_score = 0.85 # Placeholder for vector/concept match logic
        
        # 3. Experience Match (20%)
        # Check if experience level matches
        experience_score = 1.0 if job_profile.experience_level.lower() in resume_text.lower() else 0.5
        
        # 4. Total Calculation
        total_score = (keyword_score * 0.4) + (semantic_score * 0.4) + (experience_score * 0.2)
        
        # 5. Overfitting Guard (Rule: Do not repeat same keyword more than 5 times)
        is_overfitted = self._check_overfitting(resume_text, job_profile.keywords)
        
        # 6. Readability Check
        readability_pass = True # [LLM Audit Step Placeholder]
        
        return ScoreResult(
            total_score=round(total_score * 100, 2),
            keyword_score=round(keyword_score * 100, 2),
            semantic_score=round(semantic_score * 100, 2),
            experience_score=round(experience_score * 100, 2),
            is_overfitted=is_overfitted,
            readability_pass=readability_pass,
            feedback=[f"Matched {len(matched_keywords)} critical keywords"]
        )

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

# Singleton
ats_engine = ATSEngineV2()
