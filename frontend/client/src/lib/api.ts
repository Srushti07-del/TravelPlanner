/**
 * API client for the TravelPlanner backend.
 *
 * All requests go through the Vite dev proxy (/api → localhost:8000)
 * or a configured backend URL.
 */

const API_BASE = "/api";

// ---------------------------------------------------------------
// Types (mirrored from backend schemas for frontend consumption)
// ---------------------------------------------------------------

export interface TimeSlot {
  time: string;
  activity_name: string;
  description: string;
  duration_minutes: number;
  estimated_cost: number;
  category: string;
  location_name: string;
  lat: number;
  lng: number;
  tips: string;
}

export interface Restaurant {
  name: string;
  cuisine: string;
  price_range: string;
  rating: number;
  distance_from_prev_activity_km: number;
  dietary_options: string[];
  opening_hours: string;
  address: string;
  maps_url?: string;
  google_maps_url?: string; // backwards compat
}

export interface DayPlan {
  day_number: number;
  date: string;
  title: string;
  theme: string;
  time_slots: TimeSlot[];
  restaurants: Restaurant[];
  estimated_day_cost: number;
  weather_note: string;
  transportation_for_day: string;
  total_distance_km: number;
}

export interface BudgetBreakdown {
  accommodation: number;
  food: number;
  transportation: number;
  activities: number;
  shopping: number;
  emergency_buffer: number;
  total_planned: number;
}

export interface Itinerary {
  trip_id?: string;
  destination: string;
  origin: string;
  start_date: string;
  end_date: string;
  num_travelers: number;
  total_budget: number;
  currency: string;
  budget_breakdown: BudgetBreakdown;
  days: DayPlan[];
  ai_notes: string;
  generated_at: string;
}

export interface TripRequest {
  destination: string;
  origin: string;
  start_date: string;
  end_date: string;
  num_travelers: number;
  total_budget: number;
  currency: string;
  travel_style: string;
  interests: string[];
  food_preference: string;
  accommodation_preference: string;
  transport_preference: string;
  special_requests?: string;
}

// ---------------------------------------------------------------
// API functions
// ---------------------------------------------------------------

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  return response.json();
}

export async function generateTrip(request: TripRequest): Promise<Itinerary> {
  return fetchApi<Itinerary>("/trips/generate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function getDestinationImage(query: string): Promise<{ url: string }> {
  return fetchApi<{ url: string }>(`/images?query=${encodeURIComponent(query)}`);
}
