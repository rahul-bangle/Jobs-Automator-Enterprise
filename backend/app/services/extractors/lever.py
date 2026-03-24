from .base import BaseExtractor
from bs4 import BeautifulSoup
from typing import Dict, Any

class LeverExtractor(BaseExtractor):
    def can_handle(self, url: str) -> bool:
        return "jobs.lever.co" in url

    async def extract(self, url: str, html: str) -> Dict[str, Any]:
        soup = BeautifulSoup(html, 'html.parser')
        
        # Lever usually has 'posting-header' and 'posting-category'
        title = soup.find('h2')
        company = soup.find('img', class_='main-header-logo') # Placeholder if logo title not found
        location = soup.find('div', class_='sort-by-time') # Placeholder for location
        
        return {
            "job_title": self.clean_text(title.get_text()) if title else "Unknown Title",
            "company_name": "Unknown Company", # Lever often hides this in the URL
            "location": "Remote / TBD",
            "source_url": url,
            "ats_type": "lever"
        }
