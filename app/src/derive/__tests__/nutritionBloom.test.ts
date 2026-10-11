import { describe, expect, it } from "vitest";
import type { Batch, Ingredient, Recipe, Settings, Week } from "../../types/schema";
import { nutritionBloom } from "../nutritionBloom";

// 2026-10-11 is a Sunday; 10-14 is Wednesday; 10-17 is Saturday.

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

function week(id: string, batches: Batch[]): Week {
  return { id, householdSize: 2, batches, haveIngredients: [], boughtIngredients: [] };
}

function batch(id: string, date: string, slot: Batch["assignments"][number]["slot"]): Batch {
  return {
    id,
    recipeId: "rajma-recipe",
    cookDate: date,
    cookWhen: "evening",
    scale: 1,
    frozenPortions: 0,
    assignments: [{ date, slot }],
    cookedAt: `${date}T19:00:00`,
  };
}

describe("nutritionBloom", () => {
  it("today: uses the unprorated daily target and only today's data", () => {
    const b = batch("b1", "2026-10-11", "lunch");
    const log = { eaten: [{ date: "2026-10-11", slot: "lunch", batchId: "b1" }], prepDone: [] };
    const result = nutritionBloom(
      new Date("2026-10-11T12:00:00"),
      "today",
      [week("2026-10-11", [b])],
      { "rajma-recipe": recipe() },
      { rajma },
      log,
      settings,
    );

    const calories = result.petals.find((p) => p.key === "calories")!;
    expect(calories.low).toBe(1500);
    expect(calories.high).toBe(1600);
    expect(calories.actual).toBeCloseTo(666, 0);
    expect(calories.projected).toBeCloseTo(666, 0); // nothing else planned today
    expect(calories.colour).toBe("warn"); // 666 < 1500 * 0.85

    const fibre = result.petals.find((p) => p.key === "fibre")!;
    expect(fibre.colour).toBe("ok"); // 50g actual well over the 25g floor

    const veg = result.petals.find((p) => p.key === "vegetables")!;
    expect(veg.actual).toBe(0);
    expect(veg.colour).toBe("warn");

    // Veg is short by 100% of its target, the worst of any warn petal here
    // (calories is short by ~56%, protein ~47%, fat ~95%), so it headlines.
    expect(result.gapMessage).toContain("Vegetables");
    expect(result.gapMessage).toContain("short today");
  });

  it("flags calories over the max as 'over', never as a shortfall", () => {
    const big = recipe({ ingredients: [{ ingredientId: "rajma", qty: 1200, estimated: false }] });
    const b = batch("b1", "2026-10-11", "lunch");
    const log = { eaten: [{ date: "2026-10-11", slot: "lunch", batchId: "b1" }], prepDone: [] };
    const result = nutritionBloom(new Date("2026-10-11T12:00:00"), "today", [week("2026-10-11", [b])], { "rajma-recipe": big }, { rajma }, log, settings);
    const calories = result.petals.find((p) => p.key === "calories")!;
    expect(calories.actual).toBeGreaterThan(1600);
    expect(calories.colour).toBe("over");
  });

  it("week: prorates targets to days elapsed and separates past misses from future plan", () => {
    const sundayEaten = batch("sun", "2026-10-11", "lunch"); // logged eaten -> actual
    const mondayMissed = batch("mon", "2026-10-12", "dinner"); // past, never eaten -> neither
    const todayPlanned = batch("wed", "2026-10-14", "dinner"); // today, not yet eaten -> projected
    const thursdayPlanned = batch("thu", "2026-10-15", "lunch"); // future -> projected

    const log = { eaten: [{ date: "2026-10-11", slot: "lunch", batchId: "sun" }], prepDone: [] };
    const recipes = { "rajma-recipe": recipe() };
    const weeks = [week("2026-10-11", [sundayEaten, mondayMissed, todayPlanned, thursdayPlanned])];

    const result = nutritionBloom(new Date("2026-10-14T12:00:00"), "week", weeks, recipes, { rajma }, log, settings);
    const calories = result.petals.find((p) => p.key === "calories")!;

    // Sun -> Wed inclusive = 4 days elapsed.
    expect(calories.low).toBe(1500 * 4);
    expect(calories.actual).toBeCloseTo(666, 0); // only Sunday's logged meal
    expect(calories.projected).toBeCloseTo(666 * 3, 0); // + Wed + Thu, not Monday's miss
  });

  it("is on track when every petal is within tolerance", () => {
    const result = nutritionBloom(new Date("2026-10-11T12:00:00"), "today", [week("2026-10-11", [])], {}, {}, { eaten: [], prepDone: [] }, {
      ...settings,
      targets: { ...settings.targets, kcalMin: 0, kcalMax: 10000, proteinMin: 0, proteinMax: 10000, fibreMin: 0, fatPctMin: 0 },
      vegServingsMinPerDay: 0,
    });
    expect(result.petals.every((p) => p.colour === "ok")).toBe(true);
    expect(result.gapMessage).toBe("On track today.");
  });
});
