import pytest
from services.gemini_service import GeminiService
from services.budget_service import BudgetService
from services.route_optimizer import RouteOptimizer
from services.places_service import PlacesService
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


_SAMPLE_GOOGLE = {
    "results": [
        {
            "name": "Basilica of Bom Jesus",
            "geometry": {"location": {"lat": 15.5046, "lng": 73.9108}},
            "rating": 4.6,
            "formatted_address": "Old Goa, Goa 403402",
            "place_id": "abc123",
        }
    ]
}


@pytest.mark.asyncio
async def test_resolve_place_normalizes_real_result(monkeypatch):
    service = PlacesService()

    async def fake_make_request(self, endpoint, params):
        return _SAMPLE_GOOGLE

    monkeypatch.setattr(PlacesService, "_make_request", fake_make_request)
    result = await service.resolve_place("Basilica", "Goa")
    assert result["lat"] == 15.5046
    assert result["lng"] == 73.9108
    assert result["rating"] == 4.6
    assert result["address"] == "Old Goa, Goa 403402"
    assert "abc123" in result["google_maps_url"]


@pytest.mark.asyncio
async def test_resolve_place_returns_none_on_empty(monkeypatch):
    service = PlacesService()

    async def fake_make_request(self, endpoint, params):
        return {}

    monkeypatch.setattr(PlacesService, "_make_request", fake_make_request)
    assert await service.resolve_place("Nowhere", "Goa") is None


@pytest.mark.asyncio
async def test_resolve_place_never_raises(monkeypatch):
    service = PlacesService()

    async def fake_make_request(self, endpoint, params):
        raise RuntimeError("boom")

    monkeypatch.setattr(PlacesService, "_make_request", fake_make_request)
    # No API key path also returns None safely; with a forced crash it must not raise.
    assert await service.resolve_place("X", "Y") is None


@pytest.mark.asyncio
async def test_enrich_with_places_overrides_coords(monkeypatch):
    service = PlacesService()

    async def fake_make_request(self, endpoint, params):
        return _SAMPLE_GOOGLE

    monkeypatch.setattr(PlacesService, "_make_request", fake_make_request)

    itinerary = {
        "days": [
            {
                "day_number": 1,
                "time_slots": [
                    {"location_name": "Basilica", "lat": 0.0, "lng": 0.0},
                ],
                "restaurants": [
                    {"name": "Basilica", "rating": 0.0, "address": "", "google_maps_url": ""},
                ],
            }
        ]
    }
    await trips_router._enrich_with_places(itinerary, "Goa")
    slot = itinerary["days"][0]["time_slots"][0]
    assert slot["lat"] == 15.5046
    assert slot["lng"] == 73.9108
    rest = itinerary["days"][0]["restaurants"][0]
    assert rest["rating"] == 4.6
    assert rest["address"] == "Old Goa, Goa 403402"
