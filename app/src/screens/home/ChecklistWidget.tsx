import type { ChecklistItem } from "../../derive/shoppingChecklist";
import type { Store } from "../../types/schema";
import { shoppingChecklist } from "../../derive/shoppingChecklist";
import { formatQty } from "../../lib/format";
import { markHaveAcrossWeeks, toggleBoughtAcrossWeeks } from "../../state/actions";

const DOW_SHORT = ["S", "M", "T", "W", "T", "F", "S"] as const;
const DOW_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function WeekStrip({ today, nextShop, shoppingDays }: { today: string; nextShop: string; shoppingDays: string[] }) {
  const sunday = new Date(today + "T00:00:00");
  sunday.setDate(sunday.getDate() - sunday.getDay());
  return (
    <div style={{ display: "flex", gap: 6, margin: "6px 0 14px" }}>
      {DOW_KEYS.map((dow, i) => {
        const d = new Date(sunday);
        d.setDate(d.getDate() + i);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const isShoppingDay = shoppingDays.includes(dow);
        const isToday = iso === today;
        const isNextShop = iso === nextShop;
        return (
          <div
            key={dow}
            title={DOW_SHORT[i]}
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 600,
              background: isShoppingDay ? "var(--blue)" : "var(--fill)",
              color: isShoppingDay ? "#fff" : "var(--label-2)",
              outline: isToday ? "2px solid var(--label)" : isNextShop ? "2px solid var(--orange)" : "none",
              outlineOffset: 2,
            }}
          >
            {DOW_SHORT[i]}
          </div>
        );
      })}
    </div>
  );
}

function ItemRow({ item }: { item: ChecklistItem }) {
  return (
    <div class={"row" + (item.bought ? " done" : "")} style={{ flexWrap: "wrap" }}>
      <button
        type="button"
        aria-pressed={item.bought}
        aria-label={`Mark ${item.name} as bought`}
        style={{ display: "contents" }}
        onClick={() => toggleBoughtAcrossWeeks(item.weekIds, item.ingredientId)}
      >
        <span class="check">&#10003;</span>
        <div class="row-main">
          <div class="row-title">{item.name}</div>
          {item.neededFor.length > 0 && (
            <div class="row-sub">{item.neededFor.map((n) => `${n.date.slice(5)} ${n.slot}`).join(", ")}</div>
          )}
        </div>
        <span class="row-value">{formatQty(item.qty, item.unit)}</span>
      </button>
      <button
        type="button"
        class="field-go"
        style={{ fontSize: 12, minHeight: 28, marginLeft: 36 }}
        onClick={() => markHaveAcrossWeeks(item.weekIds, item.ingredientId)}
      >
        Have it
      </button>
    </div>
  );
}

export function ChecklistWidget({
  store,
  now,
  onNavigate,
}: {
  store: Store;
  now: Date;
  onNavigate: (tab: "shopping") => void;
}) {
  const weeks = Object.values(store.weeks);
  const checklist = shoppingChecklist(now, weeks, store.recipes, store.ingredients, store.settings);
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const allItems = [...checklist.shortBefore, ...checklist.buyOnNextShop];
  const boughtCount = allItems.filter((i) => i.bought).length;

  return (
    <div class="widget home-checklist">
      <div class="widget-head">
        <span class="widget-title">Shop by {checklist.nextShop.slice(5)}</span>
        <button type="button" class="widget-link" onClick={() => onNavigate("shopping")}>
          Full list
        </button>
      </div>

      <WeekStrip today={today} nextShop={checklist.nextShop} shoppingDays={store.settings.shoppingDays} />

      {!checklist.hasAnyPlan && <p class="widget-empty">Plan the week to see what to buy.</p>}

      {checklist.hasAnyPlan && allItems.length === 0 && (
        <p class="widget-empty">Nothing to buy until {checklist.nextShop.slice(5)}.</p>
      )}

      <div class="checklist-scroll">
        {checklist.shortBefore.length > 0 && (
          <>
            <div class="group-header" style={{ color: "var(--orange)" }}>
              Short before {checklist.nextShop.slice(5)}
            </div>
            <div class="list" style={{ marginBottom: 16 }}>
              {checklist.shortBefore.map((item) => (
                <ItemRow key={item.ingredientId} item={item} />
              ))}
            </div>
          </>
        )}

        {checklist.buyOnNextShop.length > 0 && (
          <>
            <div class="group-header">Buy on {checklist.nextShop.slice(5)}</div>
            <div class="list">
              {checklist.buyOnNextShop.map((item) => (
                <ItemRow key={item.ingredientId} item={item} />
              ))}
            </div>
          </>
        )}
      </div>

      {allItems.length > 0 && (
        <p class="group-footer">
          {boughtCount} of {allItems.length} bought
        </p>
      )}
    </div>
  );
}
