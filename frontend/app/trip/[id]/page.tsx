// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTrip } from "@/hooks/useTrip";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Map, Calendar as CalendarIcon, Wallet, Utensils, Activity, MessageSquare } from "lucide-react";

import ItineraryView from "@/components/trip/ItineraryView";
import MapView from "@/components/trip/MapView";
import BudgetView from "@/components/trip/BudgetView";
import AIAssistant from "@/components/trip/AIAssistant";
import WeatherBar from "@/components/trip/WeatherBar";

export default function TripDashboardPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { currentTrip, setCurrentTrip, activeTab, setActiveTab, setSavedTripId, savedTripId } = useTrip();
  const [loading, setLoading] = useState(!currentTrip);
  const [saving, setSaving] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const loadTrip = async () => {
      if (id === 'preview' && currentTrip) {
        setLoading(false);
        setAuthError(false);
        return;
      }
      
      try {
        const trip = await api.trips.get(id);
        setCurrentTrip(trip);
        setSavedTripId(id);
        setAuthError(false);
      } catch (e: any) {
        console.error("Failed to load trip", e);
        if (e.status === 401 || e.status === 403) {
          setAuthError(true);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (!currentTrip || id !== 'preview') {
      loadTrip();
    }
  }, [id, currentTrip, setCurrentTrip, setSavedTripId]);

  const handleSaveTrip = async () => {
    if (!currentTrip) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      const result = await api.trips.save(user.id, currentTrip, currentTrip.destination + ' Trip');
      setSavedTripId(result.id);
      router.push(`/trip/${result.id}`);
    } catch (e: any) {
      console.error("Save failed", e);
      if (e.status === 401 || e.status === 403) {
        router.push('/auth');
      } else {
        alert("Failed to save trip. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (authError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Unauthorized</h2>
          <p className="text-slate-500 mb-6">You don't have permission to view this trip.</p>
          <button onClick={() => router.push('/auth')} className="px-6 py-3 bg-primary text-white rounded-xl font-medium">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!currentTrip) {
    return <div className="p-12 text-center">Trip not found</div>;
  }

  const tabs = [
    { id: 'itinerary', label: 'Itinerary', icon: CalendarIcon },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'budget', label: 'Budget', icon: Wallet },
    { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
  ] as const;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{currentTrip.destination} Trip</h1>
              <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                <span>{currentTrip.start_date} to {currentTrip.end_date}</span>
                <span>•</span>
                <span>{currentTrip.num_travelers} Travelers</span>
                <span>•</span>
                <span>{currentTrip.currency} {currentTrip.total_budget} Budget</span>
              </div>
            </div>
            {id === 'preview' && !savedTripId && (
              <button 
                onClick={handleSaveTrip}
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Trip'}
              </button>
            )}
            {id !== 'preview' && (
              <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Saved</span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="flex space-x-1 border-b border-slate-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex max-w-7xl mx-auto">
          {/* Main Panel */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <WeatherBar />
            
            <div className="mt-6">
              {activeTab === 'itinerary' && <ItineraryView />}
              {activeTab === 'map' && <MapView />}
              {activeTab === 'budget' && <BudgetView />}
              {activeTab === 'assistant' && (
                <div className="md:hidden h-[600px] border border-slate-200 rounded-xl overflow-hidden">
                  <AIAssistant />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (AI Assistant on desktop) */}
          <div className="hidden md:block w-96 border-l border-slate-200 bg-white shrink-0">
            <AIAssistant />
          </div>
        </div>
      </div>
    </div>
  );
}
