"use client";

import { useState } from "react";
import { Interest } from "@/types/trip";
import { Check } from "lucide-react";

interface InterestSelectorProps {
  selected: Interest[];
  onChange: (interests: Interest[]) => void;
}

const INTERESTS: { id: Interest; label: string; icon: string }[] = [
  { id: 'beaches', label: 'Beaches', icon: '🏖️' },
  { id: 'adventure', label: 'Adventure', icon: '🏔️' },
  { id: 'food', label: 'Food', icon: '🍕' },
  { id: 'culture', label: 'Culture', icon: '🏛️' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'nightlife', label: 'Nightlife', icon: '🎵' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'history', label: 'History', icon: '📜' },
  { id: 'wellness', label: 'Wellness', icon: '🧘' },
];

export default function InterestSelector({ selected, onChange }: InterestSelectorProps) {
  const toggleInterest = (id: Interest) => {
    if (selected.includes(id)) {
      onChange(selected.filter(i => i !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {INTERESTS.map((interest) => {
        const isSelected = selected.includes(interest.id);
        return (
          <button
            key={interest.id}
            type="button"
            onClick={() => toggleInterest(interest.id)}
            className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isSelected && (
              <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-0.5">
                <Check className="w-3 h-3" />
              </div>
            )}
            <span className="text-2xl mb-2 block">{interest.icon}</span>
            <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-slate-600'}`}>
              {interest.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
