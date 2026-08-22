import os
import httpx
from typing import List, Dict

class PlacesService:
    BASE_URL = "https://maps.googleapis.com/maps/api"

    async def _make_request(self, endpoint: str, params: Dict) -> Dict:
        api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        if not api_key:
            return {}
        params["key"] = api_key
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.BASE_URL}/{endpoint}", params=params)
            if response.status_code == 200:
                return response.json()
        return {}

    async def search_places(self, query: str, location: str, type: str) -> List[Dict]:
        data = await self._make_request("place/textsearch/json", {
            "query": query,
            "location": location,
            "type": type
        })
        return data.get("results", [])

    async def get_place_details(self, place_id: str) -> Dict:
        data = await self._make_request("place/details/json", {
            "place_id": place_id,
            "fields": "name,rating,formatted_phone_number,geometry,opening_hours,website"
        })
        return data.get("result", {})

    async def get_nearby_places(self, lat: float, lng: float, radius: int, type: str) -> List[Dict]:
        data = await self._make_request("place/nearbysearch/json", {
            "location": f"{lat},{lng}",
            "radius": radius,
            "type": type
        })
        return data.get("results", [])

    async def get_distance_matrix(self, origins: List[str], destinations: List[str]) -> Dict:
        data = await self._make_request("distancematrix/json", {
            "origins": "|".join(origins),
            "destinations": "|".join(destinations)
        })
        return data
