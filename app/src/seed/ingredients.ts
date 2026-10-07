import type { Ingredient, Per100g } from "../types/schema";

/**
 * v1 only ever recorded whole-meal calorie totals, never ingredient-level
 * nutrition — so every per100g figure here is new, populated from general
 * nutrition knowledge for common ingredients rather than a literal
 * line-by-line lookup against NIN 2017 or USDA FoodData Central (the
 * sources spec section 3 names). All of it is marked `estimated: true`
 * for that reason. Treat this file as a first pass to correct over time
 * via the recipe editor's per-quantity "estimated" toggle (spec section
 * 5), not as verified data.
 */
const UNVERIFIED_SOURCE =
  "General nutrition reference values for this ingredient, not individually checked against NIN 2017 or USDA FoodData Central.";

function ing(
  id: string,
  name: string,
  aisle: Ingredient["aisle"],
  unit: Ingredient["unit"],
  per100g: Per100g,
  opts: Partial<Ingredient> = {},
): Ingredient {
  return {
    id,
    name,
    aisle,
    unit,
    per100g,
    estimated: true,
    source: UNVERIFIED_SOURCE,
    ...opts,
  };
}

const ZERO: Per100g = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };

export const INGREDIENTS: Ingredient[] = [
  // Grains
  ing("idli-rice", "Idli rice", "grains", "g", { kcal: 356, protein: 7, carbs: 79, fat: 0.5, fibre: 1 }),
  ing("poha", "Thick poha", "grains", "g", { kcal: 346, protein: 6.6, carbs: 76, fat: 1, fibre: 2 }),
  ing("rolled-oats", "Rolled oats", "grains", "g", { kcal: 389, protein: 16.9, carbs: 66, fat: 6.9, fibre: 10.6 }),
  ing("besan", "Besan", "grains", "g", { kcal: 387, protein: 22, carbs: 58, fat: 6.7, fibre: 11 }),
  ing("rice-paper", "Rice paper sheets", "other", "piece", { kcal: 27, protein: 0.02, carbs: 6.6, fat: 0.01, fibre: 0.07 }, { gramsPerPiece: 8 }),
  ing(
    "idli-batter",
    "Idli batter (leftover)",
    "other",
    "g",
    { kcal: 180, protein: 6, carbs: 35, fat: 1, fibre: 2 },
    {
      source:
        "Rough blend estimate for rice/urad-dal/poha batter. Uttapam's own ingredient list excludes this — see BUILD1-SPEC checkpoint notes on why it isn't in the shopping sum.",
    },
  ),

  // Legumes
  ing("urad-dal", "Urad dal", "legumes", "g", { kcal: 341, protein: 25, carbs: 59, fat: 1.6, fibre: 18 }, { proteinSource: "legume" }),
  ing("rajma", "Rajma", "legumes", "g", { kcal: 333, protein: 24, carbs: 60, fat: 0.8, fibre: 25 }, { proteinSource: "legume" }),
  ing("kabuli-chana", "Kabuli chana", "legumes", "g", { kcal: 364, protein: 19, carbs: 61, fat: 6, fibre: 17 }, { proteinSource: "legume" }),
  ing("toor-dal", "Toor dal", "legumes", "g", { kcal: 343, protein: 22, carbs: 63, fat: 1.5, fibre: 15 }, { proteinSource: "legume" }),
  ing("moong-dal", "Yellow moong dal", "legumes", "g", { kcal: 347, protein: 24, carbs: 59, fat: 1.2, fibre: 16 }, { proteinSource: "legume" }),

  // Meat / fish
  ing("chicken-mince", "Chicken mince", "meat_fish", "g", { kcal: 143, protein: 17, carbs: 0, fat: 8, fibre: 0 }, { proteinSource: "chicken" }),
  ing("fish-surmai-basa", "Surmai or basa", "meat_fish", "g", { kcal: 105, protein: 19, carbs: 0, fat: 3, fibre: 0 }, { proteinSource: "fish" }),
  ing("country-chicken", "Country chicken", "meat_fish", "g", { kcal: 150, protein: 20, carbs: 0, fat: 7, fibre: 0 }, { proteinSource: "chicken" }),
  ing("chicken-curry-cut", "Chicken, curry cut", "meat_fish", "g", { kcal: 215, protein: 18, carbs: 0, fat: 15, fibre: 0 }, { proteinSource: "chicken" }),

  // Dairy / eggs
  ing("greek-yogurt", "Greek yogurt", "dairy_eggs", "g", { kcal: 59, protein: 10, carbs: 3.6, fat: 0.4, fibre: 0 }, { proteinSource: "dairy" }),
  ing("milk", "Milk", "dairy_eggs", "ml", { kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fibre: 0 }, { proteinSource: "dairy" }),
  ing("curd", "Curd", "dairy_eggs", "g", { kcal: 60, protein: 3.5, carbs: 4.7, fat: 3.3, fibre: 0 }, { proteinSource: "dairy" }),
  ing("ghee", "Ghee", "oils", "g", { kcal: 900, protein: 0, carbs: 0, fat: 100, fibre: 0 }),
  ing("eggs", "Eggs", "dairy_eggs", "piece", { kcal: 155, protein: 13, carbs: 1.1, fat: 11, fibre: 0 }, { gramsPerPiece: 50, proteinSource: "egg" }),

  // Produce
  ing("onion", "Onion", "produce", "piece", { kcal: 40, protein: 1.1, carbs: 9, fat: 0.1, fibre: 1.7 }, { gramsPerPiece: 110, isVegetable: true }),
  ing("tomato", "Tomato", "produce", "piece", { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fibre: 1.2 }, { gramsPerPiece: 120, isVegetable: true }),
  ing("cucumber", "Cucumber", "produce", "piece", { kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fibre: 0.5 }, { gramsPerPiece: 150, isVegetable: true }),
  ing("carrot", "Carrot", "produce", "piece", { kcal: 41, protein: 0.9, carbs: 10, fat: 0.2, fibre: 2.8 }, { gramsPerPiece: 60, isVegetable: true }),
  ing("spinach", "Spinach", "produce", "g", { kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fibre: 2.2 }, { isVegetable: true }),
  ing("banana", "Banana", "produce", "piece", { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, fibre: 2.6 }, { gramsPerPiece: 120 }),
  ing("spring-onion", "Spring onion", "produce", "piece", { kcal: 32, protein: 1.8, carbs: 7.3, fat: 0.2, fibre: 2.6 }, { gramsPerPiece: 10, isVegetable: true }),
  ing("coriander-leaves", "Coriander", "produce", "g", { kcal: 23, protein: 2.1, carbs: 3.7, fat: 0.5, fibre: 2.8 }, { isVegetable: true }),
  ing("green-chilli", "Green chilli", "produce", "piece", { kcal: 40, protein: 2, carbs: 9, fat: 0.2, fibre: 1.5 }, { gramsPerPiece: 5, isVegetable: true }),
  ing("curry-leaves", "Curry leaves", "produce", "g", { kcal: 108, protein: 6, carbs: 18, fat: 1, fibre: 6 }, { isVegetable: true }),
  ing("ginger", "Ginger", "produce", "g", { kcal: 80, protein: 1.8, carbs: 18, fat: 0.8, fibre: 2 }),
  ing("garlic", "Garlic", "produce", "piece", { kcal: 149, protein: 6.4, carbs: 33, fat: 0.5, fibre: 2.1 }, { gramsPerPiece: 3 }),
  ing("lemon", "Lemon", "produce", "piece", { kcal: 29, protein: 1.1, carbs: 9, fat: 0.3, fibre: 2.8 }, { gramsPerPiece: 60 }),
  ing("potato", "Potato", "produce", "piece", { kcal: 77, protein: 2, carbs: 17, fat: 0.1, fibre: 2.2 }, { gramsPerPiece: 150 }),

  // Spices / pantry
  ing("salt", "Salt", "spices", "g", ZERO, { estimated: false, source: "Salt has no macronutrient content." }),
  ing("black-salt", "Black salt", "spices", "g", ZERO, { estimated: false, source: "Mineral salt, no macronutrient content." }),
  ing("fenugreek-seeds", "Fenugreek seeds", "spices", "g", { kcal: 323, protein: 23, carbs: 58, fat: 6, fibre: 25 }),
  ing("roasted-peanuts", "Roasted peanuts", "other", "g", { kcal: 567, protein: 25, carbs: 16, fat: 49, fibre: 8 }),
  ing("dried-red-chilli", "Dried red chillies", "spices", "piece", { kcal: 6, protein: 0.3, carbs: 1, fat: 0.3, fibre: 0.6 }, { gramsPerPiece: 2 }),
  ing("tamarind", "Tamarind", "other", "g", { kcal: 239, protein: 2.8, carbs: 62, fat: 0.6, fibre: 5 }),
  ing("mustard-seeds", "Mustard seeds", "spices", "g", { kcal: 508, protein: 26, carbs: 28, fat: 36, fibre: 12 }),
  ing("oil", "Oil", "oils", "ml", { kcal: 884, protein: 0, carbs: 0, fat: 100, fibre: 0 }),
  ing("ginger-garlic-paste", "Ginger garlic paste", "produce", "g", { kcal: 75, protein: 3, carbs: 15, fat: 0.5, fibre: 2 }),
  ing("turmeric", "Turmeric", "spices", "g", { kcal: 312, protein: 9.7, carbs: 67, fat: 3.3, fibre: 23 }),
  ing("coriander-powder", "Coriander powder", "spices", "g", { kcal: 298, protein: 12, carbs: 55, fat: 17, fibre: 42 }),
  ing("red-chilli-powder", "Red chilli powder", "spices", "g", { kcal: 282, protein: 14, carbs: 50, fat: 14, fibre: 30 }),
  ing("garam-masala", "Garam masala", "spices", "g", { kcal: 379, protein: 15, carbs: 50, fat: 15, fibre: 25 }),
  ing("rajma-masala", "Rajma masala", "spices", "g", { kcal: 350, protein: 10, carbs: 55, fat: 12, fibre: 20 }),
  ing("chana-masala-spice", "Chana masala (spice blend)", "spices", "g", { kcal: 350, protein: 10, carbs: 55, fat: 12, fibre: 20 }),
  ing("amchur", "Amchur", "spices", "g", { kcal: 300, protein: 2.3, carbs: 74, fat: 0.4, fibre: 13 }),
  ing("black-tea-bag", "Black tea bag", "other", "piece", { kcal: 1, protein: 0.03, carbs: 0.2, fat: 0, fibre: 0 }, { gramsPerPiece: 2 }),
  ing("cumin-seeds", "Cumin seeds", "spices", "g", { kcal: 375, protein: 18, carbs: 44, fat: 22, fibre: 11 }),
  ing("roasted-jeera-powder", "Roasted jeera powder", "spices", "g", { kcal: 375, protein: 18, carbs: 44, fat: 22, fibre: 11 }),
  ing("black-pepper", "Black pepper", "spices", "g", { kcal: 251, protein: 10, carbs: 64, fat: 3.3, fibre: 25 }),
  ing("soy-sauce", "Soy sauce", "other", "ml", { kcal: 53, protein: 8, carbs: 4.9, fat: 0.1, fibre: 0.8 }),
  ing("sesame-oil", "Sesame oil", "oils", "ml", { kcal: 884, protein: 0, carbs: 0, fat: 100, fibre: 0 }),
  ing("chia-seeds", "Chia seeds", "other", "g", { kcal: 486, protein: 17, carbs: 42, fat: 31, fibre: 34 }),
  ing("cinnamon", "Cinnamon", "spices", "g", { kcal: 247, protein: 4, carbs: 81, fat: 1.2, fibre: 53 }),
  ing("peanut-butter", "Peanut butter", "other", "g", { kcal: 588, protein: 25, carbs: 20, fat: 50, fibre: 6 }),
  ing("ajwain", "Ajwain", "spices", "g", { kcal: 305, protein: 15.9, carbs: 38, fat: 25, fibre: 22 }),
];

export const INGREDIENTS_BY_ID: Record<string, Ingredient> = Object.fromEntries(
  INGREDIENTS.map((i) => [i.id, i]),
);
