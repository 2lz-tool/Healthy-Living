import type { Aisle, Ingredient, Recipe, Unit, Week } from "../types/schema";

export type ShoppingItem = {
  ingredientId: string;
  name: string;
  aisle: Aisle;
  qty: number;
  unit: Unit;
  bought: boolean;
};

/** Round a raw summed quantity up to a sensible shop unit. Spec section 4
 * names two cases explicitly — "whole pieces, 50 g for produce, 100 g for
 * meat" — everything else defaults to the same 50 g/ml step as produce,
 * since the spec doesn't enumerate the rest and a plain-grams shopping
 * list for grains or spices would read as oddly precise next to the other
 * two groups. */
export function roundShopQty(qty: number, ing: Ingredient): number {
  if (qty <= 0) return 0;
  if (ing.unit === "piece") return Math.ceil(qty);
  const step = ing.aisle === "meat_fish" ? 100 : 50;
  return Math.ceil(qty / step) * step;
}

/** Shopping list for a week: sum ingredient quantities across batches
 * (times each batch's scale), remove anything already marked "have", round
 * to shop units, carry forward "bought" state. Returned flat and sorted —
 * callers group by aisle for display. */
export function shoppingListForWeek(
  week: Week,
  recipes: Record<string, Recipe>,
  ingredients: Record<string, Ingredient>,
): ShoppingItem[] {
  const rawTotals = new Map<string, number>();

  for (const batch of week.batches) {
    const recipe = recipes[batch.recipeId];
    if (!recipe) continue;
    for (const ri of recipe.ingredients) {
      const prev = rawTotals.get(ri.ingredientId) ?? 0;
      rawTotals.set(ri.ingredientId, prev + ri.qty * batch.scale);
    }
  }

  const items: ShoppingItem[] = [];
  for (const [ingredientId, rawQty] of rawTotals) {
    if (week.haveIngredients.includes(ingredientId)) continue;
    const ing = ingredients[ingredientId];
    if (!ing) continue;
    items.push({
      ingredientId,
      name: ing.name,
      aisle: ing.aisle,
      qty: roundShopQty(rawQty, ing),
      unit: ing.unit,
      bought: week.boughtIngredients.includes(ingredientId),
    });
  }

  return items.sort((a, b) => a.aisle.localeCompare(b.aisle) || a.name.localeCompare(b.name));
}

export function groupByAisle(items: ShoppingItem[]): Partial<Record<Aisle, ShoppingItem[]>> {
  const groups: Partial<Record<Aisle, ShoppingItem[]>> = {};
  for (const item of items) {
    (groups[item.aisle] ??= []).push(item);
  }
  return groups;
}
