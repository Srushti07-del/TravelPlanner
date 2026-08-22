export type TravelStyle = 'budget' | 'comfort' | 'luxury';
export type Interest = 'beaches' | 'adventure' | 'food' | 'culture' | 'nature' | 'nightlife' | 'shopping' | 'history' | 'wellness';
export type FoodPreference = 'vegetarian' | 'vegan' | 'non_vegetarian' | 'no_preference';
export type AccommodationPreference = 'hostel' | 'budget_hotel' | 'mid_range' | 'luxury';
export type TransportPreference = 'public' | 'taxi' | 'rental' | 'walking';
export type ReplanReason = 'weather' | 'delay' | 'budget_change' | 'attraction_closed' | 'location_change' | 'time_constraint' | 'preference_change';

export interface TripRequest {
  destination: string;
  origin: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  num_travelers: number;
  total_budget: number;
  currency: string;
  travel_style: TravelStyle;
  interests: Interest[];
  food_preference: FoodPreference;
  accommodation_preference: AccommodationPreference;
  transport_preference: TransportPreference;
  special_requests?: string;
}

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
  tips?: string;
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
  google_maps_url: string;
}

export interface DayPlan {
  day_number: number;
  date: string;
  title: string;
  theme: string;
  time_slots: TimeSlot[];
  restaurants: Restaurant[];
  estimated_day_cost: number;
  weather_note?: string;
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
  ai_notes?: string;
  generated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
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

export interface WeatherDay {
  date: string;
  temp_min: number;
  temp_max: number;
  description: string;
  icon: string;
  is_outdoor_suitable: boolean;
  warning?: string;
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
  suggested_actions?: string[];
}

export interface ReplanRequest {
  trip_id: string;
  itinerary: Itinerary;
  reason: ReplanReason;
  context: string;
}

export interface ReplanResponse {
  message: string;
  updated_itinerary: Itinerary;
}
