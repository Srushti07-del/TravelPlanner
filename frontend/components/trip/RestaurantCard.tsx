import { Restaurant } from "@/types/trip";
import { Star, MapPin, ExternalLink, Clock } from "lucide-react";

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col hover:border-primary/30 transition-colors shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h5 className="font-bold text-slate-900 truncate pr-2">{restaurant.name}</h5>
        <div className="flex items-center bg-amber-50 px-1.5 py-0.5 rounded text-amber-700 text-xs font-bold shrink-0">
          <Star className="w-3 h-3 mr-1 fill-current" />
          {restaurant.rating}
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-3 text-sm">
        <span className="font-medium text-slate-700">{restaurant.cuisine}</span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-600">{restaurant.price_range}</span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-500 text-xs">{restaurant.distance_from_prev_activity_km}km away</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {restaurant.dietary_options.map((opt, i) => (
          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
            {opt}
          </span>
        ))}
      </div>

      <div className="mt-auto space-y-2 text-xs text-slate-500">
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 shrink-0 text-slate-400" />
          <span className="line-clamp-1">{restaurant.opening_hours}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
          <span className="line-clamp-1">{restaurant.address}</span>
        </div>
      </div>

      <a 
        href={restaurant.google_maps_url} 
        target="_blank" 
        rel="noreferrer"
        className="mt-4 pt-3 border-t border-slate-100 text-primary text-sm font-medium flex items-center justify-center gap-1 hover:underline w-full"
      >
        View on Maps <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
