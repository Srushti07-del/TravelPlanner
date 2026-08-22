import { useTrip } from "@/hooks/useTrip";
import { PieChart, TrendingDown, AlertCircle, Sparkles } from "lucide-react";

export default function BudgetView() {
  const { currentTrip, triggerReplan } = useTrip();

  if (!currentTrip) return null;

  const { budget_breakdown, total_budget, currency } = currentTrip;
  
  const categories = [
    { id: 'accommodation', label: 'Accommodation', amount: budget_breakdown.accommodation, color: 'text-indigo-500', bg: 'bg-indigo-500' },
    { id: 'food', label: 'Food & Dining', amount: budget_breakdown.food, color: 'text-emerald-500', bg: 'bg-emerald-500' },
    { id: 'transportation', label: 'Transportation', amount: budget_breakdown.transportation, color: 'text-amber-500', bg: 'bg-amber-500' },
    { id: 'activities', label: 'Activities', amount: budget_breakdown.activities, color: 'text-pink-500', bg: 'bg-pink-500' },
    { id: 'shopping', label: 'Shopping', amount: budget_breakdown.shopping, color: 'text-purple-500', bg: 'bg-purple-500' },
    { id: 'emergency_buffer', label: 'Buffer', amount: budget_breakdown.emergency_buffer, color: 'text-slate-400', bg: 'bg-slate-400' },
  ].filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

  const totalPlanned = budget_breakdown.total_planned;
  const percentUsed = Math.round((totalPlanned / total_budget) * 100);
  const isOver = totalPlanned > total_budget;

  // Simple SVG Donut Chart Logic
  let currentAngle = 0;
  const cx = 100;
  const cy = 100;
  const r = 80;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Chart Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-slate-900 mb-6 self-start w-full">Budget Breakdown</h3>
          
          <div className="relative w-[200px] h-[200px] mb-6">
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
              <circle cx={cx} cy={cy} r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="32" />
              {categories.map((cat, i) => {
                const dasharray = (cat.amount / totalPlanned) * circumference;
                const dashoffset = -currentAngle;
                currentAngle += dasharray;
                
                // Map tailwind colors to hex for SVG
                const hexColor = 
                  cat.id === 'accommodation' ? '#6366f1' :
                  cat.id === 'food' ? '#10b981' :
                  cat.id === 'transportation' ? '#f59e0b' :
                  cat.id === 'activities' ? '#ec4899' :
                  cat.id === 'shopping' ? '#a855f7' : '#94a3b8';

                return (
                  <circle
                    key={cat.id}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="transparent"
                    stroke={hexColor}
                    strokeWidth="32"
                    strokeDasharray={`${dasharray} ${circumference}`}
                    strokeDashoffset={dashoffset}
                    className="transition-all duration-1000 ease-out"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900">{currency}</span>
              <span className="text-lg font-semibold text-slate-700">{totalPlanned}</span>
            </div>
          </div>
        </div>

        {/* Legend & Stats Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-slate-500">Total Planned</span>
              <span className="text-lg font-bold text-slate-900">{currency} {totalPlanned} <span className="text-sm font-normal text-slate-400">/ {total_budget}</span></span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${isOver ? 'bg-red-500' : (percentUsed > 90 ? 'bg-amber-500' : 'bg-primary')}`}
                style={{ width: `${Math.min(100, percentUsed)}%` }}
              />
            </div>
            {isOver ? (
              <div className="mt-3 text-sm text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> You are {currency} {totalPlanned - total_budget} over budget.
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-500 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4" /> {currency} {total_budget - totalPlanned} remaining in budget.
              </div>
            )}
          </div>

          <div className="space-y-3">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${cat.bg}`} />
                  <span className="text-sm font-medium text-slate-700">{cat.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500">{Math.round((cat.amount / totalPlanned) * 100)}%</span>
                  <span className="text-sm font-semibold text-slate-900 w-16 text-right">{cat.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Budget Action */}
      <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary" /> AI Budget Optimizer
          </h4>
          <p className="text-sm text-slate-600">Let AI adjust your activities and restaurants to lower costs by 15% without ruining the experience.</p>
        </div>
        <button 
          onClick={() => triggerReplan('budget_change', 'Optimize itinerary to reduce total cost by 15%')}
          className="shrink-0 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          Optimize Now
        </button>
      </div>

      {/* Daily Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-900">Daily Cost Breakdown</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {currentTrip.days.map(day => (
            <div key={day.day_number} className="p-4 px-6 flex justify-between items-center hover:bg-slate-50/50">
              <div>
                <div className="font-semibold text-slate-900">Day {day.day_number}: {day.title}</div>
                <div className="text-sm text-slate-500">{day.date}</div>
              </div>
              <div className="font-bold text-slate-900">
                {currency} {day.estimated_day_cost}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
