import type { Aisle, Ingredient, Recipe, Settings, Slot, Unit, Week } from "../types/schema";
import { roundShopQty } from "./shopping";
import { isoDate } from "./dates";
import { shoppingWindow } from "./shoppingWindow";

export type NeededFor = { date: string; slot: Slot; recipeName: string };

export type ChecklistItem = {
  ingredientId: string;
  name: string;
  aisle: Aisle;
  qty: number;
  unit: Unit;
  bought: boolean;
  neededFor: NeededFor[];
  /** The weeks whose cooks need this ingredient in this window — the
   * checkbox toggles boughtIngredients on all of them together. */
  weekIds: string[];
};

export type ShoppingChecklist = {
  nextShop: string;
  followingShop: string;
  shortBefore: ChecklistItem[];
  buyOnNextShop: ChecklistItem[];
  hasAnyPlan: boolean;
};

function itemsForRange(fromIso: string, toExclusiveIso: string, weeks: Week[], recipes: Record<string, Recipe>, ingredients: Record<string, Ingredient>): ChecklistItem[] {
  const totals = new Map<string, number>();
  const neededFor = new Map<string, NeededFor[]>();
  const weekIds = new Map<string, Set<string>>();

  for (const week of weeks) {
    for (const batch of week.batches) {
      if (batch.cookDate < fromIso || batch.cookDate >= toExclusiveIso) continue;
      const recipe = recipes[batch.recipeId];
      if (!recipe) continue;
      for (const ri of recipe.ingredients) {
        if (week.haveIngredients.includes(ri.ingredientId)) continue;
        totals.set(ri.ingredientId, (totals.get(ri.ingredientId) ?? 0) + ri.qty * batch.scale);
        const list = neededFor.get(ri.ingredientId) ?? [];
        for (const a of batch.assignments) list.push({ date: a.date, slot: a.slot, recipeName: recipe.name });
        neededFor.set(ri.ingredientId, list);
        const ids = weekIds.get(ri.ingredientId) ?? new Set<string>();
        ids.add(week.id);
        weekIds.set(ri.ingredientId, ids);
      }
    }
  }

  const items: ChecklistItem[] = [];
  for (const [ingredientId, rawQty] of totals) {
    const ing = ingredients[ingredientId];
    if (!ing) continue;
    const relevantWeekIds = [...(weekIds.get(ingredientId) ?? [])];
    const bought = relevantWeekIds.some((id) => weeks.find((w) => w.id === id)?.boughtIngredients.includes(ingredientId));
    items.push({
      ingredientId,
      name: ing.name,
      aisle: ing.aisle,
      qty: roundShopQty(rawQty, ing),
      unit: ing.unit,
      bought,
      neededFor: neededFor.get(ingredientId) ?? [],
      weekIds: relevantWeekIds,
    });
  }
  return items.sort((a, b) => a.aisle.localeCompare(b.aisle) || a.name.localeCompare(b.name));
}

/** LANDING-HANDOFF.md section 4.2. Two groups: ingredients needed before
 * the next shopping day (no trip scheduled before then — a separate
 * errand or a swap) and ingredients to buy on the next shopping day
 * itself, covering through the day before the one after. */
export function shoppingChecklist(
  now: Date,
  weeks: Week[],
  recipes: Record<string, Recipe>,
  ingredients: Record<string, Ingredient>,
  settings: Settings,
): ShoppingChecklist {
  const { nextShop, followingShop } = shoppingWindow(now, settings.shoppingDays);
  const today = isoDate(now);

  return {
    nextShop,
    followingShop,
    shortBefore: itemsForRange(today, nextShop, weeks, recipes, ingredients),
    buyOnNextShop: itemsForRange(nextShop, followingShop, weeks, recipes, ingredients),
    hasAnyPlan: weeks.some((w) => w.batches.length > 0),
  };
}
