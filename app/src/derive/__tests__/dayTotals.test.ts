import { describe, expect, it } from "vitest";
import type { Ingredient, Recipe, Week } from "../../types/schema";
import { dayTotalsForDate } from "../dayTotals";

const rice: Ingredient = {
  id: "rice",
  name: "Rice",
  aisle: "grains",
  unit: "g",
  per100g: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, fibre: 0.4 },
  estimated: false,
};
const dal: Ingredient = {
  id: "dal",
  name: "Dal",
  aisle: "legumes",
  unit: "g",
  per100g: { kcal: 340, protein: 24, carbs: 60, fat: 1.5, fibre: 16 },
  proteinSource: "legume",
  estimated: false,
};

function recipe(id: string, ingredientId: string, qty: number): Recipe {
  return {
    id,
    familyId: null,
    name: id,
    axisValues: {},
    yieldServings: 2,
    ingredients: [{ ingredientId, qty, estimated: false }],
    steps: [],
    prepActions: [],
    shelfLifeDays: 2,
    freezable: false,
    slots: ["lunch", "dinner"],
    activeMinutes: 10,
    source: { kind: "own" },
    status: "draft",
  };
}

const recipes = { rice: recipe("rice", "rice", 200), dal: recipe("dal", "dal", 200) };
const ingredients = { rice, dal };

describe("dayTotalsForDate", () => {
  it("sums every meal assigned to that date across all weeks, not just the week matching the date", () => {
    // Mirrors the nechicken example from BUILD1-SPEC.md section 3: a batch
    // cooked in week N can be assigned to a date in week N+1.
    const weekN: Week = {
      id: "2026-10-11",
      householdSize: 2,
      batches: [
        {
          id: "b1",
          recipeId: "dal",
          cookDate: "2026-10-17",
          cookWhen: "evening",
          scale: 1,
          frozenPortions: 0,
          assignments: [{ date: "2026-10-18", slot: "lunch" }],
        },
      ],
      haveIngredients: [],
      boughtIngredients: [],
    };
    const weekNPlus1: Week = {
      id: "2026-10-18",
      householdSize: 2,
      batches: [],
      haveIngredients: [],
      boughtIngredients: [],
    };

    const totals = dayTotalsForDate("2026-10-18", [weekN, weekNPlus1], recipes, ingredients);
    expect(totals.meals).toHaveLength(1);
    expect(totals.meals[0].recipeId).toBe("dal");
  });

  it("sums multiple batches sharing the same date and slot (e.g. a main plus a side)", () => {
    const week: Week = {
      id: "2026-10-11",
      householdSize: 2,
      batches: [
        {
          id: "b1",
          recipeId: "rice",
          cookDate: "2026-10-11",
          cookWhen: "evening",
          scale: 1,
          frozenPortions: 0,
          assignments: [{ date: "2026-10-12", slot: "lunch" }],
        },
        {
          id: "b2",
          recipeId: "dal",
          cookDate: "2026-10-11",
          cookWhen: "evening",
          scale: 1,
          frozenPortions: 0,
          assignments: [{ date: "2026-10-12", slot: "lunch" }],
        },
      ],
      haveIngredients: [],
      boughtIngredients: [],
    };

    const totals = dayTotalsForDate("2026-10-12", [week], recipes, ingredients);
    expect(totals.meals).toHaveLength(2);
    // rice: 200g -> 260 kcal / 2 servings = 130. dal: 200g -> 680 kcal / 2 = 340.
    expect(totals.totals.kcal).toBeCloseTo(470, 5);
  });

  it("returns zero totals and no estimated flag for a date with nothing assigned", () => {
    const week: Week = { id: "2026-10-11", householdSize: 2, batches: [], haveIngredients: [], boughtIngredients: [] };
    const totals = dayTotalsForDate("2026-10-11", [week], recipes, ingredients);
    expect(totals.meals).toHaveLength(0);
    expect(totals.totals.kcal).toBe(0);
    expect(totals.estimated).toBe(false);
  });
});
