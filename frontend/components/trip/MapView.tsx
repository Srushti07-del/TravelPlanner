"use client";

import { useTrip } from "@/hooks/useTrip";
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MapPin } from "lucide-react";

export default function MapView() {
  const { currentTrip } = useTrip();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState(false);
  const [activeDay, setActiveDay] = useState<number | 'all'>('all');

  useEffect(() => {
    if (!currentTrip || !mapRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey) {
      setMapError(true);
      return;
    }

    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey,
          version: "weekly",
        });

        const { Map } = await loader.importLibrary("maps");
        const { AdvancedMarkerElement } = await loader.importLibrary("marker") as any;

        const map = new Map(mapRef.current!, {
          center: { lat: 0, lng: 0 },
          zoom: 12,
          mapId: 'TRIP_PLANNER_MAP',
        });

        const bounds = new window.google.maps.LatLngBounds();
        const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

        currentTrip.days.forEach((day, dayIndex) => {
          if (activeDay !== 'all' && activeDay !== day.day_number) return;
          
          const color = colors[dayIndex % colors.length];

          day.time_slots.forEach((slot, slotIndex) => {
            const position = { lat: slot.lat, lng: slot.lng };
            bounds.extend(position);

            const pinElement = document.createElement("div");
            pinElement.className = "flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm shadow-md border-2 border-white";
            pinElement.style.backgroundColor = color;
            pinElement.textContent = `${day.day_number}.${slotIndex + 1}`;

            const marker = new AdvancedMarkerElement({
              map,
              position,
              content: pinElement,
              title: slot.activity_name,
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: `<div style="padding: 8px;">
                <h3 style="font-weight: bold; margin-bottom: 4px;">${slot.activity_name}</h3>
                <p style="color: #666; font-size: 12px; margin-bottom: 4px;">${slot.time} • ${slot.duration_minutes}m</p>
                <p style="font-weight: 500;">${currentTrip.currency} ${slot.estimated_cost}</p>
              </div>`,
            });

            marker.addListener("click", () => {
              infoWindow.open({
                anchor: marker,
                map,
              });
            });
          });
        });

        map.fitBounds(bounds);
      } catch (e) {
        console.error("Map load error", e);
        setMapError(true);
      }
    };

    initMap();
  }, [currentTrip, activeDay]);

  if (mapError) {
    return (
      <div className="h-[600px] bg-slate-100 rounded-2xl flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-300">
        <MapPin className="w-12 h-12 text-slate-400 mb-4" />
        <h3 className="text-xl font-bold text-slate-700 mb-2">Map Unavailable</h3>
        <p className="text-slate-500 max-w-md">
          Google Maps API key is missing or invalid. Please add NEXT_PUBLIC_GOOGLE_MAPS_KEY to your .env file to enable the interactive map.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveDay('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activeDay === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Days
        </button>
        {currentTrip?.days.map((day) => (
          <button
            key={day.day_number}
            onClick={() => setActiveDay(day.day_number)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeDay === day.day_number ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Day {day.day_number}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-[600px] rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-slate-100"
      />
    </div>
  );
}
