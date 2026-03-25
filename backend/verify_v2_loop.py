import asyncio
import sys
import os
from datetime import datetime

# Mocking the environment for verification
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "."))
if backend_path not in sys.path:
    sys.path.append(backend_path)

try:
    print("📦 Importing Phase 06 Services...")
    from app.services.pipeline_v2 import JobProfile
    from app.services.ats_engine_v2 import ats_engine
    from app.services.tailor_engine_v2 import tailor_service
    from app.services.submission_agent import submission_agent
    print("✅ Imports Successful.")
except Exception as e:
    print(f"❌ IMPORT ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

async def run_verification(test_id: int):
    print(f"\n--- VERIFICATION RUN {test_id} ---")
    # ... rest of the logic ...
    # [Including the previously written logic here for completeness]
    mock_profile = JobProfile(
        role="Product Manager",
        skills_required=["Agile", "SQL"],
        tools=["Jira"],
        experience_level="Mid",
        keywords=["PRD", "Backlog", "Roadmap", "Sprint", "Stakeholder"],
        soft_skills=["Leadership"]
    )
    base_resume = {"basics": {"name": "Verify Bot"}, "sections": {"summary": "Experienced PM"}}
    
    if test_id == 1:
        print("🔍 Testing Happy Path Discovery -> Optimized PASS...")
        result = await tailor_service.optimize_resume(base_resume, mock_profile)
        assert result['best_score'] >= 75
        print(f"✅ Happy Path Passed with score: {result['best_score']}%")
    elif test_id == 2:
        print("🔍 Testing Overfitting Guard (Keyword Stuffing prevention)...")
        stuff_resume = {"basics": {"name": "Keyword Bot"}, "sections": {"summary": "Roadmap Roadmap Roadmap Roadmap Roadmap Roadmap"}}
        score_result = ats_engine.calculate_hybrid_score(mock_profile, stuff_resume)
        assert score_result.is_overfitted == True
        print(f"✅ Overfitting Guard successfully blocked unnatural stuffing.")
    elif test_id == 3:
        print("🔍 Testing Safety Gate (Score < 75 blocking)...")
        bad_resume_res = {"best_score": 50, "final_resume": {"basics": {"name": "Fail Bot"}}}
        outcome = await submission_agent.process_submission({"url": "http://test.com"}, bad_resume_res)
        assert outcome['status'] == 'blocked'
        print(f"✅ Safety Gate successfully blocked sub-par submission.")

async def main():
    for i in range(1, 4):
        await run_verification(i)
    print("\n🏆 ALL VERIFICATIONS PASSED 3/3 — SYSTEM IS STABLE.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
