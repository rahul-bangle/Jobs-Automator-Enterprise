# Phase 05 Concepts: ATS Optimization Engine

## 1. Data Schema Evolution
To support versioning and tracking of ATS optimization, we need to enhance the `ResumeVariant` model or add a new `ATSOptimization` model.

### Proposed `ResumeVariant` Updates:
- `content`: Text content of the tailored resume.
- `version`: Integer (0 for original, 1-3 for iterations).
- `ats_score`: Integer (0-100).
- `missing_keywords`: JSON list of keywords.
- `status`: String (PASS, FAIL, OPTIMIZING).
- `parent_variant_id`: Self-referential ID to track the chain of improvements.

---

## 2. Iterative Optimization Loop (Logic)
The core engine will reside in `backend/app/services/ats.py` (Singleton: `ats_service`).

```python
async def optimize_resume(resume_text: str, job_description: str, max_iterations=3):
    current_resume = resume_text
    for i in range(max_iterations):
        # 1. Score
        score, keywords = await self.calculate_ats_score(current_resume, job_description)
        
        if score >= 75:
            return {"status": "PASS", "resume": current_resume, "score": score, "iterations": i}
            
        # 2. Improve (LLM)
        current_resume = await self.llm_improve_resume(current_resume, job_description, keywords)
        
    # If still below 75 after max iterations
    final_score, final_keywords = await self.calculate_ats_score(current_resume, job_description)
    return {
        "status": "FAIL" if final_score < 75 else "PASS",
        "resume": current_resume,
        "score": final_score,
        "iterations": max_iterations
    }
```

---

## 3. Prompting Strategy (Groq)
We will use a specialized prompt to ensure:
- **No Hallucinations**: Prompt explicitly forbids adding unverified skills.
- **ATS Friendliness**: Output in clean Markdown, avoiding columns or complex tables that trip up older ATS.
- **Natural Integration**: Keywords are woven into bullet points, not just appended as a list.

---

## 4. Pipeline Integration
The `UnifiedPipeline` in `pipeline.py` will be updated:
1. ... (Scrape/Process)
2. **Score Job** (Existing Intelligence Layer)
3. **NEW: ATS Optimization** (Gatekeeper)
   - If Job score is high enough to proceed, call `ats_service.optimize_resume`.
   - Block progression to `ApplicationQueue` unless `ATSOptimization` returns `PASS`.
---

## 5. Pre-Flight Study Guide (The Learning Loop)
For freshers, the system will provide a a proactive "Intelligence Layer" before the application is finalized:
1. **Skill Gap Analysis**: Identify technologies in the JD that are missing from the candidate's core stack.
2. **Business Context**: Summarize the company's core products and market position.
3. **Research Prompts**: Generate 3 specific topics (e.g., "How they use React for real-time dashboards") for the candidate to study.
4. **The Goal**: Ensure the candidate is prepared for an interview or can mention specific product knowledge in the tailored resume.
