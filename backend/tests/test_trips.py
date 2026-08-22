import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch, Mock
from fastapi import HTTPException
from fastapi.testclient import TestClient
from routers.trips import router as trips_router
from routers.ai import router as ai_router
from main import app
from models.schemas import TripRequest, Itinerary, DayPlan, TimeSlot, Restaurant, ReplanRequest, ReplanReason, ChatRequest, ChatMessage
from datetime import date
from auth import get_current_user


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
                "restaurants": [],
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


# --- Health endpoint ---

def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# --- Auth helpers ---

def _override_auth(user_id: str):
    app.dependency_overrides[get_current_user] = lambda: user_id


def _clear_auth_override():
    app.dependency_overrides.pop(get_current_user, None)


# --- Save trip ---

def test_save_trip_success():
    _override_auth("user-123")
    try:
        with patch("routers.trips.save_trip") as mock_save:
            mock_save.return_value = {"id": "trip-123", "title": "Goa Trip"}
            
            client = TestClient(app)
            response = client.post(
                "/trips/save",
                json={
                    "user_id": "user-123",
                    "itinerary": _make_generated_dict(),
                    "title": "Goa Trip"
                },
                headers={"Authorization": "Bearer valid-token"}
            )
            assert response.status_code == 200
            assert response.json()["id"] == "trip-123"
    finally:
        _clear_auth_override()


def test_save_trip_ownership_rejected():
    _override_auth("user-123")
    try:
        client = TestClient(app)
        response = client.post(
            "/trips/save",
            json={
                "user_id": "user-456",
                "itinerary": _make_generated_dict(),
                "title": "Goa Trip"
            },
            headers={"Authorization": "Bearer valid-token"}
        )
        assert response.status_code == 403
    finally:
        _clear_auth_override()


def test_save_trip_requires_auth():
    client = TestClient(app)
    response = client.post(
        "/trips/save",
        json={
            "user_id": "user-123",
            "itinerary": _make_generated_dict(),
            "title": "Goa Trip"
        }
    )
    assert response.status_code == 401


# --- List user trips ---

def test_list_user_trips_success():
    _override_auth("user-123")
    try:
        with patch("routers.trips.list_user_trips") as mock_list:
            mock_list.return_value = [
                {"id": "trip-1", "title": "Goa", "destination": "Goa", "start_date": "2024-01-01", "end_date": "2024-01-03", "num_travelers": 2, "total_budget": 10000, "currency": "INR", "created_at": "2024-01-01T00:00:00Z"}
            ]
            
            client = TestClient(app)
            response = client.get(
                "/trips/user/user-123",
                headers={"Authorization": "Bearer valid-token"}
            )
            assert response.status_code == 200
            assert len(response.json()) == 1
    finally:
        _clear_auth_override()


def test_list_user_trips_wrong_user():
    _override_auth("user-123")
    try:
        client = TestClient(app)
        response = client.get(
            "/trips/user/user-456",
            headers={"Authorization": "Bearer valid-token"}
        )
        assert response.status_code == 403
    finally:
        _clear_auth_override()


# --- Get trip ---

def test_get_trip_success():
    _override_auth("user-123")
    try:
        with patch("routers.trips.get_trip") as mock_get:
            mock_get.return_value = {"id": "trip-1", "user_id": "user-123", "destination": "Goa"}
            
            client = TestClient(app)
            response = client.get(
                "/trips/trip-1",
                headers={"Authorization": "Bearer valid-token"}
            )
            assert response.status_code == 200
            assert response.json()["destination"] == "Goa"
    finally:
        _clear_auth_override()


def test_get_trip_not_found():
    _override_auth("user-123")
    try:
        with patch("routers.trips.get_trip") as mock_get:
            mock_get.return_value = None
            
            client = TestClient(app)
            response = client.get(
                "/trips/trip-999",
                headers={"Authorization": "Bearer valid-token"}
            )
            assert response.status_code == 404
    finally:
        _clear_auth_override()


def test_get_trip_wrong_owner():
    _override_auth("user-123")
    try:
        with patch("routers.trips.get_trip") as mock_get:
            mock_get.return_value = {"id": "trip-1", "user_id": "user-456", "destination": "Goa"}
            
            client = TestClient(app)
            response = client.get(
                "/trips/trip-1",
                headers={"Authorization": "Bearer valid-token"}
            )
            assert response.status_code == 403
    finally:
        _clear_auth_override()


# --- Update trip ---

def test_update_trip_success():
    _override_auth("user-123")
    try:
        with patch("routers.trips.get_trip") as mock_get, \
             patch("routers.trips.update_trip") as mock_update:
            mock_get.return_value = {"id": "trip-1", "user_id": "user-123"}
            mock_update.return_value = {"id": "trip-1", "title": "Updated"}
            
            client = TestClient(app)
            response = client.put(
                "/trips/trip-1",
                json={"title": "Updated"},
                headers={"Authorization": "Bearer valid-token"}
            )
            assert response.status_code == 200
    finally:
        _clear_auth_override()


def test_update_trip_wrong_owner():
    _override_auth("user-123")
    try:
        with patch("routers.trips.get_trip") as mock_get:
            mock_get.return_value = {"id": "trip-1", "user_id": "user-456"}
            
            client = TestClient(app)
            response = client.put(
                "/trips/trip-1",
                json={"title": "Updated"},
                headers={"Authorization": "Bearer valid-token"}
            )
            assert response.status_code == 403
    finally:
        _clear_auth_override()


# --- Delete trip ---

def test_delete_trip_success():
    _override_auth("user-123")
    try:
        with patch("routers.trips.get_trip") as mock_get, \
             patch("routers.trips.delete_trip") as mock_delete:
            mock_get.return_value = {"id": "trip-1", "user_id": "user-123"}
            mock_delete.return_value = True
            
            client = TestClient(app)
            response = client.delete(
                "/trips/trip-1",
                headers={"Authorization": "Bearer valid-token"}
            )
            assert response.status_code == 200
            assert response.json()["success"] is True
    finally:
        _clear_auth_override()


def test_delete_trip_wrong_owner():
    _override_auth("user-123")
    try:
        with patch("routers.trips.get_trip") as mock_get:
            mock_get.return_value = {"id": "trip-1", "user_id": "user-456"}
            
            client = TestClient(app)
            response = client.delete(
                "/trips/trip-1",
                headers={"Authorization": "Bearer valid-token"}
            )
            assert response.status_code == 403
    finally:
        _clear_auth_override()


# --- AI Chat authorization ---

def test_ai_chat_authorized():
    _override_auth("user-123")
    try:
        with patch("routers.ai.get_trip") as mock_get, \
             patch("routers.ai.gemini_service") as mock_gemini:
            mock_get.return_value = {"id": "trip-1", "user_id": "user-123"}
            mock_gemini.chat_modify = AsyncMock(return_value=type('obj', (object,), {
                'updated_itinerary': None,
                'reply': 'Hello!',
                'changes_summary': None
            })())
            
            client = TestClient(app)
            response = client.post(
                "/ai/chat",
                json={
                    "trip_id": "trip-1",
                    "message": "Hello",
                    "itinerary": _make_generated_dict(),
                    "history": []
                },
                headers={"Authorization": "Bearer valid-token"}
            )
            assert response.status_code == 200
    finally:
        _clear_auth_override()


def test_ai_chat_unauthorized_trip():
    _override_auth("user-123")
    try:
        with patch("routers.ai.get_trip") as mock_get:
            mock_get.return_value = {"id": "trip-1", "user_id": "user-456"}
            
            client = TestClient(app)
            response = client.post(
                "/ai/chat",
                json={
                    "trip_id": "trip-1",
                    "message": "Hello",
                    "itinerary": _make_generated_dict(),
                    "history": []
                },
                headers={"Authorization": "Bearer valid-token"}
            )
            assert response.status_code == 403
    finally:
        _clear_auth_override()


# --- AI Replan authorization ---

def test_ai_replan_authorized():
    _override_auth("user-123")
    try:
        with patch("routers.ai.get_trip") as mock_get, \
             patch("routers.ai.gemini_service") as mock_gemini, \
             patch("routers.ai.weather_service") as mock_weather, \
             patch("routers.ai.save_trip_change") as mock_save_change:
            mock_get.return_value = {"id": "trip-1", "user_id": "user-123"}
            mock_gemini.replan_itinerary = AsyncMock(return_value=type('obj', (object,), {
                'updated_itinerary': _make_itinerary(),
                'changes_made': ['Changed weather plan'],
                'ai_explanation': 'Raining tomorrow',
                'message': 'Updated due to rain'
            })())
            mock_weather.get_forecast = AsyncMock(return_value=[])
            mock_save_change.return_value = {"id": "change-1"}
            
            client = TestClient(app)
            response = client.post(
                "/ai/replan",
                json={
                    "trip_id": "trip-1",
                    "itinerary": _make_generated_dict(),
                    "reason": "weather",
                    "context": "Rain expected"
                },
                headers={"Authorization": "Bearer valid-token"}
            )
            assert response.status_code == 200
    finally:
        _clear_auth_override()


def test_ai_replan_unauthorized_trip():
    _override_auth("user-123")
    try:
        with patch("routers.ai.get_trip") as mock_get:
            mock_get.return_value = {"id": "trip-1", "user_id": "user-456"}
            
            client = TestClient(app)
            response = client.post(
                "/ai/replan",
                json={
                    "trip_id": "trip-1",
                    "itinerary": _make_generated_dict(),
                    "reason": "weather",
                    "context": "Rain expected"
                },
                headers={"Authorization": "Bearer valid-token"}
            )
            assert response.status_code == 403
    finally:
        _clear_auth_override()
