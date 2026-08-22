import os
import httpx
from typing import List, Dict

_TIMEOUT = 10.0

class WeatherService:
    BASE_URL = "https://api.openweathermap.org/data/2.5"

    async def get_forecast(self, city: str, days: int = 5) -> List[Dict]:
        api_key = os.getenv("OPENWEATHER_API_KEY")
        if not api_key:
            return []
        
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/forecast", params={
                    "q": city,
                    "appid": api_key,
                    "units": "metric"
                })
                if response.status_code != 200:
                    return []
                
                data = response.json()
                daily_forecasts = {}
                for item in data.get("list", []):
                    date_str = item["dt_txt"].split(" ")[0]
                    if date_str not in daily_forecasts:
                        daily_forecasts[date_str] = {
                            "date": date_str,
                            "temp_min": item["main"]["temp_min"],
                            "temp_max": item["main"]["temp_max"],
                            "description": item["weather"][0]["description"],
                            "icon": item["weather"][0]["icon"],
                        }
                    else:
                        daily_forecasts[date_str]["temp_min"] = min(daily_forecasts[date_str]["temp_min"], item["main"]["temp_min"])
                        daily_forecasts[date_str]["temp_max"] = max(daily_forecasts[date_str]["temp_max"], item["main"]["temp_max"])
                
                result = list(daily_forecasts.values())[:days]
                for r in result:
                    classification = self.classify_weather(r)
                    r.update(classification)
                return result
        except httpx.HTTPError:
            return []

    def classify_weather(self, weather_data: Dict) -> Dict:
        desc = weather_data.get("description", "").lower()
        if any(bad in desc for bad in ["rain", "storm", "thunder", "snow", "extreme"]):
            return {
                "is_outdoor_suitable": False,
                "warning": "Poor weather for outdoor activities",
                "severity": "severe" if "storm" in desc or "extreme" in desc else "mild"
            }
        
        if weather_data.get("temp_max", 0) > 40:
            return {
                "is_outdoor_suitable": False,
                "warning": "Extreme heat warning",
                "severity": "severe"
            }
            
        return {
            "is_outdoor_suitable": True,
            "warning": None,
            "severity": "none"
        }
