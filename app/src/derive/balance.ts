import type { Ingredient, ProteinSource, Recipe, Settings, Week } from "../types/schema";
import type { DayTotals } from "./dayTotals";

export type BalanceResult = { level: "ok" | "warn"; message: string };

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Per-day balance checks for one person. Messages are concrete numbers,
 * never a bare "protein is low" — per spec section 4. */
export function dayBalanceChecks(
  dayTotals: DayTotals,
  dayLabel: string,
  settings: Settings,
): BalanceResult[] {
  const results: BalanceResult[] = [];
  const { kcal, protein } = dayTotals.totals;
  const { kcalMin, kcalMax, proteinMin } = settings.targets;

  if (kcal < kcalMin || kcal > kcalMax) {
    results.push({
      level: "warn",
      message: `${dayLabel}: ${Math.round(kcal)} kcal, target ${kcalMin}–${kcalMax}.`,
    });
  } else {
    results.push({ level: "ok", message: `${dayLabel}: ${Math.round(kcal)} kcal, within target.` });
  }

  if (protein < proteinMin) {
    results.push({
      level: "warn",
      message: `${dayLabel}: ${Math.round(protein)} g protein, ${Math.round(proteinMin - protein)} short.`,
    });
  } else {
    results.push({ level: "ok", message: `${dayLabel}: ${Math.round(protein)} g protein, met.` });
  }

  for (const meal of dayTotals.meals) {
    if ((meal.slot === "lunch" || meal.slot === "dinner") && meal.totals.protein < settings.mealProteinMin) {
      results.push({
        level: "warn",
        message: `${dayLabel}: ${capitalize(meal.slot)} is ${meal.recipeName} at ${Math.round(meal.totals.protein)} g protein.`,
      });
    }
  }

  const vegTarget = settings.vegServingGrams * settings.vegServingsMinPerDay;
  if (dayTotals.vegGrams < vegTarget) {
    results.push({
      level: "warn",
      message: `${dayLabel}: ${Math.round(dayTotals.vegGrams)} g vegetables, target ${vegTarget} g.`,
    });
  } else {
    results.push({ level: "ok", message: `${dayLabel}: ${Math.round(dayTotals.vegGrams)} g vegetables, met.` });
  }

  return results;
}

/** Week-level balance checks: protein source variety across the batches
 * actually assigned that week. A recipe can draw on more than one protein
 * source (e.g. a dal with a side of egg); each one it uses counts that
 * batch's assignment dates toward that source. */
export function weekBalanceChecks(
  week: Week,
  recipes: Record<string, Recipe>,
  ingredients: Record<string, Ingredient>,
  settings: Settings,
): BalanceResult[] {
  const results: BalanceResult[] = [];
  const datesBySource = new Map<ProteinSource, Set<string>>();

  for (const batch of week.batches) {
    const recipe = recipes[batch.recipeId];
    if (!recipe) continue;
    const sources = new Set<ProteinSource>();
    for (const ri of recipe.ingredients) {
      const source = ingredients[ri.ingredientId]?.proteinSource;
      if (source) sources.add(source);
    }
    for (const source of sources) {
      const dates = datesBySource.get(source) ?? new Set<string>();
      for (const a of batch.assignments) dates.add(a.date);
      datesBySource.set(source, dates);
    }
  }

  for (const [source, dates] of datesBySource) {
    if (dates.size > settings.maxSameProteinSourceDays) {
      results.push({
        level: "warn",
        message: `Week of ${week.id}: ${source} on ${dates.size} of 7 days, over the ${settings.maxSameProteinSourceDays}-day limit.`,
      });
    }
  }

  if (datesBySource.size === 0) {
    results.push({ level: "warn", message: `Week of ${week.id}: no protein source identified in any planned batch.` });
  } else if (datesBySource.size < 2) {
    const only = [...datesBySource.keys()][0];
    results.push({ level: "warn", message: `Week of ${week.id}: only one protein source all week (${only}).` });
  } else {
    results.push({ level: "ok", message: `Week of ${week.id}: ${datesBySource.size} protein sources used.` });
  }

  return results;
}
