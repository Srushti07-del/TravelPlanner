import { describe, expect, it } from "vitest";
import { advancePlanner, applyWeatherAlternative, editActivity, type Activity, type PlannerPreferences } from "../shared/travelPlanner";

const preferences: PlannerPreferences = {
  destination: "Amalfi Coast",
  dates: "Sep 14 – 21",
  budget: "$3,000 – $4,000",
  travelers: "2 travelers",
  interests: ["food", "coast"],
  stay: "Boutique stay",
  transport: "Walk + local rail",
};

const activities: Activity[] = [
  { title: "Sunrise viewpoint", type: "Scenic walk", cost: "$0" },
  { title: "Ferry to Amalfi", type: "Transport", cost: "$18" },
];

describe("travel planner helpers", () => {
  it("advances a conversational preference without dropping prior answers", () => {
    const next = advancePlanner(preferences, "travelers", "4 travelers");
    expect(next.destination).toBe("Amalfi Coast");
    expect(next.travelers).toBe("4 travelers");
  });

  it("applies a weather-aware indoor alternative while preserving the rest of the day", () => {
    const updated = applyWeatherAlternative(activities, "rain");
    expect(updated[0]?.title).toBe("Ceramics studio in Amalfi");
    expect(updated[1]?.title).toBe("Ferry to Amalfi");
    expect(applyWeatherAlternative(activities, "clear")).toEqual(activities);
  });

  it("edits one itinerary activity immutably", () => {
    const updated = editActivity(activities, 1);
    expect(updated[0]).toEqual(activities[0]);
    expect(updated[1]?.title).toBe("A quieter ferry to amalfi");
    expect(activities[1]?.title).toBe("Ferry to Amalfi");
  });
});
