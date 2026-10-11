import type { Ingredient, Log, Recipe, Settings, Week } from "../types/schema";
import { dayTotalsForDate } from "./dayTotals";
import { addDaysIso, daysBetween, sundayOfWeekIso } from "./dates";

export type NutrientKey = "calories" | "protein" | "carbs" | "fat" | "fibre" | "vegetables";

export type PetalColour = "ok" | "warn" | "over";

export type Petal = {
  key: NutrientKey;
  label: string;
  unit: "kcal" | "g" | "servings";
  /** Radius-1.0 reference: the midpoint of the target range, or the single
   * target for a nutrient with only a floor or ceiling. */
  ideal: number;
  /** The tolerance ring band, for nutrients with a min and max. */
  low: number;
  high: number | null;
  actual: number;
  projected: number;
  colour: PetalColour;
  estimated: boolean;
};

export type NutritionBloom = {
  range: "week" | "today";
  petals: Petal[];
  gapMessage: string;
};

const KCAL_PER_G_CARB = 4;
const KCAL_PER_G_FAT = 9;
const UNDER_TOLERANCE = 0.85; // "under by more than 15%"

function classify(actual: number, low: number, high: number | null, redEligible: boolean): PetalColour {
  if (actual < low * UNDER_TOLERANCE) return "warn";
  if (redEligible && high !== null && actual > high) return "over";
  return "ok";
}

/** LANDING-HANDOFF.md section 4.3 (Gate N pending for the visual form — this
 * is the data behind it, independent of whether it renders as a radial
 * bloom or something else). `range` "week" prorates every target to the
 * number of days elapsed since the week's Sunday (today counts as one
 * elapsed day); "today" uses the full-day target unprorated. */
export function nutritionBloom(
  now: Date,
  range: "week" | "today",
  weeks: Week[],
  recipes: Record<string, Recipe>,
  ingredients: Record<string, Ingredient>,
  log: Log,
  settings: Settings,
): NutritionBloom {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const rangeStart = range === "week" ? sundayOfWeekIso(today) : today;
  const rangeEnd = range === "week" ? addDaysIso(rangeStart, 6) : today;
  const daysElapsed = range === "week" ? daysBetween(rangeStart, today) + 1 : 1;

  // actual: logged-eaten meals within the range. projected adds everything
  // still planned from today through the end of the range that isn't yet
  // logged eaten — past, un-logged misses are neither (section 4.3 says
  // "actual plus everything still planned for the rest of the week").
  let actualKcal = 0, actualProtein = 0, actualCarbs = 0, actualFat = 0, actualFibre = 0, actualVegGrams = 0;
  let projectedKcal = 0, projectedProtein = 0, projectedCarbs = 0, projectedFat = 0, projectedFibre = 0, projectedVegGrams = 0;
  let anyEstimated = false;

  for (let d = rangeStart; d <= rangeEnd; d = addDaysIso(d, 1)) {
    const dayTotals = dayTotalsForDate(d, weeks, recipes, ingredients);
    if (dayTotals.estimated) anyEstimated = true;
    for (const meal of dayTotals.meals) {
      const eaten = log.eaten.some((e) => e.date === d && e.slot === meal.slot && e.batchId === meal.batchId);
      if (eaten) {
        actualKcal += meal.totals.kcal;
        actualProtein += meal.totals.protein;
        actualCarbs += meal.totals.carbs;
        actualFat += meal.totals.fat;
        actualFibre += meal.totals.fibre;
        actualVegGrams += meal.vegGrams;
      } else if (d >= today) {
        projectedKcal += meal.totals.kcal;
        projectedProtein += meal.totals.protein;
        projectedCarbs += meal.totals.carbs;
        projectedFat += meal.totals.fat;
        projectedFibre += meal.totals.fibre;
        projectedVegGrams += meal.vegGrams;
      }
    }
  }
  projectedKcal += actualKcal;
  projectedProtein += actualProtein;
  projectedCarbs += actualCarbs;
  projectedFat += actualFat;
  projectedFibre += actualFibre;
  projectedVegGrams += actualVegGrams;

  const t = settings.targets;
  const kcalIdeal = ((t.kcalMin + t.kcalMax) / 2) * daysElapsed;
  const proteinIdeal = ((t.proteinMin + t.proteinMax) / 2) * daysElapsed;
  const fatPctMid = (t.fatPctMin + t.fatPctMax) / 2;

  const petals: Petal[] = [
    {
      key: "calories",
      label: "Calories",
      unit: "kcal",
      ideal: kcalIdeal,
      low: t.kcalMin * daysElapsed,
      high: t.kcalMax * daysElapsed,
      actual: actualKcal,
      projected: projectedKcal,
      colour: classify(actualKcal, t.kcalMin * daysElapsed, t.kcalMax * daysElapsed, true),
      estimated: anyEstimated,
    },
    {
      key: "protein",
      label: "Protein",
      unit: "g",
      ideal: proteinIdeal,
      low: t.proteinMin * daysElapsed,
      high: t.proteinMax * daysElapsed,
      actual: actualProtein,
      projected: projectedProtein,
      colour: classify(actualProtein, t.proteinMin * daysElapsed, t.proteinMax * daysElapsed, false),
      estimated: anyEstimated,
    },
    {
      key: "carbs",
      label: "Carbs",
      unit: "g",
      ideal: ((t.carbsPctMax / 100) * kcalIdeal) / KCAL_PER_G_CARB,
      low: 0,
      high: ((t.carbsPctMax / 100) * kcalIdeal) / KCAL_PER_G_CARB,
      actual: actualCarbs,
      projected: projectedCarbs,
      colour: classify(actualCarbs, 0, ((t.carbsPctMax / 100) * kcalIdeal) / KCAL_PER_G_CARB, true),
      estimated: anyEstimated,
    },
    {
      key: "fat",
      label: "Fat",
      unit: "g",
      ideal: ((fatPctMid / 100) * kcalIdeal) / KCAL_PER_G_FAT,
      low: ((t.fatPctMin / 100) * kcalIdeal) / KCAL_PER_G_FAT,
      high: ((t.fatPctMax / 100) * kcalIdeal) / KCAL_PER_G_FAT,
      actual: actualFat,
      projected: projectedFat,
      colour: classify(actualFat, ((t.fatPctMin / 100) * kcalIdeal) / KCAL_PER_G_FAT, ((t.fatPctMax / 100) * kcalIdeal) / KCAL_PER_G_FAT, false),
      estimated: anyEstimated,
    },
    {
      key: "fibre",
      label: "Fibre",
      unit: "g",
      ideal: t.fibreMin * daysElapsed,
      low: t.fibreMin * daysElapsed,
      high: null,
      actual: actualFibre,
      projected: projectedFibre,
      colour: classify(actualFibre, t.fibreMin * daysElapsed, null, false),
      estimated: anyEstimated,
    },
    {
      key: "vegetables",
      label: "Vegetables",
      unit: "servings",
      ideal: settings.vegServingsMinPerDay * daysElapsed,
      low: settings.vegServingsMinPerDay * daysElapsed,
      high: null,
      actual: actualVegGrams / settings.vegServingGrams,
      projected: projectedVegGrams / settings.vegServingGrams,
      colour: classify(actualVegGrams / settings.vegServingGrams, settings.vegServingsMinPerDay * daysElapsed, null, false),
      estimated: anyEstimated,
    },
  ];

  const gapMessage = buildGapMessage(petals, range);
  return { range, petals, gapMessage };
}

function buildGapMessage(petals: Petal[], range: "week" | "today"): string {
  // Ranked by how short each petal is as a fraction of its own target, not
  // by raw amount — kcal is naturally hundreds while fibre is grams, so a
  // raw comparison would always surface calories regardless of severity.
  const shortfalls = petals
    .filter((p) => p.colour === "warn")
    .map((p) => ({ petal: p, shortBy: p.low - p.actual, shortPct: p.low > 0 ? (p.low - p.actual) / p.low : 0 }))
    .sort((a, b) => b.shortPct - a.shortPct);

  if (shortfalls.length === 0) {
    return range === "week" ? "On track this week." : "On track today.";
  }

  const { petal, shortBy } = shortfalls[0];
  const amount = petal.unit === "servings" ? shortBy.toFixed(1) : Math.round(shortBy).toString();
  const periodWord = range === "week" ? "this week" : "today";
  const closesIt = petal.projected >= petal.low;
  const tail = closesIt
    ? " The rest of the plan closes it."
    : " The plan doesn't close it yet.";
  return `${petal.label} is ${amount} ${petal.unit} short ${periodWord}.${tail}`;
}
