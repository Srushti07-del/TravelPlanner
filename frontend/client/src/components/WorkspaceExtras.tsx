/**
 * Stub component for workspace tab content.
 * Renders a placeholder for tabs that are not yet implemented.
 */
export function WorkspaceExtras({ tab }: { tab: string }) {
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
