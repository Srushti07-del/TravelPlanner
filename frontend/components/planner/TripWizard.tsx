"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTrip } from "@/hooks/useTrip";
import { TripRequest, TravelStyle, FoodPreference, AccommodationPreference, TransportPreference, Interest } from "@/types/trip";
import InterestSelector from "./InterestSelector";
import { MapPin, Calendar, Wallet, Heart, Sparkles, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function TripWizard() {
  const router = useRouter();
  const { generateTrip, isGenerating } = useTrip();
  
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  
  const [formData, setFormData] = useState<Partial<TripRequest>>({
    destination: "",
    origin: "",
    start_date: "",
    end_date: "",
    num_travelers: 2,
    total_budget: 1000,
    currency: "USD",
    travel_style: "comfort",
    interests: [],
    food_preference: "no_preference",
    accommodation_preference: "mid_range",
    transport_preference: "public",
    special_requests: "",
  });

  const updateForm = (updates: Partial<TripRequest>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => setStep(s => Math.min(s + 1, totalSteps));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleGenerate = async () => {
    try {
      await generateTrip(formData as TripRequest);
      // In a real app, the API would return an ID or we'd save it first. 
      // For this demo, we'll navigate to a preview page.
      router.push("/trip/preview");
    } catch (e) {
      console.error("Failed to generate", e);
      alert("Failed to generate trip. Please try again.");
    }
  };

  const nights = formData.start_date && formData.end_date 
    ? Math.max(0, differenceInDays(new Date(formData.end_date), new Date(formData.start_date)))
    : 0;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Progress Bar */}
      <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-500">
          Step {step} of {totalSteps}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-2 rounded-full w-12 transition-all ${i + 1 <= step ? 'bg-primary' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      <div className="p-8 md:p-12 min-h-[500px] flex flex-col">
        {step === 1 && (
          <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-8">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-primary mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Where are you going?</h2>
              <p className="text-slate-500 mt-2">Let's pick a destination for your next adventure.</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Destination</label>
                <input
                  type="text"
                  placeholder="e.g., Kyoto, Japan"
                  value={formData.destination}
                  onChange={e => updateForm({ destination: e.target.value })}
                  className="w-full text-xl p-4 border-2 border-slate-200 rounded-xl focus:border-primary focus:ring-0 transition-colors placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Starting from (Origin)</label>
                <input
                  type="text"
                  placeholder="e.g., New York, USA"
                  value={formData.origin}
                  onChange={e => updateForm({ origin: e.target.value })}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-primary focus:ring-0 transition-colors placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-8">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-secondary mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">When and who?</h2>
              <p className="text-slate-500 mt-2">Set your travel dates and party size.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={e => updateForm({ start_date: e.target.value })}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-primary focus:ring-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={e => updateForm({ end_date: e.target.value })}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-primary focus:ring-0"
                />
              </div>
            </div>

            {nights > 0 && (
              <div className="mb-8 inline-block px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-600">
                Trip duration: {nights} nights
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Number of travelers</label>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => updateForm({ num_travelers: Math.max(1, (formData.num_travelers || 1) - 1) })}
                  className="w-12 h-12 rounded-xl border-2 border-slate-200 flex items-center justify-center text-xl hover:bg-slate-50"
                >-</button>
                <span className="text-2xl font-bold w-12 text-center">{formData.num_travelers}</span>
                <button 
                  onClick={() => updateForm({ num_travelers: Math.min(20, (formData.num_travelers || 1) + 1) })}
                  className="w-12 h-12 rounded-xl border-2 border-slate-200 flex items-center justify-center text-xl hover:bg-slate-50"
                >+</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-8">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-accent mb-4">
                <Wallet className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">What's your budget?</h2>
              <p className="text-slate-500 mt-2">Help us find the right places for your wallet.</p>
            </div>
            
            <div className="flex gap-4 mb-8">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">Total Budget</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input
                    type="number"
                    value={formData.total_budget}
                    onChange={e => updateForm({ total_budget: Number(e.target.value) })}
                    className="w-full pl-8 p-4 text-xl border-2 border-slate-200 rounded-xl focus:border-primary"
                  />
                </div>
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
                <select 
                  value={formData.currency}
                  onChange={e => updateForm({ currency: e.target.value })}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-primary bg-white h-[64px]"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Travel Style</label>
              <div className="grid sm:grid-cols-3 gap-4">
                {(['budget', 'comfort', 'luxury'] as TravelStyle[]).map(style => (
                  <label key={style} className={`cursor-pointer p-4 border-2 rounded-xl transition-all ${formData.travel_style === style ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input 
                      type="radio" 
                      name="travel_style" 
                      value={style}
                      checked={formData.travel_style === style}
                      onChange={() => updateForm({ travel_style: style })}
                      className="sr-only"
                    />
                    <div className="font-semibold capitalize mb-1">{style}</div>
                    <div className="text-xs text-slate-500">
                      {style === 'budget' && 'Hostels, street food, public transport.'}
                      {style === 'comfort' && '3-4 star hotels, nice restaurants, mix of transport.'}
                      {style === 'luxury' && '5 star hotels, fine dining, private cars.'}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6">
              <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500 mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">What do you love?</h2>
              <p className="text-slate-500 mt-2">Select your interests to personalize the itinerary.</p>
            </div>
            
            <div className="mb-8 max-h-[300px] overflow-y-auto pr-2">
              <InterestSelector 
                selected={formData.interests as Interest[]} 
                onChange={interests => updateForm({ interests })} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Dietary Preference</label>
              <select 
                value={formData.food_preference}
                onChange={e => updateForm({ food_preference: e.target.value as FoodPreference })}
                className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-primary bg-white"
              >
                <option value="no_preference">No specific preference</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="non_vegetarian">Non-vegetarian</option>
              </select>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Review & Generate</h2>
              <p className="text-slate-500 mt-2">Ready to create your perfect itinerary?</p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <span className="text-slate-500 block mb-1">Trip</span>
                  <span className="font-semibold text-slate-900">{formData.origin} → {formData.destination}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Dates</span>
                  <span className="font-semibold text-slate-900">{formData.start_date} to {formData.end_date}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Travelers</span>
                  <span className="font-semibold text-slate-900">{formData.num_travelers}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Budget</span>
                  <span className="font-semibold text-slate-900">{formData.total_budget} {formData.currency} ({formData.travel_style})</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block mb-1">Interests</span>
                  <span className="font-semibold text-slate-900 capitalize">{formData.interests?.join(', ')}</span>
                </div>
              </div>
            </div>

            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="font-medium text-slate-900">Crafting your perfect itinerary...</p>
                <p className="text-sm text-slate-500">Analyzing routes, weather, and costs.</p>
              </div>
            ) : (
              <button 
                onClick={handleGenerate}
                className="w-full py-4 bg-primary text-white text-lg font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Generate My Trip
              </button>
            )}
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-auto pt-8 flex justify-between border-t border-slate-100">
          <button 
            onClick={handlePrev}
            disabled={step === 1 || isGenerating}
            className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:invisible flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
          {step < totalSteps && (
            <button 
              onClick={handleNext}
              disabled={
                (step === 1 && !formData.destination) ||
                (step === 2 && (!formData.start_date || !formData.end_date))
              }
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
