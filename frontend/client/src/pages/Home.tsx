import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { MapView } from "@/components/Map";
import { WorkspaceExtras } from "@/components/WorkspaceExtras";
import { useMutation } from "@tanstack/react-query";
import { generateTrip, Itinerary, TripRequest } from "@/lib/api";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Compass,
  Gem,
  Heart,
  MapPin,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  Sun,
  TrainFront,
  Users,
  Wallet,
  X,
} from "lucide-react";

const IMG = {
  hero: "/manus-storage/hero_7b8e37f3.jpg",
  cape: "/manus-storage/cape-town_c69bf609.jpg",
  lake: "/manus-storage/lake-district_aef2b3f0.jpg",
  arch: "/manus-storage/desert-arch_dc8b2ae6.jpg",
};
const destinations = [
  {
    name: "Amalfi Coast",
    country: "Italy",
    meta: "Coastal · 8 days",
    image: IMG.hero,
  },
  {
    name: "Cape Town",
    country: "South Africa",
    meta: "City & nature · 6 days",
    image: IMG.cape,
  },
  {
    name: "Lake District",
    country: "England",
    meta: "Slow travel · 5 days",
    image: IMG.lake,
  },
];
const baseItinerary = [
  {
    time: "09:30",
    title: "Sunrise at Positano viewpoint",
    type: "Scenic walk",
    cost: "$0",
    color: "#d96d4b",
    icon: "☼",
    place: "Positano viewpoint",
  },
  {
    time: "12:00",
    title: "Lunch at La Tagliata",
    type: "Local table",
    cost: "$38",
    color: "#8fae9a",
    icon: "✦",
    place: "La Tagliata",
  },
  {
    time: "15:30",
    title: "Ferry to Amalfi",
    type: "Transport · 35 min",
    cost: "$18",
    color: "#7f9fc2",
    icon: "↗",
    place: "Amalfi ferry dock",
  },
  {
    time: "19:00",
    title: "Golden hour aperitivo",
    type: "Bar & terrace",
    cost: "$26",
    color: "#d6a95d",
    icon: "◒",
    place: "Ravello terrace",
  },
];
const recommendations = [
  {
    title: "Casa Angelina",
    category: "Stay",
    image: IMG.cape,
    rating: "4.9",
    price: "$$$",
    distance: "0.8 mi",
    tags: ["Sea view", "Quiet"],
    why: "A softer landing after a full day outside.",
  },
  {
    title: "Da Adolfo",
    category: "Table",
    image: IMG.hero,
    rating: "4.8",
    price: "$$",
    distance: "1.2 mi",
    tags: ["Local", "Waterfront"],
    why: "Matches your love of long lunches and local character.",
  },
  {
    title: "Valle delle Ferriere",
    category: "Hidden gem",
    image: IMG.lake,
    rating: "4.7",
    price: "$",
    distance: "3.4 mi",
    tags: ["Wild", "Half day"],
    why: "A green, unhurried counterpoint to the coast.",
  },
];
const budgetItems = [
  { label: "Stays", value: 1280, total: 1500, color: "#d96d4b" },
  { label: "Transport", value: 420, total: 650, color: "#7f9fc2" },
  { label: "Food", value: 380, total: 580, color: "#d6a95d" },
  { label: "Experiences", value: 260, total: 420, color: "#8fae9a" },
];

function Header({ onPlan }: { onPlan: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="absolute inset-x-0 top-0 z-30 px-5 py-5 sm:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between text-white">
        <button
          className="flex items-center gap-2"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <span className="grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-white/10">
            <Compass size={17} />
          </span>
          <span className="text-lg font-semibold tracking-tight">TravelPlanner</span>
        </button>
        <nav className="hidden items-center gap-7 text-sm text-white/80 md:flex">
          <a href="#explore">Explore</a>
          <a href="#trips">My trips</a>
          <a href="#planner">Plan</a>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <button
            className="px-3 text-sm text-white/80 hover:text-white"
            onClick={() => startLogin()}
          >
            Sign in
          </button>
          <Button
            onClick={onPlan}
            className="btn-press rounded-full bg-white px-5 text-sm font-semibold text-[#21463c] hover:bg-[#f4eee0]"
          >
            Plan My Trip <ArrowRight size={15} />
          </Button>
        </div>
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Open menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="glass mt-4 rounded-3xl p-4 text-[#21463c] md:hidden">
          <div className="grid gap-3 text-sm">
            <a href="#explore">Explore</a>
            <a href="#trips">My trips</a>
            <button className="text-left" onClick={() => startLogin()}>
              Sign in
            </button>
            <Button
              onClick={onPlan}
              className="rounded-full bg-[#d96d4b] text-white"
            >
              Plan My Trip
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

function SearchBar({
  onPlan,
  dates,
  onDatesChange,
  style,
  onStyleChange,
}: {
  onPlan: (destination: string) => void;
  dates: string;
  onDatesChange: (dates: string) => void;
  style: string;
  onStyleChange: (style: string) => void;
}) {
  const [destination, setDestination] = useState("");
  const [datesOpen, setDatesOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const handleDayClick = (day: number) => {
    const clicked = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    if (!selectingEnd) {
      setStartDate(clicked);
      setEndDate(null);
      setSelectingEnd(true);
    } else {
      if (clicked < startDate!) {
        setStartDate(clicked);
        setEndDate(null);
      } else {
        setEndDate(clicked);
        setSelectingEnd(false);
        onDatesChange(
          `${formatDate(startDate!)} – ${formatDate(clicked)}`
        );
        setDatesOpen(false);
      }
    }
  };

  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const d = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return d > startDate && d < endDate;
  };

  const isSelected = (day: number) => {
    const d = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return (
      (startDate && d.getTime() === startDate.getTime()) ||
      (endDate && d.getTime() === endDate.getTime())
    );
  };

  const travelStyles = [
    "Slow & peaceful",
    "Adventure",
    "Romantic",
    "Food & culture",
    "Nature",
    "Luxury",
    "Budget",
  ];

  const datesLabel = startDate && endDate
    ? `${formatDate(startDate)} – ${formatDate(endDate)}`
    : startDate
      ? `${formatDate(startDate)} – ...`
      : dates || "Sep 14 – 21";
  const styleLabel = style || "Curious & calm";

  return (
    <div className="glass grid gap-2 rounded-3xl p-2 text-[#1d332c] sm:grid-cols-[1.4fr_1fr_1fr_auto]">
      <div className="relative flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3">
        <MapPin size={17} className="text-[#d96d4b]" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#21463c]">
            Where to?
          </div>
          <Input
            value={destination}
            onChange={e => setDestination(e.target.value)}
            className="h-5 border-0 bg-transparent p-0 text-[#1d332c] text-sm font-semibold shadow-none focus-visible:ring-0"
            placeholder="A place you dream of"
          />
        </div>
        {destination && (
          <div className="absolute left-12 right-3 top-[68px] z-10 rounded-xl border bg-white p-2 text-xs shadow-xl">
            <button
              onClick={() => setDestination("Amalfi Coast")}
              className="w-full rounded-lg p-2 text-left hover:bg-[#f0eee6]"
            >
              Amalfi Coast · Italy
            </button>
            <button
              onClick={() => setDestination("Kyoto")}
              className="w-full rounded-lg p-2 text-left hover:bg-[#f0eee6]"
            >
              Kyoto · Japan
            </button>
          </div>
        )}
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setDatesOpen(!datesOpen);
            setStyleOpen(false);
          }}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left hover:bg-white/40"
        >
          <CalendarDays size={17} className="text-[#789a87]" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#21463c]">
              When
            </div>
            <div className="text-sm font-semibold">{datesLabel}</div>
          </div>
          <ChevronDown size={14} className="ml-auto text-[#87918a]" />
        </button>
        {datesOpen && (
          <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-2xl border border-[#dfe5dc] bg-white p-4 shadow-xl">
            <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-[#d96d4b]">
              {selectingEnd ? "To" : "From"}
            </div>
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                  )
                }
                className="rounded-lg p-1 hover:bg-[#f0eee6]"
              >
                ‹
              </button>
              <span className="text-sm font-semibold text-[#21463c]">
                {currentMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                  )
                }
                className="rounded-lg p-1 hover:bg-[#f0eee6]"
              >
                ›
              </button>
            </div>
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#87918a]">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);
                const cells = [];
                for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
                for (let day = 1; day <= daysInMonth; day++) {
                  const selected = isSelected(day);
                  const inRange = isInRange(day);
                  cells.push(
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      className={`h-8 w-8 rounded-full text-xs font-semibold transition ${
                        selected
                          ? "bg-[#d96d4b] text-white"
                          : inRange
                            ? "bg-[#f0eee6] text-[#21463c]"
                            : "text-[#21463c] hover:bg-[#f0eee6]"
                      }`}
                    >
                      {day}
                    </button>
                  );
                }
                return cells;
              })()}
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                  setSelectingEnd(false);
                  onDatesChange("");
                }}
                className="mt-3 w-full rounded-lg border border-[#dfe5dc] py-2 text-xs font-semibold text-[#87918a] hover:bg-[#f0eee6]"
              >
                Clear dates
              </button>
            )}
          </div>
        )}
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setStyleOpen(!styleOpen);
            setDatesOpen(false);
          }}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left hover:bg-white/40"
        >
          <Wallet size={17} className="text-[#b18b5c]" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#21463c]">
              Your style
            </div>
            <div className="text-sm font-semibold">{styleLabel}</div>
          </div>
          <ChevronDown size={14} className="ml-auto text-[#87918a]" />
        </button>
        {styleOpen && (
          <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-[#dfe5dc] bg-white p-2 shadow-xl">
            {travelStyles.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onStyleChange(option);
                  setStyleOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  style === option
                    ? "bg-[#f0eee6] font-semibold text-[#21463c]"
                    : "text-[#21463c] hover:bg-[#f0eee6]"
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    style === option
                      ? "border-[#d96d4b]"
                      : "border-[#dfe5dc]"
                  }`}
                >
                  {style === option && (
                    <span className="h-2 w-2 rounded-full bg-[#d96d4b]" />
                  )}
                </span>
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
      <Button
        onClick={() => onPlan(destination || "Amalfi Coast")}
        className="btn-press h-auto rounded-2xl bg-[#d96d4b] px-6 py-3 font-semibold text-white shadow-lg shadow-[#d96d4b]/20 hover:bg-[#c75d3d]"
      >
        Plan My Trip
      </Button>
    </div>
  );
}
function DestinationCard({ item }: { item: (typeof destinations)[number] }) {
  return (
    <article className="card-lift group relative h-72.5 overflow-hidden rounded-[26px] text-white">
      <img
        src={item.image}
        alt={item.name}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-t from-[#10211c]/85 via-transparent to-transparent" />
      <div className="absolute inset-x-5 bottom-5">
        <div className="mb-2 flex items-center gap-2">
          <Badge className="border-0 bg-white/20 text-white backdrop-blur">
            {item.meta.split(" · ")[0]}
          </Badge>
          <span className="text-xs text-white/75">
            {item.meta.split(" · ")[1]}
          </span>
        </div>
        <h3 className="font-display text-3xl">{item.name}</h3>
        <p className="mt-1 text-sm text-white/70">{item.country}</p>
      </div>
      <button className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/15 text-white backdrop-blur hover:bg-white hover:text-[#d96d4b]">
        <Heart size={16} />
      </button>
    </article>
  );
}

function Planner({
  onComplete,
  destination,
  initialDates,
  initialStyle,
}: {
  onComplete: (data: Itinerary) => void;
  destination: string;
  initialDates?: string;
  initialStyle?: string;
}) {
  const [step, setStep] = useState(0);
  const [planning, setPlanning] = useState(false);
  const [form, setForm] = useState({
    destination,
    dates: initialDates || "Sep 14 – 21",
    budget: "$3,000 – $4,000",
    travelers: "2 travelers",
    stay: initialStyle || "Boutique stay",
    transport: "Walk + local rail",
    interests: "Sea swims, long lunches",
    activities: "Viewpoints, local tables",
  });
  const mutation = useMutation({
    mutationFn: generateTrip,
    onSuccess: (data: Itinerary) => {
      onComplete(data);
    },
    onError: (err: any) => {
      toast.error("Failed to generate trip: " + err.message);
      setPlanning(false);
    },
  });

  const handleGenerate = (currentForm: any) => {
    const req: TripRequest = {
      destination: currentForm.destination || "Amalfi Coast",
      origin: "New York",
      start_date: "2024-09-14",
      end_date: "2024-09-21",
      num_travelers: parseInt(currentForm.travelers) || 2,
      total_budget: parseInt(currentForm.budget.replace(/\D/g, "")) || 4000,
      currency: "USD",
      travel_style: currentForm.stay.toLowerCase().includes("luxury")
        ? "luxury"
        : currentForm.stay.toLowerCase().includes("budget")
          ? "budget"
          : "comfort",
      interests: ["culture", "nature", "food"],
      food_preference: "no_preference",
      accommodation_preference: "mid_range",
      transport_preference: "public",
      special_requests: `Activities: ${currentForm.activities}. Transport: ${currentForm.transport}.`,
    };
    mutation.mutate(req);
  };

  const steps = [
    {
      eyebrow: "Let’s begin",
      title: "Where are you longing to go?",
      key: "destination",
      options: ["Amalfi Coast", "Kyoto", "Patagonia", "Somewhere surprising"],
    },
    {
      eyebrow: "Set the rhythm",
      title: "When and with whom?",
      key: "dates",
      options: [
        "Sep 14 – 21 · 2 travelers",
        "October · just me",
        "Spring break · 4 travelers",
        "I’m flexible",
      ],
    },
    {
      eyebrow: "Shape the details",
      title: "What should we make room for?",
      key: "stay",
      options: [
        "Slow & scenic · boutique stay",
        "Culture-rich · central hotel",
        "Wild & outdoorsy · cabins",
        "Food-led · design stay",
      ],
    },
  ];
  if (planning)
    return (
      <section className="min-h-150 bg-[#172c26] px-5 py-28 text-white">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-8 grid h-20 w-20 place-items-center rounded-full bg-[#d96d4b] shadow-2xl shadow-[#d96d4b]/20">
            <Sparkles className="animate-pulse" size={30} />
          </div>
          <p className="eyebrow text-[#e8c5a8]">TravelPlanner intelligence</p>
          <h2 className="mt-4 font-display text-5xl">
            Composing your journey<span className="text-[#d96d4b]">.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-white/65">
            We’re balancing local character, your pace, and a little room for
            the unexpected.
          </p>
          <div className="mt-10 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[#d96d4b]" />
          </div>
          <div className="mt-6 grid gap-3 text-left text-sm text-white/60">
            <div className="flex items-center gap-3">
              <Check size={16} className="text-[#a7c7ad]" /> Matching places to
              your travel mood
            </div>
            <div className="flex items-center gap-3">
              <Check size={16} className="text-[#a7c7ad]" /> Balancing discovery
              with breathing room
            </div>
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 animate-spin rounded-full border border-white/20 border-t-[#d96d4b]" />{" "}
              Mapping the moments in between
            </div>
          </div>
        </div>
      </section>
    );
  const current = steps[step];
  return (
    <section id="planner" className="bg-[#f0eee6] px-5 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
        <div>
          <p className="eyebrow text-[#d96d4b]">{current.eyebrow}</p>
          <h2 className="mt-4 max-w-lg font-display text-5xl leading-[1.05] text-[#1f352d] sm:text-6xl">
            {current.title}
            <span className="text-[#d96d4b]">.</span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-6 text-[#6d776f]">
            A few thoughtful details help us design something that feels like
            yours, not a template.
          </p>
          <div className="mt-8 flex gap-2">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? "w-10 bg-[#d96d4b]" : "w-5 bg-[#d1d6cd]"}`}
              />
            ))}
          </div>
          <div className="mt-8 grid gap-2 text-xs text-[#718077]">
            <div>
              <span className="font-bold text-[#21463c]">Destination</span>{" "}
              {form.destination}
            </div>
            <div>
              <span className="font-bold text-[#21463c]">Dates</span>{" "}
              {form.dates}
            </div>
            <div>
              <span className="font-bold text-[#21463c]">Budget</span>{" "}
              {form.budget}
            </div>
            <div>
              <span className="font-bold text-[#21463c]">Travelers</span>{" "}
              {form.travelers}
            </div>
            <div>
              <span className="font-bold text-[#21463c]">Stay</span> {form.stay}
            </div>
            <div>
              <span className="font-bold text-[#21463c]">Transport</span>{" "}
              {form.transport}
            </div>
            <div>
              <span className="font-bold text-[#21463c]">Interests</span>{" "}
              {form.interests}
            </div>
            <div>
              <span className="font-bold text-[#21463c]">Activities</span>{" "}
              {form.activities}
            </div>
          </div>
        </div>
        <div className="rounded-4xl bg-[#fbfaf6] p-5 shadow-[0_24px_60px_rgba(31,53,45,.1)] sm:p-8">
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <Input
              value={form.destination}
              onChange={(e: any) => setForm({ ...form, destination: e.target.value })}
              placeholder="Destination"
            />
            <Input
              value={form.dates}
              onChange={(e: any) => setForm({ ...form, dates: e.target.value })}
              placeholder="Dates"
            />
            <Input
              value={form.budget}
              onChange={(e: any) => setForm({ ...form, budget: e.target.value })}
              placeholder="Budget"
            />
            <Input
              value={form.travelers}
              onChange={(e: any) => setForm({ ...form, travelers: e.target.value })}
              placeholder="Travelers"
            />
            <Input
              value={form.stay}
              onChange={(e: any) => setForm({ ...form, stay: e.target.value })}
              placeholder="Stay preference"
            />
            <Input
              value={form.transport}
              onChange={(e: any) => setForm({ ...form, transport: e.target.value })}
              placeholder="Transport"
            />
            <Input
              value={form.interests}
              onChange={(e: any) => setForm({ ...form, interests: e.target.value })}
              placeholder="Interests"
            />
            <Input
              value={form.activities}
              onChange={(e: any) => setForm({ ...form, activities: e.target.value })}
              placeholder="Preferred activities"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {current.options.map((option, i) => (
              <button
                key={option}
                onClick={() => {
                  setForm({ ...form, [current.key]: option });
                  if (step < steps.length - 1) setStep(step + 1);
                  else {
                    setPlanning(true);
                    handleGenerate({ ...form, [current.key]: option });
                  }
                }}
                className="card-lift group rounded-2xl border border-[#dfe5dc] bg-white p-5 text-left hover:border-[#d96d4b] hover:bg-[#fffaf4]"
              >
                <span className="text-xs font-bold text-[#9ba69d]">
                  0{i + 1}
                </span>
                <span className="mt-8 flex items-center justify-between text-base font-semibold text-[#284b40]">
                  {option}
                  <ArrowRight
                    size={16}
                    className="text-[#c8d0c8] group-hover:translate-x-1 group-hover:text-[#d96d4b]"
                  />
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => step > 0 && setStep(step - 1)}
            className="mt-6 text-sm font-semibold text-[#8a968e]"
          >
            Back
          </button>
        </div>
      </div>
    </section>
  );
}

function MapPanel({
  selected,
  setSelected,
  itineraryData,
}: {
  selected: number;
  setSelected: (n: number) => void;
  itineraryData?: Itinerary;
}) {
  // Build markers and route from itinerary data or fallback to base itinerary
  const timeSlots = itineraryData?.days[0]?.time_slots || [];
  const mapMarkers =
    timeSlots.length > 0
      ? timeSlots.map((t: any) => ({
          lat: t.lat,
          lng: t.lng,
          title: t.location_name || t.activity_name,
        }))
      : [
          { lat: 40.6333, lng: 14.6029, title: baseItinerary[0].place },
          { lat: 40.634, lng: 14.602, title: baseItinerary[1].place },
          { lat: 40.635, lng: 14.61, title: baseItinerary[2].place },
          { lat: 40.65, lng: 14.62, title: baseItinerary[3].place },
        ];

  const route = mapMarkers.map((m: any) => ({ lat: m.lat, lng: m.lng }));

  return (
    <div className="relative min-h-92.5 overflow-hidden rounded-[28px] bg-[#dce6dc] p-2">
      <div className="absolute inset-2 overflow-hidden rounded-[22px]">
        <MapView
          className="h-full min-h-87.5"
          initialCenter={{ lat: 40.6333, lng: 14.6029 }}
          initialZoom={12}
          markers={mapMarkers}
          route={route}
        />
      </div>
      <div className="absolute inset-5 z-10 flex items-start justify-between pointer-events-none">
        <div className="rounded-2xl bg-white/85 px-4 py-3 backdrop-blur">
          <p className="eyebrow text-[#65816e]">Route view</p>
          <h3 className="mt-1 text-lg font-semibold text-[#21463c]">
            The coast, connected
          </h3>
        </div>
        <Badge className="bg-white/85 text-[#527060]">{mapMarkers.length} stops</Badge>
      </div>
      {(itineraryData?.days[0]?.time_slots || baseItinerary).map((item: any, i: number) => (
        <button
          key={item.title || item.activity_name || i}
          onClick={() => setSelected(i)}
          className={`absolute bottom-5 z-20 grid h-9 w-9 place-items-center rounded-full border-4 border-white text-xs font-bold shadow-lg transition ${selected === i ? "bg-[#d96d4b] text-white" : "bg-[#21463c] text-white hover:scale-110"}`}
          style={{ left: `${20 + i * 20}%` }}
        >
          {i + 1}
        </button>
      ))}
      <div className="absolute bottom-5 left-[42%] right-5 z-20 rounded-2xl bg-white/85 p-3 backdrop-blur">
        <p className="text-xs font-bold text-[#21463c]">
          {itineraryData?.days[0]?.time_slots?.[selected]?.location_name ||
            baseItinerary[selected]?.place}
        </p>
        <p className="mt-1 text-xs text-[#718077]">
          {(itineraryData?.days[0]?.time_slots?.[selected] as any)?.title ||
            itineraryData?.days[0]?.time_slots?.[selected]?.activity_name ||
            baseItinerary[selected]?.title}{" "}
          · tap a stop to explore
        </p>
      </div>
    </div>
  );
}

function Dashboard({ itineraryData }: { itineraryData: Itinerary }) {
  const [selected, setSelected] = useState(0);
  const [items, setItems] = useState<any[]>(
    itineraryData?.days[0]?.time_slots || baseItinerary
  );
  const [assistant, setAssistant] = useState("");
  const [assistantReply, setAssistantReply] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [voted, setVoted] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const editItem = (i: number) => {
    const copy = [...items];
    copy[i] = {
      ...copy[i],
      title: copy[i].title.includes("quiet")
        ? baseItinerary[i].title
        : `A quieter ${copy[i].title.toLowerCase()}`,
    };
    setItems(copy);
    toast.success("Itinerary updated");
  };
  const askAssistant = () => {
    if (!assistant.trim()) return;
    setAssistantReply(
      assistant.toLowerCase().includes("rain")
        ? "I’d swap the viewpoint for a ceramics studio and move the ferry to Friday morning. Want me to apply that?"
        : "I found a gentler option nearby that keeps your day feeling open. I can add it to the timeline."
    );
    setAssistant("");
  };
  return (
    <section id="trips" className="bg-[#f7f6f1] px-5 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-[#d96d4b]">Your next chapter</p>
            <h2 className="mt-3 font-display text-5xl text-[#1f352d]">
              {itineraryData?.destination || "Amalfi"}, slowly.
            </h2>
            <p className="mt-2 text-sm text-[#7b867d]">
              {itineraryData
                ? `${itineraryData.start_date} – ${itineraryData.end_date}`
                : "September 14 – 21, 2024"}{" "}
              · {itineraryData?.num_travelers || 2} travellers · Curated by
              TravelPlanner
            </p>
          </div>
          <Button
            className="w-fit rounded-full bg-[#21463c] text-white hover:bg-[#173a30]"
            onClick={() => toast.success("Invite link copied")}
          >
            Invite a friend <Users size={15} />
          </Button>
        </div>
        {notificationsOpen && (
          <div className="mb-4 rounded-2xl border border-[#dfe4db] bg-white p-4 text-sm text-[#597166]">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#21463c]">Trip updates</p>
              <button
                onClick={() => setNotificationsOpen(false)}
                className="text-xs text-[#9aa59c]"
              >
                Close
              </button>
            </div>
            <div className="mt-3 grid gap-2">
              <p>JM suggested a swim at Marina di Praia.</p>
              <p>TravelPlanner found a quieter dinner option near the ferry.</p>
              <p className="text-[#9aa59c]">No other new updates.</p>
            </div>
          </div>
        )}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto border-b border-[#dfe4db] pb-2">
          <div className="flex gap-2">
            {[
              "My Trips",
              "Explore",
              "Saved Places",
              "Trip Details",
              "AI Assistant",
              "Activity",
              "Profile",
              "Settings",
            ].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${activeTab === tab ? "bg-[#21463c] text-white" : "text-[#718077] hover:bg-[#e8eee7]"}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="ml-auto shrink-0 rounded-full bg-[#f0eee6] px-3 py-2 text-xs font-bold text-[#597166]"
          >
            Notifications · 3
          </button>
        </div>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="rounded-[28px] border-0 bg-[#fbfaf6]">
            <DialogHeader>
              <DialogTitle className="font-display text-3xl text-[#21463c]">
                Edit this moment
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-[#718077]">
              Give the selected activity a name that feels right for your day.
            </p>
            <div className="mt-2 flex gap-2">
              <Input
                value={editTitle}
                onChange={(e: any) => setEditTitle(e.target.value)}
              />
              <Button
                onClick={() => {
                  const copy = [...items];
                  copy[selected] = {
                    ...copy[selected],
                    title: editTitle || copy[selected].title,
                  };
                  setItems(copy);
                  setEditOpen(false);
                  toast.success("Activity saved");
                }}
                className="rounded-xl bg-[#21463c] text-white"
              >
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {activeTab !== "Overview" && activeTab !== "AI Assistant" ? (
          <WorkspaceExtras tab={activeTab} />
        ) : activeTab === "AI Assistant" ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
            <div className="rounded-[28px] bg-[#21463c] p-6 text-white">
              <div className="flex items-center gap-2 text-[#c0d5c1]">
                <MessageCircle size={17} />
                <p className="eyebrow">Smart travel assistant</p>
              </div>
              <h3 className="mt-4 font-display text-4xl">
                Ask the trip anything.
              </h3>
              <div className="mt-8 rounded-2xl bg-white/10 p-2">
                <Input
                  value={assistant}
                  onChange={(e: any) => setAssistant(e.target.value)}
                  onKeyDown={(e: any) => e.key === "Enter" && askAssistant()}
                  placeholder="What should I do if it rains tomorrow?"
                  className="border-0 bg-transparent text-white placeholder:text-white/45 focus-visible:ring-0"
                />
                <Button
                  onClick={askAssistant}
                  className="mt-2 w-full rounded-xl bg-[#d96d4b] text-white"
                >
                  Ask TravelPlanner <Sparkles size={15} />
                </Button>
              </div>
              {assistantReply && (
                <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-white/80">
                  {assistantReply}
                  <button
                    onClick={() => {
                      setItems([
                        { ...items[0], title: "Ceramics studio in Amalfi" },
                        ...items.slice(1),
                      ]);
                      toast.success("Alternative added to your day");
                    }}
                    className="mt-3 flex items-center gap-2 font-semibold text-[#f0c7ad]"
                  >
                    Apply to itinerary <ArrowRight size={15} />
                  </button>
                </div>
              )}
              <div className="mt-8 grid gap-2 text-sm text-white/60">
                <button
                  onClick={() =>
                    setAssistant("Find a cheaper restaurant nearby")
                  }
                  className="rounded-xl bg-white/5 p-3 text-left hover:bg-white/10"
                >
                  Find a cheaper restaurant nearby
                </button>
                <button
                  onClick={() =>
                    setAssistant("Can we fit another attraction today?")
                  }
                  className="rounded-xl bg-white/5 p-3 text-left hover:bg-white/10"
                >
                  Can we fit another attraction today?
                </button>
              </div>
            </div>
            <div className="rounded-[28px] bg-[#e7efe5] p-6">
              <p className="eyebrow text-[#789481]">Weather-aware planning</p>
              <div className="mt-5 flex items-center gap-4">
                <Sun className="text-[#d96d4b]" size={34} />
                <div>
                  <p className="text-2xl font-semibold text-[#21463c]">
                    24° · clear
                  </p>
                  <p className="text-sm text-[#718077]">Thursday in Positano</p>
                </div>
              </div>
              <div className="mt-8 rounded-2xl bg-white/65 p-4">
                <p className="text-sm font-semibold text-[#21463c]">
                  A note from TravelPlanner
                </p>
                <p className="mt-2 text-sm leading-6 text-[#718077]">
                  Keep the sunset viewpoint as your anchor. Everything else can
                  stay pleasantly flexible.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-5 lg:grid-cols-[1.05fr_1.4fr_.72fr]">
              <div className="relative min-h-97.5 overflow-hidden rounded-[28px] bg-[#24483f] text-white">
                <div
                  className="absolute inset-0 opacity-50"
                  style={{
                    backgroundImage: `url(${IMG.hero})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#132a24] via-[#132a24]/25 to-transparent" />
                <div className="relative flex h-full flex-col justify-between p-6">
                  <div className="flex items-center justify-between">
                    <Badge className="border border-white/20 bg-white/15 text-white">
                      Live itinerary
                    </Badge>
                    <div className="flex -space-x-2">
                      <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#24483f] bg-[#dca58b] text-xs font-bold text-[#5d3527]">
                        AS
                      </div>
                      <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#24483f] bg-[#a4bda5] text-xs font-bold text-[#21463c]">
                        JM
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-white/65">
                      Day 01 · {itineraryData?.destination || "Amalfi Coast"}
                    </p>
                    <h3 className="mt-2 font-display text-4xl">
                      {itineraryData?.days[0]?.title || "A day in the light."}
                    </h3>
                    <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/75">
                      <span className="flex items-center gap-1.5">
                        <Sun size={15} /> 24° clear
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Wallet size={15} /> $820 left
                      </span>
                      <span className="flex items-center gap-1.5">
                        <TrainFront size={15} /> Ferry + walk
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-[28px] bg-white p-5 shadow-[0_20px_50px_rgba(31,53,45,.06)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="eyebrow text-[#9aa59c]">Thursday · Sep 16</p>
                    <h3 className="mt-1 text-lg font-semibold text-[#21463c]">
                      Your day, at a glance
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setEditTitle(items[selected].title);
                      setEditOpen(true);
                    }}
                    className="rounded-full bg-[#f0eee6] px-3 py-2 text-xs font-bold text-[#597166]"
                  >
                    Edit day
                  </button>
                </div>
                <div className="grid gap-1">
                  {items.map((item: any, i: number) => (
                    <div
                      key={`${item.title}-${i}`}
                      className={`group flex gap-3 rounded-2xl p-3 text-left transition ${selected === i ? "bg-[#f5f4ef]" : "hover:bg-[#fafaf7]"}`}
                    >
                      <button
                        onClick={() => setSelected(i)}
                        className="w-11 pt-1 text-left text-[11px] font-bold text-[#9aa59c]"
                      >
                        {item.time}
                      </button>
                      <button
                        onClick={() => setSelected(i)}
                        className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm"
                        style={{
                          backgroundColor: `${item.color}20`,
                          color: item.color,
                        }}
                      >
                        {item.icon}
                      </button>
                      <button
                        onClick={() => setSelected(i)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="truncate text-sm font-semibold text-[#294b40]">
                          {item.title}
                        </div>
                        <div className="mt-1 text-xs text-[#8d9990]">
                          {item.type} · {item.cost}
                        </div>
                      </button>
                      <button
                        onClick={() => editItem(i)}
                        className="mt-2 text-[#c5cec5] hover:text-[#d96d4b]"
                        aria-label="Edit activity"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[28px] bg-[#e5eee4] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="eyebrow text-[#789481]">Trip budget</p>
                      <p className="mt-2 text-3xl font-semibold text-[#21463c]">
                        $
                        {itineraryData?.budget_breakdown?.total_planned || 2480}
                      </p>
                      <p className="mt-1 text-xs text-[#718277]">
                        of ${itineraryData?.total_budget || 3650} estimated
                      </p>
                    </div>
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-white/70 text-[#d96d4b]">
                      <Wallet size={19} />
                    </div>
                  </div>
                  <Progress value={68} className="mt-6 h-2 bg-white/70" />
                  <div className="mt-4 grid gap-2">
                    {(itineraryData
                      ? [
                          {
                            label: "Stays",
                            value: itineraryData.budget_breakdown.accommodation,
                            total: itineraryData.total_budget * 0.4,
                            color: "#d96d4b",
                          },
                          {
                            label: "Transport",
                            value:
                              itineraryData.budget_breakdown.transportation,
                            total: itineraryData.total_budget * 0.2,
                            color: "#7f9fc2",
                          },
                          {
                            label: "Food",
                            value: itineraryData.budget_breakdown.food,
                            total: itineraryData.total_budget * 0.25,
                            color: "#d6a95d",
                          },
                          {
                            label: "Experiences",
                            value: itineraryData.budget_breakdown.activities,
                            total: itineraryData.total_budget * 0.15,
                            color: "#8fae9a",
                          },
                        ]
                      : budgetItems
                    ).map((item: any) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-[11px] text-[#718277]">
                          <span>{item.label}</span>
                          <span>${item.value}</span>
                        </div>
                        <Progress
                          value={(item.value / item.total) * 100}
                          className="mt-1 h-1.5 bg-white/70"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[28px] bg-[#21463c] p-5 text-white">
                  <div className="flex items-center gap-2 text-[#c0d5c1]">
                    <Users size={17} />
                    <p className="eyebrow">Travelling together</p>
                  </div>
                  <p className="mt-4 font-display text-2xl leading-tight">
                    2 people shaping this trip.
                  </p>
                  <div className="mt-5 flex items-center justify-between text-xs text-white/60">
                    <span>JM is online · suggested a swim</span>
                    <button
                      onClick={() => setVoted(!voted)}
                      className={`rounded-full px-3 py-1.5 font-bold ${voted ? "bg-[#d96d4b] text-white" : "bg-white/10 text-white"}`}
                    >
                      {voted ? "Voted" : "Vote"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-[#fffaf4] p-5">
                <p className="eyebrow text-[#a86b55]">Stay</p>
                <p className="mt-2 text-lg font-semibold text-[#713d2f]">
                  Casa Angelina
                </p>
                <p className="mt-1 text-xs text-[#8e6153]">
                  Sea view · 4 nights · check-in Sep 14
                </p>
              </div>
              <div className="rounded-3xl bg-[#e8efe5] p-5">
                <p className="eyebrow text-[#789481]">Transport</p>
                <p className="mt-2 text-lg font-semibold text-[#21463c]">
                  Walk + local ferry
                </p>
                <p className="mt-1 text-xs text-[#718077]">
                  Low-friction transfers · $420 planned
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
              <MapPanel
                selected={selected}
                setSelected={setSelected}
                itineraryData={itineraryData}
              />
              <div className="rounded-[28px] bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="eyebrow text-[#9aa59c]">
                      For your kind of curious
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-[#21463c]">
                      Handpicked nearby
                    </h3>
                  </div>
                  <button className="text-xs font-bold text-[#d96d4b]">
                    See all
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {recommendations.map(rec => (
                    <div
                      key={rec.title}
                      className="card-lift flex gap-3 rounded-2xl border border-[#edf0ea] p-3"
                    >
                      <img
                        src={rec.image}
                        alt=""
                        className="h-20 w-20 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-[#21463c]">
                            {rec.title}
                          </p>
                          <span className="text-xs text-[#d96d4b]">
                            ★ {rec.rating}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#8b968e]">
                          {rec.category} · {rec.distance} · {rec.price}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {rec.tags.map(tag => (
                            <span
                              key={tag}
                              className="rounded-full bg-[#eef2ec] px-2 py-1 text-[10px] text-[#688071]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 text-[11px] leading-4 text-[#758178]">
                          {rec.why}
                        </p>
                        <button
                          onClick={() =>
                            toast.success(`${rec.title} added to your trip`)
                          }
                          className="mt-2 text-[11px] font-bold text-[#d96d4b]"
                        >
                          Add to trip
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 rounded-[28px] bg-[#f0ddd1] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow text-[#a86b55]">
                    Collaborative trip log
                  </p>
                  <p className="mt-1 text-sm text-[#713d2f]">
                    JM suggested a swim at Marina di Praia · 8 min ago
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8e6153]">
                  <span className="h-2 w-2 rounded-full bg-[#78a680]" /> Sarah
                  is online <span className="mx-1">·</span> 3 comments
                </div>
                <button
                  onClick={() =>
                    toast.success("Suggestion added to your activity feed")
                  }
                  className="rounded-full bg-[#713d2f] px-4 py-2 text-xs font-bold text-white"
                >
                  Open activity
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
function Explore() {
  return (
    <section id="explore" className="px-5 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-[#d96d4b]">
              The world, thoughtfully selected
            </p>
            <h2 className="mt-3 font-display text-5xl text-[#1f352d]">
              Where will you feel most alive?
            </h2>
          </div>
          <button className="flex items-center gap-2 text-sm font-semibold text-[#21463c]">
            View all destinations <ArrowRight size={16} />
          </button>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {destinations.map(item => (
            <DestinationCard key={item.name} item={item} />
          ))}
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-[28px] bg-[#e8efe5] p-7 sm:p-9">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow text-[#789481]">
                  Made for your kind of curious
                </p>
                <h3 className="mt-3 max-w-md font-display text-4xl leading-tight text-[#21463c]">
                  A little more you in every recommendation.
                </h3>
              </div>
              <Gem className="text-[#d96d4b]" />
            </div>
            <p className="mt-5 max-w-md text-sm leading-6 text-[#6d7d72]">
              Tell us what pulls you in — independent bookshops, sea swims, long
              lunches, wild places — and we’ll make the map feel personal.
            </p>
            <Button className="mt-7 rounded-full bg-[#21463c] text-white hover:bg-[#173a30]">
              Set your travel mood <ArrowRight size={15} />
            </Button>
          </div>
          <div className="rounded-[28px] bg-[#f0ddd1] p-7 sm:p-9">
            <p className="eyebrow text-[#a86b55]">This week’s feeling</p>
            <h3 className="mt-3 font-display text-4xl text-[#713d2f]">
              The art of taking the long way.
            </h3>
            <p className="mt-5 text-sm leading-6 text-[#8e6153]">
              A three-day guide to corners of the world that reward a little
              wandering.
            </p>
            <button className="mt-7 flex items-center gap-2 text-sm font-semibold text-[#713d2f]">
              Read the field note <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [view, setView] = useState<"home" | "planner" | "dashboard">("home");
  const [destination, setDestination] = useState("Amalfi Coast");
  const [itineraryData, setItineraryData] = useState<Itinerary | null>(null);
  const [selectedDates, setSelectedDates] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const jumpToPlanner = (place?: string, dates?: string, style?: string) => {
    if (place) setDestination(place);
    if (dates) setSelectedDates(dates);
    if (style) setSelectedStyle(style);
    setView("planner");
    setTimeout(
      () =>
        document
          .getElementById("planner")
          ?.scrollIntoView({ behavior: "smooth" }),
      20
    );
  };
  const showDashboard = (data: Itinerary) => {
    setItineraryData(data);
    setView("dashboard");
    setTimeout(
      () =>
        document
          .getElementById("trips")
          ?.scrollIntoView({ behavior: "smooth" }),
      20
    );
  };
  return (
    <div className="min-h-screen overflow-hidden bg-[#f5f4ef]">
      {view === "home" && (
        <>
          <section className="relative min-h-180 bg-[#18332b] text-white">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${IMG.hero})` }}
            />
            <div className="absolute inset-0 bg-linear-to-r from-[#102c25]/90 via-[#17372e]/50 to-[#17372e]/25" />
            <div className="absolute inset-0 bg-linear-to-t from-[#102c25]/60 via-transparent to-transparent" />
            <Header onPlan={() => jumpToPlanner()} />
            <div className="relative mx-auto flex min-h-180 max-w-7xl items-end px-5 pb-14 pt-36 sm:px-10 sm:pb-20">
              <div className="max-w-3xl">
                <div className="fade-up flex items-center gap-3 text-sm text-white/75">
                  <span className="h-px w-10 bg-[#e7b59a]" />
                  Travel, with intention
                </div>
                <h1 className="fade-up fade-up-delay-1 mt-5 max-w-3xl font-display text-6xl leading-[.98] tracking-[-.03em] sm:text-8xl">
                  Go where the <em className="text-[#f0c2a6]">feeling</em> takes
                  you<span className="text-[#e49b76]">.</span>
                </h1>
                <p className="fade-up fade-up-delay-2 mt-7 max-w-xl text-base leading-7 text-white/76 sm:text-lg">
                  A calmer, more considered way to plan the trips you’ll talk
                  about for years.
                </p>
                <div className="fade-up fade-up-delay-3 mt-9 max-w-4xl">
                  <SearchBar
                    onPlan={(place) => jumpToPlanner(place)}
                    dates={selectedDates}
                    onDatesChange={setSelectedDates}
                    style={selectedStyle}
                    onStyleChange={setSelectedStyle}
                  />
                </div>
              </div>
            </div>
            <div className="absolute bottom-8 right-10 hidden items-center gap-3 text-xs text-white/60 lg:flex">
              <span className="h-px w-12 bg-white/40" />
              Scroll to explore
            </div>
          </section>
          <Explore />
          <Planner destination={destination} onComplete={showDashboard} initialDates={selectedDates} initialStyle={selectedStyle} />
        </>
      )}
      {view === "planner" && (
        <>
          <div className="bg-[#21463c] px-5 py-4 text-white">
            <button
              onClick={() => setView("home")}
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Compass size={18} /> TravelPlanner
            </button>
          </div>
          <Planner destination={destination} onComplete={showDashboard} initialDates={selectedDates} initialStyle={selectedStyle} />
        </>
      )}
      {view === "dashboard" && (
        <>
          <div className="bg-[#21463c] px-5 py-4 text-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <button
                onClick={() => setView("home")}
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full border border-white/30">
                  <Compass size={15} />
                </span>
                TravelPlanner
              </button>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <span className="hidden sm:inline">Your trip workspace</span>
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[#dca58b] text-xs font-bold text-[#5d3527]">
                  AS
                </div>
              </div>
            </div>
          </div>
          {itineraryData ? (
            <Dashboard itineraryData={itineraryData} />
          ) : (
            <Dashboard itineraryData={null as any} />
          )}
          <Explore />
        </>
      )}
      <footer className="bg-[#172c26] px-5 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-white/25">
                <Compass size={15} />
              </span>
              TravelPlanner
            </div>
            <p className="mt-2 text-sm text-white/50">Plan less. Feel more.</p>
          </div>
          <div className="flex gap-5 text-sm text-white/55">
            <a href="#explore">Explore</a>
            <a href="#trips">My trips</a>
            <a href="#planner">Start planning</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
