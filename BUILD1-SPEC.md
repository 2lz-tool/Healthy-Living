# Meal Plan, Build 1: Library, Planner, Reminders

Spec and Claude Code handoff. Supersedes the Mac/Tauri direction in v1 `HANDOFF.md`. Everything else in v1 is source material to migrate, not code to extend.

One household of two. Personal use. Android phone first.

---

## 0. Where this sits

| Build | Contents | Status |
|---|---|---|
| v1 | Single `index.html`, Week 1 hardcoded, five screens | Done |
| **Build 1** | **Recipe library with families and variants, week planner, derived shopping, evening reminder, balance checks** | **This spec** |
| Build 2 | Import from YouTube (videos, Shorts) and Instagram Reels via share sheet | Later |
| Build 3 | Technique and flavour science layer linked to recipe steps | Later |
| Build 4 | Plan generator suggesting weeks from the library | Later |

Build 1 is fully offline. No LLM calls, no server, no accounts.

---

## 1. Gates

### Decided

**Gate 1. Platform: Android via Capacitor.** Wrap a web build in Capacitor and sideload the APK. This keeps the web UI approach from v1, gives real local notifications, and gives the Android share sheet for Build 2 without a stack change. A PWA was rejected because it cannot schedule reliable notifications without a push server. Native Kotlin was rejected because it means rebuilding the UI for no gain at this stage. Mac is dropped.

**Gate 2. Data model.** The chain is Family > Recipe (variant) > Batch > Meal slot. Batches stay the unit of cooking, as in v1. Days are views over batch assignments.

**Gate 3. No LLM in Build 1.** All logic is deterministic arithmetic over the library.

**Gate 4. Build order** as in the table above.

### Open, confirm before section 6 step 3

**Gate D. Visual language.** v1 imitates Apple HIG in CSS. On Android that reads as foreign: wrong back behaviour, wrong type, iOS sheets. Recommendation: move to Material 3 (Material Web components or hand-built to M3 tokens), keep v1's information architecture. Tulika decides. Do not build screens until this is answered.

---

## 2. Scope

**In**
- Recipe library with dish families, variants, ingredient-level nutrition
- Recipe editor with an "estimated" flag on any quantity or nutrition value
- Week planner built by hand from the library
- Shopping list derived from the week's batches
- Evening local notification for tomorrow: what to buy, what to prep
- Today screen: tick meals eaten, tick tonight's prep tasks
- Balance checks shown on the planner, never blocking
- Settings, plus JSON export and import of all data

**Out**
- Plan generation or suggestions
- Recipe import from any URL
- Technique explanations
- Pantry inventory. A per-week "already have" tick on shopping items covers it
- Sync, accounts, multi-device

---

## 3. Data model

All IDs are short slugs or ULIDs. All quantities are metric. Nutrition is per 100 g or per unit, at ingredient level, so every recipe and day total is derived, never typed.

### Ingredient
```ts
type Ingredient = {
  id: string;
  name: string;
  aisle: "produce" | "meat_fish" | "dairy_eggs" | "grains" | "legumes" | "spices" | "oils" | "frozen" | "other";
  unit: "g" | "ml" | "piece";
  gramsPerPiece?: number;         // when unit is "piece", e.g. egg = 50
  per100g: { kcal: number; protein: number; carbs: number; fat: number; fibre: number };
  proteinSource?: "chicken" | "fish" | "egg" | "legume" | "dairy" | "red_meat";
  isVegetable?: boolean;           // counts toward veg servings
  estimated: boolean;              // nutrition not yet verified
};
```
Nutrition source: Indian Food Composition Tables 2017 (NIN) where available, otherwise USDA FoodData Central. Record which in a `source` note field if useful, not required.

### Family
```ts
type Family = {
  id: string;                      // "chicken-curry"
  name: string;
  skeleton: string;                // one paragraph: what every variant shares
  axes: { key: string; label: string; options: string[] }[];
};
```
Axes describe how variants differ. Example for `chicken-curry`: cut (country chicken bone-in, broiler bone-in, boneless thigh), fat (oil, mustard oil, ghee), souring (tomato, tamarind, none), base (onion-tomato masala, ginger-garlic-chilli paste), add-in (none, potato).

### Recipe (a variant)
```ts
type Recipe = {
  id: string;
  familyId: string | null;         // null allowed for one-offs like raita
  name: string;
  axisValues: Record<string, string>;
  yieldServings: number;           // at the quantities below
  ingredients: { ingredientId: string; qty: number; note?: string; estimated: boolean }[];
  steps: { id: string; text: string; minutes?: number; techniqueId?: string }[]; // techniqueId reserved for Build 3, always undefined now
  prepActions: { kind: "soak" | "marinate" | "thaw" | "ferment" | "grind" | "other"; leadHours: number; text: string }[];
  shelfLifeDays: number;           // refrigerated; 0 = eat same session (ragi mudda)
  freezable: boolean;
  slots: ("breakfast" | "lunch" | "dinner" | "snack" | "side")[];
  activeMinutes: number;
  source: { kind: "own" | "youtube" | "instagram" | "web" | "other"; url?: string }; // Build 2 fills url
  status: "draft" | "verified";    // verified = Tulika confirmed quantities
};
```

### Week, Batch, Assignment
```ts
type Week = {
  id: string;                      // ISO date of the Sunday it starts, "2026-10-11"
  householdSize: number;           // default from settings, 2
  batches: Batch[];
  haveIngredients: string[];       // ingredient IDs ticked "already have" this week
  boughtIngredients: string[];
};

type Batch = {
  id: string;
  recipeId: string;
  cookDate: string;                // ISO date
  cookWhen: "morning" | "evening";
  scale: number;                   // multiplier on recipe yield
  frozenPortions: number;          // portions frozen same day, exempt from shelf life
  assignments: { date: string; slot: "breakfast" | "lunch" | "dinner" | "snack" | "side" }[];
};
```
Rules enforced in the planner UI, shown as warnings, not hard blocks:
- `assignments.length * householdSize <= yieldServings * scale`
- each assignment date minus `cookDate` is at most `shelfLifeDays`, unless covered by `frozenPortions`
- an assignment date before `cookDate` is an error, and that one is blocked

### Log and settings
```ts
type Log = { eaten: { date: string; slot: string; batchId: string }[]; prepDone: { date: string; key: string }[] };

type Settings = {
  householdSize: number;           // 2
  targets: { kcalMin: number; kcalMax: number; proteinMin: number; proteinMax: number }; // 1500, 1600, 90, 100 per person
  mealProteinMin: number;          // 25 g, lunch and dinner only
  vegServingGrams: number;         // 80
  vegServingsMinPerDay: number;    // 3
  maxSameProteinSourceDays: number;// 4 of 7
  prepDays: ("sun"|"mon"|"tue"|"wed"|"thu"|"fri"|"sat")[]; // sun, wed, fri, sat
  reminderTime: string;            // "19:00"
  neverSuggest: string[];          // dislikes, stored now, used by Build 4
};
```
Seed `neverSuggest` with: paneer, egg bhurji, egg curry, quinoa, millet, tofu stir fry, sambar.

### Storage
One JSON document, `mealplan.json`, written atomically through `@capacitor/filesystem` (write temp, then rename). Data volume is small: a few hundred recipes and a year of weeks stay well under a few MB. Keep a `schemaVersion` field and a migrations function from day one. Export and import is that same file.

---

## 4. Derived logic

All pure functions in `src/derive/`, unit tested, no UI imports.

**Recipe nutrition per serving.** Sum ingredient nutrition at quantity, divide by `yieldServings`. Propagate `estimated` if any input is estimated.

**Day totals per person.** For each slot on a date, the assigned batch's recipe nutrition per serving. Flag the day as estimated if any meal is.

**Shopping list for a week.** Sum ingredient quantities across batches, times `scale`. Group by aisle. Round up to sensible shop units: whole pieces, 50 g for produce, 100 g for meat. Remove anything in `haveIngredients`. Support ticking items as bought.

**Tomorrow's reminder content** for date D+1. Three groups:
1. Buy: ingredients for batches with `cookDate` = D+1 not in `haveIngredients` or `boughtIngredients`.
2. Prep tonight: `prepActions` for batches cooking on D+1 whose `leadHours` puts the start on or before D evening. This covers soaking rajma, marinating chicken, and grinding batter.
3. Move from freezer: frozen portions assigned on D+1.

If all three are empty, schedule nothing for that day.

**Balance checks**, per person per day and per week. Each returns `{ level: "ok" | "warn", message }`:
- Calories outside `kcalMin` to `kcalMax`
- Protein below `proteinMin`
- Any lunch or dinner below `mealProteinMin`
- Vegetable grams below `vegServingGrams * vegServingsMinPerDay`
- Week: one protein source on more than `maxSameProteinSourceDays` days
- Week: fewer than 2 distinct protein sources
Messages are concrete: "Thursday: 64 g protein, 26 short. Lunch is chana at 14 g." Not "protein is low."

---

## 5. Screens

Bottom navigation, four tabs, plus Settings from the top bar.

**Today**
- Today's meals with tick to mark eaten
- Tonight's prep checklist: the same content as the reminder, tickable
- Shortcut to tomorrow's shopping items

**Week (planner)**
- Week switcher in the header, Sunday start
- Prep days are visually distinct
- Each day shows its slots, filled from batch assignments, plus a balance strip: kcal, protein, veg, with warn state
- Add batch flow: pick a recipe from the library, pick a cook date and morning or evening, set the scale, then tap slots to assign. Shelf life and portion warnings appear live as slots are tapped
- Tapping a filled slot shows the batch, with options to reassign or remove
- Copy last week as a starting point

**Library**
- Families list, each expanding to its variants, plus an "Other" group for recipes without a family
- Recipe detail: ingredients scaled to household, steps, prep actions, nutrition per serving, shelf life, axis values. Draft and estimated values are visibly marked
- Recipe editor: a form over the schema, with an "estimated" toggle per quantity, and an ingredient picker that can create a new ingredient inline
- Family editor: skeleton and axes

**Shopping**
- The current week by default, grouped by aisle
- Each item has two ticks, "have" and "bought", with a running count

**Settings**
- Everything in `Settings`
- Notification permission status with a re-request button
- Export and import JSON

---

## 6. Work order for Claude Code

Stop at each checkpoint and show Tulika before continuing.

1. **Scaffold.** Vite, TypeScript, Preact. Capacitor added with the Android platform. Plugins: `@capacitor/filesystem` and `@capacitor/local-notifications`. Add a GitHub Actions workflow that builds a debug APK as a downloadable artifact on every push to `main`. Tulika works phone-first and needs to install builds without a desktop Android toolchain.
2. **Data and derivations.** Schema types, the storage layer with migrations, and all of section 4 with unit tests (Vitest). Seed data per section 7. **Checkpoint:** the derived shopping list for the seeded Week 1 compared against v1's hand-written `SHOPPING`, with every difference explained.
3. **Gate D answered.** Then build the screens: Library and editor first, then Week planner, Shopping, Today, Settings. **Checkpoint:** APK installed, planning a full week by hand works end to end.
4. **Notifications.** Request `POST_NOTIFICATIONS` on first launch with an explanation screen before the system prompt. Schedule notifications as described in section 8. **Checkpoint:** a reminder fires on the phone with correct content.
5. **Acceptance pass** against section 9.

---

## 7. Seed data

Migrate all 16 v1 recipes from the `RECIPES` const in v1 `index.html`, mapped to the new schema. Set `status: "draft"` on all of them and set `estimated: true` wherever v1 had no source for a number.

Families to create:

| Family | Variants from v1 | Example axes |
|---|---|---|
| Chicken curry | Naatukodi, NE chicken curry with potato | cut, fat, souring, base, add-in |
| Legume curry | Rajma, chana masala, dal tadka | legume, souring, tempering, finish |
| Fermented batter | Idli, uttapam | form, add-ins |
| Eggs | Turkish eggs, boiled eggs | method, base |
| Rolls | Rice paper minced chicken rolls, air fried | wrapper, filling, cook method |

No family: carrot and cucumber raita, peanut chutney, rice, red rice, ragi mudda (`shelfLifeDays: 0`), overnight oats, and any remaining v1 breakfasts.

Also migrate v1 Week 1 (`DAYS` and `BATCHES`) as a seeded `Week`. It is the test fixture for the step 2 checkpoint and Tulika's first real week in the new app.

---

## 8. Notification scheduling

Local notifications carry fixed content at schedule time, so content cannot be computed at fire time. Therefore:
- On app open and after any change to a week, cancel all pending reminders and schedule the next 14 days, each with its precomputed content.
- If no planned week covers a date in that window, schedule a single "No plan for next week yet" notification at reminder time on the last prep day before the gap.
- Use inexact scheduling with `allowWhileIdle`. Exact alarms need a special permission on Android 14 and later, and a few minutes of drift at 19:00 does not matter.
- Title: "Tomorrow: cook rajma" (or "Tomorrow: nothing to cook, 2 things to buy"). Body: up to three lines, buy first. Tapping it opens Today with tonight's prep list.
- If the app goes unopened for more than 14 days, reminders stop. That is acceptable for personal use.

---

## 9. Accept when

- A full week can be planned from the library in under 10 minutes without typing any numbers
- The shopping list matches the plan with no manual edits
- Tomorrow's reminder fires on the phone around the set time with the correct buy, prep, and thaw items
- Day totals show kcal, protein, and veg, and are marked estimated wherever any input is estimated
- All data survives app kill, phone restart, and APK reinstall via export and import
- Works with no network
- Every tap target is at least 48 dp

---

## 10. Inputs needed from Tulika

1. Gate D: Material 3 or keep HIG styling.
2. Real quantities and yields for naatukodi, the NE chicken curry, and Turkish eggs. Quantities are enough. Calories are derived from ingredients now, so no calorie figures are needed.
3. Reminder time if not 19:00.
4. Whether targets stay at 1,500 to 1,600 kcal and 90 to 100 g protein.
