// Data model per BUILD1-SPEC.md section 3. All IDs are short slugs.
// All quantities are metric. Nutrition is per 100 g or per unit at
// ingredient level — recipe and day totals are always derived, never typed.

export type Aisle =
  | "produce"
  | "meat_fish"
  | "dairy_eggs"
  | "grains"
  | "legumes"
  | "spices"
  | "oils"
  | "frozen"
  | "other";

export type Unit = "g" | "ml" | "piece";

export type ProteinSource =
  | "chicken"
  | "fish"
  | "egg"
  | "legume"
  | "dairy"
  | "red_meat";

export type Per100g = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
};

export type Ingredient = {
  id: string;
  name: string;
  aisle: Aisle;
  unit: Unit;
  /** Required when unit is "piece", e.g. egg = 50. */
  gramsPerPiece?: number;
  per100g: Per100g;
  proteinSource?: ProteinSource;
  /** Counts toward veg servings. */
  isVegetable?: boolean;
  /** Nutrition not yet verified against a source. */
  estimated: boolean;
  /** Free-text note on where the per100g figures came from. */
  source?: string;
};

export type FamilyAxis = {
  key: string;
  label: string;
  options: string[];
};

export type Family = {
  id: string;
  name: string;
  /** One paragraph: what every variant shares. */
  skeleton: string;
  axes: FamilyAxis[];
};

export type Slot = "breakfast" | "lunch" | "dinner" | "snack" | "side";

export type RecipeIngredient = {
  ingredientId: string;
  qty: number;
  note?: string;
  estimated: boolean;
};

export type RecipeStep = {
  id: string;
  text: string;
  minutes?: number;
  /** Reserved for Build 3 (technique layer). Always undefined now. */
  techniqueId?: string;
};

export type PrepAction = {
  kind: "soak" | "marinate" | "thaw" | "ferment" | "grind" | "other";
  leadHours: number;
  text: string;
};

export type RecipeSource = {
  kind: "own" | "youtube" | "instagram" | "web" | "other";
  /** Build 2 fills this in via share-sheet import. */
  url?: string;
};

export type RecipeStatus = "draft" | "verified";

export type Recipe = {
  id: string;
  /** null allowed for one-offs like raita that don't belong to a family. */
  familyId: string | null;
  name: string;
  axisValues: Record<string, string>;
  /** At the ingredient quantities below. */
  yieldServings: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  prepActions: PrepAction[];
  /** Refrigerated. 0 = eat same session (e.g. ragi mudda). */
  shelfLifeDays: number;
  freezable: boolean;
  slots: Slot[];
  activeMinutes: number;
  source: RecipeSource;
  /** "verified" = Tulika confirmed the quantities. */
  status: RecipeStatus;
};

export type BatchAssignment = {
  date: string; // ISO date
  slot: Slot;
};

export type Batch = {
  id: string;
  recipeId: string;
  cookDate: string; // ISO date
  cookWhen: "morning" | "evening";
  /** Multiplier on recipe yield. */
  scale: number;
  /** Portions frozen the same day, exempt from shelf life. */
  frozenPortions: number;
  assignments: BatchAssignment[];
};

export type Week = {
  /** ISO date of the Sunday it starts, e.g. "2026-10-11". */
  id: string;
  householdSize: number;
  batches: Batch[];
  /** Ingredient IDs ticked "already have" this week. */
  haveIngredients: string[];
  boughtIngredients: string[];
};

export type LogEatenEntry = {
  date: string;
  slot: string;
  batchId: string;
};

export type LogPrepEntry = {
  date: string;
  key: string;
};

export type Log = {
  eaten: LogEatenEntry[];
  prepDone: LogPrepEntry[];
};

export type BalanceTargets = {
  kcalMin: number;
  kcalMax: number;
  proteinMin: number;
  proteinMax: number;
};

export type DayOfWeek = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type Settings = {
  householdSize: number;
  targets: BalanceTargets;
  /** Grams — lunch and dinner only. */
  mealProteinMin: number;
  vegServingGrams: number;
  vegServingsMinPerDay: number;
  maxSameProteinSourceDays: number;
  prepDays: DayOfWeek[];
  /** "HH:MM", 24h. */
  reminderTime: string;
  /** Dislikes, stored now, used by Build 4's plan generator. */
  neverSuggest: string[];
};

/** The single on-disk document: mealplan.json. */
export type Store = {
  schemaVersion: number;
  ingredients: Record<string, Ingredient>;
  families: Record<string, Family>;
  recipes: Record<string, Recipe>;
  /** Keyed by Week.id. */
  weeks: Record<string, Week>;
  log: Log;
  settings: Settings;
};

export const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  householdSize: 2,
  targets: { kcalMin: 1500, kcalMax: 1600, proteinMin: 90, proteinMax: 100 },
  mealProteinMin: 25,
  vegServingGrams: 80,
  vegServingsMinPerDay: 3,
  maxSameProteinSourceDays: 4,
  prepDays: ["sun", "wed", "fri", "sat"],
  reminderTime: "19:00",
  neverSuggest: [
    "paneer",
    "egg bhurji",
    "egg curry",
    "quinoa",
    "millet",
    "tofu stir fry",
    "sambar",
  ],
};

export function emptyStore(): Store {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ingredients: {},
    families: {},
    recipes: {},
    weeks: {},
    log: { eaten: [], prepDone: [] },
    settings: { ...DEFAULT_SETTINGS },
  };
}
