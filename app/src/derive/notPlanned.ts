import type { Recipe, Slot, Week } from "../types/schema";
import { addDaysIso, daysBetween } from "./dates";

export type LeftoverOption = {
  kind: "leftover";
  batchId: string;
  recipeId: string;
  recipeName: string;
  portionsLeft: number;
  /** Undefined when the leftover is frozen — exempt from shelf life. */
  shelfLifeEndsIso?: string;
};

export type FromLibraryOption = {
  kind: "from_library";
  recipeId: string;
  recipeName: string;
  activeMinutes: number;
};

export type PlanProperlyOption = { kind: "plan_properly" };

export type NotPlannedOption = LeftoverOption | FromLibraryOption | PlanProperlyOption;

/** LANDING-HANDOFF.md section 4.1, "Not planned" state. Up to three options,
 * each category contributing at most its single best match: the leftover
 * closest to the end of its shelf life, and the quickest library recipe
 * with everything already on hand. "Plan it properly" is always offered. */
export function notPlannedOptions(
  date: string,
  slot: Slot,
  weeks: Week[],
  recipes: Record<string, Recipe>,
): NotPlannedOption[] {
  const options: NotPlannedOption[] = [];

  // 1. Leftovers first.
  const leftovers: LeftoverOption[] = [];
  for (const week of weeks) {
    for (const batch of week.batches) {
      const recipe = recipes[batch.recipeId];
      if (!recipe) continue;
      const availableServings = recipe.yieldServings * batch.scale;
      const assignedServings = batch.assignments.length * week.householdSize;
      const portionsLeft = Math.floor((availableServings - assignedServings) / week.householdSize);
      if (portionsLeft <= 0) continue;

      const withinShelfLife = batch.frozenPortions > 0 || daysBetween(batch.cookDate, date) <= recipe.shelfLifeDays;
      if (!withinShelfLife) continue;

      leftovers.push({
        kind: "leftover",
        batchId: batch.id,
        recipeId: recipe.id,
        recipeName: recipe.name,
        portionsLeft,
        shelfLifeEndsIso: batch.frozenPortions > 0 ? undefined : addDaysIso(batch.cookDate, recipe.shelfLifeDays),
      });
    }
  }
  leftovers.sort((a, b) => (a.shelfLifeEndsIso ?? "9999-99-99").localeCompare(b.shelfLifeEndsIso ?? "9999-99-99"));
  if (leftovers.length > 0) options.push(leftovers[0]);

  // 2. From the library.
  const haveOrBought = new Set<string>();
  for (const week of weeks) {
    for (const id of week.haveIngredients) haveOrBought.add(id);
    for (const id of week.boughtIngredients) haveOrBought.add(id);
  }
  const fromLibrary: FromLibraryOption[] = Object.values(recipes)
    .filter((r) => r.slots.includes(slot) && r.ingredients.every((ri) => haveOrBought.has(ri.ingredientId)))
    .map((r) => ({ kind: "from_library" as const, recipeId: r.id, recipeName: r.name, activeMinutes: r.activeMinutes }))
    .sort((a, b) => a.activeMinutes - b.activeMinutes);
  if (fromLibrary.length > 0) options.push(fromLibrary[0]);

  // 3. Plan it properly — always offered.
  options.push({ kind: "plan_properly" });

  return options;
}
