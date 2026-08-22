from fastapi import APIRouter
from typing import List, Dict
from services.weather_service import WeatherService

router = APIRouter(prefix="/weather", tags=["weather"])
weather_service = WeatherService()

@router.get("/{destination}", response_model=List[Dict])
async def get_weather(destination: str):
    return await weather_service.get_forecast(destination)
