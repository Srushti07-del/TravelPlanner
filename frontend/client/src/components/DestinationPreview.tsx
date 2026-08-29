import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getDestinationInfo, getMultipleDestinationImages, DestinationInfoResponse } from "@/lib/api";
import { Calendar, Clock, Banknote, MapPin, ArrowRight } from "lucide-react";

interface DestinationPreviewProps {
  destination: string;
  onContinue: (destination: string) => void;
  onCancel: () => void;
}

export function DestinationPreview({ destination, onContinue, onCancel }: DestinationPreviewProps) {
  const [info, setInfo] = useState<DestinationInfoResponse | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      getDestinationInfo(destination),
      getMultipleDestinationImages(destination, 3)
    ])
      .then(([infoRes, imagesRes]) => {
        if (!isMounted) return;
        setInfo(infoRes);
        setImages(imagesRes.urls || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load destination info");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [destination]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-[28px] bg-[#f0eee6] p-6 shadow-2xl sm:p-8 animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={onCancel}
          className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/50 text-[#21463c] transition hover:bg-white"
        >
          ✕
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#d96d4b]/20 text-[#d96d4b]">
            <MapPin size={24} />
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold text-[#21463c]">{destination}</h2>
            <p className="text-sm font-medium text-[#718077]">Destination Preview</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid h-64 grid-cols-3 gap-4">
              <div className="col-span-2 h-full rounded-2xl bg-black/5 animate-pulse" />
              <div className="grid grid-rows-2 gap-4">
                <div className="h-full rounded-2xl bg-black/5 animate-pulse" />
                <div className="h-full rounded-2xl bg-black/5 animate-pulse" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="h-24 rounded-2xl bg-black/5 animate-pulse" />
              <div className="h-24 rounded-2xl bg-black/5 animate-pulse" />
              <div className="h-24 rounded-2xl bg-black/5 animate-pulse" />
            </div>
            <div className="h-20 w-full rounded-2xl bg-black/5 animate-pulse" />
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-[#d96d4b]">{error}</p>
            <Button onClick={onCancel} className="mt-4 rounded-full bg-[#21463c] text-white">
              Go Back
            </Button>
          </div>
        ) : (
          info && (
            <div className="space-y-8">
              {/* Photo Gallery */}
              {images.length > 0 && (
                <div className="grid h-64 sm:h-80 grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 overflow-hidden rounded-2xl">
                  {images.length >= 1 && (
                    <div className="sm:col-span-2 h-full">
                      <img
                        src={images[0]}
                        alt={destination}
                        className="h-full w-full object-cover transition duration-700 hover:scale-105"
                      />
                    </div>
                  )}
                  {images.length >= 3 && (
                    <div className="hidden sm:grid grid-rows-2 gap-4 h-full">
                      <img
                        src={images[1]}
                        alt={`${destination} scenery`}
                        className="h-full w-full object-cover transition duration-700 hover:scale-105"
                      />
                      <img
                        src={images[2]}
                        alt={`${destination} culture`}
                        className="h-full w-full object-cover transition duration-700 hover:scale-105"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Summary Text */}
              <p className="text-lg text-[#1d332c] leading-relaxed">
                {info.summary}
              </p>

              {/* Info Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm">
                  <Calendar className="text-[#8fae9a] shrink-0" size={24} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#718077]">Best Time</h4>
                    <p className="mt-1 font-semibold text-[#21463c]">{info.best_time_to_visit}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm">
                  <Clock className="text-[#7f9fc2] shrink-0" size={24} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#718077]">Recommended</h4>
                    <p className="mt-1 font-semibold text-[#21463c]">{info.ideal_duration}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm">
                  <Banknote className="text-[#d6a95d] shrink-0" size={24} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#718077]">Currency</h4>
                    <p className="mt-1 font-semibold text-[#21463c]">{info.currency}</p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => onContinue(destination)}
                  className="rounded-full bg-[#d96d4b] px-8 py-6 text-lg font-semibold text-white shadow-lg shadow-[#d96d4b]/20 hover:bg-[#c75d3d]"
                >
                  Start Planning <ArrowRight className="ml-2" size={20} />
                </Button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
