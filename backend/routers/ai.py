import logging
from fastapi import APIRouter, HTTPException, Depends
from models.schemas import ChatRequest, ChatResponse, ReplanRequest, ReplanResponse
from services.gemini_service import GeminiService
from services.places_service import PlacesService
from services.weather_service import WeatherService
from services.route_optimizer import RouteOptimizer
from db.supabase_client import get_trip, save_trip_change
from auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])
gemini_service = GeminiService()
places_service = PlacesService()
weather_service = WeatherService()
route_optimizer = RouteOptimizer()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, user_id: str = Depends(get_current_user)):
    try:
        trip = await get_trip(request.trip_id)
        if not trip:
            raise HTTPException(status_code=404, detail="Trip was not found.")
        if trip.get("user_id") != user_id:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to modify this trip.",
            )
        response = await gemini_service.chat_modify(request)
        if response.updated_itinerary:
            await save_trip_change({
                "trip_id": request.trip_id,
                "change_reason": request.message,
                "original_days": request.itinerary.model_dump().get("days"),
                "updated_days": response.updated_itinerary.model_dump().get("days"),
            })
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Chat modify failed")
        raise HTTPException(
            status_code=500,
            detail="Failed to process chat request. Please try again.",
        )


@router.post("/replan", response_model=ReplanResponse)
async def replan(request: ReplanRequest, user_id: str = Depends(get_current_user)):
    try:
        trip = await get_trip(request.trip_id)
        if not trip:
            raise HTTPException(status_code=404, detail="Trip was not found.")
        if trip.get("user_id") != user_id:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to replan this trip.",
            )

        enriched_context = await _build_replan_context(request)
        response = await gemini_service.replan_itinerary(request, enriched_context)
        await save_trip_change({
            "trip_id": request.trip_id,
            "change_reason": f"{request.reason.value}: {request.context}",
            "original_days": request.itinerary.model_dump().get("days"),
            "updated_days": response.updated_itinerary.model_dump().get("days"),
        })
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Replan failed")
        raise HTTPException(
            status_code=500,
            detail="Failed to replan trip. Please try again.",
        )


async def _build_replan_context(request: ReplanRequest) -> dict:
    context = {"real_data_available": False}
    try:
        if request.reason.value == "weather":
            forecast = await weather_service.get_forecast(
                request.itinerary.destination, days=len(request.itinerary.days)
            )
            context["weather_forecast"] = forecast
            context["real_data_available"] = True
        elif request.reason.value == "attraction_closed":
            days = request.itinerary.days
            affected = request.affected_days or list(range(1, len(days) + 1))
            alternatives = {}
            for day_idx in affected:
                if 1 <= day_idx <= len(days):
                    day = days[day_idx - 1]
                    for slot in day.time_slots[:1]:
                        try:
                            nearby = await places_service.get_nearby_places(
                                slot.lat, slot.lng, radius=5000, type="tourist_attraction"
                            )
                            if nearby:
                                alternatives[str(day_idx)] = nearby[:3]
                        except Exception:
                            continue
            context["alternatives"] = alternatives
            context["real_data_available"] = True
        elif request.reason.value == "budget_change":
            context["new_budget"] = request.new_budget
            context["real_data_available"] = True
        elif request.reason.value == "location_change":
            if request.current_location:
                try:
                    places = await places_service.search_places(
                        query=request.current_location,
                        location=request.current_location,
                        type="",
                    )
                    context["current_location_places"] = places[:5]
                    context["real_data_available"] = True
                except Exception:
                    pass
    except Exception:
        pass
    return context
