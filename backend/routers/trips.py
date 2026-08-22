from fastapi import APIRouter, HTTPException
from typing import List, Dict
from models.schemas import TripRequest, Itinerary, SaveTripRequest, TripSummary
from services.gemini_service import GeminiService
from services.budget_service import BudgetService
from services.weather_service import WeatherService
from db.supabase_client import save_trip, get_trip, update_trip, delete_trip, list_user_trips
from datetime import datetime

router = APIRouter(prefix="/trips", tags=["trips"])
gemini_service = GeminiService()
budget_service = BudgetService()
weather_service = WeatherService()

@router.post("/generate", response_model=Itinerary)
async def generate_trip(request: TripRequest):
    try:
        itinerary_dict = await gemini_service.generate_itinerary(request)
        forecasts = await weather_service.get_forecast(request.destination, days=len(itinerary_dict.get("days", [])))
        
        for i, day in enumerate(itinerary_dict.get("days", [])):
            if i < len(forecasts):
                day["weather_note"] = f"{forecasts[i]['temp_max']}C, {forecasts[i]['description']}"

        budget_breakdown = budget_service.allocate_budget(
            request.total_budget, 
            len(itinerary_dict.get("days", [])), 
            request.num_travelers, 
            request.travel_style
        )
        itinerary_dict["budget_breakdown"] = budget_breakdown.model_dump()
        itinerary_dict["generated_at"] = datetime.utcnow().isoformat() + "Z"
        
        return Itinerary(**itinerary_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save")
async def save_generated_trip(request: SaveTripRequest):
    data = {
        "user_id": request.user_id,
        "title": request.title,
        "destination": request.itinerary.destination,
        "start_date": request.itinerary.start_date,
        "end_date": request.itinerary.end_date,
        "num_travelers": request.itinerary.num_travelers,
        "total_budget": request.itinerary.total_budget,
        "currency": request.itinerary.currency,
        "itinerary": request.itinerary.model_dump(),
        "budget_breakdown": request.itinerary.budget_breakdown.model_dump()
    }
    saved = await save_trip(data)
    return {"id": saved.get("id"), "title": saved.get("title")}

@router.get("/user/{user_id}", response_model=List[TripSummary])
async def get_user_trips(user_id: str):
    trips = await list_user_trips(user_id)
    return [TripSummary(**t) for t in trips]

@router.get("/{trip_id}")
async def get_trip_endpoint(trip_id: str):
    trip = await get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@router.put("/{trip_id}")
async def update_trip_endpoint(trip_id: str, updates: Dict):
    updated = await update_trip(trip_id, updates)
    return updated

@router.delete("/{trip_id}")
async def delete_trip_endpoint(trip_id: str):
    success = await delete_trip(trip_id)
    return {"success": success}
