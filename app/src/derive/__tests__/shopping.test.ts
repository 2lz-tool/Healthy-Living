import { describe, expect, it } from "vitest";
import type { Ingredient, Recipe, Week } from "../../types/schema";
import { groupByAisle, roundShopQty, shoppingListForWeek } from "../shopping";

const onion: Ingredient = {
  id: "onion",
  name: "Onion",
  aisle: "produce",
  unit: "piece",
  gramsPerPiece: 110,
  per100g: { kcal: 40, protein: 1.1, carbs: 9, fat: 0.1, fibre: 1.7 },
  estimated: false,
};
const chicken: Ingredient = {
  id: "chicken",
  name: "Chicken",
  aisle: "meat_fish",
  unit: "g",
  per100g: { kcal: 150, protein: 20, carbs: 0, fat: 7, fibre: 0 },
  estimated: false,
};

function recipe(id: string, lines: { ingredientId: string; qty: number }[]): Recipe {
  return {
    id,
    familyId: null,
    name: id,
    axisValues: {},
    yieldServings: 2,
    ingredients: lines.map((l) => ({ ...l, estimated: false })),
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

const recipes = {
  curry: recipe("curry", [
    { ingredientId: "onion", qty: 3 },
    { ingredientId: "chicken", qty: 380 },
  ]),
};
const ingredients = { onion, chicken };

function week(overrides: Partial<Week> = {}): Week {
  return {
    id: "2026-10-11",
    householdSize: 2,
    batches: [],
    haveIngredients: [],
    boughtIngredients: [],
    ...overrides,
  };
}

describe("roundShopQty", () => {
  it("rounds pieces up to a whole number", () => {
    expect(roundShopQty(2.3, onion)).toBe(3);
  });
  it("rounds meat/fish up to the nearest 100g", () => {
    expect(roundShopQty(380, chicken)).toBe(400);
    expect(roundShopQty(401, chicken)).toBe(500);
  });
  it("returns 0 for a non-positive quantity rather than a negative shop line", () => {
    expect(roundShopQty(0, chicken)).toBe(0);
    expect(roundShopQty(-5, chicken)).toBe(0);
  });
});

describe("shoppingListForWeek", () => {
  it("sums ingredient quantities across batches, scaled, and rounds to shop units", () => {
    const w = week({
      batches: [
        {
          id: "b1",
          recipeId: "curry",
          cookDate: "2026-10-11",
          cookWhen: "evening",
          scale: 2,
          frozenPortions: 0,
          assignments: [{ date: "2026-10-12", slot: "dinner" }],
        },
      ],
    });
    const items = shoppingListForWeek(w, recipes, ingredients);
    const chickenItem = items.find((i) => i.ingredientId === "chicken")!;
    const onionItem = items.find((i) => i.ingredientId === "onion")!;
    // 380g * scale 2 = 760 -> rounds up to 800 (nearest 100g, meat_fish).
    expect(chickenItem.qty).toBe(800);
    // 3 pieces * scale 2 = 6 pieces, already whole.
    expect(onionItem.qty).toBe(6);
  });

  it("removes anything already marked have, and carries forward bought state", () => {
    const w = week({
      batches: [
        {
          id: "b1",
          recipeId: "curry",
          cookDate: "2026-10-11",
          cookWhen: "evening",
          scale: 1,
          frozenPortions: 0,
          assignments: [{ date: "2026-10-12", slot: "dinner" }],
        },
      ],
      haveIngredients: ["onion"],
      boughtIngredients: ["chicken"],
    });
    const items = shoppingListForWeek(w, recipes, ingredients);
    expect(items.find((i) => i.ingredientId === "onion")).toBeUndefined();
    expect(items.find((i) => i.ingredientId === "chicken")?.bought).toBe(true);
  });
});

describe("groupByAisle", () => {
  it("buckets items by aisle", () => {
    const grouped = groupByAisle([
      { ingredientId: "onion", name: "Onion", aisle: "produce", qty: 3, unit: "piece", bought: false },
      { ingredientId: "chicken", name: "Chicken", aisle: "meat_fish", qty: 400, unit: "g", bought: false },
    ]);
    expect(grouped.produce).toHaveLength(1);
    expect(grouped.meat_fish).toHaveLength(1);
  });
});
