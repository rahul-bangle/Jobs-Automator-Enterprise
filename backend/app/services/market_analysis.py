"""
Market Analysis Service — Groq (llama-3.3-70b-versatile)
Aggregates skills and requirements across all ingested jobs.
Returns top skills, tools, and portfolio project recommendations.
"""
import os
import json
from groq import Groq
from typing import List, Dict

ANALYSIS_MODEL = "llama-3.3-70b-versatile"

MARKET_ANALYSIS_PROMPT = """You are a job market analyst. Analyze these job descriptions and return ONLY valid JSON with no markdown.

JOB TITLES AND DESCRIPTIONS:
{jobs_summary}

Return exactly this JSON structure:
{{
  "top_skills": [
    {{"skill": "<skill name>", "frequency": <count>, "importance": "high|medium|low"}}
  ],
  "top_tools": [
    {{"tool": "<tool name>", "frequency": <count>}}
  ],
  "experience_range": {{
    "min_years": <number>,
    "max_years": <number>,
    "fresher_friendly": <true|false>
  }},
  "common_keywords": ["<keyword1>", "<keyword2>"],
  "recommended_projects": [
    {{
      "project_title": "<title>",
      "skills_covered": ["<skill1>"],
      "description": "<1-sentence description>",
      "difficulty": "beginner|intermediate|advanced"
    }}
  ]
}}"""


def get_groq_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set in environment")
    return Groq(api_key=api_key)


async def analyze_market(jobs: List[Dict]) -> dict:
    """Aggregate market insights from a batch of jobs using Groq."""
    try:
        client = get_groq_client()

        # Build compact job summary (cap at 25 jobs to stay within token limits)
        jobs_summary = "\n".join([
            f"- {j.get('job_title', 'N/A')} at {j.get('company_name', 'N/A')}: {str(j.get('description', ''))[:300]}"
            for j in jobs[:25]
        ])

        prompt = MARKET_ANALYSIS_PROMPT.format(jobs_summary=jobs_summary)

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise market analysis engine. Always return valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=ANALYSIS_MODEL,
            temperature=0.2,
            response_format={"type": "json_object"}
        )

        raw = chat_completion.choices[0].message.content
        return json.loads(raw)

    except Exception as e:
        return {
            "error": str(e),
            "top_skills": [],
            "top_tools": [],
            "recommended_projects": []
        }
