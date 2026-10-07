import type { Recipe, Store } from "../../../src/types/schema";
import { recipeNutritionPerServing, recipeVegGramsPerServing } from "../../derive";
import { Group, List, Row, Tag } from "../../components/UI";
import { formatGrams, formatKcal, formatQty } from "../../lib/format";

export function RecipeDetail({
  recipe,
  store,
  onEdit,
}: {
  recipe: Recipe;
  store: Store;
  onEdit: () => void;
}) {
  const family = recipe.familyId ? store.families[recipe.familyId] : null;
  const scale = store.settings.householdSize / (recipe.yieldServings || 1);
  const { perServing, estimated } = recipeNutritionPerServing(recipe, store.ingredients);
  const vegGrams = recipeVegGramsPerServing(recipe, store.ingredients);

  return (
    <div>
      <p class="recipe-meta">
        {family ? family.name : "No family"}
        {Object.keys(recipe.axisValues).length > 0 && (
          <> &middot; {Object.entries(recipe.axisValues).map(([k, v]) => `${k}: ${v}`).join(", ")}</>
        )}
      </p>

      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        <Tag kind={recipe.status === "draft" ? "draft" : "ok"}>{recipe.status}</Tag>
        {estimated && <Tag kind="estimated">nutrition estimated</Tag>}
        <Tag>{recipe.shelfLifeDays === 0 ? "eat same session" : `${recipe.shelfLifeDays}d shelf life`}</Tag>
        {recipe.freezable && <Tag>freezable</Tag>}
        <Tag>{recipe.activeMinutes} min active</Tag>
      </div>

      <Group header="Nutrition per serving">
        <List>
          <Row title="Calories" value={formatKcal(perServing.kcal)} />
          <Row title="Protein" value={formatGrams(perServing.protein)} />
          <Row title="Carbs" value={formatGrams(perServing.carbs)} />
          <Row title="Fat" value={formatGrams(perServing.fat)} />
          <Row title="Fibre" value={formatGrams(perServing.fibre)} />
          <Row title="Vegetables" value={formatGrams(vegGrams)} />
        </List>
      </Group>

      <div class="recipe-h">Ingredients for {store.settings.householdSize} people</div>
      <Group>
        <List>
          {recipe.ingredients.map((ri, i) => {
            const ing = store.ingredients[ri.ingredientId];
            return (
              <div class="row" key={i}>
                <div class="row-main ing">
                  <span class="row-title">
                    {ing?.name ?? ri.ingredientId}
                    {ri.estimated && " *"}
                  </span>
                  <span class="q">{ing ? formatQty(ri.qty * scale, ing.unit) : ri.note}</span>
                </div>
              </div>
            );
          })}
        </List>
      </Group>

      {recipe.steps.length > 0 && (
        <>
          <div class="recipe-h">Method</div>
          <Group>
            <List>
              {recipe.steps.map((step, i) => (
                <div class="row" key={step.id}>
                  <div class="row-main step">
                    <span class="step-n">{i + 1}</span>
                    <span>
                      {step.text}
                      {step.minutes != null && <span class="row-sub"> — {step.minutes} min</span>}
                    </span>
                  </div>
                </div>
              ))}
            </List>
          </Group>
        </>
      )}

      {recipe.prepActions.length > 0 && (
        <>
          <div class="recipe-h">Prep ahead</div>
          <Group>
            <List>
              {recipe.prepActions.map((p, i) => (
                <Row key={i} title={p.text} sub={`${p.kind}, ${p.leadHours}h lead time`} />
              ))}
            </List>
          </Group>
        </>
      )}

      <button type="button" class="sheet-action" onClick={onEdit}>
        Edit recipe
      </button>
    </div>
  );
}
