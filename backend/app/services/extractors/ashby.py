from .base import BaseExtractor
from bs4 import BeautifulSoup
from typing import Dict, Any

class AshbyExtractor(BaseExtractor):
    def can_handle(self, url: str) -> bool:
        return "jobs.ashbyhq.com" in url

    async def extract(self, url: str, html: str) -> Dict[str, Any]:
        soup = BeautifulSoup(html, 'html.parser')
        
        # Ashby usually has <h1> for title
        title = soup.find('h1')
        location = soup.find('div', class_='location')
        
        return {
            "job_title": self.clean_text(title.get_text()) if title else "Unknown Title",
            "company_name": "Unknown Company",
            "location": self.clean_text(location.get_text()) if location else "Unknown Location",
            "source_url": url,
            "ats_type": "ashby"
        }
