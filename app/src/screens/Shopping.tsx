import { useState } from "preact/hooks";
import type { Store } from "../types/schema";
import { groupByAisle, shoppingListForWeek } from "../derive";
import { Group, LargeTitle, List } from "../components/UI";
import { addDaysIso, sundayOfWeek, todayIso } from "../lib/format";
import { clearBought, toggleBoughtIngredient, toggleHaveIngredient } from "../state/actions";

const AISLE_LABEL: Record<string, string> = {
  produce: "Produce",
  meat_fish: "Meat & fish",
  dairy_eggs: "Dairy & eggs",
  grains: "Grains",
  legumes: "Legumes",
  spices: "Spices",
  oils: "Oils",
  frozen: "Frozen",
  other: "Other",
};

export function ShoppingScreen({ store }: { store: Store }) {
  const [weekStart, setWeekStart] = useState(sundayOfWeek(todayIso()));
  const week = store.weeks[weekStart];

  if (!week) {
    return (
      <div class="container">
        <LargeTitle title="Shopping" subtitle={`Week of ${weekStart}`} />
        <div class="row" style={{ background: "var(--card)", borderRadius: "var(--radius-lg)", marginBottom: 20 }}>
          <button type="button" class="field-go" onClick={() => setWeekStart(addDaysIso(weekStart, -7))}>
            &larr; Prev
          </button>
          <div class="row-main" />
          <button type="button" class="field-go" onClick={() => setWeekStart(addDaysIso(weekStart, 7))}>
            Next &rarr;
          </button>
        </div>
        <p class="group-footer">No plan for this week yet — nothing to shop for.</p>
      </div>
    );
  }

  const items = shoppingListForWeek(week, store.recipes, store.ingredients);
  const grouped = groupByAisle(items);
  const boughtCount = items.filter((i) => i.bought).length;

  return (
    <div class="container">
      <LargeTitle title="Shopping" subtitle={`${boughtCount} of ${items.length} bought — week of ${weekStart}`} />

      <div class="row" style={{ background: "var(--card)", borderRadius: "var(--radius-lg)", marginBottom: 20 }}>
        <button type="button" class="field-go" onClick={() => setWeekStart(addDaysIso(weekStart, -7))}>
          &larr; Prev
        </button>
        <div class="row-main" />
        <button type="button" class="field-go" onClick={() => setWeekStart(addDaysIso(weekStart, 7))}>
          Next &rarr;
        </button>
      </div>

      {Object.entries(grouped).map(([aisle, aisleItems]) => (
        <Group key={aisle} header={AISLE_LABEL[aisle] ?? aisle}>
          <List>
            {aisleItems!.map((item) => (
              <div key={item.ingredientId} class={"row" + (item.bought ? " done" : "")}>
                <button
                  type="button"
                  aria-pressed={item.bought}
                  aria-label={`Mark ${item.name} as bought`}
                  style={{ display: "contents" }}
                  onClick={() => toggleBoughtIngredient(weekStart, item.ingredientId)}
                >
                  <span class="check">&#10003;</span>
                  <div class="row-main">
                    <div class="row-title">{item.name}</div>
                  </div>
                  <span class="row-value">
                    {item.qty} {item.unit}
                  </span>
                </button>
                <button
                  type="button"
                  class="field-go"
                  style={{ fontSize: 12 }}
                  onClick={() => toggleHaveIngredient(weekStart, item.ingredientId)}
                >
                  Have it
                </button>
              </div>
            ))}
          </List>
        </Group>
      ))}

      {items.length === 0 && <p class="group-footer">Nothing left to buy — everything is already marked "have".</p>}

      {boughtCount > 0 && (
        <Group>
          <List>
            <button type="button" class="row" onClick={() => clearBought(weekStart)}>
              <div class="row-main">
                <div class="row-title field-destructive">Clear the basket</div>
              </div>
            </button>
          </List>
        </Group>
      )}
    </div>
  );
}
