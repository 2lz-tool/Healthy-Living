/** DASHBOARD-POLISH-HANDOFF.md 3.6. 24px, stroke 3, track separator. The
 * count stays as the accessible label — the ring is a visual summary. */
export function ProgressRing({
  value,
  total,
  color = "var(--accent)",
  label,
}: {
  value: number;
  total: number;
  color?: string;
  label: string;
}) {
  const r = 9;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(1, value / total) : 0;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" role="img" aria-label={label}>
      <circle cx="12" cy="12" r={r} fill="none" stroke="var(--separator)" stroke-width="3" />
      {pct > 0 && (
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke={color}
          stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray={c}
          stroke-dashoffset={c * (1 - pct)}
          transform="rotate(-90 12 12)"
        />
      )}
    </svg>
  );
}
