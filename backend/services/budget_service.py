from models.schemas import BudgetBreakdown, TravelStyle
from typing import Dict, List

class BudgetService:
    def allocate_budget(self, total: float, days: int, num_travelers: int, style: TravelStyle) -> BudgetBreakdown:
        if style == TravelStyle.budget:
            ratios = (0.25, 0.30, 0.20, 0.15, 0.05, 0.05)
        elif style == TravelStyle.luxury:
            ratios = (0.45, 0.25, 0.10, 0.10, 0.05, 0.05)
        else: # comfort
            ratios = (0.35, 0.25, 0.15, 0.15, 0.05, 0.05)

        return BudgetBreakdown(
            accommodation=round(total * ratios[0], 2),
            food=round(total * ratios[1], 2),
            transportation=round(total * ratios[2], 2),
            activities=round(total * ratios[3], 2),
            shopping=round(total * ratios[4], 2),
            emergency_buffer=round(total * ratios[5], 2),
            total_planned=total
        )

    def check_budget_status(self, total_budget: float, planned_cost: float, spent: float, days_remaining: int, total_days: int = 0) -> Dict:
        remaining = total_budget - spent
        if total_days > 0 and days_remaining <= total_days:
            days_passed = total_days - days_remaining
            expected_spent = (total_budget / total_days) * days_passed
        else:
            expected_spent = 0.0
        
        overspend = max(0.0, round(spent - expected_spent, 2))
        is_over = overspend > 0.05 or remaining < 0
        return {
            "status": "over_budget" if is_over else "on_track",
            "overspend_by": round(overspend, 2) if is_over else 0.0,
            "daily_remaining": round(max(0.0, remaining) / max(1, days_remaining), 2),
            "recommendation": "Cut back on dining and shopping or choose cheaper activities." if is_over else "You are on track and within budget."
        }

    def validate_within_budget(self, days: List[Dict], total_budget: float, tolerance: float = 0.20) -> None:
        """Deterministically guard against hallucinated over-budget itineraries.

        Raises ValueError if the sum of per-day estimated costs exceeds the
        user-authorized total budget by more than the tolerance fraction.
        """
        planned = sum(float(d.get("estimated_day_cost", 0.0) or 0.0) for d in days)
        max_allowed = total_budget * (1.0 + tolerance)
        if planned > max_allowed:
            raise ValueError(
                f"Generated itinerary cost ({planned:.2f}) exceeds the authorized "
                f"budget ({total_budget:.2f}) by more than {int(tolerance * 100)}%."
            )

        return [
            "Switch to public transport or shared cabs instead of private taxis.",
            "Opt for highly-rated street food or local eateries over fine dining.",
            "Prioritize free or low-cost outdoor attractions like parks, beaches, and historic walks.",
            "Book group tours or look for online discounts for ticketed attractions."
        ]
