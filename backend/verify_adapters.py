import asyncio
from app.services.extractors.service import extractor_service

async def verify():
    test_urls = [
        "https://boards.greenhouse.io/example/jobs/12345",
        "https://jobs.lever.co/example/id",
        "https://jobs.ashbyhq.com/example/id"
    ]
    
    # Mock HTML content
    mock_html = "<html><body><h1>Sample Job</h1><div class='location'>New York</div></body></html>"
    
    print("--- Verifying Job Adapters ---")
    for url in test_urls:
        print(f"\nTesting URL: {url}")
        result = await extractor_service.extract_job(url, mock_html)
        if result:
            print(f"✅ Success: {result}")
        else:
            print(f"❌ Failed to find adapter for {url}")

if __name__ == "__main__":
    asyncio.run(verify())
