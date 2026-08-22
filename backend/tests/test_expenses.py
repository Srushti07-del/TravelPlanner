import pytest
from services.budget_service import BudgetService
from models.schemas import TravelStyle, DayPlan, TimeSlot, Restaurant


def _make_day(cost: float) -> DayPlan:
    return DayPlan(
        day_number=1,
        date="2024-01-01",
        title="Day 1",
        theme="Test",
        time_slots=[],
        restaurants=[],
        estimated_day_cost=cost,
        weather_note="Sunny",
        transportation_for_day="taxi",
        total_distance_km=10.0,
    )


def test_calculate_actual_cost_empty_days():
    service = BudgetService()
    assert service.calculate_actual_cost([]) == 0.0


def test_calculate_actual_cost_multiple_days():
    service = BudgetService()
    days = [_make_day(1000.0), _make_day(2000.0), _make_day(1500.0)]
    assert service.calculate_actual_cost(days) == 4500.0


def test_calculate_budget_status_within_budget():
    service = BudgetService()
    days = [_make_day(3000.0), _make_day(3000.0)]
    result = service.calculate_budget_status(10000.0, 0.0, days)
    assert result["status"] == "within_budget"
    assert result["projected_trip_cost"] == 6000.0
    assert result["remaining_budget"] == 10000.0


def test_calculate_budget_status_over_budget():
    service = BudgetService()
    days = [_make_day(6000.0), _make_day(5000.0)]
    result = service.calculate_budget_status(10000.0, 0.0, days)
    assert result["status"] == "over_budget"
    assert result["projected_trip_cost"] == 11000.0


def test_calculate_budget_status_at_risk():
    service = BudgetService()
    days = [_make_day(4500.0), _make_day(4500.0)]
    result = service.calculate_budget_status(10000.0, 0.0, days)
    assert result["status"] == "at_risk"
    assert result["projected_trip_cost"] == 9000.0


def test_calculate_budget_status_with_actual_expenses():
    service = BudgetService()
    days = [_make_day(2000.0), _make_day(2000.0)]
    result = service.calculate_budget_status(10000.0, 3000.0, days)
    assert result["actual_expenses"] == 3000.0
    assert result["remaining_budget"] == 7000.0
    assert result["projected_trip_cost"] == 7000.0


def test_allocate_budget_zero_budget():
    service = BudgetService()
    breakdown = service.allocate_budget(0.0, 5, 2, TravelStyle.budget)
    assert breakdown.total_planned == 0.0
    assert breakdown.accommodation == 0.0


def test_allocate_budget_negative_budget_rejected():
    service = BudgetService()
    with pytest.raises(ValueError, match="Budget cannot be negative"):
        service.allocate_budget(-1000.0, 5, 2, TravelStyle.budget)


def test_check_budget_status_zero_budget():
    service = BudgetService()
    result = service.check_budget_status(0.0, 0.0, 0.0, 1, total_days=1)
    assert result["status"] == "on_track"
    assert result["daily_remaining"] == 0.0


def test_suggest_savings_returns_list():
    service = BudgetService()
    suggestions = service.suggest_savings({}, 5000.0)
    assert isinstance(suggestions, list)
    assert len(suggestions) > 0
