export type BloomPetalStatus = "ok" | "warn" | "over";

export type BloomPetal = {
  key: string;
  label: string;
  /** actual / ideal, already clamped by the caller for display. */
  ratio: number;
  /** (actual + rest-of-range-planned) / ideal, already clamped. */
  projectedRatio: number;
  status: BloomPetalStatus;
  /** Text equivalent for the accessible table, e.g. "312 of 380 g, 82%". */
  valueText: string;
};

const STATUS_COLOR: Record<BloomPetalStatus, string> = {
  ok: "var(--green)",
  warn: "var(--orange)",
  over: "var(--red)",
};

/** Within-tolerance band shown under the ideal circle — matches the 15%
 * "under" threshold the colour classification itself uses (derive/
 * nutritionBloom.ts), so the ring and the colour agree. */
const TOLERANCE_LOW = 0.85;

function polar(cx: number, cy: number, angle: number, r: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function petalPath(cx: number, cy: number, angle: number, radius: number, halfAngle: number): string {
  const tip = polar(cx, cy, angle, radius);
  const c1 = polar(cx, cy, angle - halfAngle, radius * 0.55);
  const c2 = polar(cx, cy, angle + halfAngle, radius * 0.55);
  return `M ${cx} ${cy} Q ${c1.x} ${c1.y} ${tip.x} ${tip.y} Q ${c2.x} ${c2.y} ${cx} ${cy} Z`;
}

const MAX_RATIO = 1.6;

/** DASHBOARD-POLISH-HANDOFF.md 3.6, fixes #12 and #13. Sizes 240 (dashboard)
 * and 96 (recipe detail, labels hidden). Purely presentational — ratios
 * and status are computed by the caller from the actual nutrition data. */
export function Bloom({
  petals,
  size = 240,
  showTable = true,
  ariaLabel,
}: {
  petals: BloomPetal[];
  size?: number;
  showTable?: boolean;
  ariaLabel: string;
}) {
  const showLabels = size > 96;
  const cx = size / 2;
  const cy = size / 2;
  const margin = showLabels ? 36 : 10;
  const idealRadius = size / 2 - margin;
  const n = petals.length;
  const halfAngle = ((2 * Math.PI) / n / 2) * 0.8;

  return (
    <div class="ui-bloom">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={ariaLabel}>
        {/* ideal: one true circle at radius 1.0, plus its tolerance band */}
        <circle cx={cx} cy={cy} r={idealRadius} fill="none" stroke="var(--label-3)" stroke-width="1" />
        <circle
          cx={cx}
          cy={cy}
          r={(idealRadius + idealRadius * TOLERANCE_LOW) / 2}
          fill="none"
          stroke="var(--label-3)"
          stroke-opacity="0.1"
          stroke-width={idealRadius * (1 - TOLERANCE_LOW)}
        />

        {petals.map((p, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
          const r = Math.min(p.projectedRatio, MAX_RATIO) * idealRadius;
          return (
            <path
              key={`projected-${p.key}`}
              class="ui-bloom-projected"
              d={petalPath(cx, cy, angle, r, halfAngle)}
              fill="none"
              stroke="var(--label-2)"
              stroke-width="1.5"
              stroke-dasharray="3 3"
            />
          );
        })}

        {petals.map((p, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
          const r = Math.min(p.ratio, MAX_RATIO) * idealRadius;
          return (
            <path
              key={`actual-${p.key}`}
              class="ui-bloom-actual"
              d={petalPath(cx, cy, angle, r, halfAngle)}
              fill={STATUS_COLOR[p.status]}
              fill-opacity="0.8"
              style={{ animationDelay: `${i * 30}ms` }}
            />
          );
        })}

        {showLabels &&
          petals.map((p, i) => {
            const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
            const pt = polar(cx, cy, angle, idealRadius + 16);
            const cos = Math.cos(angle);
            const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
            return (
              <text key={`label-${p.key}`} x={pt.x} y={pt.y} class="ui-bloom-label" text-anchor={anchor} dominant-baseline="middle">
                {p.label}
              </text>
            );
          })}
      </svg>

      {showTable && (
        <div class="ui-bloom-table">
          {petals.map((p) => (
            <div key={p.key} class="ui-bloom-table-row">
              <span class="ui-bloom-table-dot" style={{ background: STATUS_COLOR[p.status] }} />
              <span class="text-callout ui-bloom-table-label">{p.label}</span>
              <span class="text-callout text-tabular ui-bloom-table-value">{p.valueText}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
