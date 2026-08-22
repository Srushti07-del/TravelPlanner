import os
import httpx
from typing import List, Dict, Optional

_TIMEOUT = 10.0

class PlacesService:
    BASE_URL = "https://maps.googleapis.com/maps/api"

    async def _make_request(self, endpoint: str, params: Dict) -> Dict:
        api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        if not api_key:
            return {}
        params["key"] = api_key
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/{endpoint}", params=params)
                if response.status_code == 200:
                    return response.json()
        except httpx.HTTPError:
            pass
        return {}

    async def resolve_place(self, name: str, destination: str) -> Optional[Dict]:
        """Best-effort lookup of real place data for a given name.

        Returns normalized dict with real lat/lng/rating/address/maps_url, or
        None when the key is missing, the API fails, or no result is found.
        Never raises — callers fall back to existing (LLM) values.
        """
        query = f"{name} {destination}".strip()
        try:
            data = await self._make_request("place/textsearch/json", {"query": query})
        except Exception:
            return None
        results = data.get("results", [])
        if not results:
            return None
        top = results[0]
        geo = top.get("geometry", {}).get("location", {})
        lat = geo.get("lat")
        lng = geo.get("lng")
        if lat is None or lng is None:
            return None
        return {
            "name": top.get("name", name),
            "lat": lat,
            "lng": lng,
            "rating": top.get("rating"),
            "address": top.get("formatted_address"),
            "google_maps_url": f"https://maps.google.com/?q={top.get('place_id', '')}",
        }

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
