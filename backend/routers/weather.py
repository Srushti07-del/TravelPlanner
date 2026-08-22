from fastapi import APIRouter, HTTPException
from typing import List, Dict
from services.weather_service import WeatherService

router = APIRouter(prefix="/weather", tags=["weather"])
weather_service = WeatherService()


@router.get("/{destination}", response_model=List[Dict])
async def get_weather(destination: str):
    try:
        return await weather_service.get_forecast(destination)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
