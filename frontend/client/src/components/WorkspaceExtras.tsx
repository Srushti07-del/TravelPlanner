import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, ChevronRight, CircleUserRound, FileText, Settings2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function WorkspaceExtras({ tab }: { tab: string }) {
  const copy: Record<string, { eyebrow: string; title: string; body: string }> = {
    Explore: { eyebrow: "Explore", title: "A wider world, curated gently.", body: "Browse seasonal field notes, local tables, quiet stays, and journeys shaped around how you want to feel." },
    "Saved Places": { eyebrow: "Saved places", title: "Your little list of maybes.", body: "Save places while you wander through Voyage. When you are ready, we will help them find a home in your itinerary." },
    "Trip Details": { eyebrow: "Trip details", title: "The practical layer, made calm.", body: "Your stays, ferry timings, travel documents, and day-by-day notes, collected in one unhurried place." },
    Profile: { eyebrow: "Profile", title: "Travel in your own rhythm.", body: "Tell Voyage what keeps pulling you back: sea swims, small galleries, long lunches, or the road less taken." },
    Settings: { eyebrow: "Settings", title: "Make Voyage feel like yours.", body: "Manage notifications, travel preferences, connected companions, and the details that make planning feel effortless." },
  };
  const item = copy[tab] ?? copy["Saved Places"];
  return <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-[28px] bg-[#21463c] p-7 text-white"><p className="eyebrow text-[#c0d5c1]">{item.eyebrow}</p><h3 className="mt-4 max-w-lg font-display text-5xl leading-tight">{item.title}</h3><p className="mt-5 max-w-lg text-sm leading-6 text-white/65">{item.body}</p><Button onClick={() => toast.success("Your Voyage preferences were saved")} className="mt-8 rounded-full bg-[#d96d4b] text-white hover:bg-[#c75d3d]">Make it personal <ChevronRight size={15} /></Button></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-[24px] bg-white p-5"><Bookmark className="text-[#d96d4b]" size={20} /><p className="mt-5 text-lg font-semibold text-[#21463c]">12 saved moments</p><p className="mt-1 text-sm text-[#718077]">Ready when inspiration strikes.</p></div><div className="rounded-[24px] bg-[#e7efe5] p-5"><Sparkles className="text-[#789481]" size={20} /><p className="mt-5 text-lg font-semibold text-[#21463c]">Curious & calm</p><p className="mt-1 text-sm text-[#718077]">Your current travel mood.</p></div><div className="rounded-[24px] bg-[#f0ddd1] p-5"><FileText className="text-[#a86b55]" size={20} /><p className="mt-5 text-lg font-semibold text-[#713d2f]">1 active trip</p><p className="mt-1 text-sm text-[#8e6153]">Amalfi, slowly.</p></div><div className="rounded-[24px] bg-white p-5"><CircleUserRound className="text-[#789481]" size={20} /><p className="mt-5 text-lg font-semibold text-[#21463c]">2 companions</p><p className="mt-1 text-sm text-[#718077]">Sarah and Jamie.</p></div></div></div>;
}
