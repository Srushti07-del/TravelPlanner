"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { TripSummary } from "@/types/trip";
import Link from "next/link";
import { Calendar, Users, Wallet, Plus, MapPin, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function TripsPage() {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUserAndTrips = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        try {
          const data = await api.trips.listByUser(user.id);
          setTrips(data);
        } catch (error) {
          console.error("Failed to load trips", error);
        }
      }
      setLoading(false);
    };

    fetchUserAndTrips();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this trip?")) return;
    try {
      await api.trips.delete(id);
      setTrips(trips.filter(t => t.id !== id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Please sign in to view your trips</h2>
        <Link href="/auth" className="px-6 py-3 bg-primary text-white rounded-xl font-medium inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Trips</h1>
        <Link href="/plan" className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-5 h-5" />
          Plan New Trip
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <MapPin className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No trips planned yet</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Your travel adventures start here. Create your first AI-powered itinerary and let the journey begin.
          </p>
          <Link href="/plan" className="px-8 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors">
            Start Planning
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div key={trip.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <div className="h-32 bg-slate-100 relative">
                {/* Fallback pattern for destination image */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 mix-blend-multiply"></div>
                <div className="absolute bottom-4 left-4 text-white drop-shadow-md">
                  <h3 className="text-xl font-bold truncate max-w-[250px]">{trip.destination}</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-slate-600">
                    <Calendar className="w-4 h-4 mr-3 text-slate-400" />
                    {format(new Date(trip.start_date), "MMM d")} - {format(new Date(trip.end_date), "MMM d, yyyy")}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Users className="w-4 h-4 mr-3 text-slate-400" />
                    {trip.num_travelers} {trip.num_travelers === 1 ? 'traveler' : 'travelers'}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Wallet className="w-4 h-4 mr-3 text-slate-400" />
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: trip.currency }).format(trip.total_budget)}
                  </div>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                  <Link href={`/trip/${trip.id}`} className="text-primary font-medium text-sm hover:underline">
                    View Itinerary
                  </Link>
                  <button onClick={() => handleDelete(trip.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
