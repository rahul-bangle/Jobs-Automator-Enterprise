import asyncio
import sys
import os
from app.services.processor import processor_service

# Ensure app is in path
sys.path.append(os.getcwd())

async def test_fetch():
    output_file = "test_output.txt"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("--- STARTING AUTO-FETCH LITE TEST ---\n")
        
        test_url = "https://example.com"
        
        try:
            f.write(f"1. Fetching URL: {test_url}...\n")
            html = await processor_service.fetch_url(test_url)
            f.write(f"Success: Fetched {len(html)} characters.\n")
            
            f.write("\n2. Processing content (BeautifulSoup Fallback)...\n")
            content = await processor_service.process_html(html)
            
            f.write("\n--- EXTRACTED CONTENT PREVIEW ---\n")
            f.write(content[:500] + "\n")
            f.write("---------------------------------\n")
            
            if len(content) > 50:
                f.write("\n✅ AUTO-FETCH LITE VERIFIED.\n")
            else:
                f.write("\n❌ Extraction seems insufficient.\n")
                
        except Exception as e:
            f.write(f"\n❌ TEST FAILED: {e}\n")

if __name__ == "__main__":
    asyncio.run(test_fetch())
