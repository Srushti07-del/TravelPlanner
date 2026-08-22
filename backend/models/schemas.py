from enum import Enum
from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import List, Optional


class TravelStyle(str, Enum):
    budget = "budget"
    comfort = "comfort"
    luxury = "luxury"


class Interest(str, Enum):
    beaches = "beaches"
    adventure = "adventure"
    food = "food"
    culture = "culture"
    nature = "nature"
    nightlife = "nightlife"
    shopping = "shopping"
    history = "history"
    wellness = "wellness"


class FoodPreference(str, Enum):
    vegetarian = "vegetarian"
    vegan = "vegan"
    non_vegetarian = "non_vegetarian"
    no_preference = "no_preference"


class AccommodationPreference(str, Enum):
    hostel = "hostel"
    budget_hotel = "budget_hotel"
    mid_range = "mid_range"
    luxury = "luxury"


class TransportPreference(str, Enum):
    public = "public"
    taxi = "taxi"
    rental = "rental"
    walking = "walking"


class TripRequest(BaseModel):
    destination: str
    origin: str
    start_date: date
    end_date: date
    num_travelers: int = Field(ge=1, le=20)
    total_budget: float
    currency: str = "INR"
    travel_style: TravelStyle
    interests: List[Interest]
    food_preference: FoodPreference
    accommodation_preference: AccommodationPreference
    transport_preference: TransportPreference
    special_requests: Optional[str] = None


class TimeSlot(BaseModel):
    time: str
    activity_name: str
    description: str
    duration_minutes: int
    estimated_cost: float
    category: str
    location_name: str
    lat: float
    lng: float
    tips: str


class Restaurant(BaseModel):
    name: str
    cuisine: str
    price_range: str
    rating: float
    distance_from_prev_activity_km: float
    dietary_options: List[str]
    opening_hours: str
    address: str
    google_maps_url: str


class DayPlan(BaseModel):
    day_number: int
    date: str
    title: str
    theme: str
    time_slots: List[TimeSlot]
    restaurants: List[Restaurant]
    estimated_day_cost: float
    weather_note: str
    transportation_for_day: str
    total_distance_km: float
    weather_forecast_available: bool = False


class BudgetBreakdown(BaseModel):
    accommodation: float
    food: float
    transportation: float
    activities: float
    shopping: float
    emergency_buffer: float
    total_planned: float
    actual_expenses: float = 0.0
    remaining_budget: float = 0.0
    projected_trip_cost: float = 0.0
    budget_status: str = "within_budget"


class Itinerary(BaseModel):
    trip_id: Optional[str] = None
    destination: str
    origin: str
    start_date: str
    end_date: str
    num_travelers: int
    total_budget: float
    currency: str
    budget_breakdown: BudgetBreakdown
    days: List[DayPlan]
    ai_notes: str
    generated_at: str
    actual_cost: float = 0.0
    remaining_budget: float = 0.0


class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str


class ChatRequest(BaseModel):
    trip_id: str
    message: str
    itinerary: Itinerary
    chat_history: List[ChatMessage] = Field(default_factory=list, alias="history")

    model_config = {"populate_by_name": True}


class ChatResponse(BaseModel):
    message: str = Field(default="", alias="reply", serialization_alias="reply")
    updated_itinerary: Optional[Itinerary] = None
    changes_summary: Optional[str] = None

    model_config = {"populate_by_name": True}


class ReplanReason(str, Enum):
    weather = "weather"
    delay = "delay"
    budget_change = "budget_change"
    attraction_closed = "attraction_closed"
    location_change = "location_change"
    time_constraint = "time_constraint"
    preference_change = "preference_change"


class ReplanRequest(BaseModel):
    trip_id: str
    itinerary: Itinerary
    reason: ReplanReason
    context: str
    affected_days: Optional[List[int]] = None
    new_budget: Optional[float] = None
    current_location: Optional[str] = None


class ReplanResponse(BaseModel):
    updated_itinerary: Itinerary
    changes_made: List[str]
    ai_explanation: str
    message: str = ""


class SaveTripRequest(BaseModel):
    user_id: str
    itinerary: Itinerary
    title: str


class TripSummary(BaseModel):
    id: str
    title: str
    destination: str
    start_date: str
    end_date: str
    num_travelers: int
    total_budget: float
    currency: str
    created_at: str


class ErrorResponse(BaseModel):
    error: dict
