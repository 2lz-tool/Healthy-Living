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

export function markBatchCooked(weekId: string, batchId: string) {
  updateStore((s) => {
    const week = s.weeks[weekId];
    if (!week) return s;
    const batches = week.batches.map((b) => (b.id === batchId ? { ...b, cookedAt: new Date().toISOString() } : b));
    return { ...s, weeks: { ...s.weeks, [weekId]: { ...week, batches } } };
  });
}

/** "Mark thawed" for a next-meal dashboard card in the thaw state. There's
 * no per-assignment thawed flag in the schema (see derive/nextMeal.ts's
 * isFrozenCovered doc comment) — this reuses frozenPortions itself,
 * decrementing it by one assignment's worth, which moves the assignment
 * out of the batch's inferred "frozen tail" on the next read. */
export function markBatchThawed(weekId: string, batchId: string, householdSize: number) {
  updateStore((s) => {
    const week = s.weeks[weekId];
    if (!week) return s;
    const batches = week.batches.map((b) =>
      b.id === batchId ? { ...b, frozenPortions: Math.max(0, b.frozenPortions - householdSize) } : b,
    );
    return { ...s, weeks: { ...s.weeks, [weekId]: { ...week, batches } } };
  });
}

/** The dashboard's "not planned" leftover option: add one more assignment
 * to an existing batch rather than creating a new one. */
export function assignLeftoverBatch(weekId: string, batchId: string, date: string, slot: Batch["assignments"][number]["slot"]) {
  updateStore((s) => {
    const week = s.weeks[weekId];
    if (!week) return s;
    const batches = week.batches.map((b) =>
      b.id === batchId && !b.assignments.some((a) => a.date === date && a.slot === slot)
        ? { ...b, assignments: [...b.assignments, { date, slot }] }
        : b,
    );
    return { ...s, weeks: { ...s.weeks, [weekId]: { ...week, batches } } };
  });
}

/** The dashboard's "from the library" option: a same-day batch for one
 * slot, scale 1, nothing frozen — the quick-assign case from an empty
 * slot, not the full Add Batch sheet. */
export function createQuickBatch(weekId: string, recipeId: string, date: string, slot: Batch["assignments"][number]["slot"]) {
  updateStore((s) => {
    const week = s.weeks[weekId] ?? ensureWeek(weekId, s.settings.householdSize);
    const existingIds = new Set(Object.values(s.weeks).flatMap((w) => w.batches.map((b) => b.id)));
    let n = 1;
    let id = `b-${recipeId}-${n}`;
    while (existingIds.has(id)) id = `b-${recipeId}-${++n}`;
    const batch: Batch = {
      id,
      recipeId,
      cookDate: date,
      cookWhen: slot === "breakfast" || slot === "lunch" ? "morning" : "evening",
      scale: 1,
      frozenPortions: 0,
      assignments: [{ date, slot }],
      cookedAt: new Date().toISOString(),
    };
    return { ...s, weeks: { ...s.weeks, [weekId]: { ...week, batches: [...week.batches, batch] } } };
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

/** The dashboard checklist's checkbox: an ingredient can be needed across
 * more than one week (a short-before-shopping cook in one week, a
 * buy-on-day cook that's rolled into the next), so toggling it keeps every
 * relevant week's boughtIngredients in sync rather than just one. */
export function toggleBoughtAcrossWeeks(weekIds: string[], ingredientId: string) {
  updateStore((s) => {
    const nowBought = weekIds.some((id) => s.weeks[id]?.boughtIngredients.includes(ingredientId));
    const weeks = { ...s.weeks };
    for (const weekId of weekIds) {
      const week = weeks[weekId] ?? ensureWeek(weekId, s.settings.householdSize);
      const has = week.boughtIngredients.includes(ingredientId);
      const boughtIngredients = nowBought
        ? week.boughtIngredients.filter((id) => id !== ingredientId)
        : has
          ? week.boughtIngredients
          : [...week.boughtIngredients, ingredientId];
      weeks[weekId] = { ...week, boughtIngredients };
    }
    return { ...s, weeks };
  });
}

export function markHaveAcrossWeeks(weekIds: string[], ingredientId: string) {
  updateStore((s) => {
    const weeks = { ...s.weeks };
    for (const weekId of weekIds) {
      const week = weeks[weekId] ?? ensureWeek(weekId, s.settings.householdSize);
      if (week.haveIngredients.includes(ingredientId)) continue;
      weeks[weekId] = { ...week, haveIngredients: [...week.haveIngredients, ingredientId] };
    }
    return { ...s, weeks };
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
