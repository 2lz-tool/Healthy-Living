import { useState } from "preact/hooks";
import type { Batch, BatchAssignment, Slot, Store } from "../../types/schema";
import { batchWarnings } from "../../derive";
import { FieldRow, List, Row, Segmented, Stepper, TextField } from "../../components/UI";

const SLOTS: Slot[] = ["breakfast", "lunch", "dinner", "snack", "side"];

function newBatchId(recipeId: string, existingIds: Set<string>): string {
  let n = 1;
  let id = `b-${recipeId}-${n}`;
  while (existingIds.has(id)) id = `b-${recipeId}-${++n}`;
  return id;
}

export function AddBatchSheet({
  store,
  weekStart,
  existingBatch,
  initialAssignment,
  onSave,
  onCancel,
}: {
  store: Store;
  weekStart: string;
  existingBatch: Batch | null;
  initialAssignment?: BatchAssignment;
  onSave: (batch: Batch) => void;
  onCancel: () => void;
}) {
  const [recipeId, setRecipeId] = useState(existingBatch?.recipeId ?? "");
  const [cookDate, setCookDate] = useState(existingBatch?.cookDate ?? initialAssignment?.date ?? weekStart);
  const [cookWhen, setCookWhen] = useState<"morning" | "evening">(existingBatch?.cookWhen ?? "evening");
  const [scale, setScale] = useState(existingBatch?.scale ?? 1);
  const [frozenPortions, setFrozenPortions] = useState(existingBatch?.frozenPortions ?? 0);
  const [assignments, setAssignments] = useState<BatchAssignment[]>(
    existingBatch?.assignments ?? (initialAssignment ? [initialAssignment] : []),
  );
  const [newDate, setNewDate] = useState(initialAssignment?.date ?? weekStart);
  const [newSlot, setNewSlot] = useState<Slot>(initialAssignment?.slot ?? "dinner");

  const recipe = recipeId ? store.recipes[recipeId] : null;

  const draftBatch: Batch = {
    id: existingBatch?.id ?? "draft",
    recipeId,
    cookDate,
    cookWhen,
    scale,
    frozenPortions,
    assignments,
  };
  const warnings = recipe ? batchWarnings(draftBatch, recipe, store.settings.householdSize) : [];

  function addAssignment() {
    if (assignments.some((a) => a.date === newDate && a.slot === newSlot)) return;
    setAssignments([...assignments, { date: newDate, slot: newSlot }]);
  }
  function removeAssignment(i: number) {
    setAssignments(assignments.filter((_, idx) => idx !== i));
  }

  if (!recipe) {
    return (
      <div>
        <div class="recipe-h">Pick a recipe</div>
        <List>
          {Object.values(store.recipes)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((r) => (
              <Row key={r.id} title={r.name} chevron onClick={() => setRecipeId(r.id)} />
            ))}
        </List>
      </div>
    );
  }

  return (
    <div>
      <div class="recipe-h">{recipe.name}</div>
      <List>
        <FieldRow label="Cook date">
          <input class="field-input" type="date" value={cookDate} onChange={(e) => setCookDate((e.target as HTMLInputElement).value)} />
        </FieldRow>
        <div class="row">
          <div class="row-main">
            <div class="row-title">When</div>
            <div style={{ marginTop: 8 }}>
              <Segmented
                ariaLabel="Cook when"
                value={cookWhen}
                onChange={setCookWhen}
                options={[{ value: "morning", label: "Morning" }, { value: "evening", label: "Evening" }]}
              />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="row-main">
            <div class="row-title">Scale</div>
            <div class="row-sub">Multiplier on the recipe's {recipe.yieldServings}-serving yield</div>
          </div>
          <Stepper label="scale" value={scale} min={1} max={10} onChange={setScale} />
        </div>
        <FieldRow label="Frozen portions">
          <TextField type="number" value={String(frozenPortions)} onCommit={(v) => setFrozenPortions(parseFloat(v) || 0)} />
        </FieldRow>
      </List>

      <div class="recipe-h" style={{ marginTop: 20 }}>Assigned meals</div>
      <List>
        {assignments.map((a, i) => (
          <Row key={i} title={`${a.date} — ${a.slot}`} value="Remove" onClick={() => removeAssignment(i)} />
        ))}
        <div class="row" style={{ flexWrap: "wrap" }}>
          <div class="row-main">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input class="field-input" type="date" value={newDate} onChange={(e) => setNewDate((e.target as HTMLInputElement).value)} />
              <select class="field-select" value={newSlot} onChange={(e) => setNewSlot((e.target as HTMLSelectElement).value as Slot)}>
                {SLOTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button type="button" class="field-go" onClick={addAssignment}>
                Add
              </button>
            </div>
          </div>
        </div>
      </List>

      {warnings.length > 0 && (
        <div class="note" style={{ marginTop: 16 }}>
          {warnings.map((w, i) => (
            <div key={i} style={{ color: w.level === "error" ? "var(--red)" : "var(--orange)", marginBottom: 4 }}>
              {w.message}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, padding: "20px 2px 24px" }}>
        <button
          type="button"
          class="field-go"
          disabled={assignments.length === 0 || warnings.some((w) => w.level === "error")}
          onClick={() => {
            const id = existingBatch?.id ?? newBatchId(recipeId, new Set(Object.values(store.weeks).flatMap((w) => w.batches.map((b) => b.id))));
            onSave({ id, recipeId, cookDate, cookWhen, scale, frozenPortions, assignments });
          }}
        >
          Save batch
        </button>
        <button type="button" class="field-go" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
