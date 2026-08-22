import re

file_path = "client/src/pages/Home.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
imports_to_add = """import { useMutation } from "@tanstack/react-query";
import { generateTrip, Itinerary, TripRequest } from "@/lib/api";
"""
content = content.replace('import { ArrowRight', imports_to_add + 'import { ArrowRight')

# Replace Planner signature
content = content.replace(
    'function Planner({ onComplete, destination }: { onComplete: () => void; destination: string }) {',
    'function Planner({ onComplete, destination }: { onComplete: (data: Itinerary) => void; destination: string }) {'
)

# Replace setTimeout in Planner with handleGenerate
planner_generate_logic = """
  const mutation = useMutation({
    mutationFn: generateTrip,
    onSuccess: (data) => {
      onComplete(data);
    },
    onError: (err: any) => {
      toast.error("Failed to generate trip: " + err.message);
      setPlanning(false);
    }
  });

  const handleGenerate = (currentForm: any) => {
    const req: TripRequest = {
      destination: currentForm.destination || "Amalfi Coast",
      origin: "New York",
      start_date: "2024-09-14",
      end_date: "2024-09-21",
      num_travelers: parseInt(currentForm.travelers) || 2,
      total_budget: parseInt(currentForm.budget.replace(/\\D/g, "")) || 4000,
      currency: "USD",
      travel_style: currentForm.stay.toLowerCase().includes("luxury") ? "luxury" : currentForm.stay.toLowerCase().includes("budget") ? "budget" : "comfort",
      interests: ["culture", "nature", "food"],
      food_preference: "no_preference",
      accommodation_preference: "mid_range",
      transport_preference: "public",
      special_requests: `Activities: ${currentForm.activities}. Transport: ${currentForm.transport}.`
    };
    mutation.mutate(req);
  };
"""

content = content.replace('const steps = [{', planner_generate_logic + '\n const steps = [{')

# Replace the step completion logic
content = content.replace(
    'if (step < steps.length - 1) setStep(step + 1); else { setPlanning(true); setTimeout(onComplete, 1800); }',
    'if (step < steps.length - 1) setStep(step + 1); else { setPlanning(true); handleGenerate({ ...form, [current.key]: option }); }'
)

# Replace Dashboard signature
content = content.replace('function Dashboard() {', 'function Dashboard({ itineraryData }: { itineraryData: Itinerary }) {')

# Modify Dashboard initial state
content = content.replace('const [items, setItems] = useState(baseItinerary);', 'const [items, setItems] = useState(itineraryData?.days[0]?.time_slots || baseItinerary);')

# Modify Home component to hold itineraryData
content = content.replace(
    'const [destination, setDestination] = useState("Amalfi Coast");',
    'const [destination, setDestination] = useState("Amalfi Coast"); const [itineraryData, setItineraryData] = useState<Itinerary | null>(null);'
)

content = content.replace(
    'const showDashboard = () => {',
    'const showDashboard = (data: Itinerary) => { setItineraryData(data); '
)

content = content.replace(
    '<Dashboard />',
    '{itineraryData ? <Dashboard itineraryData={itineraryData} /> : <Dashboard itineraryData={null as any} />}'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Home.tsx patched successfully!")
