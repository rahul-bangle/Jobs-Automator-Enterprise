import os
import json
from app.core.config import settings
from app.core.llm import llm_client as client
from typing import Optional, Dict, Any
from groq import Groq
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.learning_loop import learning_loop_service

# Models
REASONING_MODEL = "llama-3.3-70b-versatile"
SPEED_MODEL = "llama-3.1-8b-instant"

SCORING_PROMPT = """You are a job relevance analyst. Score this job for the candidate and return ONLY valid JSON with no markdown, no explanation.

CANDIDATE PROFILE:
{candidate_profile}

JOB DETAILS:
Title: {job_title}
Company: {company_name}
Location: {location}
Description: {description}

CURRENT WEIGHTS:
Skill Match: {skill_w}%
Keyword Match: {keyword_w}%
Experience Match: {experience_w}%
Location Match: {location_w}%

Return exactly this JSON structure:
{{
  "score_breakdown": {{
    "skill_match": <0-100>,
    "keyword_match": <0-100>,
    "experience_match": <0-100>,
    "location_match": <0-100>
  }},
  "why_this_job": "<2-sentence reason why this job is recommended for this candidate>",
  "risk_flags": ["<optional list of concerns, can be empty list>"]
}}"""


class ScoringService:
    def _get_groq_client(self) -> Optional[Groq]:
        return client

    async def score_job(
        self,
        session: AsyncSession,
        job_title: str,
        company_name: str,
        location: str,
        description: str,
        candidate_profile: str,
        use_speed_model: bool = False
    ) -> Dict[str, Any]:
        """Call Groq to score a job with white-box breakdown, incorporating learned weights."""
        
        # 1. Get dynamically tuned weights from the Learning Loop
        weights = await learning_loop_service.get_current_weights(session)
        
        model = SPEED_MODEL if use_speed_model else REASONING_MODEL

        try:
            client = self._get_groq_client()
            if not client:
                raise ValueError("Groq client not initialized. Check GROQ_API_KEY.")
                
            prompt = SCORING_PROMPT.format(
                candidate_profile=str(candidate_profile),  # ensure string
                job_title=job_title,
                company_name=company_name,
                location=location,
                description=str(description)[:3000] if description else "N/A",  # Token guard
                skill_w=int(weights.skill_match_weight * 100),
                keyword_w=int(weights.keyword_match_weight * 100),
                experience_w=int(weights.experience_match_weight * 100),
                location_w=int(weights.location_match_weight * 100)
            )

            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a precise job scoring engine. Always return valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model=model,
                temperature=0.1,  # Low temp for consistent scoring
                response_format={"type": "json_object"}  # Force JSON mode
            )

            raw = chat_completion.choices[0].message.content
            data = json.loads(raw)
            
            # 2. Calculate overall weighted score based on learned weights
            breakdown = data.get("score_breakdown", {})
            overall_score = (
                breakdown.get("skill_match", 0) * weights.skill_match_weight +
                breakdown.get("keyword_match", 0) * weights.keyword_match_weight +
                breakdown.get("experience_match", 0) * weights.experience_match_weight +
                breakdown.get("location_match", 0) * weights.location_match_weight
            )
            
            data["overall_score"] = float(overall_score / 100.0) # Scale back to 0-1
            return data

        except Exception as e:
            return {
                "score_breakdown": {
                    "skill_match": 0,
                    "keyword_match": 0,
                    "experience_match": 0,
                    "location_match": 0
                },
                "overall_score": 0.0,
                "why_this_job": f"Scoring failed: {str(e)}",
                "risk_flags": ["scoring_error"]
            }

scoring_service = ScoringService()
