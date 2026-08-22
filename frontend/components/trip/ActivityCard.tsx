import { TimeSlot } from "@/types/trip";
import { Clock, MapPin, ExternalLink, ChevronDown, Info } from "lucide-react";
import { useState } from "react";

export default function ActivityCard({ slot, currency }: { slot: TimeSlot; currency: string }) {
  const [showTips, setShowTips] = useState(false);

  return (
    <div className="relative pl-12">
      {/* Timeline dot */}
      <div className="absolute left-[11px] top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-slate-50" />
      
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                <Clock className="w-3.5 h-3.5" />
                {slot.time} ({slot.duration_minutes}m)
              </span>
              <span className="text-lg" title={slot.category}>
                {getCategoryIcon(slot.category)}
              </span>
            </div>
            
            <h4 className="text-lg font-bold text-slate-900 mb-1">{slot.activity_name}</h4>
            <p className="text-slate-600 text-sm mb-3 line-clamp-2">{slot.description}</p>
            
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center text-slate-500">
                <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                {slot.location_name}
              </div>
              
              <a 
                href={`https://maps.google.com/?q=${slot.lat},${slot.lng}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <div className="inline-block px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-semibold border border-green-100">
              {slot.estimated_cost === 0 ? 'Free' : `${currency} ${slot.estimated_cost}`}
            </div>
          </div>

        </div>

        {slot.tips && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button 
              onClick={() => setShowTips(!showTips)}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              <Info className="w-4 h-4" /> AI Tips
              <ChevronDown className={`w-4 h-4 transition-transform ${showTips ? 'rotate-180' : ''}`} />
            </button>
            
            {showTips && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
                {slot.tips}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getCategoryIcon(cat: string) {
  const lower = cat.toLowerCase();
  if (lower.includes('food') || lower.includes('restaurant')) return '🍽️';
  if (lower.includes('museum') || lower.includes('culture') || lower.includes('history')) return '🏛️';
  if (lower.includes('beach') || lower.includes('sea')) return '🏖️';
  if (lower.includes('nature') || lower.includes('park')) return '🌿';
  if (lower.includes('shopping')) return '🛍️';
  if (lower.includes('nightlife') || lower.includes('bar')) return '🍸';
  if (lower.includes('transport')) return '🚆';
  return '📍';
}
