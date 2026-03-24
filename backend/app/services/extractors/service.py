from typing import List, Optional, Dict, Any
from .base import BaseExtractor
from .greenhouse import GreenhouseExtractor

from .base import BaseExtractor
from .greenhouse import GreenhouseExtractor
from .lever import LeverExtractor
from .ashby import AshbyExtractor

class ExtractorService:
    def __init__(self):
        self.extractors: List[BaseExtractor] = [
            GreenhouseExtractor(),
            LeverExtractor(),
            AshbyExtractor(),
        ]

    async def extract_job(self, url: str, html: str) -> Optional[Dict[str, Any]]:
        for extractor in self.extractors:
            if extractor.can_handle(url):
                return await extractor.extract(url, html)
        return None

extractor_service = ExtractorService()
