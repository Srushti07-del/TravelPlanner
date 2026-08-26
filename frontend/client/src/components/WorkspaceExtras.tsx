import { useEffect, useState } from "react";
import { getUserTrips, deleteTrip } from "@/lib/api";
import { toast } from "sonner";
import { CalendarDays, Trash } from "lucide-react";

export function WorkspaceExtras({ tab }: { tab: string }) {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === "My Trips") {
      setLoading(true);
      getUserTrips()
        .then((data) => setTrips(data))
        .catch((e) => toast.error("Failed to load trips: " + e.message))
        .finally(() => setLoading(false));
    }
  }, [tab]);

  const handleDelete = async (tripId: string) => {
    try {
      await deleteTrip(tripId);
      setTrips(trips.filter((t) => t.trip_id !== tripId));
      toast.success("Trip deleted");
    } catch (e: any) {
      toast.error("Failed to delete: " + e.message);
    }
  };

  if (tab === "My Trips") {
    return (
      <div className="rounded-[28px] bg-white p-8 shadow-sm">
        <h3 className="font-display text-3xl text-[#21463c] mb-6">My Saved Trips</h3>
        {loading ? (
          <p className="text-sm text-[#718077]">Loading your journeys...</p>
        ) : trips.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <div key={trip.trip_id} className="rounded-2xl border border-[#edf0ea] p-5 card-lift flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-[#21463c]">{trip.destination}</h4>
                  <p className="mt-1 text-sm text-[#718077] flex items-center gap-1.5">
                    <CalendarDays size={14} /> {trip.start_date}
                  </p>
                </div>
                <div className="mt-6 flex justify-end">
                  <button onClick={() => handleDelete(trip.trip_id)} className="text-xs text-[#d96d4b] hover:bg-[#d96d4b]/10 rounded-full p-2 transition">
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#718077]">No trips saved yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-[28px] bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold text-[#21463c]">{tab}</p>
      <p className="mt-2 text-xs text-[#718077]">
        This section is coming soon.
      </p>
    </div>
  );
}

export default WorkspaceExtras;
