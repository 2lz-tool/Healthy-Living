import { describe, expect, it } from "vitest";
import type { Batch, Ingredient, Recipe, Week } from "../../types/schema";
import { tomorrowReminderContent } from "../reminder";

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
    prepActions: [{ kind: "soak", leadHours: 12, text: "Soak the rajma" }],
    shelfLifeDays: 4,
    freezable: false,
    slots: ["dinner"],
    activeMinutes: 20,
    source: { kind: "own" },
    status: "draft",
    ...overrides,
  };
}

function week(batches: Batch[]): Week {
  return { id: "2026-10-11", householdSize: 2, batches, haveIngredients: [], boughtIngredients: [] };
}

describe("tomorrowReminderContent", () => {
  it("buys ingredients for batches cooking D+1, skipping have/bought", () => {
    const w = week([
      {
        id: "b1",
        recipeId: "rajma-recipe",
        cookDate: "2026-10-12",
        cookWhen: "evening",
        scale: 1,
        frozenPortions: 0,
        assignments: [{ date: "2026-10-13", slot: "dinner" }],
      },
    ]);
    const content = tomorrowReminderContent("2026-10-11", [w], { "rajma-recipe": recipe() }, { rajma });
    expect(content.date).toBe("2026-10-12");
    expect(content.buy).toHaveLength(1);
    expect(content.buy[0].qty).toBe(400);
  });

  it("puts a prep action in prepTonight when its lead time starts on or before D evening", () => {
    // Cooking evening of D+1 (19:00), with a 36h lead, means prep must start
    // 2026-10-11 07:00 — before D's evening (2026-10-11 19:00) — so it
    // belongs in tonight's reminder for D = 2026-10-11.
    const w = week([
      {
        id: "b1",
        recipeId: "rajma-recipe",
        cookDate: "2026-10-12",
        cookWhen: "evening",
        scale: 1,
        frozenPortions: 0,
        assignments: [{ date: "2026-10-13", slot: "dinner" }],
      },
    ]);
    const longLead = recipe({ prepActions: [{ kind: "soak", leadHours: 36, text: "Soak the rajma" }] });
    const content = tomorrowReminderContent("2026-10-11", [w], { "rajma-recipe": longLead }, { rajma });
    expect(content.prepTonight).toHaveLength(1);
    expect(content.prepTonight[0].text).toBe("Soak the rajma");
  });

  it("does not list a prep action whose lead time starts after D evening", () => {
    const w = week([
      {
        id: "b1",
        recipeId: "rajma-recipe",
        cookDate: "2026-10-12",
        cookWhen: "morning",
        scale: 1,
        frozenPortions: 0,
        assignments: [{ date: "2026-10-13", slot: "dinner" }],
      },
    ]);
    const shortLead = recipe({ prepActions: [{ kind: "soak", leadHours: 1, text: "Quick soak" }] });
    const content = tomorrowReminderContent("2026-10-11", [w], { "rajma-recipe": shortLead }, { rajma });
    expect(content.prepTonight).toHaveLength(0);
  });

  it("lists frozen portions assigned on D+1", () => {
    const w = week([
      {
        id: "b1",
        recipeId: "rajma-recipe",
        cookDate: "2026-10-05",
        cookWhen: "evening",
        scale: 1,
        frozenPortions: 2,
        assignments: [{ date: "2026-10-12", slot: "dinner" }],
      },
    ]);
    const content = tomorrowReminderContent("2026-10-11", [w], { "rajma-recipe": recipe() }, { rajma });
    expect(content.moveFromFreezer).toHaveLength(1);
    expect(content.moveFromFreezer[0].portions).toBe(2);
  });

  it("is empty, not scheduled, when nothing applies to D+1", () => {
    const content = tomorrowReminderContent("2026-10-11", [week([])], {}, {});
    expect(content.isEmpty).toBe(true);
  });
});
