import asyncio
import json
import logging
import os
from app.core.db import async_session_maker
from app.models.base import Job
from app.services.tailor_engine_v2 import tailor_service
from app.services.pipeline_v2 import discovery_service, JobProfile
from sqlalchemy import select

# Configure logging
logging.basicConfig(level=logging.INFO)

async def run_trial():
    # 1. Selection: Pick the PepsiCo job
    target_id = "9818d8bcc8be7ad3d23847839e810961717f85a48cee01cfdd472426b633e50f"
    
    async with async_session_maker() as db:
        res = await db.execute(select(Job).filter(Job.id == target_id))
        job = res.scalar_one_or_none()
        
        if not job:
            print(f"ERROR: Job {target_id} not found.")
            return

        print(f"Target Job Loaded: {job.job_title} at {job.company_name}")

        # 2. Get Job Profile
        print("Analyzing Job Description...")
        job_profile = JobProfile(
            role=job.job_title,
            skills_required=["Sales", "Operations", "Team Management"],
            tools=["Excel", "CRM", "ERP"],
            experience_level="Mid-Senior",
            keywords=["Revenue", "Supply Chain", "Sales Ops"],
            soft_skills=["Leadership"]
        )
        print(f"Analysis Complete. Role detected: {job_profile.role}")

        # 3. Define Base Resume
        base_resume = {
            "basics": {
                "name": "Rahul Bangle",
                "label": "Full Stack Developer & Technical Lead",
                "summary": "Experienced developer skilled in Python, JS, and automation."
            },
            "sections": {
                "experience": "Lead Developer at TechCorp. Managed sales automation tools and operational workflows using Python and React.",
                "skills": ["Python", "SQL", "Automation", "Leadership"]
            }
        }

        # 4. Tailor Loop
        print("Starting Recursive Tailoring Loop (3 iterations max)...")
        result = await tailor_service.optimize_resume(base_resume, job_profile, max_iterations=2)

        # 5. Output Result
        print("\n" + "="*50)
        print("TAILORING TRIAL COMPLETED")
        print(f"Best Score Reached: {result['best_score']}%")
        print(f"Iterations: {len(result['version_history'])}")
        print("="*50)
        
        # Save final resume
        with open("tailored_resume_trial.json", "w") as f:
            json.dump(result["final_resume"], f, indent=2)
        print("Final resume saved to 'tailored_resume_trial.json'")

if __name__ == "__main__":
    asyncio.run(run_trial())
