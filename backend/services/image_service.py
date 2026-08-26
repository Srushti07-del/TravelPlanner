import os
import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class ImageService:
    def __init__(self):
        self.access_key = os.getenv("UNSPLASH_ACCESS_KEY")
        self.base_url = "https://api.unsplash.com"
        self._cache = {}
        
        # Default beautiful placeholder images
        self.default_images = [
            "https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1600",
            "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1600",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600",
            "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1600"
        ]
        
        # Location specific fallbacks in case API rate limit is hit
        self.fallback_mapping = {
            "amalfi": "https://images.unsplash.com/photo-1533656338503-b22f63e96cd8?q=80&w=1600",
            "cape town": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1600",
            "lake district": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600",
            "kyoto": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1600",
            "banff": "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?q=80&w=1600",
            "santorini": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1600"
        }

    async def get_image_for_destination(self, query: str) -> str:
        """Fetch a relevant high-resolution image URL from Unsplash based on a query."""
        if query in self._cache:
            return self._cache[query]
            
        if not self.access_key:
            logger.warning("UNSPLASH_ACCESS_KEY is not set. Using fallback images.")
            return self._get_fallback_image(query)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/search/photos",
                    params={
                        "query": f"{query} landmark landscape",
                        "per_page": 1,
                        "orientation": "landscape"
                    },
                    headers={
                        "Authorization": f"Client-ID {self.access_key}"
                    },
                    timeout=5.0
                )
                response.raise_for_status()
                data = response.json()
                
                if data["results"]:
                    img_url = data["results"][0]["urls"]["regular"]
                    self._cache[query] = img_url
                    return img_url
                else:
                    return self._get_fallback_image(query)
                    
        except Exception as e:
            logger.error(f"Failed to fetch image from Unsplash for query '{query}': {e}")
            return self._get_fallback_image(query)
            
    def _get_fallback_image(self, query: str) -> str:
        """Returns a deterministic placeholder image based on the query string."""
        lower_query = query.lower()
        for key, url in self.fallback_mapping.items():
            if key in lower_query:
                return url
                
        index = hash(query) % len(self.default_images)
        return self.default_images[index]
