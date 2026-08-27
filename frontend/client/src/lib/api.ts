/**
 * API client for the TravelPlanner backend.
 *
 * All requests go through the Vite dev proxy (/api → localhost:8000)
 * or a configured backend URL.
 */

import { COOKIE_NAME } from "@shared/const";

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
  weather_forecast_available?: boolean;
}

export interface BudgetBreakdown {
  accommodation: number;
  food: number;
  transportation: number;
  activities: number;
  shopping: number;
  emergency_buffer: number;
  total_planned: number;
  actual_expenses?: number;
  remaining_budget?: number;
  projected_trip_cost?: number;
  budget_status?: string;
}

export interface PackingListItem {
  item_name: string;
  reason: string;
}

export interface PackingListCategory {
  category_name: string;
  items: PackingListItem[];
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
  actual_cost?: number;
  remaining_budget?: number;
  packing_list?: PackingListCategory[];
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

export interface SaveTripRequest {
  user_id: string;
  itinerary: Itinerary;
  title: string;
}

export interface TripSummary {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  num_travelers: number;
  total_budget: number;
  currency: string;
  created_at: string;
}

export interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  trip_id: string;
  message: string;
  itinerary: Itinerary;
  history: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  updated_itinerary?: Itinerary;
  changes_summary?: string;
}

export interface ReplanRequest {
  trip_id: string;
  itinerary: Itinerary;
  reason: string;
  context: string;
  affected_days?: number[];
  new_budget?: number;
  current_location?: string;
}

export interface ReplanResponse {
  updated_itinerary: Itinerary;
  changes_made: string[];
  ai_explanation: string;
  message: string;
}

export interface PackingListRequest {
  trip_id: string;
  itinerary: Itinerary;
}

export interface PackingListResponse {
  packing_list: PackingListCategory[];
}

export interface DestinationInfoResponse {
  summary: string;
  best_time_to_visit: string;
  ideal_duration: string;
  currency: string;
}


export interface Expense {
  id?: string;
  trip_id: string;
  category: string;
  amount: number;
  description: string;
  expense_date: string;
  created_at?: string;
}

export interface ExpenseCreate {
  trip_id: string;
  category: string;
  amount: number;
  description: string;
  expense_date: string;
}

export interface ExpenseUpdate {
  category?: string;
  amount?: number;
  description?: string;
  expense_date?: string;
}

// ---------------------------------------------------------------
// API functions
// ---------------------------------------------------------------

function getAuthHeader(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem("manus-cookie");
    if (raw) {
      const prefix = `${COOKIE_NAME}=`;
      const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
      const token = pair?.trim().slice(prefix.length);
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    }
  } catch {
    // sessionStorage unavailable
  }
  return {};
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  return response.json();
}

// --- TRIPS ---
export async function generateTrip(request: TripRequest): Promise<Itinerary> {
  return fetchApi<Itinerary>("/trips/generate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function saveTrip(request: SaveTripRequest): Promise<{ trip_id: string }> {
  return fetchApi<{ trip_id: string }>("/trips/save", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function getUserTrips(userId: string): Promise<TripSummary[]> {
  return fetchApi<TripSummary[]>(`/trips/user/${encodeURIComponent(userId)}`);
}

export async function getTrip(tripId: string): Promise<Itinerary> {
  return fetchApi<Itinerary>(`/trips/${encodeURIComponent(tripId)}`);
}

export async function updateTrip(tripId: string, updates: Partial<Itinerary>): Promise<Itinerary> {
  return fetchApi<Itinerary>(`/trips/${encodeURIComponent(tripId)}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteTrip(tripId: string): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>(`/trips/${encodeURIComponent(tripId)}`, {
    method: "DELETE",
  });
}

// --- AI ---
export async function chat(request: ChatRequest): Promise<ChatResponse> {
  return fetchApi<ChatResponse>("/ai/chat", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function replan(request: ReplanRequest): Promise<ReplanResponse> {
  return fetchApi<ReplanResponse>("/ai/replan", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function generatePackingList(request: PackingListRequest): Promise<PackingListResponse> {
  return fetchApi<PackingListResponse>("/ai/packing-list", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function getDestinationInfo(country: string): Promise<DestinationInfoResponse> {
  return fetchApi<DestinationInfoResponse>(`/ai/destination-info?country=${encodeURIComponent(country)}`);
}

// --- PLACES ---
export async function searchPlaces(query: string, location: string): Promise<any[]> {
  return fetchApi<any[]>(`/places/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`);
}

export async function getNearbyPlaces(lat: number, lng: number, radius: number = 5000, keyword: string = ""): Promise<any[]> {
  return fetchApi<any[]>(`/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}`);
}

// --- WEATHER ---
export async function getWeather(destination: string): Promise<any[]> {
  return fetchApi<any[]>(`/weather/${encodeURIComponent(destination)}`);
}

// --- IMAGES ---
export async function getDestinationImage(query: string): Promise<{ url: string }> {
  return fetchApi<{ url: string }>(`/images?query=${encodeURIComponent(query)}`);
}

export async function getMultipleDestinationImages(query: string, count: number = 3): Promise<{ urls: string[] }> {
  return fetchApi<{ urls: string[] }>(`/images/multiple?query=${encodeURIComponent(query)}&count=${count}`);
}

// --- EXPENSES ---
export async function addExpense(request: ExpenseCreate): Promise<Expense> {
  return fetchApi<Expense>("/expenses/", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function getExpenses(tripId: string): Promise<Expense[]> {
  return fetchApi<Expense[]>(`/expenses/trip/${encodeURIComponent(tripId)}`);
}

export async function getExpenseSummary(tripId: string): Promise<any> {
  return fetchApi<any>(`/expenses/trip/${encodeURIComponent(tripId)}/summary`);
}

export async function updateExpense(expenseId: string, updates: ExpenseUpdate): Promise<Expense> {
  return fetchApi<Expense>(`/expenses/${encodeURIComponent(expenseId)}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteExpense(expenseId: string): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>(`/expenses/${encodeURIComponent(expenseId)}`, {
    method: "DELETE",
  });
}
