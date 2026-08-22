import { useTripStore } from '../store/tripStore';
import { api } from '../lib/api';
import { TripRequest, ReplanReason } from '../types/trip';

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

  const sendChatMessage = async (message: string) => {
    if (!store.currentTrip) return;
    
    store.setIsChatLoading(true);
    store.addChatMessage({ role: 'user', content: message, timestamp: new Date().toISOString() });
    
    try {
      const response = await api.ai.chat({
        trip_id: store.savedTripId || 'temp_id',
        message,
        itinerary: store.currentTrip,
        chat_history: store.chatHistory
      });
      
      store.addChatMessage({ role: 'assistant', content: response.message, timestamp: new Date().toISOString() });
      
      if (response.updated_itinerary) {
        store.updateItinerary(response.updated_itinerary);
      }
    } finally {
      store.setIsChatLoading(false);
    }
  };

  const triggerReplan = async (reason: ReplanReason, context: string) => {
    if (!store.currentTrip) return;
    
    store.setIsReplanning(true);
    try {
      const response = await api.ai.replan({
        trip_id: store.savedTripId || 'temp_id',
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
    ...store
  };
}
