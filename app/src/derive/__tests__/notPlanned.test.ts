import { describe, expect, it } from "vitest";
import type { Batch, Recipe, Week } from "../../types/schema";
import { notPlannedOptions } from "../notPlanned";

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

function week(partial: Partial<Week> & { batches: Batch[] }): Week {
  return { id: "2026-10-11", householdSize: 2, haveIngredients: [], boughtIngredients: [], ...partial };
}

describe("notPlannedOptions", () => {
  it("offers a leftover batch with unassigned servings inside shelf life", () => {
    const batch: Batch = {
      id: "b1",
      recipeId: "rajma-recipe",
      cookDate: "2026-10-10",
      cookWhen: "evening",
      scale: 2, // yields 4 servings
      frozenPortions: 0,
      assignments: [{ date: "2026-10-10", slot: "dinner" }], // 2 servings used, 2 left
    };
    const options = notPlannedOptions("2026-10-11", "dinner", [week({ batches: [batch] })], { "rajma-recipe": recipe() });
    const leftover = options.find((o) => o.kind === "leftover");
    expect(leftover).toBeDefined();
    if (leftover?.kind === "leftover") {
      expect(leftover.portionsLeft).toBe(1);
      expect(leftover.shelfLifeEndsIso).toBe("2026-10-14");
    }
    expect(options.at(-1)?.kind).toBe("plan_properly");
  });

  it("excludes a leftover past its shelf life unless frozen", () => {
    const stale: Batch = {
      id: "b1",
      recipeId: "rajma-recipe",
      cookDate: "2026-09-01",
      cookWhen: "evening",
      scale: 2,
      frozenPortions: 0,
      assignments: [{ date: "2026-09-01", slot: "dinner" }],
    };
    const options = notPlannedOptions("2026-10-11", "dinner", [week({ batches: [stale] })], { "rajma-recipe": recipe() });
    expect(options.find((o) => o.kind === "leftover")).toBeUndefined();
  });

  it("keeps a frozen leftover regardless of age", () => {
    const frozen: Batch = {
      id: "b1",
      recipeId: "rajma-recipe",
      cookDate: "2026-09-01",
      cookWhen: "evening",
      scale: 2,
      frozenPortions: 2,
      assignments: [],
    };
    const options = notPlannedOptions("2026-10-11", "dinner", [week({ batches: [frozen] })], { "rajma-recipe": recipe() });
    const leftover = options.find((o) => o.kind === "leftover");
    expect(leftover).toBeDefined();
    if (leftover?.kind === "leftover") expect(leftover.shelfLifeEndsIso).toBeUndefined();
  });

  it("offers the quickest library recipe whose ingredients are all on hand, for the right slot", () => {
    const slow = recipe({ id: "slow", name: "Slow rajma", activeMinutes: 40, slots: ["dinner"] });
    const quick = recipe({ id: "quick", name: "Quick eggs", activeMinutes: 10, slots: ["dinner"], ingredients: [{ ingredientId: "egg", qty: 2, estimated: false }] });
    const wrongSlot = recipe({ id: "bfast", name: "Breakfast only", activeMinutes: 5, slots: ["breakfast"] });
    const missingIngredient = recipe({ id: "missing", name: "No paneer yet", activeMinutes: 1, slots: ["dinner"], ingredients: [{ ingredientId: "paneer", qty: 200, estimated: false }] });

    const w = week({ batches: [], haveIngredients: ["rajma"] });
    const w2 = week({ batches: [], boughtIngredients: ["egg"] });
    const options = notPlannedOptions("2026-10-11", "dinner", [w, w2], { slow, quick, bfast: wrongSlot, missing: missingIngredient });
    const fromLibrary = options.find((o) => o.kind === "from_library");
    expect(fromLibrary).toBeDefined();
    if (fromLibrary?.kind === "from_library") expect(fromLibrary.recipeName).toBe("Quick eggs");
  });

  it("offers only plan_properly when there are no leftovers or ready-to-cook recipes", () => {
    const options = notPlannedOptions("2026-10-11", "dinner", [week({ batches: [] })], { "rajma-recipe": recipe() });
    expect(options).toEqual([{ kind: "plan_properly" }]);
  });
});
