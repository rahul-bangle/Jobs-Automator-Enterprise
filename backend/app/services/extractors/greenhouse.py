from .base import BaseExtractor
from bs4 import BeautifulSoup
from typing import Dict, Any

class GreenhouseExtractor(BaseExtractor):
    def can_handle(self, url: str) -> bool:
        return "boards.greenhouse.io" in url

    async def extract(self, url: str, html: str) -> Dict[str, Any]:
        soup = BeautifulSoup(html, 'html.parser')
        
        # Greenhouse usually has 'app-title' and 'location'
        title = soup.find('h1', class_='app-title')
        company = soup.find('span', class_='company-name')
        location = soup.find('div', class_='location')
        
        return {
            "job_title": self.clean_text(title.get_text()) if title else "Unknown Title",
            "company_name": self.clean_text(company.get_text()) if company else "Unknown Company",
            "location": self.clean_text(location.get_text()) if location else "Unknown Location",
            "source_url": url,
            "ats_type": "greenhouse"
        }
