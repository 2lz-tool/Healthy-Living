# Meal Plan: Landing Dashboard, Desktop First

Handoff for Claude Code. Extends `BUILD1-SPEC.md`; read that first. Section references like "B1 §4" point into it.

The landing page replaces the Today tab from B1 §5 as the screen the app opens on. It is designed for the desktop window first and collapses to phone width second.

---

## 0. Gates

Do not write layout code until all three are answered.

**Gate 1 reopened: desktop shell.** B1 §1 dropped the Mac app in favour of Android via Capacitor. Starting from desktop reverses that. Recommendation: the web layer stays the single codebase. Wrap it in Tauri v2 for the Mac (the config is in v1 `HANDOFF.md` §4) and in Capacitor for the phone later. No UI code differs between them, only the shell and the notification plugin. Tulika confirms.

**Gate D, now leaning HIG.** With the Mac as the first target, HIG styling from v1 is the right fit again. The phone build inherits it. Tulika confirms HIG or Material 3.

**Gate N: nutrition chart form.** The request says "loom infographic". This spec reads that as a radial bloom: one petal per nutrient, with the ideal as an outline and actual consumption as the fill (§4.3). If "loom" means something else, such as woven bands, Tulika describes it and §4.3 is rewritten before building.

---

## 1. Additions to the B1 data model

```ts
// Settings additions
shoppingDays: ("sun"|"mon"|"tue"|"wed"|"thu"|"fri"|"sat")[];   // set in onboarding, at least one
slotTimes: { breakfast: "08:30"; lunch: "13:30"; dinner: "20:30"; snack: "17:00" }; // local time
targets: {
  // existing kcalMin, kcalMax, proteinMin, proteinMax
  carbsPctMax: 50;          // percent of kcal
  fatPctMin: 20; fatPctMax: 30;
  fibreMin: 25;             // grams per day
};
vegServingsMinPerDay: 3;    // already in B1, reused here

// Batch addition
cookedAt?: string;          // ISO datetime; set when Tulika marks the batch cooked
```

**Onboarding** gains one step: "Which days do you shop?" Use multi-select day chips. Default to Saturday, editable later in Settings. This is the only onboarding change.

Migration: `schemaVersion` bump. Set existing batches with `cookDate` in the past to `cookedAt = cookDate` at their `cookWhen` time.

---

## 2. Desktop layout

The window minimum is 1000 × 700, from the v1 Tauri config. Design at 1280 and check at 1000 and 1600.

```
┌────────┬──────────────────────────────────────────────────────┐
│        │  Sun 11 Oct · Week of 11 Oct            [Plan week]  │  header 56
│ Side-  ├───────────────────────────────┬──────────────────────┤
│ bar    │                               │                      │
│        │  NEXT MEAL           (7 col)  │  SHOP BY SAT (5 col) │
│ Home   │                               │                      │
│ Week   │                               │  spans both rows     │
│ Library├───────────────────────────────┤                      │
│ Shop   │                               │                      │
│        │  NUTRITION           (7 col)  │                      │
│ ⚙      │                               │                      │
└────────┴───────────────────────────────┴──────────────────────┘
```

- **Sidebar:** 220 px. Same destinations as the B1 tabs, with Home replacing Today. Translucent vibrancy, as in v1.
- **Content grid:** 12 columns, 24 px gutters, 32 px outer padding, max width 1280 and centred beyond that.
- **Checklist placement:** the checklist gets the full right column because its length varies most. The two left widgets keep fixed heights so the page does not jump.
- **Header contents:** the header holds the date, the week label, and one primary action, "Plan week", which opens the B1 Week planner. Nothing else goes in the header.
- **No other widgets.** This page has three. Adding a fourth needs a new decision.

**Below 900 px:** a single column ordered Next meal, Checklist, Nutrition, with the sidebar becoming a bottom tab bar. This is the phone layout for later; build it now, but it is not tested to the desktop bar.

---

## 3. Shared rules

- Every number shown is derived through B1 §4 functions. Widgets never compute nutrition themselves. Add new derive functions in `src/derive/` with tests.
- Any value built on an `estimated` input shows a small "est." marker. One marker per figure, not per widget.
- The dashboard re-derives on focus, on any data change, and every minute so that "next meal" rolls over at slot times. There is no loading state; data is local.
- Each widget has a header row: title on the left, one text link on the right to its full screen.

---

## 4. Widgets

### 4.1 Next meal

**Purpose.** Answers one question: what do I eat next, and do I need to do anything for it?

**Which meal is "next".** Take the earliest slot, today or later, whose slot time plus 60 minutes has not passed and which has no `Log.eaten` entry. Look ahead at most 7 days.

**States**, in priority order:

| State | Condition | Shows | Actions |
|---|---|---|---|
| Ready | Slot has an assignment and its batch has `cookedAt` | Meal name, slot and time ("Lunch · 1:30 pm"), "Ready · reheat", per-person kcal and protein | Mark eaten |
| Cook first | Assigned batch has no `cookedAt` and `cookDate` ≤ slot date | Meal name, slot and time, "Cook first · 35 min active", any `prepActions` not yet done, with overdue ones flagged ("Rajma should have soaked since last night") | Open recipe, Mark cooked |
| Thaw | Assignment is covered by `frozenPortions` | "Move from freezer now" plus timing | Mark thawed, then becomes Ready |
| Not planned | Slot has no assignment | "Lunch tomorrow isn't planned" | See below |
| Nothing planned | No assignment anywhere in the next 7 days | "Nothing planned this week" | Plan week |

**Not planned state.** This covers the case where the next meal is not already in the plan. Offer up to three options, built deterministically with no generator:
1. **Leftovers first.** Batches with unassigned portions still inside shelf life, for example "Chana masala · 2 portions left · good till Tue". One tap assigns it.
2. **From the library.** Recipes allowed in this slot whose ingredients are all in `haveIngredients` or bought. Sort by active minutes, quickest first. One tap creates a batch for that day and assigns it.
3. **Plan it properly.** Opens the planner on that day.

If both 1 and 2 are empty, show only option 3 with "Nothing on hand fits. Plan it."

**Also show** a quiet line under the main card: "Then: Dinner · Rajma · ready". That is the slot after this one, so the next step is visible without opening the Week screen.

### 4.2 Shopping checklist up to the next shopping day

**Purpose.** What to buy on the next shopping trip, and what is short before then.

**Definitions.**
- `nextShop` is the first date in `shoppingDays` on or after today. If today is a shopping day and it is past 20:00, roll to the following one.
- `followingShop` is the shopping day after `nextShop`.

**Two sections:**
1. **"Short before {nextShop}"**: shown only if non-empty, in a warning tint. Ingredients for batches with `cookDate` from today to the day before `nextShop` that are not in `haveIngredients` or `boughtIngredients`. There is no shopping trip before these cooks, so they need a separate errand or a swap.
2. **"Buy on {nextShop}"**: ingredients for batches with `cookDate` from `nextShop` to the day before `followingShop`, minus have and bought. Group by aisle (B1 §3 aisles), using the shop-unit rounding from B1 §4.

**Widget title** names the day: "Shop by Sat". Under it, a mini week strip of 7 dots shows shopping days as filled, today ringed, and `nextShop` highlighted, so the shopping cadence is visible at a glance.

**Each item** shows name, quantity, and which meals need it on hover or long-press ("Rajma · Mon dinner, Tue lunch"). It has one checkbox, which writes to `boughtIngredients`. There is a secondary "Have it" action per item in an overflow menu, which writes to `haveIngredients`.

**Footer:** "8 of 14 bought" and a link to the full Shopping screen.

**Empty state:** "Nothing to buy until Sat" or, if no plan exists, "Plan the week to see what to buy."

### 4.3 Nutrition: ideal vs actual (radial bloom, pending Gate N)

**Purpose.** Show at a glance where this week's eating is off balance, and whether the rest of the plan fixes it.

**Six petals**, evenly spaced, each scaled so the ideal sits at the same radius:

| Petal | Ideal (per person, prorated to days elapsed) | Actual source |
|---|---|---|
| Calories | midpoint of `kcalMin` to `kcalMax` | `Log.eaten` |
| Protein | midpoint of `proteinMin` to `proteinMax` | `Log.eaten` |
| Carbs | `carbsPctMax` of the kcal ideal, as grams | `Log.eaten` |
| Fat | midpoint of the fat % band, as grams | `Log.eaten` |
| Fibre | `fibreMin` | `Log.eaten` |
| Vegetables | `vegServingsMinPerDay` servings | `Log.eaten` |

**Three layers:**
1. **Ideal:** a thin outline circle at radius 1.0, plus a tolerance ring band for nutrients that have a range.
2. **Actual:** filled petals from eaten meals, week to date.
3. **Projected:** a dashed petal outline for actual plus everything still planned for the rest of the week. This shows whether the plan closes a gap without Tulika doing the arithmetic.

**Colour.**
- Petals within tolerance use the system green.
- Under by more than 15% uses orange.
- Over the calorie or carb max uses red.
- Fibre, vegetables, and protein are never red for being over.

**Under the chart:** the one most important gap, as a sentence, computed with B1 §4 balance check messages. For example: "Protein is 48 g short this week. Wednesday's rolls and Thursday's fish close 30 g of it." If everything is within tolerance: "On track this week."

**Toggle:** "This week" (default) and "Today". Today uses the full-day ideal, not prorated, with projected showing the rest of today's plan.

**Not shown:** micronutrients, weight, and history beyond this week. History is a later screen.

**Accessibility:** each petal has a text equivalent ("Protein 312 of 380 g, 82%"), and the chart has an accessible table fallback.

**Implementation:** SVG, hand-built, no chart library. Animate petals growing on first render only, under 400 ms, and skip the animation under `prefers-reduced-motion`.

---

## 5. Work order

1. Answer Gates 1, D, and N.
2. Schema additions and onboarding shopping-day step (§1), with migration.
3. Derive functions with tests: `nextMeal(now)`, `shoppingWindow(today)`, `nutritionBloom(range)`, `notPlannedOptions(slot)`.
4. Desktop layout shell and sidebar (§2).
5. Widgets in order: Next meal, Checklist, Nutrition. **Checkpoint** after each, shown to Tulika in the running desktop window.
6. Below-900 px collapse.
7. Acceptance pass.

---

## 6. Accept when

- Opening the app shows the correct next meal for the current time, and it rolls over on its own at slot time plus 60 minutes.
- With an unplanned slot, leftovers are offered first, and assigning one updates all three widgets immediately.
- The checklist names the correct next shopping day from onboarding, and splits "short before" from "buy on" correctly across a week that spans two shopping days.
- Ticking an item on the dashboard and on the Shopping screen stays in sync both ways.
- The bloom matches hand-calculated totals for the seeded Week 1, to within rounding, and the projected layer equals actual plus the remaining plan.
- Every estimated figure carries the marker.
- At 1000 px wide nothing truncates or scrolls horizontally.
- Light and dark mode follow the system.

---

## 7. Inputs needed from Tulika

1. Gate 1: Tauri for the Mac, with Capacitor for the phone later.
2. Gate D: HIG or Material 3.
3. Gate N: is the radial bloom what "loom" meant?
4. Slot times, if different from 8:30, 13:30, 20:30.
5. Fibre and fat targets, if the defaults (25 g, 20 to 30%) are not right.
