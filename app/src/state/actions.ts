import type { Batch, Family, Ingredient, Recipe, Store, Week } from "../types/schema";
import { updateStore } from "./store";

// ---------- library ----------

export function upsertRecipe(recipe: Recipe) {
  updateStore((s) => ({ ...s, recipes: { ...s.recipes, [recipe.id]: recipe } }));
}

export function deleteRecipe(id: string) {
  updateStore((s) => {
    const recipes = { ...s.recipes };
    delete recipes[id];
    return { ...s, recipes };
  });
}

export function upsertFamily(family: Family) {
  updateStore((s) => ({ ...s, families: { ...s.families, [family.id]: family } }));
}

export function upsertIngredient(ingredient: Ingredient) {
  updateStore((s) => ({ ...s, ingredients: { ...s.ingredients, [ingredient.id]: ingredient } }));
}

// ---------- weeks / batches ----------

export function ensureWeek(weekId: string, householdSize: number): Week {
  return {
    id: weekId,
    householdSize,
    batches: [],
    haveIngredients: [],
    boughtIngredients: [],
  };
}

export function getOrCreateWeek(s: Store, weekId: string): Week {
  return s.weeks[weekId] ?? ensureWeek(weekId, s.settings.householdSize);
}

export function saveWeek(week: Week) {
  updateStore((s) => ({ ...s, weeks: { ...s.weeks, [week.id]: week } }));
}

export function upsertBatch(weekId: string, batch: Batch) {
  updateStore((s) => {
    const week = s.weeks[weekId] ?? ensureWeek(weekId, s.settings.householdSize);
    const exists = week.batches.some((b) => b.id === batch.id);
    const batches = exists
      ? week.batches.map((b) => (b.id === batch.id ? batch : b))
      : [...week.batches, batch];
    return { ...s, weeks: { ...s.weeks, [weekId]: { ...week, batches } } };
  });
}

export function removeBatch(weekId: string, batchId: string) {
  updateStore((s) => {
    const week = s.weeks[weekId];
    if (!week) return s;
    return {
      ...s,
      weeks: { ...s.weeks, [weekId]: { ...week, batches: week.batches.filter((b) => b.id !== batchId) } },
    };
  });
}

/** Copies every batch from one week to another, shifting every date
 * (cookDate and each assignment date) by the same number of days so the
 * copy lands on the new week's own Sunday-to-Saturday span. */
export function copyWeek(fromWeekId: string, toWeekId: string) {
  updateStore((s) => {
    const from = s.weeks[fromWeekId];
    if (!from) return s;
    const shiftDays = daysBetweenIso(fromWeekId, toWeekId);
    const to = s.weeks[toWeekId] ?? ensureWeek(toWeekId, from.householdSize);
    const batches: Batch[] = from.batches.map((b, i) => ({
      ...b,
      id: `${b.id}-copy-${toWeekId}-${i}`,
      cookDate: addDaysIso(b.cookDate, shiftDays),
      assignments: b.assignments.map((a) => ({ ...a, date: addDaysIso(a.date, shiftDays) })),
    }));
    return { ...s, weeks: { ...s.weeks, [toWeekId]: { ...to, batches } } };
  });
}

export function toggleHaveIngredient(weekId: string, ingredientId: string) {
  updateStore((s) => {
    const week = s.weeks[weekId] ?? ensureWeek(weekId, s.settings.householdSize);
    const has = week.haveIngredients.includes(ingredientId);
    const haveIngredients = has
      ? week.haveIngredients.filter((id) => id !== ingredientId)
      : [...week.haveIngredients, ingredientId];
    return { ...s, weeks: { ...s.weeks, [weekId]: { ...week, haveIngredients } } };
  });
}

export function toggleBoughtIngredient(weekId: string, ingredientId: string) {
  updateStore((s) => {
    const week = s.weeks[weekId] ?? ensureWeek(weekId, s.settings.householdSize);
    const has = week.boughtIngredients.includes(ingredientId);
    const boughtIngredients = has
      ? week.boughtIngredients.filter((id) => id !== ingredientId)
      : [...week.boughtIngredients, ingredientId];
    return { ...s, weeks: { ...s.weeks, [weekId]: { ...week, boughtIngredients } } };
  });
}

export function clearBought(weekId: string) {
  updateStore((s) => {
    const week = s.weeks[weekId];
    if (!week) return s;
    return { ...s, weeks: { ...s.weeks, [weekId]: { ...week, boughtIngredients: [] } } };
  });
}

// ---------- log ----------

export function toggleEaten(date: string, slot: string, batchId: string) {
  updateStore((s) => {
    const exists = s.log.eaten.some((e) => e.date === date && e.slot === slot && e.batchId === batchId);
    const eaten = exists
      ? s.log.eaten.filter((e) => !(e.date === date && e.slot === slot && e.batchId === batchId))
      : [...s.log.eaten, { date, slot, batchId }];
    return { ...s, log: { ...s.log, eaten } };
  });
}

export function togglePrepDone(date: string, key: string) {
  updateStore((s) => {
    const exists = s.log.prepDone.some((p) => p.date === date && p.key === key);
    const prepDone = exists
      ? s.log.prepDone.filter((p) => !(p.date === date && p.key === key))
      : [...s.log.prepDone, { date, key }];
    return { ...s, log: { ...s.log, prepDone } };
  });
}

// ---------- settings ----------

export function updateSettings(patch: Partial<Store["settings"]>) {
  updateStore((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function replaceStore(next: Store) {
  updateStore(() => next);
}

// ---------- small date helpers (kept local — these are UI-side week-id
// arithmetic, not part of the derive/ pure-logic contract) ----------

function addDaysIso(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetweenIso(from: string, to: string): number {
  const a = new Date(from + "T00:00:00").getTime();
  const b = new Date(to + "T00:00:00").getTime();
  return Math.round((b - a) / 86_400_000);
}
