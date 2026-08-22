import pytest
from services.budget_service import BudgetService
from models.schemas import TravelStyle

def test_allocate_budget():
    service = BudgetService()
    breakdown = service.allocate_budget(10000.0, 5, 2, TravelStyle.budget)
    assert breakdown.total_planned == 10000.0
    assert breakdown.accommodation == 2500.0
    assert breakdown.food == 3000.0
    assert breakdown.transportation == 2000.0
    assert breakdown.activities == 1500.0
    assert breakdown.shopping == 500.0
    assert breakdown.emergency_buffer == 500.0

def test_check_budget_status():
    service = BudgetService()
    # 5-day trip, 10000 total budget. After day 1 (4 days remaining), expected spent is 2000.
    status_on_track = service.check_budget_status(10000.0, 10000.0, 1800.0, 4, total_days=5)
    assert status_on_track["status"] == "on_track"
    assert status_on_track["overspend_by"] == 0.0
    
    # Spent 9000 with 4 days remaining -> heavily over budget
    status_over = service.check_budget_status(10000.0, 10000.0, 9000.0, 4, total_days=5)
    assert status_over["status"] == "over_budget"
    assert status_over["overspend_by"] > 0
