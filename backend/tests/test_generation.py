import pytest
from services.gemini_service import GeminiService
from services.budget_service import BudgetService
from services.route_optimizer import RouteOptimizer
from routers import trips as trips_router


def _sample_day(lat=15.4989, lng=73.8278):
    return {
        "day_number": 1,
        "date": "2026-01-01",
        "title": "Day 1",
        "theme": "Arrival",
        "time_slots": [
            {"time": "09:00 AM", "activity_name": "A", "description": "d", "duration_minutes": 60,
             "estimated_cost": 100.0, "category": "Culture", "location_name": "X",
             "lat": lat, "lng": lng, "tips": "t"},
            {"time": "01:00 PM", "activity_name": "B", "description": "d", "duration_minutes": 60,
             "estimated_cost": 200.0, "category": "Food", "location_name": "Y",
             "lat": 15.5439, "lng": 73.7554, "tips": "t"},
        ],
        "restaurants": [],
        "estimated_day_cost": 300.0,
        "weather_note": "",
        "transportation_for_day": "taxi",
        "total_distance_km": 0.0,
    }


def test_coordinate_validation_rejects_invalid_range():
    service = GeminiService()
    bad = {"days": [_sample_day(lat=999.0, lng=73.8278)]}
    with pytest.raises(ValueError):
        service._validate_itinerary_schema(bad)


def test_coordinate_validation_accepts_valid_range():
    service = GeminiService()
    good = {"days": [_sample_day()]}
    # Should not raise; returns a dict (schema validation may still fail on
    # missing top-level fields, so we only assert no coordinate error).
    try:
        service._validate_itinerary_schema(good)
    except ValueError as exc:
        assert "Invalid coordinates" not in str(exc)


def test_compute_day_distance_uses_real_coordinates():
    day = _sample_day()
    dist = trips_router._compute_day_distance(day)
    # Panaji -> Calangute is ~15km
    assert 5.0 < dist < 20.0


def test_compute_day_distance_single_slot_is_zero():
    day = _sample_day()
    day["time_slots"] = day["time_slots"][:1]
    assert trips_router._compute_day_distance(day) == 0.0


def test_validate_within_budget_passes_for_plausible_plan():
    service = BudgetService()
    days = [_sample_day() for _ in range(3)]
    # 3 days * 300 = 900 vs 10000 budget -> fine
    service.validate_within_budget(days, 10000.0)


def test_validate_within_budget_raises_when_excessive():
    service = BudgetService()
    days = [{"estimated_day_cost": 5000.0} for _ in range(5)]  # 25000 vs 10000
    with pytest.raises(ValueError):
        service.validate_within_budget(days, 10000.0)


def test_validate_within_budget_tolerance_boundary():
    service = BudgetService()
    # 10000 * 1.20 = 12000 allowed; 11999 passes, 12001 fails
    service.validate_within_budget([{"estimated_day_cost": 11999.0}], 10000.0)
    with pytest.raises(ValueError):
        service.validate_within_budget([{"estimated_day_cost": 12001.0}], 10000.0)
