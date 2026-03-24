import asyncio
import os
import sys
from datetime import datetime
from sqlmodel import select
from app.core.db import async_session_maker, engine, init_db
from app.models.base import User, Campaign, Job, ScoringWeights
from app.services.scoring import score_job
from app.core.config import settings

# Ensure app is in path
sys.path.append(os.getcwd())

async def test_flow():
    print("--- STARTING END-TO-END INTELLIGENCE TEST (FIXED) ---")
    
    # 1. Initialize DB
    await init_db()
    
    async with async_session_maker() as session:
        print("Session opened.")
        
        # 3. Ensure Default Weights exist
        result = await session.execute(select(ScoringWeights))
        weights = result.scalars().first()
        if not weights:
            print("Seeding default scoring weights...")
            weights = ScoringWeights()
            session.add(weights)
            await session.commit()
        else:
            print("Scoring weights found.")

        # 4. Check for test user
        result = await session.execute(select(User).where(User.email == "test@example.com"))
        user = result.scalars().first()
        if not user:
            print("Seeding test user...")
            user = User(email="test@example.com", hashed_password="hashed_password", full_name="Test User")
            session.add(user)
            await session.commit()
            await session.refresh(user)
        else:
            print("Test user found.")

        # 5. Check for active campaign
        result = await session.execute(select(Campaign).where(Campaign.user_id == user.id, Campaign.is_active == True))
        campaign = result.scalars().first()
        if not campaign:
            print("Seeding active campaign...")
            campaign = Campaign(
                user_id=user.id,
                target_role="Product Manager",
                target_locations="Remote, New York",
                experience_level="Mid-Senior",
                tech_stack="Python, SQL, Jira, Agile",
                is_active=True
            )
            session.add(campaign)
            await session.commit()
            await session.refresh(campaign)
        else:
            print("Active campaign found.")

        # 6. Create a Test Job
        job_title = "Senior Product Manager"
        company = "TechCorp Solutions"
        location = "Remote"
        job_id = Job.generate_id(company, job_title, location)
        
        job = await session.get(Job, job_id)
        if not job:
            print(f"Creating test job: {job_title} at {company}...")
            job = Job(
                id=job_id,
                company_name=company,
                job_title=job_title,
                location=location,
                source_url="https://example.com/job/123",
                description="Looking for a Senior PM with experience in Python and Agile methodologies to lead our core automation team."
            )
            session.add(job)
            await session.commit()
            await session.refresh(job)
        else:
            print(f"Test job found: {job.job_title}")

        # 7. TRIGGER SCORING
        print("\n--- TRIGGERING GROQ SCORING ENGINE ---")
        candidate_profile = f"Role: {campaign.target_role}, Tech: {campaign.tech_stack}, Experience: {campaign.experience_level}"
        
        score_result = await score_job(
            session=session,
            job_title=job.job_title,
            company_name=job.company_name,
            location=job.location,
            description=job.description,
            candidate_profile=candidate_profile
        )
        
        # Persist the score to the Job record
        job.relevance_score = score_result.get("overall_score", 0)
        job.fit_summary = score_result.get("why_this_job", "")
        job.score_breakdown = score_result.get("score_breakdown", {})
        job.risk_flags = score_result.get("risk_flags", [])
        
        session.add(job)
        await session.commit()

        print("\n--- TEST RESULT SUMMARY ---")
        print(f"Job: {job.job_title} @ {job.company_name}")
        print(f"Overall Score: {job.relevance_score}%")
        print(f"Breakdown: {job.score_breakdown}")
        print(f"Why this job: {job.fit_summary}")
        print(f"Risk Flags: {job.risk_flags}")
        
    print("\n--- TEST FLOW COMPLETE ---")

if __name__ == "__main__":
    asyncio.run(test_flow())
