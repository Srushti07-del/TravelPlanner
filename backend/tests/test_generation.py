import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import date
from fastapi import HTTPException
from routers.trips import generate_trip, _enrich_itinerary_with_external_data
from routers.ai import replan, _build_replan_context
from models.schemas import TripRequest, ReplanRequest, ReplanReason, Itinerary
from services.budget_service import BudgetService


def _make_request() -> TripRequest:
    return TripRequest(
        destination="Goa",
        origin="Mumbai",
        start_date=date(2024, 1, 1),
        end_date=date(2024, 1, 3),
        num_travelers=2,
        total_budget=10000,
        currency="INR",
        travel_style="comfort",
        interests=["beaches", "food"],
        food_preference="no_preference",
        accommodation_preference="budget_hotel",
        transport_preference="taxi",
    )


def _make_generated_dict() -> dict:
    return {
        "destination": "Goa",
        "origin": "Mumbai",
        "start_date": "2024-01-01",
        "end_date": "2024-01-03",
        "num_travelers": 2,
        "total_budget": 10000,
        "currency": "INR",
        "budget_breakdown": {
            "accommodation": 3500,
            "food": 2500,
            "transportation": 1500,
            "activities": 1500,
            "shopping": 500,
            "emergency_buffer": 500,
            "total_planned": 10000,
        },
        "days": [
            {
                "day_number": 1,
                "date": "2024-01-01",
                "title": "Beach Day",
                "theme": "Beaches",
                "time_slots": [
                    {
                        "time": "09:00 AM",
                        "activity_name": "Visit Baga Beach",
                        "description": "Relax on the beach.",
                        "duration_minutes": 120,
                        "estimated_cost": 500,
                        "category": "Beach",
                        "location_name": "Baga Beach",
                        "lat": 15.55,
                        "lng": 73.75,
                        "tips": "Bring sunscreen",
                    }
                ],
                "restaurants": [
                    {
                        "name": "Fisherman's Wharf",
                        "cuisine": "Seafood",
                        "price_range": "Mid-range",
                        "rating": 4.2,
                        "distance_from_prev_activity_km": 2.0,
                        "dietary_options": ["Vegetarian", "Non-Vegetarian"],
                        "opening_hours": "12:00 PM - 11:00 PM",
                        "address": "Baga Beach",
                        "google_maps_url": "https://maps.google.com/?q=Fisherman+Wharf+Goa",
                    }
                ],
                "estimated_day_cost": 3000,
                "weather_note": "Sunny",
                "transportation_for_day": "taxi",
                "total_distance_km": 0.0,
            }
        ],
        "ai_notes": "Enjoy your trip.",
        "generated_at": "2024-01-01T00:00:00Z",
    }


def _make_itinerary() -> Itinerary:
    return Itinerary(**_make_generated_dict())


# --- Basic generation tests ---

@pytest.mark.asyncio
async def test_generate_trip_valid_request():
    with patch("routers.trips.gemini_service") as mock_gemini, \
         patch("routers.trips.weather_service") as mock_weather, \
         patch("routers.trips.places_service") as mock_places, \
         patch("routers.trips.route_optimizer") as mock_optimizer:

        mock_gemini.generate_itinerary = AsyncMock(return_value=_make_generated_dict())
        mock_weather.get_forecast = AsyncMock(return_value=[
            {"date": "2024-01-01", "temp_max": 30, "description": "clear sky"}
        ])
        mock_places.search_places = AsyncMock(return_value=[])
        mock_optimizer.optimize_day_route = MagicMock(return_value=_make_generated_dict()["days"][0]["time_slots"])
        mock_optimizer.calculate_distance = MagicMock(return_value=5.0)

        result = await generate_trip(_make_request())
        assert result["destination"] == "Goa"
        assert len(result["days"]) == 1
        assert result["actual_cost"] > 0
        assert result["remaining_budget"] >= 0
        assert result["budget_breakdown"]["budget_status"] in ["within_budget", "at_risk", "over_budget"]


@pytest.mark.asyncio
async def test_generate_trip_weather_matched_by_date():
    with patch("routers.trips.gemini_service") as mock_gemini, \
         patch("routers.trips.weather_service") as mock_weather, \
         patch("routers.trips.places_service") as mock_places, \
         patch("routers.trips.route_optimizer") as mock_optimizer:

        mock_gemini.generate_itinerary = AsyncMock(return_value=_make_generated_dict())
        mock_weather.get_forecast = AsyncMock(return_value=[
            {"date": "2024-01-01", "temp_max": 30, "description": "clear sky"},
            {"date": "2024-01-02", "temp_max": 28, "description": "cloudy"},
            {"date": "2024-01-03", "temp_max": 32, "description": "sunny"},
        ])
        mock_places.search_places = AsyncMock(return_value=[])
        mock_optimizer.optimize_day_route = MagicMock(return_value=_make_generated_dict()["days"][0]["time_slots"])
        mock_optimizer.calculate_distance = MagicMock(return_value=5.0)

        result = await generate_trip(_make_request())
        day = result["days"][0]
        assert day["weather_forecast_available"] is True
        assert "30C" in day["weather_note"]


@pytest.mark.asyncio
async def test_generate_trip_weather_unavailable():
    with patch("routers.trips.gemini_service") as mock_gemini, \
         patch("routers.trips.weather_service") as mock_weather, \
         patch("routers.trips.places_service") as mock_places, \
         patch("routers.trips.route_optimizer") as mock_optimizer:

        mock_gemini.generate_itinerary = AsyncMock(return_value=_make_generated_dict())
        mock_weather.get_forecast = AsyncMock(return_value=[])
        mock_places.search_places = AsyncMock(return_value=[])
        mock_optimizer.optimize_day_route = MagicMock(return_value=_make_generated_dict()["days"][0]["time_slots"])
        mock_optimizer.calculate_distance = MagicMock(return_value=5.0)

        result = await generate_trip(_make_request())
        day = result["days"][0]
        assert day["weather_forecast_available"] is False
        assert "unavailable" in day["weather_note"].lower()


@pytest.mark.asyncio
async def test_generate_trip_gemini_failure():
    with patch("routers.trips.gemini_service") as mock_gemini:
        mock_gemini.generate_itinerary = AsyncMock(side_effect=Exception("AI failure"))

        with pytest.raises(HTTPException) as exc_info:
            await generate_trip(_make_request())
        assert exc_info.value.status_code == 500
        assert "Failed to generate trip" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_generate_trip_external_api_failure_continues():
    with patch("routers.trips.gemini_service") as mock_gemini, \
         patch("routers.trips.weather_service") as mock_weather, \
         patch("routers.trips.places_service") as mock_places, \
         patch("routers.trips.route_optimizer") as mock_optimizer:

        mock_gemini.generate_itinerary = AsyncMock(return_value=_make_generated_dict())
        mock_weather.get_forecast = AsyncMock(side_effect=Exception("Weather API down"))
        mock_places.search_places = AsyncMock(side_effect=Exception("Places API down"))
        mock_optimizer.optimize_day_route = MagicMock(return_value=_make_generated_dict()["days"][0]["time_slots"])
        mock_optimizer.calculate_distance = MagicMock(return_value=0.0)

        result = await generate_trip(_make_request())
        assert result["destination"] == "Goa"
        assert len(result["days"]) == 1


@pytest.mark.asyncio
async def test_route_optimizer_connected():
    generated = _make_generated_dict()
    generated["days"][0]["time_slots"] = [
        {
            "time": "09:00 AM",
            "activity_name": "Visit Baga Beach",
            "description": "Relax on the beach.",
            "duration_minutes": 120,
            "estimated_cost": 500,
            "category": "Beach",
            "location_name": "Baga Beach",
            "lat": 15.55,
            "lng": 73.75,
            "tips": "Bring sunscreen",
        },
        {
            "time": "02:00 PM",
            "activity_name": "Visit Fort Aguada",
            "description": "Explore the historic fort.",
            "duration_minutes": 90,
            "estimated_cost": 300,
            "category": "History",
            "location_name": "Fort Aguada",
            "lat": 15.48,
            "lng": 73.80,
            "tips": "Wear comfortable shoes",
        },
    ]
    with patch("routers.trips.gemini_service") as mock_gemini, \
         patch("routers.trips.weather_service") as mock_weather, \
         patch("routers.trips.places_service") as mock_places, \
         patch("routers.trips.route_optimizer") as mock_optimizer:

        mock_gemini.generate_itinerary = AsyncMock(return_value=generated)
        mock_weather.get_forecast = AsyncMock(return_value=[])
        mock_places.search_places = AsyncMock(return_value=[])
        mock_optimizer.optimize_day_route = MagicMock(return_value=generated["days"][0]["time_slots"])
        mock_optimizer.calculate_distance = MagicMock(return_value=5.0)

        await generate_trip(_make_request())
        mock_optimizer.optimize_day_route.assert_called_once()
        mock_optimizer.calculate_distance.assert_called_once()


@pytest.mark.asyncio
async def test_enrich_itinerary_skips_empty_days():
    result = await _enrich_itinerary_with_external_data({"days": []}, _make_request())
    assert result["days"] == []


@pytest.mark.asyncio
async def test_enrich_itinerary_handles_api_failure():
    itinerary = _make_generated_dict()
    with patch("routers.trips.places_service") as mock_places, \
         patch("routers.trips.route_optimizer") as mock_optimizer:

        mock_places.search_places = AsyncMock(side_effect=Exception("API error"))
        mock_optimizer.optimize_day_route = MagicMock(return_value=itinerary["days"][0]["time_slots"])
        mock_optimizer.calculate_distance = MagicMock(return_value=0.0)

        result = await _enrich_itinerary_with_external_data(itinerary, _make_request())
        assert result["days"][0]["time_slots"] is not None


# --- Auth / Ownership tests for routers ---

@pytest.mark.asyncio
async def test_get_trip_ownership_check():
    with patch("routers.trips.get_trip") as mock_get, \
         patch("routers.trips.get_current_user", return_value="user-A"):
        mock_get.return_value = {"id": "trip-1", "user_id": "user-B"}
        from routers.trips import get_trip_endpoint
        with pytest.raises(HTTPException) as exc_info:
            await get_trip_endpoint("trip-1", "user-A")
        assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_update_trip_ownership_check():
    with patch("routers.trips.get_trip") as mock_get, \
         patch("routers.trips.update_trip") as mock_update, \
         patch("routers.trips.get_current_user", return_value="user-A"):
        mock_get.return_value = {"id": "trip-1", "user_id": "user-B"}
        from routers.trips import update_trip_endpoint
        with pytest.raises(HTTPException) as exc_info:
            await update_trip_endpoint("trip-1", {}, "user-A")
        assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_delete_trip_ownership_check():
    with patch("routers.trips.get_trip") as mock_get, \
         patch("routers.trips.delete_trip") as mock_delete, \
         patch("routers.trips.get_current_user", return_value="user-A"):
        mock_get.return_value = {"id": "trip-1", "user_id": "user-B"}
        from routers.trips import delete_trip_endpoint
        with pytest.raises(HTTPException) as exc_info:
            await delete_trip_endpoint("trip-1", "user-A")
        assert exc_info.value.status_code == 403


# --- Malformed AI output tests ---

@pytest.mark.asyncio
async def test_generate_trip_malformed_ai_output():
    with patch("routers.trips.gemini_service") as mock_gemini:
        mock_gemini.generate_itinerary = AsyncMock(return_value={"not": "valid"})
        with pytest.raises(HTTPException) as exc_info:
            await generate_trip(_make_request())
        assert exc_info.value.status_code == 500


# --- Replan context tests ---

@pytest.mark.asyncio
async def test_build_replan_context_weather():
    request = ReplanRequest(
        trip_id="trip-1",
        itinerary=_make_itinerary(),
        reason=ReplanReason.weather,
        context="Rain expected",
    )
    with patch("routers.ai.weather_service") as mock_weather:
        mock_weather.get_forecast = AsyncMock(return_value=[
            {"date": "2024-01-01", "temp_max": 20, "description": "rain"}
        ])
        context = await _build_replan_context(request)
        assert context["real_data_available"] is True
        assert len(context["weather_forecast"]) == 1


@pytest.mark.asyncio
async def test_build_replan_context_attraction_closed():
    request = ReplanRequest(
        trip_id="trip-1",
        itinerary=_make_itinerary(),
        reason=ReplanReason.attraction_closed,
        context="Baga Beach closed",
        affected_days=[1],
    )
    with patch("routers.ai.places_service") as mock_places:
        mock_places.get_nearby_places = AsyncMock(return_value=[
            {"name": "Alternative Beach", "place_id": "alt-1"}
        ])
        context = await _build_replan_context(request)
        assert context["real_data_available"] is True
        assert "1" in context["alternatives"]


@pytest.mark.asyncio
async def test_build_replan_context_budget_change():
    request = ReplanRequest(
        trip_id="trip-1",
        itinerary=_make_itinerary(),
        reason=ReplanReason.budget_change,
        context="Budget reduced",
        new_budget=5000,
    )
    context = await _build_replan_context(request)
    assert context["real_data_available"] is True
    assert context["new_budget"] == 5000


# --- Route optimizer edge cases ---

@pytest.mark.asyncio
async def test_generate_trip_single_time_slot():
    generated = _make_generated_dict()
    generated["days"][0]["time_slots"] = [
        {
            "time": "09:00 AM",
            "activity_name": "Visit Baga Beach",
            "description": "Relax on the beach.",
            "duration_minutes": 120,
            "estimated_cost": 500,
            "category": "Beach",
            "location_name": "Baga Beach",
            "lat": 15.55,
            "lng": 73.75,
            "tips": "Bring sunscreen",
        }
    ]
    with patch("routers.trips.gemini_service") as mock_gemini, \
         patch("routers.trips.weather_service") as mock_weather, \
         patch("routers.trips.places_service") as mock_places, \
         patch("routers.trips.route_optimizer") as mock_optimizer:

        mock_gemini.generate_itinerary = AsyncMock(return_value=generated)
        mock_weather.get_forecast = AsyncMock(return_value=[])
        mock_places.search_places = AsyncMock(return_value=[])
        mock_optimizer.optimize_day_route = MagicMock(return_value=generated["days"][0]["time_slots"])
        mock_optimizer.calculate_distance = MagicMock(return_value=0.0)

        result = await generate_trip(_make_request())
        assert result["days"][0]["total_distance_km"] == 0.0
