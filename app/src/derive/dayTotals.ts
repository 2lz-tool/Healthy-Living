import type { Ingredient, Per100g, Recipe, Slot, Week } from "../types/schema";
import { recipeNutritionPerServing, recipeVegGramsPerServing, sumPer100g, zeroPer100g } from "./nutrition";

export type DayMeal = {
  slot: Slot;
  batchId: string;
  recipeId: string;
  recipeName: string;
  totals: Per100g;
  vegGrams: number;
  estimated: boolean;
};

export type DayTotals = {
  date: string;
  totals: Per100g;
  vegGrams: number;
  /** True if any meal that day drew on an estimated ingredient/quantity. */
  estimated: boolean;
  meals: DayMeal[];
};

/** Day totals per person for one date. Searches every week's batches, not
 * just the week whose id matches the date, because a batch's assignments
 * can land in the following week (e.g. Saturday's cook covering next
 * Sunday's lunch) — see BUILD1-SPEC.md section 3, the nechicken example. */
export function dayTotalsForDate(
  date: string,
  weeks: Week[],
  recipes: Record<string, Recipe>,
  ingredients: Record<string, Ingredient>,
): DayTotals {
  const meals: DayMeal[] = [];

  for (const week of weeks) {
    for (const batch of week.batches) {
      const recipe = recipes[batch.recipeId];
      if (!recipe) continue;
      for (const a of batch.assignments) {
        if (a.date !== date) continue;
        const { perServing, estimated } = recipeNutritionPerServing(recipe, ingredients);
        meals.push({
          slot: a.slot,
          batchId: batch.id,
          recipeId: recipe.id,
          recipeName: recipe.name,
          totals: perServing,
          vegGrams: recipeVegGramsPerServing(recipe, ingredients),
          estimated,
        });
      }
    }
  }

  return {
    date,
    totals: meals.length ? sumPer100g(meals.map((m) => m.totals)) : zeroPer100g(),
    vegGrams: meals.reduce((s, m) => s + m.vegGrams, 0),
    estimated: meals.some((m) => m.estimated),
    meals,
  };
}
