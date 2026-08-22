import TripWizard from "@/components/planner/TripWizard";

export default function PlanPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <TripWizard />
      </div>
    </div>
  );
}
