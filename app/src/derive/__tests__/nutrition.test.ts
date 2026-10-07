import { describe, expect, it } from "vitest";
import type { Ingredient, Recipe } from "../../types/schema";
import { ingredientGrams, recipeNutritionPerServing, recipeVegGramsPerServing, sumPer100g } from "../nutrition";

const rice: Ingredient = {
  id: "rice",
  name: "Rice",
  aisle: "grains",
  unit: "g",
  per100g: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, fibre: 0.4 },
  estimated: false,
};

const egg: Ingredient = {
  id: "egg",
  name: "Egg",
  aisle: "dairy_eggs",
  unit: "piece",
  gramsPerPiece: 50,
  per100g: { kcal: 155, protein: 13, carbs: 1.1, fat: 11, fibre: 0 },
  estimated: false,
};

const carrot: Ingredient = {
  id: "carrot",
  name: "Carrot",
  aisle: "produce",
  unit: "g",
  per100g: { kcal: 41, protein: 0.9, carbs: 10, fat: 0.2, fibre: 2.8 },
  isVegetable: true,
  estimated: true,
};

function recipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "r1",
    familyId: null,
    name: "Test recipe",
    axisValues: {},
    yieldServings: 2,
    ingredients: [],
    steps: [],
    prepActions: [],
    shelfLifeDays: 1,
    freezable: false,
    slots: ["lunch"],
    activeMinutes: 10,
    source: { kind: "own" },
    status: "draft",
    ...overrides,
  };
}

describe("ingredientGrams", () => {
  it("passes through grams and ml 1:1", () => {
    expect(ingredientGrams(rice, 200)).toBe(200);
  });
  it("converts piece quantities via gramsPerPiece", () => {
    expect(ingredientGrams(egg, 4)).toBe(200);
  });
  it("treats a missing gramsPerPiece as 0, not a crash", () => {
    const noWeight: Ingredient = { ...egg, gramsPerPiece: undefined };
    expect(ingredientGrams(noWeight, 4)).toBe(0);
  });
});

describe("recipeNutritionPerServing", () => {
  it("sums ingredient nutrition at quantity and divides by yieldServings", () => {
    const r = recipe({
      yieldServings: 2,
      ingredients: [
        { ingredientId: "rice", qty: 200, estimated: false },
        { ingredientId: "egg", qty: 4, estimated: false },
      ],
    });
    const ingredients = { rice, egg };
    const { perServing, estimated } = recipeNutritionPerServing(r, ingredients);

    // 200g rice: 260 kcal. 4 eggs (200g): 310 kcal. Total 570, /2 servings = 285.
    expect(perServing.kcal).toBeCloseTo(285, 5);
    expect(estimated).toBe(false);
  });

  it("propagates estimated when any ingredient is estimated", () => {
    const r = recipe({
      ingredients: [
        { ingredientId: "rice", qty: 100, estimated: false },
        { ingredientId: "carrot", qty: 50, estimated: false },
      ],
    });
    const { estimated } = recipeNutritionPerServing(r, { rice, carrot });
    expect(estimated).toBe(true); // carrot.estimated is true
  });

  it("propagates estimated when a recipe-ingredient line itself is estimated", () => {
    const r = recipe({ ingredients: [{ ingredientId: "rice", qty: 100, estimated: true }] });
    const { estimated } = recipeNutritionPerServing(r, { rice });
    expect(estimated).toBe(true);
  });

  it("marks estimated (rather than throwing) when an ingredient id is missing from the library", () => {
    const r = recipe({ ingredients: [{ ingredientId: "ghost", qty: 100, estimated: false }] });
    const { estimated, perServing } = recipeNutritionPerServing(r, {});
    expect(estimated).toBe(true);
    expect(perServing.kcal).toBe(0);
  });
});

describe("recipeVegGramsPerServing", () => {
  it("sums only ingredients flagged isVegetable, divided by servings", () => {
    const r = recipe({
      yieldServings: 2,
      ingredients: [
        { ingredientId: "carrot", qty: 120, estimated: false },
        { ingredientId: "rice", qty: 200, estimated: false },
      ],
    });
    expect(recipeVegGramsPerServing(r, { carrot, rice })).toBe(60);
  });
});

describe("sumPer100g", () => {
  it("adds every field across a list", () => {
    const total = sumPer100g([
      { kcal: 10, protein: 1, carbs: 2, fat: 3, fibre: 4 },
      { kcal: 20, protein: 2, carbs: 3, fat: 4, fibre: 5 },
    ]);
    expect(total).toEqual({ kcal: 30, protein: 3, carbs: 5, fat: 7, fibre: 9 });
  });
});
