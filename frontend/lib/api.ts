// @ts-nocheck
import { TripRequest, Itinerary, ChatRequest, ChatResponse, ReplanRequest, ReplanResponse, WeatherDay } from '../types/trip';
import { supabase } from './supabase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  }
  return {};
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}, requireAuth = false): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const authHeaders = requireAuth ? await getAuthHeaders() : {};
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      const errorBody = await response.text();
      const error = new Error(`Authentication required: ${response.status}`) as any;
      error.status = response.status;
      error.body = errorBody;
      throw error;
    }
    const errorBody = await response.text();
    throw new Error(`API error: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

export const api = {
  trips: {
    generate: (request: TripRequest) => fetchApi<Itinerary>('/trips/generate', { method: 'POST', body: JSON.stringify(request) }),
    save: (userId: string, itinerary: Itinerary, title: string) => fetchApi<{ id: string; title: string }>('/trips/save', { method: 'POST', body: JSON.stringify({ user_id: userId, itinerary, title }) }, true),
    get: (id: string) => fetchApi<Itinerary>(`/trips/${id}`, {}, true),
    update: (id: string, data: Partial<Itinerary>) => fetchApi<Itinerary>(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(data) }, true),
    delete: (id: string) => fetchApi<any>(`/trips/${id}`, { method: 'DELETE' }, true),
    listByUser: (userId: string) => fetchApi<any[]>(`/trips/user/${userId}`, {}, true),
  },
  ai: {
    chat: (request: ChatRequest) => fetchApi<ChatResponse>('/ai/chat', { method: 'POST', body: JSON.stringify(request) }, true),
    replan: (request: ReplanRequest) => fetchApi<ReplanResponse>('/ai/replan', { method: 'POST', body: JSON.stringify(request) }, true),
  },
  weather: {
    getForecast: (destination: string) => fetchApi<WeatherDay[]>(`/weather/${encodeURIComponent(destination)}`),
  },
  places: {
    search: (q: string, location: string, type: string) => fetchApi<any>(`/places/search?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}&type=${encodeURIComponent(type)}`),
    nearby: (lat: number, lng: number, radius: number, type: string) => fetchApi<any>(`/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}&type=${type}`),
  },
};
