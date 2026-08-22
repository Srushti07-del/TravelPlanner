from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict
from models.schemas import TripRequest, Itinerary, SaveTripRequest, TripSummary
from services.gemini_service import GeminiService
from services.budget_service import BudgetService
from services.weather_service import WeatherService
from services.route_optimizer import RouteOptimizer
from services.places_service import PlacesService
from db.supabase_client import save_trip, get_trip, update_trip, delete_trip, list_user_trips
from datetime import datetime

router = APIRouter(prefix="/trips", tags=["trips"])
gemini_service = GeminiService()
budget_service = BudgetService()
weather_service = WeatherService()
route_optimizer = RouteOptimizer()
places_service = PlacesService()


@router.post("/generate", response_model=Itinerary)
async def generate_trip(request: TripRequest):
    try:
        itinerary_dict = await gemini_service.generate_itinerary(request)

        await _enrich_with_places(itinerary_dict, request.destination)

        days = itinerary_dict.get("days", [])
        forecasts = await weather_service.get_forecast(request.destination, days=len(days))

        for i, day in enumerate(days):
            note_parts = []
            if i < len(forecasts):
                fc = forecasts[i]
                note_parts.append(f"{fc['temp_max']}C, {fc['description']}")
                classification = weather_service.classify_weather(fc)
                if not classification["is_outdoor_suitable"] and classification.get("warning"):
                    note_parts.append(f"Weather alert: {classification['warning']}.")
            if note_parts:
                day["weather_note"] = " ".join(note_parts)

            day["total_distance_km"] = _compute_day_distance(day)

        budget_service.validate_within_budget(days, request.total_budget)
        budget_breakdown = budget_service.allocate_budget(
            request.total_budget,
            len(days),
            request.num_travelers,
            request.travel_style
        )
        itinerary_dict["budget_breakdown"] = budget_breakdown.model_dump()
        itinerary_dict["generated_at"] = datetime.utcnow().isoformat() + "Z"

        return Itinerary(**itinerary_dict)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


def _compute_day_distance(day: Dict) -> float:
    """Compute the real cumulative travel distance for a day from activity coordinates.

    Replaces the LLM's hallucinated total_distance_km with a deterministic
    great-circle sum of consecutive time-slot coordinates.
    """
    slots = day.get("time_slots", [])
    if len(slots) < 2:
        return 0.0
    total = 0.0
    prev = slots[0]
    for slot in slots[1:]:
        try:
            total += route_optimizer.calculate_distance(
                float(prev["lat"]), float(prev["lng"]),
                float(slot["lat"]), float(slot["lng"])
            )
        except (KeyError, TypeError, ValueError):
            return day.get("total_distance_km", 0.0)
        prev = slot
    return round(total, 2)


@router.post("/save")
async def save_generated_trip(request: SaveTripRequest):
    try:
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
    except Exception as exc:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.get("/user/{user_id}", response_model=List[TripSummary])
async def get_user_trips(user_id: str):
    try:
        trips = await list_user_trips(user_id)
        return [TripSummary(**t) for t in trips]
    except Exception as exc:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


async def _get_user_trip(trip_id: str, user_id: str) -> Dict:
    trip = await get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.get("/{trip_id}")
async def get_trip_endpoint(trip_id: str, user_id: str = Query(...)):
    trip = await _get_user_trip(trip_id, user_id)
    return trip


@router.put("/{trip_id}")
async def update_trip_endpoint(trip_id: str, user_id: str = Query(...), updates: Dict = None):
    await _get_user_trip(trip_id, user_id)
    updated = await update_trip(trip_id, updates or {})
    return updated


@router.delete("/{trip_id}")
async def delete_trip_endpoint(trip_id: str, user_id: str = Query(...)):
    await _get_user_trip(trip_id, user_id)
    success = await delete_trip(trip_id)
    return {"success": success}
