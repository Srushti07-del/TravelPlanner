import { useTripStore } from '../store/tripStore';
import { api } from '../lib/api';
import { TripRequest, ReplanReason } from '../types/trip';
import { supabase } from '../lib/supabase';

export function useTrip() {
  const store = useTripStore();

  const generateTrip = async (request: TripRequest) => {
    store.setIsGenerating(true);
    try {
      const itinerary = await api.trips.generate(request);
      store.setCurrentTrip(itinerary);
      
      try {
        const weather = await api.weather.getForecast(request.destination);
        store.setWeather(weather);
      } catch (e) {
        console.error('Failed to fetch weather', e);
      }
      
      return itinerary;
    } finally {
      store.setIsGenerating(false);
    }
  };

  const ensureSavedTrip = async (): Promise<string | null> => {
    if (store.savedTripId) return store.savedTripId;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/auth';
      return null;
    }
    
    if (!store.currentTrip) return null;
    
    const result = await api.trips.save(user.id, store.currentTrip, store.currentTrip.destination + ' Trip');
    store.setSavedTripId(result.id);
    return result.id;
  };

  const sendChatMessage = async (message: string) => {
    if (!store.currentTrip) return;
    
    const tripId = await ensureSavedTrip();
    if (!tripId) return;
    
    store.setIsChatLoading(true);
    store.addChatMessage({ role: 'user', content: message, timestamp: new Date().toISOString() });
    
    try {
      const response = await api.ai.chat({
        trip_id: tripId,
        message,
        itinerary: store.currentTrip,
        history: store.chatHistory
      });
      
      store.addChatMessage({ role: 'assistant', content: response.reply, timestamp: new Date().toISOString() });
      
      if (response.updated_itinerary) {
        store.updateItinerary(response.updated_itinerary);
      }
    } finally {
      store.setIsChatLoading(false);
    }
  };

  const triggerReplan = async (reason: ReplanReason, context: string) => {
    if (!store.currentTrip) return;
    
    const tripId = await ensureSavedTrip();
    if (!tripId) return;
    
    store.setIsReplanning(true);
    try {
      const response = await api.ai.replan({
        trip_id: tripId,
        itinerary: store.currentTrip,
        reason,
        context
      });
      
      store.updateItinerary(response.updated_itinerary);
    } finally {
      store.setIsReplanning(false);
    }
  };

  return {
    generateTrip,
    sendChatMessage,
    triggerReplan,
    ensureSavedTrip,
    ...store
  };
}
