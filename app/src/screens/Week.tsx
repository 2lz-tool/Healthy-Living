import { useState } from "preact/hooks";
import type { Batch, BatchAssignment, Slot, Store } from "../types/schema";
import { dayBalanceChecks, dayTotalsForDate } from "../derive";
import { BalanceStrip, Group, LargeTitle, List, Row, Sheet, Tag } from "../components/UI";
import { AddBatchSheet } from "./week/AddBatchSheet";
import { addDaysIso, DOW_LABEL, formatKcal, sundayOfWeek, todayIso } from "../lib/format";
import { copyWeek, removeBatch, upsertBatch } from "../state/actions";

const SLOTS: Slot[] = ["breakfast", "lunch", "dinner", "snack", "side"];
const DOW_KEYS: ("sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat")[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

type SheetState =
  | { kind: "none" }
  | { kind: "add"; initial?: BatchAssignment }
  | { kind: "batch"; weekId: string; batch: Batch };

export function WeekScreen({ store }: { store: Store }) {
  const [weekStart, setWeekStart] = useState(sundayOfWeek(store.weeks[Object.keys(store.weeks)[0]]?.id ?? todayIso()));
  const [sheet, setSheet] = useState<SheetState>({ kind: "none" });

  const week = store.weeks[weekStart];
  const allWeeks = Object.values(store.weeks);
  const today = todayIso();

  function findAssignments(date: string, slot: Slot): { weekId: string; batch: Batch }[] {
    const found: { weekId: string; batch: Batch }[] = [];
    for (const w of allWeeks) {
      for (const b of w.batches) {
        if (b.assignments.some((a) => a.date === date && a.slot === slot)) {
          found.push({ weekId: w.id, batch: b });
        }
      }
    }
    return found;
  }

  function saveBatch(batch: Batch) {
    upsertBatch(weekStart, batch);
    setSheet({ kind: "none" });
  }

  function removeOneAssignment(weekId: string, batch: Batch, date: string, slot: Slot) {
    const remaining = batch.assignments.filter((a) => !(a.date === date && a.slot === slot));
    if (remaining.length === 0) {
      removeBatch(weekId, batch.id);
    } else {
      upsertBatch(weekId, { ...batch, assignments: remaining });
    }
    setSheet({ kind: "none" });
  }

  return (
    <div class="container">
      <LargeTitle title="Week" subtitle="Sunday start. Prep days are highlighted." />

      <div class="row" style={{ background: "var(--card)", borderRadius: "var(--radius-lg)", marginBottom: 20 }}>
        <button type="button" class="field-go" onClick={() => setWeekStart(addDaysIso(weekStart, -7))}>
          &larr; Prev
        </button>
        <div class="row-main" style={{ textAlign: "center" }}>
          <div class="row-title">Week of {weekStart}</div>
        </div>
        <button type="button" class="field-go" onClick={() => setWeekStart(addDaysIso(weekStart, 7))}>
          Next &rarr;
        </button>
      </div>

      {!week && (
        <div class="note" style={{ marginBottom: 20 }}>
          No plan yet for this week.
          {allWeeks.length > 0 && (
            <>
              {" "}
              <button
                type="button"
                class="field-go"
                onClick={() => copyWeek(allWeeks[allWeeks.length - 1].id, weekStart)}
              >
                Copy last week as a starting point
              </button>
            </>
          )}
        </div>
      )}

      {DOW_KEYS.map((dowKey, i) => {
        const date = addDaysIso(weekStart, i);
        const isPrepDay = store.settings.prepDays.includes(dowKey);
        const dayTotals = dayTotalsForDate(date, allWeeks, store.recipes, store.ingredients);
        const balance = dayBalanceChecks(dayTotals, DOW_LABEL[dowKey], store.settings);

        return (
          <Group key={date}>
            <div class="day-head">
              <div>
                <span class="day-name">{DOW_LABEL[dowKey]}</span>
                {date === today && <span class="today-dot" aria-label="Today" />}
                {isPrepDay && <Tag kind="warn">prep day</Tag>}
              </div>
              <span class="day-meta">{formatKcal(dayTotals.totals.kcal)}</span>
            </div>
            <BalanceStrip results={balance.filter((b) => b.level === "warn")} />
            <List>
              {SLOTS.map((slot) => {
                const matches = findAssignments(date, slot);
                if (matches.length === 0) {
                  return (
                    <Row
                      key={slot}
                      title={`${slot[0].toUpperCase()}${slot.slice(1)}`}
                      value="Add"
                      onClick={() => setSheet({ kind: "add", initial: { date, slot } })}
                    />
                  );
                }
                return (
                  <div key={slot}>
                    {matches.map(({ weekId, batch }) => {
                      const recipe = store.recipes[batch.recipeId];
                      return (
                        <Row
                          key={batch.id}
                          title={`${slot[0].toUpperCase()}${slot.slice(1)}: ${recipe?.name ?? batch.recipeId}`}
                          sub={recipe?.status === "draft" ? "Draft recipe" : undefined}
                          chevron
                          onClick={() => setSheet({ kind: "batch", weekId, batch })}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </List>
          </Group>
        );
      })}

      <Sheet
        open={sheet.kind === "add"}
        title="Add batch"
        onClose={() => setSheet({ kind: "none" })}
      >
        {sheet.kind === "add" && (
          <AddBatchSheet
            store={store}
            weekStart={weekStart}
            existingBatch={null}
            initialAssignment={sheet.initial}
            onSave={saveBatch}
            onCancel={() => setSheet({ kind: "none" })}
          />
        )}
      </Sheet>

      <Sheet
        open={sheet.kind === "batch"}
        title={sheet.kind === "batch" ? store.recipes[sheet.batch.recipeId]?.name ?? "Batch" : ""}
        onClose={() => setSheet({ kind: "none" })}
      >
        {sheet.kind === "batch" && (
          <BatchDetail
            store={store}
            weekId={sheet.weekId}
            batch={sheet.batch}
            onRemoveAssignment={(date, slot) => removeOneAssignment(sheet.weekId, sheet.batch, date, slot)}
            onRemoveBatch={() => {
              removeBatch(sheet.weekId, sheet.batch.id);
              setSheet({ kind: "none" });
            }}
            onEdit={(updated) => saveBatch(updated)}
          />
        )}
      </Sheet>
    </div>
  );
}

function BatchDetail({
  store,
  weekId,
  batch,
  onRemoveAssignment,
  onRemoveBatch,
  onEdit,
}: {
  store: Store;
  weekId: string;
  batch: Batch;
  onRemoveAssignment: (date: string, slot: Slot) => void;
  onRemoveBatch: () => void;
  onEdit: (b: Batch) => void;
}) {
  const [editing, setEditing] = useState(false);
  const recipe = store.recipes[batch.recipeId];

  if (editing) {
    return (
      <AddBatchSheet
        store={store}
        weekStart={weekId}
        existingBatch={batch}
        onSave={onEdit}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div>
      <p class="recipe-meta">
        Cooked {batch.cookWhen} of {batch.cookDate}, scale &times;{batch.scale}
        {batch.frozenPortions > 0 && `, ${batch.frozenPortions} portions frozen`}.
      </p>
      <div class="recipe-h">Covers</div>
      <List>
        {batch.assignments.map((a, i) => (
          <Row key={i} title={`${a.date} — ${a.slot}`} value="Remove" onClick={() => onRemoveAssignment(a.date, a.slot)} />
        ))}
      </List>
      <div style={{ display: "flex", gap: 12, padding: "20px 2px 24px" }}>
        <button type="button" class="field-go" onClick={() => setEditing(true)}>
          Edit batch
        </button>
        <button type="button" class="field-go field-destructive" onClick={onRemoveBatch}>
          Remove whole batch
        </button>
      </div>
      {!recipe && <p class="group-footer">Recipe no longer in the library.</p>}
    </div>
  );
}
