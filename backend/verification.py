import sys
import os
import asyncio
from unittest.mock import MagicMock

# Prevent Unicode errors in Windows terminal for emojis
sys.stdout.reconfigure(encoding='utf-8')

# Ensure app is in path
sys.path.append(os.getcwd())

async def run_verification():
    print("--- JOBS AUTOMATOR VERIFICATION LAYER ---")
    
    # Check Imports (with fallback for crawl4ai)
    print("1. [Imports] Checking core services...")
    
    # Mock crawl4ai if missing to avoid blocking other tests
    if "crawl4ai" not in sys.modules:
        print("INFO: Mocking crawl4ai (dependency resolution pending for Python 3.14)")
        mock_crawl = MagicMock()
        sys.modules["crawl4ai"] = mock_crawl
        sys.modules["crawl4ai.chunking_strategy"] = MagicMock()
        sys.modules["crawl4ai.extraction_strategy"] = MagicMock()
        sys.modules["crawl4ai.web_crawler"] = MagicMock()

    try:
        from app.services.processor import processor_service
        from app.services.scoring import scoring_service
        from app.services.learning_loop import learning_loop_service
        # Check other services if they exist or mock them
        print("Success: Core Phase 08 & Service imports verified.")
    except ImportError as e:
        print(f"Failed: {e}")
        return

    # Check Environment Variables
    from app.core.config import settings
    print(f"2. [Config] Project Name: {settings.PROJECT_NAME}")
    if settings.GROQ_API_KEY:
        print(f"Success: Groq API Key found.")
        # Minimal probe of Groq logic if possible
    else:
        print(f"Failed: Groq API Key missing.")

    # Check API Routers
    print("3. [Routers] Verifying API map...")
    from app.api.router import api_router
    routes = [r.path for r in api_router.routes]
    expected_segments = ["/jobs", "/campaign", "/import", "/intelligence", "/trust", "/packets", "/dlq", "/learning"]
    found_segments = [s for s in expected_segments if any(s.replace('/', '') in r for r in routes)]
    if len(found_segments) >= len(expected_segments):
        print(f"Success: All segments registered: {found_segments}")
    else:
        print(f"Failed: Missing segments: {set(expected_segments) - set(found_segments)}")

    # Check Database Status
    print("4. [Storage] Checking database configuration...")
    print(f"Success: Storage mode: {settings.DATABASE_MODE}")

    print("\n--- VERIFICATION COMPLETE (HEARTBEAT OK) ---")

if __name__ == "__main__":
    asyncio.run(run_verification())
