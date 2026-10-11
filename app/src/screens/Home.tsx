import type { Store } from "../types/schema";
import { todayIso, sundayOfWeek } from "../lib/format";
import { useNow } from "../lib/useNow";
import { NextMealWidget } from "./home/NextMealWidget";
import { ChecklistWidget } from "./home/ChecklistWidget";
import { NutritionBloomWidget } from "./home/NutritionBloomWidget";

function formatHeaderDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
  const day = d.getDate();
  const month = d.toLocaleDateString(undefined, { month: "short" });
  return `${weekday} ${day} ${month}`;
}

export function HomeScreen({ store, onNavigate }: { store: Store; onNavigate: (tab: "week" | "library" | "shopping") => void }) {
  const now = useNow();
  const today = todayIso();
  const weekStart = sundayOfWeek(today);

  return (
    <>
      <div class="home-header">
        <span class="home-header-label">
          {formatHeaderDate(today)} · Week of {formatHeaderDate(weekStart).replace(/^\w+ /, "")}
        </span>
        <button type="button" class="home-header-action" onClick={() => onNavigate("week")}>
          Plan week
        </button>
      </div>
      <div class="home-grid">
        <NextMealWidget store={store} now={now} onNavigate={onNavigate} />
        <ChecklistWidget store={store} now={now} onNavigate={onNavigate} />
        <NutritionBloomWidget store={store} now={now} />
      </div>
    </>
  );
}
