import { describe, expect, it } from "vitest";
import type { Batch, Ingredient, Recipe, Settings, Week } from "../../types/schema";
import { shoppingChecklist } from "../shoppingChecklist";

// 2026-10-11 is a Sunday; 10-17 Sat; 10-24 Sat (the following Saturday).

const settings: Settings = {
  householdSize: 2,
  targets: { kcalMin: 1500, kcalMax: 1600, proteinMin: 90, proteinMax: 100, carbsPctMax: 50, fatPctMin: 20, fatPctMax: 30, fibreMin: 25 },
  mealProteinMin: 25,
  vegServingGrams: 80,
  vegServingsMinPerDay: 3,
  maxSameProteinSourceDays: 4,
  prepDays: ["sun", "wed", "fri", "sat"],
  reminderTime: "19:00",
  neverSuggest: [],
  shoppingDays: ["sat"],
  slotTimes: { breakfast: "08:30", lunch: "13:30", dinner: "20:30", snack: "17:00" },
};

const rajma: Ingredient = {
  id: "rajma",
  name: "Rajma",
  aisle: "legumes",
  unit: "g",
  per100g: { kcal: 333, protein: 24, carbs: 60, fat: 0.8, fibre: 25 },
  estimated: false,
};

function recipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "rajma-recipe",
    familyId: null,
    name: "Rajma",
    axisValues: {},
    yieldServings: 2,
    ingredients: [{ ingredientId: "rajma", qty: 400, estimated: false }],
    steps: [],
    prepActions: [],
    shelfLifeDays: 4,
    freezable: true,
    slots: ["dinner"],
    activeMinutes: 20,
    source: { kind: "own" },
    status: "draft",
    ...overrides,
  };
}

function batch(id: string, cookDate: string): Batch {
  return {
    id,
    recipeId: "rajma-recipe",
    cookDate,
    cookWhen: "evening",
    scale: 1,
    frozenPortions: 0,
    assignments: [{ date: cookDate, slot: "dinner" }],
  };
}

function week(id: string, batches: Batch[], overrides: Partial<Week> = {}): Week {
  return { id, householdSize: 2, batches, haveIngredients: [], boughtIngredients: [], ...overrides };
}

describe("shoppingChecklist", () => {
  it("splits a cook before the next shopping day from one on or after it", () => {
    const w = week("2026-10-11", [batch("early", "2026-10-13"), batch("late", "2026-10-19")]);
    const result = shoppingChecklist(new Date("2026-10-11T10:00:00"), [w], { "rajma-recipe": recipe() }, { rajma }, settings);
    expect(result.nextShop).toBe("2026-10-17");
    expect(result.shortBefore).toHaveLength(1);
    expect(result.buyOnNextShop).toHaveLength(1);
  });

  it("excludes ingredients already marked have, but keeps bought ones (as bought)", () => {
    const w = week("2026-10-11", [batch("b1", "2026-10-13")], { boughtIngredients: ["rajma"] });
    const result = shoppingChecklist(new Date("2026-10-11T10:00:00"), [w], { "rajma-recipe": recipe() }, { rajma }, settings);
    expect(result.shortBefore).toHaveLength(1);
    expect(result.shortBefore[0].bought).toBe(true);

    const w2 = week("2026-10-11", [batch("b1", "2026-10-13")], { haveIngredients: ["rajma"] });
    const result2 = shoppingChecklist(new Date("2026-10-11T10:00:00"), [w2], { "rajma-recipe": recipe() }, { rajma }, settings);
    expect(result2.shortBefore).toHaveLength(0);
  });

  it("names which meals need an item", () => {
    const w = week("2026-10-11", [batch("b1", "2026-10-13")]);
    const result = shoppingChecklist(new Date("2026-10-11T10:00:00"), [w], { "rajma-recipe": recipe() }, { rajma }, settings);
    expect(result.shortBefore[0].neededFor).toEqual([{ date: "2026-10-13", slot: "dinner", recipeName: "Rajma" }]);
  });

  it("reports hasAnyPlan false when no batches exist anywhere", () => {
    const result = shoppingChecklist(new Date("2026-10-11T10:00:00"), [week("2026-10-11", [])], {}, {}, settings);
    expect(result.hasAnyPlan).toBe(false);
    expect(result.shortBefore).toHaveLength(0);
    expect(result.buyOnNextShop).toHaveLength(0);
  });
});
