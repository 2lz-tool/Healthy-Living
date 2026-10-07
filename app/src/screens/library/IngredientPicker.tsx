import { useState } from "preact/hooks";
import type { Aisle, Ingredient, ProteinSource, Store, Unit } from "../../types/schema";
import { FieldRow, TextField } from "../../components/UI";

const AISLES: Aisle[] = ["produce", "meat_fish", "dairy_eggs", "grains", "legumes", "spices", "oils", "frozen", "other"];
const UNITS: Unit[] = ["g", "ml", "piece"];
const PROTEIN_SOURCES: (ProteinSource | "")[] = ["", "chicken", "fish", "egg", "legume", "dairy", "red_meat"];

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "ingredient";
}

/** A <select> of every ingredient in the library, plus an inline form to
 * create a new one on the spot — spec section 5: "an ingredient picker
 * that can create a new ingredient inline." */
export function IngredientPicker({
  store,
  value,
  onChange,
  onCreate,
}: {
  store: Store;
  value: string;
  onChange: (ingredientId: string) => void;
  onCreate: (ingredient: Ingredient) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Ingredient>({
    id: "",
    name: "",
    aisle: "other",
    unit: "g",
    per100g: { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
    estimated: true,
  });

  const options = Object.values(store.ingredients).sort((a, b) => a.name.localeCompare(b.name));

  if (creating) {
    const id = draft.name ? slugify(draft.name) : "";
    const collides = id && store.ingredients[id];
    return (
      <div class="list" style={{ marginBottom: 12 }}>
        <FieldRow label="Name">
          <TextField value={draft.name} onCommit={(name) => setDraft({ ...draft, name })} placeholder="e.g. Paneer" />
        </FieldRow>
        <FieldRow label="Aisle">
          <select
            class="field-select"
            value={draft.aisle}
            onChange={(e) => setDraft({ ...draft, aisle: (e.target as HTMLSelectElement).value as Aisle })}
          >
            {AISLES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="Unit">
          <select
            class="field-select"
            value={draft.unit}
            onChange={(e) => setDraft({ ...draft, unit: (e.target as HTMLSelectElement).value as Unit })}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </FieldRow>
        {draft.unit === "piece" && (
          <FieldRow label="Grams per piece">
            <TextField
              type="number"
              value={String(draft.gramsPerPiece ?? "")}
              onCommit={(v) => setDraft({ ...draft, gramsPerPiece: parseFloat(v) || undefined })}
            />
          </FieldRow>
        )}
        <FieldRow label="kcal / 100g">
          <TextField type="number" value={String(draft.per100g.kcal)} onCommit={(v) => setDraft({ ...draft, per100g: { ...draft.per100g, kcal: parseFloat(v) || 0 } })} />
        </FieldRow>
        <FieldRow label="Protein / 100g">
          <TextField type="number" value={String(draft.per100g.protein)} onCommit={(v) => setDraft({ ...draft, per100g: { ...draft.per100g, protein: parseFloat(v) || 0 } })} />
        </FieldRow>
        <FieldRow label="Carbs / 100g">
          <TextField type="number" value={String(draft.per100g.carbs)} onCommit={(v) => setDraft({ ...draft, per100g: { ...draft.per100g, carbs: parseFloat(v) || 0 } })} />
        </FieldRow>
        <FieldRow label="Fat / 100g">
          <TextField type="number" value={String(draft.per100g.fat)} onCommit={(v) => setDraft({ ...draft, per100g: { ...draft.per100g, fat: parseFloat(v) || 0 } })} />
        </FieldRow>
        <FieldRow label="Fibre / 100g">
          <TextField type="number" value={String(draft.per100g.fibre)} onCommit={(v) => setDraft({ ...draft, per100g: { ...draft.per100g, fibre: parseFloat(v) || 0 } })} />
        </FieldRow>
        <FieldRow label="Protein source">
          <select
            class="field-select"
            value={draft.proteinSource ?? ""}
            onChange={(e) => setDraft({ ...draft, proteinSource: ((e.target as HTMLSelectElement).value || undefined) as ProteinSource | undefined })}
          >
            {PROTEIN_SOURCES.map((p) => (
              <option key={p} value={p}>{p || "none"}</option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="Counts as a vegetable">
          <input
            type="checkbox"
            checked={!!draft.isVegetable}
            onChange={(e) => setDraft({ ...draft, isVegetable: (e.target as HTMLInputElement).checked })}
          />
        </FieldRow>
        <div class="row">
          <div class="row-main">
            <button
              type="button"
              class="field-go"
              disabled={!draft.name || !!collides}
              onClick={() => {
                const ingredient: Ingredient = { ...draft, id, estimated: true };
                onCreate(ingredient);
                onChange(id);
                setCreating(false);
                setDraft({ id: "", name: "", aisle: "other", unit: "g", per100g: { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }, estimated: true });
              }}
            >
              Add "{draft.name || "…"}" to the library
            </button>
            {collides && <div class="row-sub" style={{ color: "var(--red)" }}>An ingredient with that name already exists.</div>}
          </div>
        </div>
        <div class="row">
          <button type="button" class="field-go" onClick={() => setCreating(false)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <select
      class="field-select"
      value={value}
      onChange={(e) => {
        const v = (e.target as HTMLSelectElement).value;
        if (v === "__new__") {
          setCreating(true);
        } else {
          onChange(v);
        }
      }}
    >
      <option value="">Choose…</option>
      {options.map((i) => (
        <option key={i.id} value={i.id}>{i.name}</option>
      ))}
      <option value="__new__">+ New ingredient…</option>
    </select>
  );
}
