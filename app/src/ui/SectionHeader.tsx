/** DASHBOARD-POLISH-HANDOFF.md 3.6, fix #24. Sticky inside a scroll area. */
export function SectionHeader({ label, count, warn }: { label: string; count?: number; warn?: boolean }) {
  return (
    <div class="ui-section-header">
      <span class={"text-eyebrow" + (warn ? " warn" : "")}>{label}</span>
      {count != null && <span class="text-caption ui-section-header-count">{count}</span>}
    </div>
  );
}
