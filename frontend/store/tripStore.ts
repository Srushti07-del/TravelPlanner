import { create } from 'zustand';
import { Itinerary, ChatMessage, WeatherDay } from '../types/trip';

interface TripStore {
  currentTrip: Itinerary | null;
  savedTripId: string | null;
  chatHistory: ChatMessage[];
  isGenerating: boolean;
  isReplanning: boolean;
  isChatLoading: boolean;
  weather: WeatherDay[];
  activeTab: 'itinerary' | 'map' | 'budget' | 'restaurants' | 'activities' | 'assistant';
  
  setCurrentTrip: (trip: Itinerary | null) => void;
  setSavedTripId: (id: string | null) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setIsGenerating: (v: boolean) => void;
  setIsReplanning: (v: boolean) => void;
  setIsChatLoading: (v: boolean) => void;
  setWeather: (w: WeatherDay[]) => void;
  setActiveTab: (tab: 'itinerary' | 'map' | 'budget' | 'restaurants' | 'activities' | 'assistant') => void;
  updateItinerary: (updated: Itinerary) => void;
  reset: () => void;
}

export const useTripStore = create<TripStore>((set) => ({
  currentTrip: null,
  savedTripId: null,
  chatHistory: [],
  isGenerating: false,
  isReplanning: false,
  isChatLoading: false,
  weather: [],
  activeTab: 'itinerary',

  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setSavedTripId: (id) => set({ savedTripId: id }),
  addChatMessage: (msg) => set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
  setIsGenerating: (v) => set({ isGenerating: v }),
  setIsReplanning: (v) => set({ isReplanning: v }),
  setIsChatLoading: (v) => set({ isChatLoading: v }),
  setWeather: (w) => set({ weather: w }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  updateItinerary: (updated) => set({ currentTrip: updated }),
  reset: () => set({
    currentTrip: null,
    savedTripId: null,
    chatHistory: [],
    isGenerating: false,
    isReplanning: false,
    isChatLoading: false,
    weather: [],
    activeTab: 'itinerary',
  }),
}));
