import sys
from pathlib import Path

# Add the current directory to sys.path
sys.path.append(str(Path(__file__).parent))

try:
    print("🚀 Testing module imports...")
    import job_scraper.settings as settings
    print(f"✅ Settings imported: {settings.BOT_NAME}")
    
    import job_scraper.middlewares as middlewares
    print("✅ Middlewares imported")
    
    import job_scraper.pipelines as pipelines
    print("✅ Pipelines imported")
    
    from job_scraper.spiders.test_spider import TestSpider
    print(f"✅ Spider found: {TestSpider.name}")
    
except Exception as e:
    print(f"❌ Error during import: {e}")
    import traceback
    traceback.print_exc()
