import type { Batch, Ingredient, Log, PrepAction, Recipe, Settings, Week } from "../types/schema";
import { recipeNutritionPerServing } from "./nutrition";
import { addDaysIso, dateToHours, parseHhmm } from "./dates";

/** The slots a dashboard "next meal" can land on. "side" has no slot time
 * (schema.ts SlotTimes) and never stands alone as the next meal — see that
 * type's own doc comment. */
const NEXT_MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type TimedSlot = (typeof NEXT_MEAL_SLOTS)[number];

const LOOKAHEAD_DAYS = 7;

type BatchRef = { week: Week; batch: Batch; recipe: Recipe };

function allBatchRefs(weeks: Week[], recipes: Record<string, Recipe>): BatchRef[] {
  const refs: BatchRef[] = [];
  for (const week of weeks) {
    for (const batch of week.batches) {
      const recipe = recipes[batch.recipeId];
      if (recipe) refs.push({ week, batch, recipe });
    }
  }
  return refs;
}

/** True if this assignment's servings are covered by the batch's frozen
 * stock. A batch has no per-assignment frozen flag, so this is inferred:
 * sort the batch's assignments by date, and treat the LAST
 * floor(frozenPortions / householdSize) of them — the ones furthest from
 * the cook date — as the frozen tail, matching how a household actually
 * freezes (eat fresh first, freeze the rest for later). "Mark thawed" (not
 * yet wired to a widget) is expected to decrement frozenPortions by one
 * assignment's worth, which moves an assignment out of this tail. */
function isFrozenCovered(batch: Batch, assignment: Batch["assignments"][number], householdSize: number): boolean {
  const frozenCount = Math.floor(batch.frozenPortions / householdSize);
  if (frozenCount <= 0) return false;
  const sorted = [...batch.assignments].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const tail = sorted.slice(Math.max(0, sorted.length - frozenCount));
  return tail.some((a) => a.date === assignment.date && a.slot === assignment.slot);
}

export type PendingPrepAction = { text: string; overdue: boolean };

export type NextMealBase = { date: string; slot: TimedSlot };

export type ReadyMeal = NextMealBase & {
  state: "ready";
  batchId: string;
  recipeId: string;
  recipeName: string;
  kcalPerPerson: number;
  proteinPerPerson: number;
  estimated: boolean;
};

export type CookFirstMeal = NextMealBase & {
  state: "cook_first";
  batchId: string;
  recipeId: string;
  recipeName: string;
  activeMinutes: number;
  pendingPrepActions: PendingPrepAction[];
};

export type ThawMeal = NextMealBase & {
  state: "thaw";
  batchId: string;
  recipeId: string;
  recipeName: string;
};

export type NotPlannedMeal = NextMealBase & { state: "not_planned" };
export type NothingPlanned = { state: "nothing_planned" };

export type NextMealState = ReadyMeal | CookFirstMeal | ThawMeal | NotPlannedMeal | NothingPlanned;

export type ThenMeal = { slot: TimedSlot; recipeName: string | null; state: NextMealState["state"] };

export type NextMealResult = NextMealState & { then?: ThenMeal };

/** Classifies one date+slot candidate per the states table in section 4.1,
 * without regard to whether it's the "chosen" next meal or the "then" line —
 * both need the same classification. */
function classify(
  date: string,
  slot: TimedSlot,
  refs: BatchRef[],
  householdSize: number,
  ingredients: Record<string, Ingredient>,
  nowHours: number,
): NextMealState {
  const matches = refs.flatMap((ref) => {
    const a = ref.batch.assignments.find((a) => a.date === date && a.slot === slot);
    return a ? [{ ref, a }] : [];
  });

  if (matches.length === 0) {
    return { state: "not_planned", date, slot };
  }

  // One batch stands for the slot on the dashboard — the first one assigned.
  const { ref, a } = matches[0];
  const { batch, recipe } = ref;

  if (isFrozenCovered(batch, a, householdSize)) {
    return { state: "thaw", date, slot, batchId: batch.id, recipeId: recipe.id, recipeName: recipe.name };
  }

  if (!batch.cookedAt) {
    const cookMoment = dateToHours(batch.cookDate) + (batch.cookWhen === "morning" ? 8 : 19);
    const pendingPrepActions: PendingPrepAction[] = recipe.prepActions.map((action: PrepAction) => ({
      text: action.text,
      overdue: nowHours > cookMoment - action.leadHours,
    }));
    return {
      state: "cook_first",
      date,
      slot,
      batchId: batch.id,
      recipeId: recipe.id,
      recipeName: recipe.name,
      activeMinutes: recipe.activeMinutes,
      pendingPrepActions,
    };
  }

  const { perServing, estimated } = recipeNutritionPerServing(recipe, ingredients);
  return {
    state: "ready",
    date,
    slot,
    batchId: batch.id,
    recipeId: recipe.id,
    recipeName: recipe.name,
    kcalPerPerson: perServing.kcal,
    proteinPerPerson: perServing.protein,
    estimated,
  };
}

function recipeNameOf(state: NextMealState): string | null {
  return "recipeName" in state ? state.recipeName : null;
}

/** LANDING-HANDOFF.md section 4.1. Finds the next actionable meal slot from
 * `now`, looking up to 7 days ahead, skipping any slot whose time plus 60
 * minutes has already passed or that's already logged eaten. */
export function nextMeal(
  now: Date,
  weeks: Week[],
  recipes: Record<string, Recipe>,
  ingredients: Record<string, Ingredient>,
  settings: Settings,
  log: Log,
): NextMealResult {
  const refs = allBatchRefs(weeks, recipes);
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const nowHours = now.getTime() / 3_600_000;

  const candidates: NextMealBase[] = [];
  for (let i = 0; i < LOOKAHEAD_DAYS; i++) {
    const date = addDaysIso(today, i);
    const slots = [...NEXT_MEAL_SLOTS].sort((a, b) => parseHhmm(settings.slotTimes[a]) - parseHhmm(settings.slotTimes[b]));
    for (const slot of slots) candidates.push({ date, slot });
  }

  const windowEnd = addDaysIso(today, LOOKAHEAD_DAYS);
  const anyAssignmentInWindow = refs.some((ref) =>
    ref.batch.assignments.some((a) => a.date >= today && a.date < windowEnd),
  );

  let chosenIndex = -1;
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const moment = dateToHours(c.date) + parseHhmm(settings.slotTimes[c.slot]);
    if (nowHours >= moment + 1) continue; // slot time + 60 minutes has passed
    const eaten = log.eaten.some((e) => e.date === c.date && e.slot === c.slot);
    if (eaten) continue;
    chosenIndex = i;
    break;
  }

  if (chosenIndex === -1) {
    return anyAssignmentInWindow ? { state: "not_planned", date: today, slot: "breakfast" } : { state: "nothing_planned" };
  }

  const chosen = candidates[chosenIndex];
  const result = classify(chosen.date, chosen.slot, refs, settings.householdSize, ingredients, nowHours);
  if (result.state === "not_planned" && !anyAssignmentInWindow) {
    return { state: "nothing_planned" };
  }

  const next = candidates[chosenIndex + 1];
  if (!next) return result;

  const nextResult = classify(next.date, next.slot, refs, settings.householdSize, ingredients, nowHours);
  return { ...result, then: { slot: next.slot, recipeName: recipeNameOf(nextResult), state: nextResult.state } };
}
