"use client";

import { useTrip } from "@/hooks/useTrip";
import ActivityCard from "./ActivityCard";
import RestaurantCard from "./RestaurantCard";
import { ChevronDown, RefreshCw, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { DayPlan } from "@/types/trip";

export default function ItineraryView() {
  const { currentTrip, isReplanning, triggerReplan } = useTrip();
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({ 1: true });
  const [replanMenuOpen, setReplanMenuOpen] = useState<number | null>(null);

  if (!currentTrip) return null;

  const toggleDay = (dayNum: number) => {
    setExpandedDays(prev => ({ ...prev, [dayNum]: !prev[dayNum] }));
  };

  const handleReplan = (day: DayPlan, reason: any) => {
    triggerReplan(reason, `Replan day ${day.day_number}: ${day.title}`);
    setReplanMenuOpen(null);
  };

  return (
    <div className="space-y-6">
      {isReplanning && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center justify-center gap-3 text-primary animate-pulse">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="font-medium">AI is adapting your itinerary...</span>
        </div>
      )}

      {currentTrip.days.map((day) => (
        <div key={day.day_number} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Day Header */}
          <div 
            className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => toggleDay(day.day_number)}
          >
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded">
                  DAY {day.day_number}
                </span>
                <span className="text-slate-500 text-sm font-medium">{day.date}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">{day.title}</h3>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-slate-900">{currentTrip.currency} {day.estimated_day_cost}</div>
                <div className="text-xs text-slate-500">{day.total_distance_km} km total</div>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedDays[day.day_number] ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* Day Content */}
          {expandedDays[day.day_number] && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              {day.weather_note && (
                <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 text-amber-800 rounded-xl text-sm border border-amber-100">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p>{day.weather_note}</p>
                </div>
              )}

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200" />
                
                <div className="space-y-6">
                  {/* We interleave activities and restaurants based on time if we had exact times, 
                      but for simplicity we'll show activities, then a restaurant suggestion section */}
                  {day.time_slots.map((slot, idx) => (
                    <ActivityCard 
                      key={idx} 
                      slot={slot} 
                      currency={currentTrip.currency} 
                    />
                  ))}
                </div>
              </div>

              {day.restaurants.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    🍽️ Dining Suggestions
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {day.restaurants.map((rest, idx) => (
                      <RestaurantCard key={idx} restaurant={rest} />
                    ))}
                  </div>
                </div>
              )}

              {/* Day Actions */}
              <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end">
                <div className="relative">
                  <button 
                    onClick={() => setReplanMenuOpen(replanMenuOpen === day.day_number ? null : day.day_number)}
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-primary/5 px-4 py-2 rounded-lg transition-colors border border-primary/20"
                  >
                    <RefreshCw className="w-4 h-4" /> Modify this day
                  </button>
                  
                  {replanMenuOpen === day.day_number && (
                    <div className="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-10">
                      <div className="p-2 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">AI Replan Reason</div>
                      <div className="flex flex-col py-1">
                        <button onClick={() => handleReplan(day, 'weather')} className="text-left px-4 py-2 text-sm hover:bg-slate-50">🌧️ Raining / Bad Weather</button>
                        <button onClick={() => handleReplan(day, 'time_constraint')} className="text-left px-4 py-2 text-sm hover:bg-slate-50">⏰ Make it more relaxed</button>
                        <button onClick={() => handleReplan(day, 'budget_change')} className="text-left px-4 py-2 text-sm hover:bg-slate-50">💰 Cheaper options</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
