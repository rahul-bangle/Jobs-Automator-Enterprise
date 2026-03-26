import logging
from typing import Dict, Any
from app.services.scoring import scoring_service # Using the same LLM service

logger = logging.getLogger("ResumeParser")

class ResumeParser:
    """Converts raw PDF text into high-fidelity Reactive-Resume JSON."""
    
    async def parse_text_to_json(self, text: str) -> Dict[str, Any]:
        """Uses LLM to extract structured data from resume text."""
        prompt = f"""
        You are an expert ATS (Applicant Tracking System) parser. 
        Extract all relevant information from the following resume text and format it into a valid Reactive-Resume JSON schema.
        
        REQUIRED FIELDS:
        - basics: {{ name, email, phone, location, profiles, summary, label }}
        - sections: {{ work: {{ items: [] }}, education: {{ items: [] }}, skills: {{ items: [] }}, projects: {{ items: [] }} }}
        
        RESUME TEXT:
        {text}
        
        RETURN ONLY VALID JSON. Do not include any markdown or explanations.
        """
        
        try:
            # Reusing the scoring service's shared client
            from app.services.scoring import client as groq_client
            
            if not groq_client:
                logger.error("Groq client not initialized. Check GROQ_API_KEY.")
                return {"basics": {"name": "Error: Missing API Key"}, "sections": {"work": {"items": []}}}

            completion = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"}
            )
            
            import json
            content = completion.choices[0].message.content
            return json.loads(content)
            
        except Exception as e:
            logger.error(f"Failed to parse resume via LLM: {e}")
            return {"basics": {"name": "Detected From Text"}, "sections": {"work": {"items": []}}}

resume_parser = ResumeParser()
