import { useTrip } from "@/hooks/useTrip";
import { AlertTriangle, CloudRain } from "lucide-react";

export default function WeatherBar() {
  const { weather, triggerReplan } = useTrip();

  if (!weather || weather.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 overflow-x-auto">
      <div className="shrink-0 flex items-center justify-center pr-4 md:border-r border-slate-200">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Forecast</h3>
      </div>
      
      <div className="flex gap-4 flex-1">
        {weather.map((day, i) => (
          <div key={i} className="flex-1 min-w-[120px] bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col items-center text-center">
            <span className="text-xs font-medium text-slate-500 mb-1">{day.date}</span>
            <span className="text-2xl mb-1" title={day.description}>{day.icon}</span>
            <div className="text-sm font-bold text-slate-900">
              {day.temp_max}° <span className="text-slate-400 font-normal">{day.temp_min}°</span>
            </div>
            
            {day.warning && (
              <button 
                onClick={() => triggerReplan('weather', `Weather warning on ${day.date}: ${day.warning}`)}
                className="mt-2 w-full px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors border border-red-100"
                title="Click to replan indoor activities"
              >
                <AlertTriangle className="w-3 h-3" /> Warning
              </button>
            )}
            {!day.warning && !day.is_outdoor_suitable && (
              <button
                onClick={() => triggerReplan('weather', `Rain expected on ${day.date}`)}
                className="mt-2 w-full px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors border border-blue-100"
              >
                <CloudRain className="w-3 h-3" /> Replan day
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
