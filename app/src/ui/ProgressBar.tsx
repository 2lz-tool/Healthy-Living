/** DASHBOARD-POLISH-HANDOFF.md 3.6. 4px tall, radius-full, track separator. */
export function ProgressBar({ value, total, color = "var(--accent)" }: { value: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;
  return (
    <div class="ui-progressbar">
      <i style={{ width: `${pct * 100}%`, background: color }} />
    </div>
  );
}
