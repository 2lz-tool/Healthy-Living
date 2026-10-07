import { useState } from "preact/hooks";
import type { Store } from "../types/schema";
import { Group, LargeTitle, List, Row, Sheet } from "../components/UI";
import { RecipeDetail } from "./library/RecipeDetail";
import { RecipeEditor } from "./library/RecipeEditor";
import { FamilyEditor } from "./library/FamilyEditor";
import { upsertFamily, upsertRecipe } from "../state/actions";

type SheetState =
  | { kind: "none" }
  | { kind: "detail"; recipeId: string }
  | { kind: "edit-recipe"; recipeId: string | null }
  | { kind: "edit-family"; familyId: string | null };

export function LibraryScreen({ store }: { store: Store }) {
  const [sheet, setSheet] = useState<SheetState>({ kind: "none" });

  const recipesByFamily = new Map<string, typeof store.recipes[string][]>();
  const noFamily: (typeof store.recipes)[string][] = [];
  for (const r of Object.values(store.recipes)) {
    if (r.familyId && store.families[r.familyId]) {
      const list = recipesByFamily.get(r.familyId) ?? [];
      list.push(r);
      recipesByFamily.set(r.familyId, list);
    } else {
      noFamily.push(r);
    }
  }

  const detailRecipe = sheet.kind === "detail" ? store.recipes[sheet.recipeId] : null;
  const editingRecipe = sheet.kind === "edit-recipe" && sheet.recipeId ? store.recipes[sheet.recipeId] : null;
  const editingFamily = sheet.kind === "edit-family" && sheet.familyId ? store.families[sheet.familyId] : null;

  return (
    <div class="container">
      <LargeTitle title="Library" subtitle="Families and their variants, plus anything on its own." />

      {Object.values(store.families).map((family) => {
        const recipes = recipesByFamily.get(family.id) ?? [];
        return (
          <Group key={family.id} header={family.name}>
            <List>
              {recipes.map((r) => (
                <Row
                  key={r.id}
                  title={r.name}
                  sub={r.status === "draft" ? "Draft" : "Verified"}
                  chevron
                  onClick={() => setSheet({ kind: "detail", recipeId: r.id })}
                />
              ))}
              <button type="button" class="row" onClick={() => setSheet({ kind: "edit-family", familyId: family.id })}>
                <div class="row-main">
                  <div class="row-title" style={{ color: "var(--blue)" }}>Edit family</div>
                </div>
              </button>
            </List>
          </Group>
        );
      })}

      <Group header="Other">
        <List>
          {noFamily.map((r) => (
            <Row
              key={r.id}
              title={r.name}
              sub={r.status === "draft" ? "Draft" : "Verified"}
              chevron
              onClick={() => setSheet({ kind: "detail", recipeId: r.id })}
            />
          ))}
        </List>
      </Group>

      <div style={{ display: "flex", gap: 10, padding: "4px 0 24px" }}>
        <button type="button" class="field-go" onClick={() => setSheet({ kind: "edit-recipe", recipeId: null })}>
          + New recipe
        </button>
        <button type="button" class="field-go" onClick={() => setSheet({ kind: "edit-family", familyId: null })}>
          + New family
        </button>
      </div>

      <Sheet
        open={sheet.kind === "detail" && !!detailRecipe}
        title={detailRecipe?.name ?? ""}
        onClose={() => setSheet({ kind: "none" })}
      >
        {detailRecipe && (
          <RecipeDetail
            recipe={detailRecipe}
            store={store}
            onEdit={() => setSheet({ kind: "edit-recipe", recipeId: detailRecipe.id })}
          />
        )}
      </Sheet>

      <Sheet
        open={sheet.kind === "edit-recipe"}
        title={editingRecipe ? "Edit recipe" : "New recipe"}
        onClose={() => setSheet({ kind: "none" })}
      >
        {sheet.kind === "edit-recipe" && (
          <RecipeEditor
            recipe={editingRecipe ?? null}
            store={store}
            onSave={(r) => {
              upsertRecipe(r);
              setSheet({ kind: "detail", recipeId: r.id });
            }}
            onCancel={() => setSheet({ kind: "none" })}
          />
        )}
      </Sheet>

      <Sheet
        open={sheet.kind === "edit-family"}
        title={editingFamily ? "Edit family" : "New family"}
        onClose={() => setSheet({ kind: "none" })}
      >
        {sheet.kind === "edit-family" && (
          <FamilyEditor
            family={editingFamily ?? null}
            existing={store.families}
            onSave={(f) => {
              upsertFamily(f);
              setSheet({ kind: "none" });
            }}
            onCancel={() => setSheet({ kind: "none" })}
          />
        )}
      </Sheet>
    </div>
  );
}
