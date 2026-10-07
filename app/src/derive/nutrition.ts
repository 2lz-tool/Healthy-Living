import type { Ingredient, Per100g, Recipe } from "../types/schema";

/** Grams of an ingredient for a given recipe quantity. "g" and "ml" are
 * both treated 1:1 for nutrition purposes (the schema has no density
 * field); "piece" converts via gramsPerPiece. */
export function ingredientGrams(ing: Ingredient, qty: number): number {
  if (ing.unit === "piece") {
    return qty * (ing.gramsPerPiece ?? 0);
  }
  return qty;
}

export function zeroPer100g(): Per100g {
  return { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };
}

export function sumPer100g(values: Per100g[]): Per100g {
  const total = zeroPer100g();
  for (const v of values) {
    total.kcal += v.kcal;
    total.protein += v.protein;
    total.carbs += v.carbs;
    total.fat += v.fat;
    total.fibre += v.fibre;
  }
  return total;
}

export function scalePer100g(v: Per100g, factor: number): Per100g {
  return {
    kcal: v.kcal * factor,
    protein: v.protein * factor,
    carbs: v.carbs * factor,
    fat: v.fat * factor,
    fibre: v.fibre * factor,
  };
}

export type RecipeNutrition = {
  perServing: Per100g;
  /** True if any ingredient lookup was missing, or any ingredient/recipe
   * line was itself marked estimated. */
  estimated: boolean;
};

/** Sum ingredient nutrition at quantity, divide by yieldServings. Propagates
 * `estimated` if any input is estimated — per spec section 4. */
export function recipeNutritionPerServing(
  recipe: Recipe,
  ingredients: Record<string, Ingredient>,
): RecipeNutrition {
  let estimated = false;
  const lineTotals: Per100g[] = [];

  for (const ri of recipe.ingredients) {
    const ing = ingredients[ri.ingredientId];
    if (!ing) {
      estimated = true;
      continue;
    }
    if (ri.estimated || ing.estimated) estimated = true;
    const grams = ingredientGrams(ing, ri.qty);
    lineTotals.push(scalePer100g(ing.per100g, grams / 100));
  }

  const total = sumPer100g(lineTotals);
  const servings = recipe.yieldServings || 1;
  return { perServing: scalePer100g(total, 1 / servings), estimated };
}

/** Grams of vegetable (ingredients flagged isVegetable) per serving. */
export function recipeVegGramsPerServing(
  recipe: Recipe,
  ingredients: Record<string, Ingredient>,
): number {
  let totalGrams = 0;
  for (const ri of recipe.ingredients) {
    const ing = ingredients[ri.ingredientId];
    if (!ing?.isVegetable) continue;
    totalGrams += ingredientGrams(ing, ri.qty);
  }
  return totalGrams / (recipe.yieldServings || 1);
}
