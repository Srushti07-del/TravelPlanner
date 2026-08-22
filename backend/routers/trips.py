import logging
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from models.schemas import (
    TripRequest,
    Itinerary,
    SaveTripRequest,
    TripSummary,
    ErrorResponse,
)
from services.gemini_service import GeminiService
from services.budget_service import BudgetService
from services.weather_service import WeatherService
from services.route_optimizer import RouteOptimizer
from services.places_service import PlacesService
from db.supabase_client import (
    save_trip,
    get_trip,
    update_trip,
    delete_trip,
    list_user_trips,
)
from datetime import datetime, timezone
from auth import get_current_user

logger = logging.getLogger(__name__)

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
        itinerary_dict = await _enrich_itinerary_with_external_data(itinerary_dict, request)

        try:
            forecasts = await weather_service.get_forecast(
                request.destination, days=len(itinerary_dict.get("days", []))
            )
        except Exception:
            forecasts = []
        forecast_map = {f["date"]: f for f in forecasts}

        for day in itinerary_dict.get("days", []):
            day_date = day.get("date")
            forecast = forecast_map.get(day_date)
            if forecast:
                day["weather_note"] = (
                    f"{forecast['temp_max']}C, {forecast['description']}"
                )
                day["weather_forecast_available"] = True
            else:
                day["weather_note"] = "Forecast unavailable for this date"
                day["weather_forecast_available"] = False

        budget_breakdown = budget_service.allocate_budget(
            request.total_budget,
            len(itinerary_dict.get("days", [])),
            request.num_travelers,
            request.travel_style,
        )
        itinerary_dict["budget_breakdown"] = budget_breakdown.model_dump()
        itinerary_dict["generated_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        validated = Itinerary(**itinerary_dict)
        budget_status = budget_service.calculate_budget_status(
            validated.total_budget,
            budget_service.calculate_actual_cost(validated.days),
            validated.days,
        )
        validated_dict = validated.model_dump()
        validated_dict["actual_cost"] = budget_status["actual_expenses"]
        validated_dict["remaining_budget"] = budget_status["remaining_budget"]
        validated_dict["budget_breakdown"]["actual_expenses"] = budget_status["actual_expenses"]
        validated_dict["budget_breakdown"]["remaining_budget"] = budget_status["remaining_budget"]
        validated_dict["budget_breakdown"]["projected_trip_cost"] = budget_status["projected_trip_cost"]
        validated_dict["budget_breakdown"]["budget_status"] = budget_status["status"]
        return validated_dict
    except Exception as e:
        logger.exception("Trip generation failed")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate trip. Please try again.",
        )


@router.post("/save")
async def save_generated_trip(
    request: SaveTripRequest, authenticated_user_id: str = Depends(get_current_user)
):
    if authenticated_user_id != request.user_id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to save this trip.",
        )
    try:
        data = {
            "user_id": authenticated_user_id,
            "title": request.title,
            "destination": request.itinerary.destination,
            "start_date": request.itinerary.start_date,
            "end_date": request.itinerary.end_date,
            "num_travelers": request.itinerary.num_travelers,
            "total_budget": request.itinerary.total_budget,
            "currency": request.itinerary.currency,
            "itinerary": request.itinerary.model_dump(),
            "budget_breakdown": request.itinerary.budget_breakdown.model_dump(),
        }
        saved = await save_trip(data)
        return {"id": saved.get("id"), "title": saved.get("title")}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Save trip failed")
        raise HTTPException(
            status_code=500,
            detail="Failed to save trip. Please try again.",
        )


@router.get("/user/{user_id}", response_model=List[TripSummary])
async def get_user_trips(
    user_id: str,
    authenticated_user_id: str = Depends(get_current_user)
):
    if authenticated_user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view these trips.",
        )
    try:
        trips = await list_user_trips(user_id)
        return [TripSummary(**t) for t in trips]
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("List user trips failed")
        raise HTTPException(
            status_code=500,
            detail="Failed to load trips. Please try again.",
        )


@router.get("/{trip_id}")
async def get_trip_endpoint(trip_id: str, user_id: str = Depends(get_current_user)):
    try:
        trip = await get_trip(trip_id)
        if not trip:
            raise HTTPException(status_code=404, detail="Trip was not found.")
        if trip.get("user_id") != user_id:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to access this trip.",
            )
        return trip
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Get trip failed")
        raise HTTPException(
            status_code=500,
            detail="Failed to load trip. Please try again.",
        )


@router.put("/{trip_id}")
async def update_trip_endpoint(
    trip_id: str, updates: Dict, user_id: str = Depends(get_current_user)
):
    try:
        trip = await get_trip(trip_id)
        if not trip:
            raise HTTPException(status_code=404, detail="Trip was not found.")
        if trip.get("user_id") != user_id:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to update this trip.",
            )
        updated = await update_trip(trip_id, updates)
        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Update trip failed")
        raise HTTPException(
            status_code=500,
            detail="Failed to update trip. Please try again.",
        )


@router.delete("/{trip_id}")
async def delete_trip_endpoint(trip_id: str, user_id: str = Depends(get_current_user)):
    try:
        trip = await get_trip(trip_id)
        if not trip:
            raise HTTPException(status_code=404, detail="Trip was not found.")
        if trip.get("user_id") != user_id:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to delete this trip.",
            )
        success = await delete_trip(trip_id)
        return {"success": success}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Delete trip failed")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete trip. Please try again.",
        )


async def _enrich_itinerary_with_external_data(itinerary_dict: dict, request: TripRequest) -> dict:
    days = itinerary_dict.get("days", [])
    if not days:
        return itinerary_dict

    origin_coords = None
    dest_coords = None

    try:
        origin_places = await places_service.search_places(
            query=request.origin, location=request.origin, type=""
        )
        if origin_places:
            geometry = origin_places[0].get("geometry", {})
            origin_coords = geometry.get("location")

        dest_places = await places_service.search_places(
            query=request.destination, location=request.destination, type=""
        )
        if dest_places:
            geometry = dest_places[0].get("geometry", {})
            dest_coords = geometry.get("location")
    except Exception:
        logger.debug("Places enrichment failed, continuing without real coordinates")

    for day in days:
        time_slots = day.get("time_slots", [])
        if not time_slots:
            continue

        optimized = route_optimizer.optimize_day_route(
            time_slots, origin_coords or {"lat": time_slots[0].get("lat", 0), "lng": time_slots[0].get("lng", 0)}
        )
        day["time_slots"] = optimized

        total_distance = 0.0
        for i in range(len(optimized) - 1):
            try:
                dist = route_optimizer.calculate_distance(
                    optimized[i]["lat"],
                    optimized[i]["lng"],
                    optimized[i + 1]["lat"],
                    optimized[i + 1]["lng"],
                )
                total_distance += dist
            except Exception:
                continue
        day["total_distance_km"] = round(total_distance, 2)

        for slot in optimized:
            try:
                place_details = await places_service.get_place_details(
                    slot.get("location_name", "")
                )
                if place_details:
                    geometry = place_details.get("geometry", {}).get("location", {})
                    if geometry:
                        slot["lat"] = geometry.get("lat", slot.get("lat", 0))
                        slot["lng"] = geometry.get("lng", slot.get("lng", 0))
                    if place_details.get("rating"):
                        slot["rating"] = place_details["rating"]
                    if place_details.get("formatted_address"):
                        slot["address"] = place_details["formatted_address"]
            except Exception:
                continue

    return itinerary_dict
