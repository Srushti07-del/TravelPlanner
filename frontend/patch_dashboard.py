import re

file_path = "client/src/pages/Home.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Modify MapPanel
content = content.replace(
    'function MapPanel({ selected, setSelected }: { selected: number; setSelected: (n: number) => void }) {',
    'function MapPanel({ selected, setSelected, itineraryData }: { selected: number; setSelected: (n: number) => void; itineraryData?: Itinerary }) {'
)
content = content.replace(
    'const route = [{ lat: 40.6333, lng: 14.6029 }, { lat: 40.634, lng: 14.602 }, { lat: 40.635, lng: 14.61 }, { lat: 40.65, lng: 14.62 }];',
    'const timeSlots = itineraryData?.days[0]?.time_slots || []; const route = timeSlots.length > 0 ? timeSlots.map(t => ({ lat: t.lat, lng: t.lng })) : [{ lat: 40.6333, lng: 14.6029 }, { lat: 40.634, lng: 14.602 }, { lat: 40.635, lng: 14.61 }, { lat: 40.65, lng: 14.62 }];'
)
content = content.replace(
    'title: baseItinerary[i].place',
    'title: timeSlots[i]?.location_name || baseItinerary[i].place'
)
content = content.replace(
    'baseItinerary.map((item, i)',
    '(itineraryData?.days[0]?.time_slots || baseItinerary).map((item, i)'
)
content = content.replace(
    'baseItinerary[selected].place',
    '(itineraryData?.days[0]?.time_slots?.[selected]?.location_name || baseItinerary[selected].place)'
)
content = content.replace(
    'baseItinerary[selected].title',
    '(itineraryData?.days[0]?.time_slots?.[selected]?.title || itineraryData?.days[0]?.time_slots?.[selected]?.activity_name || baseItinerary[selected].title)'
)

# Modify Dashboard elements
content = content.replace(
    '<MapPanel selected={selected} setSelected={setSelected} />',
    '<MapPanel selected={selected} setSelected={setSelected} itineraryData={itineraryData} />'
)
content = content.replace(
    '<h2 className="mt-3 font-display text-5xl text-[#1f352d]">Amalfi, slowly.</h2>',
    '<h2 className="mt-3 font-display text-5xl text-[#1f352d]">{itineraryData?.destination || "Amalfi"}, slowly.</h2>'
)
content = content.replace(
    '<p className="mt-2 text-sm text-[#7b867d]">September 14 – 21, 2024 · 2 travellers · Curated by Voyage</p>',
    '<p className="mt-2 text-sm text-[#7b867d]">{itineraryData ? `${itineraryData.start_date} – ${itineraryData.end_date}` : "September 14 – 21, 2024"} · {itineraryData?.num_travelers || 2} travellers · Curated by Voyage</p>'
)
content = content.replace(
    '<p className="text-sm text-white/65">Day 03 · Amalfi Coast</p>',
    '<p className="text-sm text-white/65">Day 01 · {itineraryData?.destination || "Amalfi Coast"}</p>'
)
content = content.replace(
    '<h3 className="mt-2 font-display text-4xl">A day in the light.</h3>',
    '<h3 className="mt-2 font-display text-4xl">{itineraryData?.days[0]?.title || "A day in the light."}</h3>'
)
content = content.replace(
    '<p className="mt-2 text-3xl font-semibold text-[#21463c]">$2,480</p>',
    '<p className="mt-2 text-3xl font-semibold text-[#21463c]">${itineraryData?.budget_breakdown?.total_planned || 2480}</p>'
)
content = content.replace(
    '<p className="mt-1 text-xs text-[#718277]">of $3,650 estimated</p>',
    '<p className="mt-1 text-xs text-[#718277]">of ${itineraryData?.total_budget || 3650} estimated</p>'
)
content = content.replace(
    '{budgetItems.map(item =>',
    '{(itineraryData ? [ { label: "Stays", value: itineraryData.budget_breakdown.accommodation, total: itineraryData.total_budget * 0.4, color: "#d96d4b" }, { label: "Transport", value: itineraryData.budget_breakdown.transportation, total: itineraryData.total_budget * 0.2, color: "#7f9fc2" }, { label: "Food", value: itineraryData.budget_breakdown.food, total: itineraryData.total_budget * 0.25, color: "#d6a95d" }, { label: "Experiences", value: itineraryData.budget_breakdown.activities, total: itineraryData.total_budget * 0.15, color: "#8fae9a" } ] : budgetItems).map(item =>'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Dashboard patched successfully!")
