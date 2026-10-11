import { useState } from "preact/hooks";
import type { Petal } from "../../derive/nutritionBloom";
import type { Store } from "../../types/schema";
import { nutritionBloom } from "../../derive/nutritionBloom";
import { Segmented, Tag } from "../../components/UI";

const CX = 110;
const CY = 110;
const IDEAL_RADIUS = 70;
const MAX_RATIO = 1.6; // clamps a very-over petal so the shape stays legible
const COLOUR: Record<Petal["colour"], string> = { ok: "var(--green)", warn: "var(--orange)", over: "var(--red)" };

function polar(angle: number, r: number) {
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

function petalPath(angle: number, radius: number, halfAngle: number): string {
  const tip = polar(angle, radius);
  const c1 = polar(angle - halfAngle, radius * 0.55);
  const c2 = polar(angle + halfAngle, radius * 0.55);
  return `M ${CX} ${CY} Q ${c1.x} ${c1.y} ${tip.x} ${tip.y} Q ${c2.x} ${c2.y} ${CX} ${CY} Z`;
}

function formatValue(p: Petal): string {
  const v = p.unit === "servings" ? p.actual.toFixed(1) : Math.round(p.actual).toString();
  const ideal = p.unit === "servings" ? p.ideal.toFixed(1) : Math.round(p.ideal).toString();
  return `${v} of ${ideal} ${p.unit}`;
}

export function NutritionBloomWidget({ store, now }: { store: Store; now: Date }) {
  const [range, setRange] = useState<"week" | "today">("week");
  const weeks = Object.values(store.weeks);
  const bloom = nutritionBloom(now, range, weeks, store.recipes, store.ingredients, store.log, store.settings);

  const n = bloom.petals.length;
  const halfAngle = ((2 * Math.PI) / n / 2) * 0.8;

  return (
    <div class="widget home-nutrition">
      <div class="widget-head">
        <span class="widget-title">Nutrition</span>
        <Segmented
          ariaLabel="Range"
          value={range}
          onChange={setRange}
          options={[{ value: "week", label: "This week" }, { value: "today", label: "Today" }]}
        />
      </div>

      <svg viewBox="0 0 220 220" width="220" height="220" role="img" aria-label={`Nutrition balance, ${range === "week" ? "this week" : "today"}`}>
        {bloom.petals.map((p, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
          return <path key={`ideal-${p.key}`} d={petalPath(angle, IDEAL_RADIUS, halfAngle)} fill="none" stroke="var(--label-3)" stroke-width="1" />;
        })}
        {bloom.petals.map((p, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
          const r = Math.min(p.projected / p.ideal, MAX_RATIO) * IDEAL_RADIUS;
          return (
            <path
              key={`projected-${p.key}`}
              class="bloom-petal-projected"
              d={petalPath(angle, r, halfAngle)}
              fill="none"
              stroke="var(--label-2)"
              stroke-width="1.5"
              stroke-dasharray="3 3"
            />
          );
        })}
        {bloom.petals.map((p, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
          const r = Math.min(p.actual / p.ideal, MAX_RATIO) * IDEAL_RADIUS;
          return (
            <path
              key={`actual-${p.key}`}
              class="bloom-petal-actual"
              d={petalPath(angle, r, halfAngle)}
              fill={COLOUR[p.colour]}
              fill-opacity="0.78"
              style={{ animationDelay: `${i * 30}ms` }}
            />
          );
        })}
        {bloom.petals.map((p, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
          const labelPt = polar(angle, IDEAL_RADIUS + 16);
          const anchor = Math.cos(angle) > 0.3 ? "start" : Math.cos(angle) < -0.3 ? "end" : "middle";
          return (
            <text key={`label-${p.key}`} x={labelPt.x} y={labelPt.y} font-size="9" fill="var(--label-2)" text-anchor={anchor} dominant-baseline="middle">
              {p.label}
            </text>
          );
        })}
      </svg>

      <div class="bloom-legend">
        <span>
          <span class="bloom-legend-dot" style={{ background: "var(--green)" }} />
          On target
        </span>
        <span>
          <span class="bloom-legend-dot" style={{ background: "var(--orange)" }} />
          Under
        </span>
        <span>
          <span class="bloom-legend-dot" style={{ background: "var(--red)" }} />
          Over
        </span>
        <span style={{ marginLeft: "auto" }}>┄ projected</span>
      </div>

      <p class="row-sub" style={{ marginTop: 10 }}>
        {bloom.gapMessage}
      </p>

      <div class="bloom-table">
        {bloom.petals.map((p) => (
          <div key={p.key} class="bloom-table-row">
            <span>
              {p.label}
              {p.estimated && (
                <span style={{ marginLeft: 6 }}>
                  <Tag kind="estimated">est.</Tag>
                </span>
              )}
            </span>
            <span class="row-value">
              {formatValue(p)} · {p.ideal > 0 ? Math.round((p.actual / p.ideal) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
