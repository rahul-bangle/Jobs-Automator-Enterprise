import asyncio
import httpx
import logging
from typing import Optional
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

class ProcessorService:
    def __init__(self):
        self.crawler = None

    async def _ensure_crawler(self):
        """Lazy load crawl4ai only if available."""
        if self.crawler is None:
            try:
                from crawl4ai import AsyncWebCrawler
                self.crawler = AsyncWebCrawler(verbose=True)
                await self.crawler.start()
            except (ImportError, Exception) as e:
                logger.warning(f"Crawl4AI not available, using BeautifulSoup fallback: {e}")
                self.crawler = False # Flag to avoid re-imports

    async def fetch_url(self, url: str) -> str:
        """Fetch raw HTML from a URL using httpx (SSL verify disabled for dev)."""
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, verify=False) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.text

    async def process_html(self, html_content: str) -> str:
        """
        Process raw HTML content. Fallback to BeautifulSoup if Crawl4AI is missing.
        """
        await self._ensure_crawler()
        
        # 1. Attempt Crawl4AI if it started successfully
        if self.crawler:
            try:
                result = await self.crawler.arun(
                    url="raw://", 
                    html=html_content,
                    bypass_cache=True
                )
                if result and result.markdown:
                    return result.markdown
            except Exception as e:
                logger.error(f"Crawl4AI processing failed: {e}")

        # 2. Robust Fallback: BeautifulSoup4
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Remove scripts, styles, and other noisy tags
            for element in soup(['script', 'style', 'nav', 'footer', 'header']):
                element.decompose()
            
            # Extract plain text with preservation of some structure
            text = soup.get_text(separator='\n')
            # Clean up extra whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = '\n'.join(chunk for chunk in chunks if chunk)
            
            return text
        except Exception as e:
            logger.error(f"BeautifulSoup fallback failed: {e}")
            return "Failed to extract content from HTML"

    async def __aenter__(self):
        await self._ensure_crawler()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.crawler and hasattr(self.crawler, 'close'):
            await self.crawler.close()

processor_service = ProcessorService()
