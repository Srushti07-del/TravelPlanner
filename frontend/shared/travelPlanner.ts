export type PlannerPreferences = {
  destination: string;
  dates: string;
  budget: string;
  travelers: string;
  interests: string[];
  stay: string;
  transport: string;
};

export type Activity = { title: string; type: string; cost: string };

export function advancePlanner(preferences: PlannerPreferences, field: keyof PlannerPreferences, value: string | string[]) {
  return { ...preferences, [field]: value };
}

export function applyWeatherAlternative(activities: Activity[], weather: "rain" | "clear") {
  if (weather !== "rain") return activities;
  return [{ title: "Ceramics studio in Amalfi", type: "Indoor experience", cost: "$24" }, ...activities.slice(1)];
}

export function editActivity(activities: Activity[], index: number) {
  return activities.map((activity, i) => i === index ? { ...activity, title: activity.title.startsWith("A quieter") ? activity.title.slice(10) : `A quieter ${activity.title.toLowerCase()}` } : activity);
}
