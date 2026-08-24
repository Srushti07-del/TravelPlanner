import asyncio
import httpx
import time
from typing import List, Dict, Optional

_TIMEOUT = 10.0

# Nominatim requires max 1 request per second for the public instance.
# We enforce this with a simple async lock + timestamp.
_nominatim_last_request = 0.0
_nominatim_lock = asyncio.Lock()

_HEADERS = {
    "User-Agent": "TravelPlanner/1.0 (student project; contact: travelplanner@example.com)",
    "Accept-Language": "en",
}


class PlacesService:
    """Place search and routing service using free/open APIs.

    Replaces the former Google Maps dependency with:
    - Nominatim (OpenStreetMap) for geocoding / text search
    - Overpass API for nearby place discovery
    - OSRM (public demo) for road distance / duration
    """

    NOMINATIM_URL = "https://nominatim.openstreetmap.org"
    OVERPASS_URL = "https://overpass-api.de/api/interpreter"
    OSRM_URL = "https://router.project-osrm.org"

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _nominatim_throttle(self) -> None:
        """Ensure at least 1 second between Nominatim requests."""
        global _nominatim_last_request
        async with _nominatim_lock:
            now = time.monotonic()
            wait = 1.0 - (now - _nominatim_last_request)
            if wait > 0:
                await asyncio.sleep(wait)
            _nominatim_last_request = time.monotonic()

    async def _nominatim_search(self, query: str, limit: int = 5) -> List[Dict]:
        """Search Nominatim for places matching a text query."""
        await self._nominatim_throttle()
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT, headers=_HEADERS) as client:
                response = await client.get(
                    f"{self.NOMINATIM_URL}/search",
                    params={
                        "q": query,
                        "format": "jsonv2",
                        "addressdetails": 1,
                        "limit": limit,
                    },
                )
                if response.status_code == 200:
                    return response.json()
        except (httpx.HTTPError, Exception):
            pass
        return []

    # ------------------------------------------------------------------
    # Public API — preserves signatures from the former Google service
    # ------------------------------------------------------------------

    async def resolve_place(self, name: str, destination: str) -> Optional[Dict]:
        """Best-effort lookup of real place data for a given name.

        Returns normalized dict with real lat/lng/address/maps_url, or
        None when the API fails or no result is found.
        Never raises — callers fall back to existing (LLM) values.
        """
        query = f"{name} {destination}".strip()
        try:
            results = await self._nominatim_search(query, limit=1)
        except Exception:
            return None

        if not results:
            return None

        top = results[0]
        try:
            lat = float(top.get("lat", 0))
            lng = float(top.get("lon", 0))
        except (TypeError, ValueError):
            return None

        if lat == 0.0 and lng == 0.0:
            return None

        address_parts = top.get("address", {})
        display_name = top.get("display_name", "")
        osm_id = top.get("osm_id", "")
        osm_type = top.get("osm_type", "")

        # Build an OpenStreetMap link
        maps_url = ""
        if osm_type and osm_id:
            maps_url = f"https://www.openstreetmap.org/{osm_type}/{osm_id}"

        return {
            "name": top.get("name") or top.get("display_name", name),
            "lat": lat,
            "lng": lng,
            "rating": None,  # OSM does not provide ratings
            "address": display_name,
            "maps_url": maps_url,
        }

    async def search_places(self, query: str, location: str, type: str) -> List[Dict]:
        """Search for places matching a query near a location."""
        full_query = f"{query} {location}".strip() if location else query
        results = await self._nominatim_search(full_query, limit=10)

        places = []
        for r in results:
            try:
                lat = float(r.get("lat", 0))
                lon = float(r.get("lon", 0))
            except (TypeError, ValueError):
                continue

            osm_id = r.get("osm_id", "")
            osm_type = r.get("osm_type", "")
            maps_url = ""
            if osm_type and osm_id:
                maps_url = f"https://www.openstreetmap.org/{osm_type}/{osm_id}"

            places.append({
                "name": r.get("name") or r.get("display_name", ""),
                "formatted_address": r.get("display_name", ""),
                "geometry": {"location": {"lat": lat, "lng": lon}},
                "types": [r.get("category", ""), r.get("type", "")],
                "place_id": f"osm:{osm_type}:{osm_id}",
                "maps_url": maps_url,
            })
        return places

    async def get_place_details(self, place_id: str) -> Dict:
        """Get details for a place. Accepts OSM-style IDs."""
        # For Nominatim we do a reverse lookup if we have coords,
        # otherwise return empty since OSM doesn't have a place_id system like Google.
        return {}

    async def get_nearby_places(
        self, lat: float, lng: float, radius: int, type: str
    ) -> List[Dict]:
        """Find nearby places using the Overpass API."""
        # Map common type strings to OSM tags
        tag_mapping = {
            "restaurant": '"amenity"="restaurant"',
            "cafe": '"amenity"="cafe"',
            "hotel": '"tourism"="hotel"',
            "museum": '"tourism"="museum"',
            "park": '"leisure"="park"',
            "temple": '"amenity"="place_of_worship"',
            "church": '"amenity"="place_of_worship"',
            "mosque": '"amenity"="place_of_worship"',
            "hospital": '"amenity"="hospital"',
            "pharmacy": '"amenity"="pharmacy"',
            "atm": '"amenity"="atm"',
            "bank": '"amenity"="bank"',
            "bar": '"amenity"="bar"',
            "tourist_attraction": '"tourism"="attraction"',
            "attraction": '"tourism"="attraction"',
        }

        osm_tag = tag_mapping.get(type.lower(), f'"amenity"="{type}"') if type else '"tourism"="attraction"'
        radius_m = min(radius, 10000)  # Cap at 10km to avoid overloading

        query = f"""
        [out:json][timeout:10];
        (
          node[{osm_tag}](around:{radius_m},{lat},{lng});
          way[{osm_tag}](around:{radius_m},{lat},{lng});
        );
        out center 20;
        """

        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT, headers=_HEADERS) as client:
                response = await client.post(
                    self.OVERPASS_URL,
                    data={"data": query},
                )
                if response.status_code != 200:
                    return []
                data = response.json()
        except (httpx.HTTPError, Exception):
            return []

        places = []
        for element in data.get("elements", []):
            tags = element.get("tags", {})
            name = tags.get("name")
            if not name:
                continue

            # For ways, use the center coordinates
            if element.get("type") == "way":
                center = element.get("center", {})
                elat = center.get("lat")
                elng = center.get("lon")
            else:
                elat = element.get("lat")
                elng = element.get("lon")

            if elat is None or elng is None:
                continue

            osm_id = element.get("id", "")
            osm_type = element.get("type", "node")
            maps_url = f"https://www.openstreetmap.org/{osm_type}/{osm_id}"

            addr_parts = []
            for key in ["addr:street", "addr:housenumber", "addr:city", "addr:postcode"]:
                if tags.get(key):
                    addr_parts.append(tags[key])

            places.append({
                "name": name,
                "formatted_address": ", ".join(addr_parts) if addr_parts else "",
                "geometry": {"location": {"lat": elat, "lng": elng}},
                "types": [tags.get("amenity", ""), tags.get("tourism", "")],
                "place_id": f"osm:{osm_type}:{osm_id}",
                "maps_url": maps_url,
            })

        return places

    async def get_distance_matrix(
        self, origins: List[str], destinations: List[str]
    ) -> Dict:
        """Calculate road distances and durations using OSRM.

        Accepts origins/destinations as "lat,lng" strings (same format as
        the former Google Distance Matrix API).

        Returns a structure compatible with the former Google response shape.
        """
        rows = []
        origin_addresses = []
        destination_addresses = []

        for origin in origins:
            origin_addresses.append(origin)
            elements = []

            for dest in destinations:
                if origin == dest:
                    elements.append({
                        "distance": {"text": "0 km", "value": 0},
                        "duration": {"text": "0 mins", "value": 0},
                        "status": "OK",
                    })
                    destination_addresses.append(dest)
                    continue

                try:
                    # OSRM expects lng,lat order
                    o_parts = origin.split(",")
                    d_parts = dest.split(",")
                    o_latlng = f"{o_parts[1].strip()},{o_parts[0].strip()}"
                    d_latlng = f"{d_parts[1].strip()},{d_parts[0].strip()}"

                    async with httpx.AsyncClient(timeout=_TIMEOUT, headers=_HEADERS) as client:
                        response = await client.get(
                            f"{self.OSRM_URL}/route/v1/driving/{o_latlng};{d_latlng}",
                            params={"overview": "false"},
                        )

                    if response.status_code == 200:
                        data = response.json()
                        routes = data.get("routes", [])
                        if routes:
                            route = routes[0]
                            distance_m = route.get("distance", 0)
                            duration_s = route.get("duration", 0)
                            distance_km = distance_m / 1000
                            duration_min = duration_s / 60

                            elements.append({
                                "distance": {
                                    "text": f"{distance_km:.1f} km",
                                    "value": int(distance_m),
                                },
                                "duration": {
                                    "text": f"{duration_min:.0f} mins",
                                    "value": int(duration_s),
                                },
                                "status": "OK",
                            })
                        else:
                            elements.append({"status": "ZERO_RESULTS"})
                    else:
                        elements.append({"status": "REQUEST_DENIED"})
                except Exception:
                    elements.append({"status": "UNKNOWN_ERROR"})

                if dest not in destination_addresses:
                    destination_addresses.append(dest)

            rows.append({"elements": elements})

        return {
            "rows": rows,
            "origin_addresses": origin_addresses,
            "destination_addresses": destination_addresses,
            "status": "OK",
        }
