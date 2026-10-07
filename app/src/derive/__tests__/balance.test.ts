import { describe, expect, it } from "vitest";
import type { DayTotals } from "../dayTotals";
import type { Ingredient, Recipe, Settings, Week } from "../../types/schema";
import { dayBalanceChecks, weekBalanceChecks } from "../balance";

const settings: Settings = {
  householdSize: 2,
  targets: { kcalMin: 1500, kcalMax: 1600, proteinMin: 90, proteinMax: 100 },
  mealProteinMin: 25,
  vegServingGrams: 80,
  vegServingsMinPerDay: 3,
  maxSameProteinSourceDays: 4,
  prepDays: ["sun", "wed", "fri", "sat"],
  reminderTime: "19:00",
  neverSuggest: [],
};

function day(overrides: Partial<DayTotals> = {}): DayTotals {
  return {
    date: "2026-10-11",
    totals: { kcal: 1550, protein: 95, carbs: 0, fat: 0, fibre: 0 },
    vegGrams: 300,
    estimated: false,
    meals: [],
    ...overrides,
  };
}

describe("dayBalanceChecks", () => {
  it("is all ok within target", () => {
    const results = dayBalanceChecks(day(), "Sunday", settings);
    expect(results.every((r) => r.level === "ok")).toBe(true);
  });

  it("warns with a concrete shortfall number when protein is low", () => {
    const results = dayBalanceChecks(
      day({ totals: { kcal: 1550, protein: 64, carbs: 0, fat: 0, fibre: 0 } }),
      "Thursday",
      settings,
    );
    const warn = results.find((r) => r.message.includes("protein"))!;
    expect(warn.level).toBe("warn");
    expect(warn.message).toBe("Thursday: 64 g protein, 26 short.");
  });

  it("warns on a specific meal below mealProteinMin, naming the dish", () => {
    const results = dayBalanceChecks(
      day({
        meals: [
          { slot: "lunch", batchId: "b1", recipeId: "chana", recipeName: "chana", totals: { kcal: 300, protein: 14, carbs: 0, fat: 0, fibre: 0 }, vegGrams: 0, estimated: false },
        ],
      }),
      "Thursday",
      settings,
    );
    const warn = results.find((r) => r.message.includes("Lunch"))!;
    expect(warn.message).toBe("Thursday: Lunch is chana at 14 g protein.");
  });

  it("warns when kcal is outside the target band, both directions", () => {
    const under = dayBalanceChecks(day({ totals: { kcal: 1000, protein: 95, carbs: 0, fat: 0, fibre: 0 } }), "D", settings);
    const over = dayBalanceChecks(day({ totals: { kcal: 2000, protein: 95, carbs: 0, fat: 0, fibre: 0 } }), "D", settings);
    expect(under.find((r) => r.message.includes("kcal"))?.level).toBe("warn");
    expect(over.find((r) => r.message.includes("kcal"))?.level).toBe("warn");
  });

  it("warns when vegetables are under the daily target", () => {
    const results = dayBalanceChecks(day({ vegGrams: 100 }), "D", settings);
    const warn = results.find((r) => r.message.includes("vegetables"))!;
    expect(warn.level).toBe("warn");
    expect(warn.message).toContain("target 240 g");
  });
});

describe("weekBalanceChecks", () => {
  const chicken: Ingredient = {
    id: "chicken",
    name: "Chicken",
    aisle: "meat_fish",
    unit: "g",
    per100g: { kcal: 150, protein: 20, carbs: 0, fat: 7, fibre: 0 },
    proteinSource: "chicken",
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

  function recipe(id: string, ingredientId: string): Recipe {
    return {
      id,
      familyId: null,
      name: id,
      axisValues: {},
      yieldServings: 2,
      ingredients: [{ ingredientId, qty: 300, estimated: false }],
      steps: [],
      prepActions: [],
      shelfLifeDays: 2,
      freezable: false,
      slots: ["dinner"],
      activeMinutes: 10,
      source: { kind: "own" },
      status: "draft",
    };
  }

  function week(assignmentsCount: number, recipeId: string): Week {
    return {
      id: "2026-10-11",
      householdSize: 2,
      batches: [
        {
          id: "b1",
          recipeId,
          cookDate: "2026-10-11",
          cookWhen: "evening",
          scale: 1,
          frozenPortions: 0,
          assignments: Array.from({ length: assignmentsCount }, (_, i) => ({
            date: `2026-10-${12 + i}`,
            slot: "dinner" as const,
          })),
        },
      ],
      haveIngredients: [],
      boughtIngredients: [],
    };
  }

  it("warns when one protein source covers more days than the limit", () => {
    const w = week(5, "chicken-recipe");
    const results = weekBalanceChecks(w, { "chicken-recipe": recipe("chicken-recipe", "chicken") }, { chicken }, settings);
    const warn = results.find((r) => r.message.includes("chicken"))!;
    expect(warn.level).toBe("warn");
    expect(warn.message).toContain("5 of 7 days");
  });

  it("warns when fewer than two protein sources are used all week", () => {
    const w = week(2, "chicken-recipe");
    const results = weekBalanceChecks(w, { "chicken-recipe": recipe("chicken-recipe", "chicken") }, { chicken }, settings);
    expect(results.some((r) => r.level === "warn" && r.message.includes("only one protein source"))).toBe(true);
  });

  it("is ok with two or more protein sources, none over the day limit", () => {
    const w: Week = {
      id: "2026-10-11",
      householdSize: 2,
      batches: [
        { id: "b1", recipeId: "chicken-recipe", cookDate: "2026-10-11", cookWhen: "evening", scale: 1, frozenPortions: 0, assignments: [{ date: "2026-10-12", slot: "dinner" }] },
        { id: "b2", recipeId: "dal-recipe", cookDate: "2026-10-11", cookWhen: "evening", scale: 1, frozenPortions: 0, assignments: [{ date: "2026-10-13", slot: "dinner" }] },
      ],
      haveIngredients: [],
      boughtIngredients: [],
    };
    const results = weekBalanceChecks(
      w,
      { "chicken-recipe": recipe("chicken-recipe", "chicken"), "dal-recipe": recipe("dal-recipe", "dal") },
      { chicken, dal },
      settings,
    );
    expect(results.every((r) => r.level === "ok")).toBe(true);
  });
});
