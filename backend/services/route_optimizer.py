import math
from typing import List, Dict

class RouteOptimizer:
    def calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        R = 6371.0 # Earth radius in kilometers
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def estimate_travel_time(self, distance_km: float, transport: str) -> int:
        speeds = {
            "walking": 5.0,
            "taxi": 30.0,
            "rental": 40.0,
            "public": 20.0
        }
        speed = speeds.get(transport.lower(), 25.0)
        hours = distance_km / speed
        return int(hours * 60)

    def optimize_day_route(self, activities: List[Dict], hotel_location: Dict) -> List[Dict]:
        if not activities:
            return []
            
        unvisited = list(activities)
        route = []
        current_loc = hotel_location

        while unvisited:
            nearest = min(unvisited, key=lambda x: self.calculate_distance(
                current_loc["lat"], current_loc["lng"],
                x["lat"], x["lng"]
            ))
            route.append(nearest)
            unvisited.remove(nearest)
            current_loc = nearest

        return route
