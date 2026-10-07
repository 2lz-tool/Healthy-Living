import { useState } from "preact/hooks";
import type {
  PrepAction,
  Recipe,
  RecipeIngredient,
  RecipeSource,
  RecipeStep,
  Slot,
  Store,
} from "../../types/schema";
import { FieldRow, Group, List, TextField } from "../../components/UI";
import { IngredientPicker } from "./IngredientPicker";
import { upsertIngredient } from "../../state/actions";

const SLOTS: Slot[] = ["breakfast", "lunch", "dinner", "snack", "side"];
const PREP_KINDS: PrepAction["kind"][] = ["soak", "marinate", "thaw", "ferment", "grind", "other"];
const SOURCE_KINDS: RecipeSource["kind"][] = ["own", "youtube", "instagram", "web", "other"];

function newRecipeId(name: string, existing: Record<string, Recipe>): string {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "recipe";
  let id = base;
  let n = 2;
  while (existing[id]) id = `${base}-${n++}`;
  return id;
}

export function RecipeEditor({
  recipe,
  store,
  onSave,
  onCancel,
}: {
  recipe: Recipe | null; // null = creating a new one
  store: Store;
  onSave: (r: Recipe) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Recipe>(
    recipe ?? {
      id: "",
      familyId: null,
      name: "",
      axisValues: {},
      yieldServings: store.settings.householdSize,
      ingredients: [],
      steps: [],
      prepActions: [],
      shelfLifeDays: 1,
      freezable: false,
      slots: ["dinner"],
      activeMinutes: 20,
      source: { kind: "own" },
      status: "draft",
    },
  );

  const family = draft.familyId ? store.families[draft.familyId] : null;

  function set<K extends keyof Recipe>(key: K, value: Recipe[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function save() {
    const id = draft.id || newRecipeId(draft.name, store.recipes);
    onSave({ ...draft, id });
  }

  // ---------- ingredients ----------
  function updateIngredient(i: number, patch: Partial<RecipeIngredient>) {
    const ingredients = draft.ingredients.map((ri, idx) => (idx === i ? { ...ri, ...patch } : ri));
    set("ingredients", ingredients);
  }
  function addIngredient() {
    set("ingredients", [...draft.ingredients, { ingredientId: "", qty: 0, estimated: true }]);
  }
  function removeIngredient(i: number) {
    set("ingredients", draft.ingredients.filter((_, idx) => idx !== i));
  }

  // ---------- steps ----------
  function updateStep(i: number, patch: Partial<RecipeStep>) {
    set("steps", draft.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addStep() {
    set("steps", [...draft.steps, { id: `s${draft.steps.length + 1}`, text: "" }]);
  }
  function removeStep(i: number) {
    set("steps", draft.steps.filter((_, idx) => idx !== i));
  }

  // ---------- prep actions ----------
  function updatePrep(i: number, patch: Partial<PrepAction>) {
    set("prepActions", draft.prepActions.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function addPrep() {
    set("prepActions", [...draft.prepActions, { kind: "other", leadHours: 1, text: "" }]);
  }
  function removePrep(i: number) {
    set("prepActions", draft.prepActions.filter((_, idx) => idx !== i));
  }

  function toggleSlot(slot: Slot) {
    const has = draft.slots.includes(slot);
    set("slots", has ? draft.slots.filter((s) => s !== slot) : [...draft.slots, slot]);
  }

  return (
    <div>
      <Group header="Basics">
        <List>
          <FieldRow label="Name">
            <TextField value={draft.name} onCommit={(v) => set("name", v)} placeholder="Recipe name" />
          </FieldRow>
          <FieldRow label="Family">
            <select
              class="field-select"
              value={draft.familyId ?? ""}
              onChange={(e) => {
                const v = (e.target as HTMLSelectElement).value;
                set("familyId", v || null);
                set("axisValues", {});
              }}
            >
              <option value="">No family</option>
              {Object.values(store.families).map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </FieldRow>
          {family?.axes.map((axis) => (
            <FieldRow key={axis.key} label={axis.label}>
              <select
                class="field-select"
                value={draft.axisValues[axis.key] ?? ""}
                onChange={(e) =>
                  set("axisValues", { ...draft.axisValues, [axis.key]: (e.target as HTMLSelectElement).value })
                }
              >
                <option value="">—</option>
                {axis.options.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </FieldRow>
          ))}
          <FieldRow label="Yield (servings)">
            <TextField type="number" value={String(draft.yieldServings)} onCommit={(v) => set("yieldServings", parseFloat(v) || 1)} />
          </FieldRow>
          <FieldRow label="Status">
            <select class="field-select" value={draft.status} onChange={(e) => set("status", (e.target as HTMLSelectElement).value as Recipe["status"])}>
              <option value="draft">draft</option>
              <option value="verified">verified</option>
            </select>
          </FieldRow>
          <FieldRow label="Shelf life (days)">
            <TextField type="number" value={String(draft.shelfLifeDays)} onCommit={(v) => set("shelfLifeDays", parseFloat(v) || 0)} />
          </FieldRow>
          <FieldRow label="Freezable">
            <input type="checkbox" checked={draft.freezable} onChange={(e) => set("freezable", (e.target as HTMLInputElement).checked)} />
          </FieldRow>
          <FieldRow label="Active minutes">
            <TextField type="number" value={String(draft.activeMinutes)} onCommit={(v) => set("activeMinutes", parseFloat(v) || 0)} />
          </FieldRow>
          <FieldRow label="Source">
            <select class="field-select" value={draft.source.kind} onChange={(e) => set("source", { ...draft.source, kind: (e.target as HTMLSelectElement).value as RecipeSource["kind"] })}>
              {SOURCE_KINDS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </FieldRow>
        </List>
      </Group>

      <Group header="Slots">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "0 16px 18px" }}>
          {SLOTS.map((slot) => (
            <label key={slot} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={draft.slots.includes(slot)} onChange={() => toggleSlot(slot)} />
              {slot}
            </label>
          ))}
        </div>
      </Group>

      <Group header="Ingredients">
        <List>
          {draft.ingredients.map((ri, i) => (
            <div class="row" key={i} style={{ flexWrap: "wrap" }}>
              <div class="row-main">
                <IngredientPicker
                  store={store}
                  value={ri.ingredientId}
                  onChange={(id) => updateIngredient(i, { ingredientId: id })}
                  onCreate={upsertIngredient}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                  <TextField type="number" value={String(ri.qty)} onCommit={(v) => updateIngredient(i, { qty: parseFloat(v) || 0 })} />
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--label-2)" }}>
                    <input type="checkbox" checked={ri.estimated} onChange={(e) => updateIngredient(i, { estimated: (e.target as HTMLInputElement).checked })} />
                    estimated
                  </label>
                  <button type="button" class="field-go field-destructive" onClick={() => removeIngredient(i)}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <Row title="+ Add ingredient" onClick={addIngredient} />
        </List>
      </Group>

      <Group header="Method">
        <List>
          {draft.steps.map((step, i) => (
            <div class="row" key={step.id}>
              <div class="row-main" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ flex: 1 }}>
                  <TextField value={step.text} onCommit={(v) => updateStep(i, { text: v })} placeholder={`Step ${i + 1}`} />
                </span>
                <button type="button" class="field-go field-destructive" onClick={() => removeStep(i)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          <Row title="+ Add step" onClick={addStep} />
        </List>
      </Group>

      <Group header="Prep ahead">
        <List>
          {draft.prepActions.map((p, i) => (
            <div class="row" key={i} style={{ flexWrap: "wrap" }}>
              <div class="row-main">
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <select class="field-select" value={p.kind} onChange={(e) => updatePrep(i, { kind: (e.target as HTMLSelectElement).value as PrepAction["kind"] })}>
                    {PREP_KINDS.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                  <TextField type="number" value={String(p.leadHours)} onCommit={(v) => updatePrep(i, { leadHours: parseFloat(v) || 0 })} />
                  <span style={{ fontSize: 13, color: "var(--label-2)", alignSelf: "center" }}>h lead</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ flex: 1 }}>
                    <TextField value={p.text} onCommit={(v) => updatePrep(i, { text: v })} placeholder="What to do" />
                  </span>
                  <button type="button" class="field-go field-destructive" onClick={() => removePrep(i)}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <Row title="+ Add prep action" onClick={addPrep} />
        </List>
      </Group>

      <div style={{ display: "flex", gap: 12, padding: "4px 2px 24px" }}>
        <button type="button" class="field-go" onClick={save} disabled={!draft.name}>
          Save
        </button>
        <button type="button" class="field-go" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// Local Row to avoid importing the display-only one with chevron styling
// mismatched for an action row.
function Row({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <button type="button" class="row" onClick={onClick}>
      <div class="row-main">
        <div class="row-title" style={{ color: "var(--blue)" }}>{title}</div>
      </div>
    </button>
  );
}
