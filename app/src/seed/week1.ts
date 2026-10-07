import type { Batch, BatchAssignment, Week } from "../types/schema";

/**
 * Migrated from v1's DAYS and BATCHES consts. Week.id matches the example
 * date in BUILD1-SPEC.md section 3's schema comment, "2026-10-11" — a
 * Sunday.
 *
 * Several things don't migrate 1:1, documented here and repeated in the
 * checkpoint message since "every difference explained" is the bar:
 *
 * 1. v1's DAYS.meals has one `recipe` field per slot, so a slot with two
 *    real components (a main plus a side) could only ever link one of
 *    them. Build 1's Batch.assignments has no such limit — several
 *    batches can share a date+slot — so raita (mentioned in six lunch
 *    titles but never linked as `recipe` except once) and the Thursday
 *    "cold chana salad" (riding on the chana batch, not a separate
 *    recipe) are now both represented as real assignments instead of
 *    prose.
 * 2. Monday lunch's v1 entry links `recipe: "raita"` even though the
 *    title says "Naatukodi curry, rice, raita" and BATCHES.naatukodi's
 *    own `covers` list names "Monday lunch" explicitly — i.e. v1's two
 *    hand-maintained fields disagreed with each other. Migrated as
 *    naatukodi, matching the title and the batch note, not the
 *    (apparently mistaken) DAYS link.
 * 3. The idli batch's v1 `covers` list names "Friday dinner", but Friday
 *    dinner is uttapam — a different recipe that happens to use the same
 *    leftover batter. Modeled as uttapam's own batch/assignment instead,
 *    not a direct assignment of the idli batch.
 * 4. Peanut chutney's first cook is listed under PREP.sun ("Sunday
 *    night"), but it's also eaten at Sunday breakfast — which it can't
 *    be, cooked the same night after the fact. Moved to Saturday evening
 *    so the dates are actually possible; this is a correction, not a
 *    literal migration.
 * 5. Overnight oats' recipe note says "good for 3 days" but v1 covers it
 *    from one Sunday-night batch through Friday breakfast — 5 days,
 *    past its own stated shelf life. Split into two batches (Sunday
 *    night for Monday, Thursday night for Friday) rather than carry the
 *    inconsistency forward.
 * 6. v1's "yogurt" batch (recipeId: null — a shared tub, not tied to one
 *    recipe) has no equivalent here: Batch.recipeId is required in Build
 *    1's schema. Dropped rather than worked around — oats and the
 *    smoothie already each list greek yogurt as their own ingredient, so
 *    the shopping list still totals it correctly across both; the
 *    schema's normal ingredient-summing does what the special-cased
 *    batch used to do by hand.
 * 7. Plain rice, ragi mudda, boiled eggs, and every snack-only item
 *    (apple, almonds, chaas, makhana) were never linked to a `recipe` in
 *    v1 either — they only existed as free text in meal titles and in
 *    the hand-written SHOPPING const. They're genuinely absent from the
 *    library, not dropped in migration, so they won't appear in the
 *    derived shopping list. That's expected, not a bug — see the
 *    checkpoint message.
 */

const SUN = "2026-10-11";
const MON = "2026-10-12";
const TUE = "2026-10-13";
const WED = "2026-10-14";
const THU = "2026-10-15";
const FRI = "2026-10-16";
const SAT = "2026-10-17";
const NEXT_SUN = "2026-10-18";
const PREV_SAT = "2026-10-10"; // the Saturday before this week starts

function a(date: string, slot: BatchAssignment["slot"]): BatchAssignment {
  return { date, slot };
}

function batch(
  id: string,
  recipeId: string,
  cookDate: string,
  cookWhen: Batch["cookWhen"],
  scale: number,
  assignments: BatchAssignment[],
  frozenPortions = 0,
): Batch {
  return { id, recipeId, cookDate, cookWhen, scale, frozenPortions, assignments };
}

const batches: Batch[] = [
  batch("b-idli", "idli", PREV_SAT, "evening", 2, [a(SUN, "breakfast"), a(WED, "breakfast")]),
  batch("b-chutney-1", "chutney", PREV_SAT, "evening", 2, [a(SUN, "breakfast"), a(WED, "breakfast")]),
  batch("b-chutney-2", "chutney", WED, "evening", 2, [a(FRI, "dinner"), a(SAT, "breakfast")]),
  batch("b-naatukodi", "naatukodi", SUN, "morning", 3, [a(SUN, "lunch"), a(SUN, "dinner"), a(MON, "lunch")]),
  batch("b-rajma", "rajma", SUN, "evening", 3, [a(MON, "dinner"), a(TUE, "lunch"), a(WED, "lunch")], 2),
  batch("b-chana", "chana", WED, "evening", 3, [a(THU, "lunch"), a(THU, "dinner"), a(FRI, "lunch")]),
  batch("b-dal", "dal", FRI, "evening", 1, [a(SAT, "lunch")]),
  batch("b-rolls", "rolls", WED, "evening", 1, [a(WED, "dinner")]),
  batch("b-nechicken", "nechicken", SAT, "evening", 2, [a(SAT, "dinner"), a(NEXT_SUN, "lunch")]),
  batch("b-uttapam", "uttapam", FRI, "evening", 1, [a(FRI, "dinner")]),
  batch("b-oats-1", "oats", SUN, "evening", 1, [a(MON, "breakfast")]),
  batch("b-oats-2", "oats", THU, "evening", 1, [a(FRI, "breakfast")]),
  batch("b-smoothie", "smoothie", SUN, "evening", 1, [a(TUE, "breakfast")]),
  batch("b-chilla", "chilla", FRI, "evening", 1, [a(SAT, "breakfast")]),
  batch("b-fish", "fish", TUE, "evening", 1, [a(TUE, "dinner")]),
  batch("b-soup", "soup", WED, "evening", 1, [a(THU, "dinner")]),
  batch("b-raita-mon", "raita", SUN, "evening", 1, [a(MON, "lunch")]),
  batch("b-raita-tue", "raita", MON, "evening", 1, [a(TUE, "lunch")]),
  batch("b-raita-wed", "raita", TUE, "evening", 1, [a(WED, "lunch")]),
  batch("b-raita-thu", "raita", WED, "evening", 1, [a(THU, "lunch")]),
  batch("b-raita-fri", "raita", THU, "evening", 1, [a(FRI, "lunch")]),
  batch("b-raita-sat", "raita", FRI, "evening", 1, [a(SAT, "lunch")]),
];

export const WEEK1: Week = {
  id: SUN,
  householdSize: 2,
  batches,
  haveIngredients: [],
  boughtIngredients: [],
};
