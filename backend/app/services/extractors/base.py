from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseExtractor(ABC):
    @abstractmethod
    async def extract(self, url: str, html: str) -> Dict[str, Any]:
        """Extract job data from HTML."""
        pass

    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """Check if this extractor can handle the URL."""
        pass

    def clean_text(self, text: str) -> str:
        """Helper to clean whitespace and junk."""
        if not text:
            return ""
        return " ".join(text.split())
