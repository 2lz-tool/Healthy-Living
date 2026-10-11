import { describe, expect, it } from "vitest";
import type { Batch, Ingredient, Recipe, Settings, Week } from "../../types/schema";
import { nextMeal } from "../nextMeal";

// 2026-10-11 is a Sunday.

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
    slots: ["dinner", "lunch"],
    activeMinutes: 20,
    source: { kind: "own" },
    status: "draft",
    ...overrides,
  };
}

function week(batches: Batch[], id = "2026-10-11"): Week {
  return { id, householdSize: 2, batches, haveIngredients: [], boughtIngredients: [] };
}

const emptyLog = { eaten: [], prepDone: [] };

describe("nextMeal", () => {
  it("is ready when the chosen slot's batch has cookedAt", () => {
    const batch: Batch = {
      id: "b1",
      recipeId: "rajma-recipe",
      cookDate: "2026-10-10",
      cookWhen: "evening",
      scale: 1,
      frozenPortions: 0,
      assignments: [{ date: "2026-10-11", slot: "lunch" }],
      cookedAt: "2026-10-10T19:00:00",
    };
    const result = nextMeal(new Date("2026-10-11T12:00:00"), [week([batch])], { "rajma-recipe": recipe() }, { rajma }, settings, emptyLog);
    expect(result.state).toBe("ready");
    if (result.state === "ready") {
      expect(result.date).toBe("2026-10-11");
      expect(result.slot).toBe("lunch");
      expect(result.recipeName).toBe("Rajma");
      expect(result.kcalPerPerson).toBeCloseTo(666, 0);
      expect(result.proteinPerPerson).toBeCloseTo(48, 0);
    }
    // "then" is the next candidate slot after lunch today: snack, unassigned.
    expect(result.then?.slot).toBe("snack");
    expect(result.then?.state).toBe("not_planned");
  });

  it("is cook_first when the chosen slot's batch has no cookedAt, with overdue prep flagged", () => {
    const batch: Batch = {
      id: "b1",
      recipeId: "rajma-recipe",
      cookDate: "2026-10-11",
      cookWhen: "evening",
      scale: 1,
      frozenPortions: 0,
      assignments: [{ date: "2026-10-11", slot: "dinner" }],
    };
    const soaker = recipe({ prepActions: [{ kind: "soak", leadHours: 2, text: "Soak the rajma" }] });
    // 7pm: breakfast/lunch/snack have all passed their slot+60min window, so
    // dinner (20:30) is the first remaining candidate even though unassigned
    // slots earlier today exist.
    const result = nextMeal(new Date("2026-10-11T19:00:00"), [week([batch])], { "rajma-recipe": soaker }, { rajma }, settings, emptyLog);
    expect(result.state).toBe("cook_first");
    if (result.state === "cook_first") {
      expect(result.slot).toBe("dinner");
      expect(result.pendingPrepActions).toHaveLength(1);
      expect(result.pendingPrepActions[0].overdue).toBe(true);
    }
  });

  it("is thaw when the assignment falls in the batch's frozen tail", () => {
    const batch: Batch = {
      id: "b1",
      recipeId: "rajma-recipe",
      cookDate: "2026-10-01",
      cookWhen: "evening",
      scale: 3,
      frozenPortions: 4, // covers 2 of the household-size-2 assignments
      assignments: [
        { date: "2026-10-05", slot: "dinner" },
        { date: "2026-10-08", slot: "dinner" },
        { date: "2026-10-11", slot: "dinner" },
      ],
      cookedAt: "2026-10-01T19:00:00",
    };
    const result = nextMeal(new Date("2026-10-11T19:00:00"), [week([batch])], { "rajma-recipe": recipe() }, { rajma }, settings, emptyLog);
    expect(result.state).toBe("thaw");
    if (result.state === "thaw") {
      expect(result.date).toBe("2026-10-11");
      expect(result.recipeName).toBe("Rajma");
    }
  });

  it("is not_planned for an empty slot when something else is planned within 7 days", () => {
    const batch: Batch = {
      id: "b1",
      recipeId: "rajma-recipe",
      cookDate: "2026-10-12",
      cookWhen: "evening",
      scale: 1,
      frozenPortions: 0,
      assignments: [{ date: "2026-10-12", slot: "lunch" }],
    };
    const result = nextMeal(new Date("2026-10-11T06:00:00"), [week([batch])], { "rajma-recipe": recipe() }, { rajma }, settings, emptyLog);
    expect(result.state).toBe("not_planned");
    if (result.state === "not_planned") {
      expect(result.date).toBe("2026-10-11");
      expect(result.slot).toBe("breakfast");
    }
  });

  it("is nothing_planned when no assignment exists anywhere in the next 7 days", () => {
    const result = nextMeal(new Date("2026-10-11T06:00:00"), [week([])], {}, {}, settings, emptyLog);
    expect(result.state).toBe("nothing_planned");
  });

  it("skips a slot already logged eaten", () => {
    const batch: Batch = {
      id: "b1",
      recipeId: "rajma-recipe",
      cookDate: "2026-10-10",
      cookWhen: "evening",
      scale: 1,
      frozenPortions: 0,
      assignments: [
        { date: "2026-10-11", slot: "breakfast" },
        { date: "2026-10-11", slot: "lunch" },
      ],
      cookedAt: "2026-10-10T19:00:00",
    };
    const log = { eaten: [{ date: "2026-10-11", slot: "breakfast", batchId: "b1" }], prepDone: [] };
    const result = nextMeal(new Date("2026-10-11T06:00:00"), [week([batch])], { "rajma-recipe": recipe() }, { rajma }, settings, log);
    expect(result.state).toBe("ready");
    if (result.state === "ready") expect(result.slot).toBe("lunch");
  });
});
