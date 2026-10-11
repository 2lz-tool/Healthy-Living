import type { Store } from "../../types/schema";
import { nextMeal } from "../../derive/nextMeal";
import { notPlannedOptions } from "../../derive/notPlanned";
import { Tag } from "../../components/UI";
import { addDaysIso, formatTime12h, relativeDayLabel, SLOT_LABEL, sundayOfWeek, todayIso } from "../../lib/format";
import { assignLeftoverBatch, createQuickBatch, markBatchCooked, markBatchThawed, toggleEaten } from "../../state/actions";

export function NextMealWidget({
  store,
  now,
  onNavigate,
}: {
  store: Store;
  now: Date;
  onNavigate: (tab: "week" | "library") => void;
}) {
  const weeks = Object.values(store.weeks);
  const result = nextMeal(now, weeks, store.recipes, store.ingredients, store.settings, store.log);
  const today = todayIso();

  return (
    <div class="widget home-next-meal">
      <div class="widget-head">
        <span class="widget-title">Next meal</span>
      </div>
      {renderBody()}
    </div>
  );

  function renderBody() {
    if (result.state === "nothing_planned") {
      return (
        <>
          <p class="widget-empty">Nothing planned this week.</p>
          <button type="button" class="home-header-action" onClick={() => onNavigate("week")}>
            Plan week
          </button>
        </>
      );
    }

    const label = `${SLOT_LABEL[result.slot]} · ${formatTime12h(store.settings.slotTimes[result.slot])}`;

    if (result.state === "not_planned") {
      const options = notPlannedOptions(result.date, result.slot, weeks, store.recipes);
      return (
        <>
          <div class="row-title">{`${SLOT_LABEL[result.slot]} ${relativeDayLabel(result.date, today)} isn't planned`}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {options.map((opt, i) => {
              if (opt.kind === "leftover") {
                return (
                  <button
                    key={i}
                    type="button"
                    class="field-go"
                    style={{ textAlign: "left" }}
                    onClick={() => assignLeftoverBatch(opt.weekId, opt.batchId, result.date, result.slot)}
                  >
                    {opt.recipeName} · {opt.portionsLeft} portion{opt.portionsLeft === 1 ? "" : "s"} left
                    {opt.shelfLifeEndsIso ? ` · good till ${relativeDayLabel(opt.shelfLifeEndsIso, today)}` : ""}
                  </button>
                );
              }
              if (opt.kind === "from_library") {
                const weekId = weekIdForDate(store, result.date);
                return (
                  <button
                    key={i}
                    type="button"
                    class="field-go"
                    style={{ textAlign: "left" }}
                    onClick={() => createQuickBatch(weekId, opt.recipeId, result.date, result.slot)}
                  >
                    {opt.recipeName} · {opt.activeMinutes} min
                  </button>
                );
              }
              return (
                <button key={i} type="button" class="field-go" style={{ textAlign: "left" }} onClick={() => onNavigate("week")}>
                  Plan it properly
                </button>
              );
            })}
          </div>
        </>
      );
    }

    if (result.state === "thaw") {
      return (
        <div class="hero-card">
          <div class="row-title">{label}</div>
          <div class="row-sub" style={{ marginTop: 4 }}>
            Move {result.recipeName} from the freezer now
          </div>
          <button
            type="button"
            class="hero-action"
            style={{ marginTop: 12 }}
            onClick={() => markBatchThawed(result.weekId, result.batchId, store.settings.householdSize)}
          >
            Mark thawed
          </button>
        </div>
      );
    }

    if (result.state === "cook_first") {
      return (
        <div class="hero-card">
          <div class="row-title">{`${label} · ${result.recipeName}`}</div>
          <div class="row-sub" style={{ marginTop: 4 }}>
            Cook first · {result.activeMinutes} min active
          </div>
          {result.pendingPrepActions.length > 0 && (
            <ul style={{ margin: "10px 0 0", padding: 0, listStyle: "none" }}>
              {result.pendingPrepActions.map((p, i) => (
                <li key={i} class={"row-sub" + (p.overdue ? " overdue" : "")} style={{ fontSize: 13, marginTop: 4 }}>
                  {p.overdue ? `${p.text} — should have started already` : p.text}
                </li>
              ))}
            </ul>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button type="button" class="hero-action" onClick={() => onNavigate("library")}>
              Open recipe
            </button>
            <button type="button" class="hero-action" onClick={() => markBatchCooked(result.weekId, result.batchId)}>
              Mark cooked
            </button>
          </div>
        </div>
      );
    }

    // ready
    return (
      <div class="hero-card">
        <div class="row-title">{`${label} · ${result.recipeName}`}</div>
        <div class="row-sub" style={{ marginTop: 4 }}>
          Ready · reheat
          {result.estimated && (
            <span style={{ marginLeft: 6 }}>
              <Tag kind="estimated">est.</Tag>
            </span>
          )}
        </div>
        <div class="row-sub" style={{ marginTop: 2 }}>
          {Math.round(result.kcalPerPerson)} kcal · {Math.round(result.proteinPerPerson)} g protein / person
        </div>
        <button type="button" class="hero-action" style={{ marginTop: 12 }} onClick={() => toggleEaten(result.date, result.slot, result.batchId)}>
          Mark eaten
        </button>
        {result.then && (
          <div class="row-sub" style={{ marginTop: 14 }}>
            Then: {SLOT_LABEL[result.then.slot]}
            {result.then.recipeName ? ` · ${result.then.recipeName}` : ""} · {thenStateLabel(result.then.state)}
          </div>
        )}
      </div>
    );
  }
}

function thenStateLabel(state: string): string {
  switch (state) {
    case "ready":
      return "ready";
    case "cook_first":
      return "needs cooking";
    case "thaw":
      return "move from freezer";
    case "not_planned":
      return "not planned";
    default:
      return state;
  }
}

/** The week a date belongs to: an existing week whose span covers it, or
 * else that date's own Sunday-starting week id. */
function weekIdForDate(store: Store, date: string): string {
  const existing = Object.values(store.weeks).find((w) => date >= w.id && date < addDaysIso(w.id, 7));
  return existing ? existing.id : sundayOfWeek(date);
}
