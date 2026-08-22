import { TripRequest, Itinerary, ChatRequest, ChatResponse, ReplanRequest, ReplanResponse, WeatherDay } from '../types/trip';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API error: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

export const api = {
  trips: {
    generate: (request: TripRequest) => fetchApi<Itinerary>('/trips/generate', { method: 'POST', body: JSON.stringify(request) }),
    save: (userId: string, itinerary: Itinerary, title: string) => fetchApi<{ id: string; title: string }>('/trips/save', { method: 'POST', body: JSON.stringify({ user_id: userId, itinerary, title }) }),
    get: (id: string) => fetchApi<Itinerary>(`/trips/${id}`),
    update: (id: string, data: Partial<Itinerary>) => fetchApi<Itinerary>(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<any>(`/trips/${id}`, { method: 'DELETE' }),
    listByUser: (userId: string) => fetchApi<any[]>(`/trips/user/${userId}`),
  },
  ai: {
    chat: (request: ChatRequest) => fetchApi<ChatResponse>('/ai/chat', { method: 'POST', body: JSON.stringify(request) }),
    replan: (request: ReplanRequest) => fetchApi<ReplanResponse>('/ai/replan', { method: 'POST', body: JSON.stringify(request) }),
  },
  weather: {
    getForecast: (destination: string) => fetchApi<WeatherDay[]>(`/weather/${encodeURIComponent(destination)}`),
  },
  places: {
    search: (q: string, location: string, type: string) => fetchApi<any>(`/places/search?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}&type=${encodeURIComponent(type)}`),
    nearby: (lat: number, lng: number, radius: number, type: string) => fetchApi<any>(`/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}&type=${type}`),
  },
};
