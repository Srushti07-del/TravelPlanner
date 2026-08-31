import os
import json
import logging

logger = logging.getLogger(__name__)

from google import genai
from google.genai import types
from google.genai.errors import APIError
from models.schemas import TripRequest, ChatRequest, ChatResponse, ReplanRequest, ReplanResponse, Itinerary, PackingListCategory


class GeminiService:
    """Core AI service using Google Gemini 2.0 Flash via the google-genai SDK."""

    def __init__(self):
        self._client: genai.Client | None = None
        self.model = "gemini-3.6-flash"

    @property
    def client(self) -> genai.Client:
        if self._client is None:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError(
                    "GEMINI_API_KEY is not set. Please add it to your backend/.env file."
                )
            self._client = genai.Client(api_key=api_key)
        return self._client

    def _extract_json(self, text: str) -> dict:
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())

    def _validate_coordinates(self, data: dict) -> None:
        """Reject itineraries whose activities carry out-of-range coordinates.

        The LLM is not a geocoder; impossible coordinates mean the generated
        plan is unreliable and should not be persisted.
        """
        for day in data.get("days", []):
            for slot in day.get("time_slots", []):
                lat = slot.get("lat")
                lng = slot.get("lng")
                if lat is None or lng is None:
                    continue
                if not (-90.0 <= float(lat) <= 90.0 and -180.0 <= float(lng) <= 180.0):
                    raise ValueError(
                        f"Invalid coordinates for '{slot.get('activity_name', 'unknown')}': "
                        f"({lat}, {lng})."
                    )

    def _validate_itinerary_schema(self, data: dict) -> dict:
        """Validate raw dict against Itinerary schema and return validated dict."""
        try:
            self._validate_coordinates(data)
            return Itinerary(**data).model_dump()
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError(f"Itinerary schema validation failed: {exc}")

    def _validate_budget_schema(self, data: dict) -> dict:
        """Validate raw dict against BudgetBreakdown schema and return validated dict."""
        try:
            from models.schemas import BudgetBreakdown
            return BudgetBreakdown(**data).model_dump()
        except Exception as exc:
            raise ValueError(f"BudgetBreakdown schema validation failed: {exc}")

    async def _generate_content(self, prompt: str, temperature: float = 0.7) -> str:
        """Call Gemini with timeout and structured error handling."""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=temperature,
                    max_output_tokens=8192,
                ),
            )
            return response.text
        except APIError as exc:
            raise ValueError(f"Gemini API error: {exc}") from exc
        except Exception as exc:
            raise ValueError(f"Gemini request failed: {exc}") from exc

    async def generate_itinerary(self, request: TripRequest) -> dict:
        num_days = (request.end_date - request.start_date).days + 1
        prompt = f"""You are an expert AI Travel Planner.

Trip Details:
- From: {request.origin}
- To: {request.destination}
- Dates: {request.start_date} to {request.end_date} ({num_days} days)
- Travelers: {request.num_travelers}
- Total Budget: {request.total_budget} {request.currency}
- Travel Style: {request.travel_style.value}
- Interests: {', '.join(i.value for i in request.interests)}
- Food Preference: {request.food_preference.value}
- Accommodation: {request.accommodation_preference.value}
- Transport Preference: {request.transport_preference.value}
- Special Requests: {request.special_requests or 'None'}

Generate a complete, realistic, day-by-day itinerary. Use real place names and realistic costs.

IMPORTANT: Do NOT invent factual data such as coordinates, ratings, opening hours, addresses, or exact prices. Leave lat/lng as 0.0. Leave rating as 0.0. Leave distance fields as 0.0. The backend will enrich these with real external data.

Return ONLY raw valid JSON (no markdown, no code blocks) matching this exact schema:
{{
  "destination": "string",
  "origin": "string",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "num_travelers": {request.num_travelers},
  "total_budget": {request.total_budget},
  "currency": "{request.currency}",
  "budget_breakdown": {{
    "accommodation": float,
    "food": float,
    "transportation": float,
    "activities": float,
    "shopping": float,
    "emergency_buffer": float,
    "total_planned": float
  }},
  "days": [
    {{
      "day_number": 1,
      "date": "YYYY-MM-DD",
      "title": "string",
      "theme": "string",
      "time_slots": [
        {{
          "time": "HH:MM AM/PM",
          "activity_name": "string",
          "description": "2-3 sentence description",
          "duration_minutes": integer,
          "estimated_cost": float,
          "category": "string (e.g. Beach, Food, Adventure, Culture, Hotel)",
          "location_name": "specific real place name",
          "lat": 0.0,
          "lng": 0.0,
          "tips": "practical tip for the traveler"
        }}
      ],
      "restaurants": [
        {{
          "name": "real restaurant name",
          "cuisine": "string",
          "price_range": "Budget/Mid-range/Fine Dining",
          "rating": 0.0,
          "distance_from_prev_activity_km": 0.0,
          "dietary_options": ["Vegetarian", "Vegan", "Non-Vegetarian"],
          "opening_hours": "HH:MM AM - HH:MM PM",
          "address": "real address",
          "maps_url": ""
        }}
      ],
      "estimated_day_cost": float,
      "weather_note": "brief weather expectation for this time of year",
      "transportation_for_day": "main mode of transport for the day",
      "total_distance_km": 0.0
    }}
  ],
  "ai_notes": "2-3 sentences of key travel tips for this trip",
  "generated_at": "2024-01-01T00:00:00Z"
}}

Important rules:
1. Budget breakdown MUST sum to total_budget ({request.total_budget} {request.currency})
2. Sum of all estimated_day_cost values should be close to total_planned in budget_breakdown
3. Include {num_days} days exactly
4. Include 3-5 time_slots per day and 2-3 restaurants per day
5. Use realistic place names for the destination
6. Costs must be realistic for {request.travel_style.value} travel
"""
        text = await self._generate_content(prompt, temperature=0.7)
        data = self._extract_json(text)
        self._validate_itinerary_schema(data)
        self._validate_budget_schema(data.get("budget_breakdown", {}))
        return data

    async def chat_modify(self, request: ChatRequest) -> ChatResponse:
        prompt = f"""You are an adaptive travel planner AI. A user wants to modify their trip itinerary.

Current Itinerary (JSON):
{request.itinerary.model_dump_json(indent=2)}

User's Request: "{request.message}"

Instructions:
- Understand the user's intent and modify ONLY the relevant days/activities.
- Preserve all other days and preferences unchanged.
- Return ONLY raw valid JSON (no markdown) matching this exact schema:
{{
  "reply": "Your friendly conversational response to the user explaining what you changed",
  "updated_itinerary": {{ ...complete updated itinerary JSON using the same schema as above, or null if no changes needed... }},
  "changes_summary": "Brief bullet-point summary of what changed, or null if no changes"
}}
"""
        text = await self._generate_content(prompt, temperature=0.6)
        data = self._extract_json(text)
        updated_itinerary_data = data.get("updated_itinerary")
        validated_itinerary = None
        if updated_itinerary_data:
            validated_itinerary = Itinerary(**self._validate_itinerary_schema(updated_itinerary_data))
        return ChatResponse(
            message=data.get("message", "I've processed your request."),
            updated_itinerary=validated_itinerary,
            changes_summary=data.get("changes_summary"),
        )

    async def replan_itinerary(
        self, request: ReplanRequest, enriched_context: dict | None = None
    ) -> ReplanResponse:
        scenario_guidance = {
            "weather": "Swap outdoor activities with suitable indoor alternatives. Keep costs similar.",
            "delay": f"Recalculate the schedule for affected days. Current location: {request.current_location or 'unknown'}. Remove or shorten activities that no longer fit.",
            "budget_change": f"New remaining budget: {request.new_budget} {request.itinerary.currency}. Replace expensive activities/restaurants with budget-friendly alternatives. Prioritize free and low-cost options.",
            "attraction_closed": "Find a nearby, similar attraction as replacement. Keep the time slot and cost similar.",
            "location_change": f"User is now at: {request.current_location}. Suggest the best nearby activities and restaurants that fit the remaining schedule and budget.",
            "time_constraint": "Shorten or remove lower-priority activities to fit the available time. Keep must-see highlights.",
            "preference_change": "Adjust activities to better match the user's updated preference while staying within budget.",
        }

        guidance = scenario_guidance.get(request.reason.value, "Replan appropriately.")
        affected_str = (
            f"Days {request.affected_days}" if request.affected_days else "all relevant days"
        )

        context_str = ""
        if enriched_context and enriched_context.get("real_data_available"):
            context_str = f"\nReal-world data:\n{json.dumps(enriched_context, indent=2)}"

        prompt = f"""You are an adaptive travel planner AI. An unexpected situation requires replanning.

Situation: {request.reason.value.replace('_', ' ').title()}
Context: {request.context}
Affected: {affected_str}
Guidance: {guidance}
{context_str}

Current Itinerary:
{request.itinerary.model_dump_json(indent=2)}

Replan ONLY the affected days. Keep all other days exactly as they are.
Return ONLY raw valid JSON (no markdown) matching this schema:
{{
  "updated_itinerary": {{ ...complete updated itinerary JSON with only affected days modified... }},
  "changes_made": ["Change 1 description", "Change 2 description", ...],
  "ai_explanation": "A friendly 2-3 sentence explanation of what changed and why",
  "message": "A concise summary message for the user"
}}
"""
        text = await self._generate_content(prompt, temperature=0.6)
        data = self._extract_json(text)
        return ReplanResponse(
            updated_itinerary=Itinerary(**self._validate_itinerary_schema(data["updated_itinerary"])),
            changes_made=data.get("changes_made", []),
            ai_explanation=data.get("ai_explanation", ""),
            message=data.get("message", ""),
        )

    def _validate_itinerary(self, data: dict) -> None:
        try:
            Itinerary(**data)
        except Exception as e:
            logger.error("Invalid itinerary generated by AI: %s", e)
            raise ValueError(f"AI generated invalid itinerary: {e}")

    async def generate_packing_list(self, itinerary: Itinerary) -> list[PackingListCategory]:
        prompt = f"""You are an expert AI Travel Planner. Generate a smart packing list for this trip.

Destination: {itinerary.destination}
Dates: {itinerary.start_date} to {itinerary.end_date}
Travel Style: {itinerary.budget_breakdown.total_planned} {itinerary.currency} budget
Activities planned: {', '.join([slot.activity_name for day in itinerary.days for slot in day.time_slots])}
Expected Weather: {', '.join(set([day.weather_note for day in itinerary.days if day.weather_note]))}

Generate a comprehensive, categorized packing list that is perfectly tailored to these activities and weather conditions.
Return ONLY raw valid JSON (no markdown, no code blocks) matching this exact schema:
{{
  "packing_list": [
    {{
      "category_name": "string (e.g. Clothes, Toiletries, Electronics, Documents, Miscellaneous)",
      "items": [
        {{
          "item_name": "string",
          "reason": "1 sentence explaining why it's needed based on the itinerary or weather"
        }}
      ]
    }}
  ]
}}
"""
        text = await self._generate_content(prompt, temperature=0.5)
        data = self._extract_json(text)
        
        packing_list_data = data.get("packing_list", [])
        return [PackingListCategory(**cat) for cat in packing_list_data]

    async def get_destination_info(self, country: str) -> dict:
        prompt = f"""You are a knowledgeable travel expert. Provide a short travel preview for the destination/country: {country}.
Return ONLY raw valid JSON (no markdown, no code blocks) matching this exact schema:
{{
  "summary": "A 1-2 sentence compelling summary of what makes {country} special.",
  "best_time_to_visit": "e.g., Spring (March-May) or Autumn (Sept-Nov)",
  "ideal_duration": "e.g., 10-14 days",
  "currency": "e.g., Japanese Yen (JPY)"
}}
"""
        text = await self._generate_content(prompt, temperature=0.5)
        data = self._extract_json(text)
        return data
