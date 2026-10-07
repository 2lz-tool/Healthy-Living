# Meal Plan

Personal meal planning app for one household of two.

**Current direction: Build 1**, specified in `BUILD1-SPEC.md` — a recipe
library with families and variants, a week planner, a shopping list
derived from the plan, an evening reminder, and balance checks. Android
phone first, via Capacitor. This supersedes the Mac/Tauri direction
below; `web/` and `desktop/` are v1, kept as migration source material,
not extended further. See `BUILD1-SPEC.md` for the full spec, data
model, and work order.

## Build 1 — `app/`

Vite + TypeScript + Preact, wrapped in Capacitor for Android. Fully
offline — no LLM calls, no server, no accounts.

```bash
cd app
npm install
npm run dev          # live web preview
npm test             # Vitest, the derivation layer
npm run build         # tsc + vite build
npx cap sync android   # copy the build into the Android project
```

A GitHub Actions workflow (`.github/workflows/android-debug-apk.yml`)
builds a debug APK on every push to `main` and uploads it as a workflow
artifact, so it can be installed on a phone without a local Android
toolchain.

**Status:** steps 1–3 of `BUILD1-SPEC.md` section 6 are done — scaffold,
schema, storage with migrations, the derived-logic layer (unit tested),
v1's Week 1 and 16 recipes migrated as seed data, and all five screens
(Gate D: kept v1's HIG look rather than moving to Material 3). Verified
by running the app in a browser via Playwright — this container has no
Android SDK, so the real step-3 checkpoint ("APK installed, planning a
full week by hand works end to end") still needs a phone. **Step 4,
notification scheduling, is not built yet.**

```
app/
  src/
    types/schema.ts     # Ingredient, Family, Recipe, Week, Batch, Settings, ...
    storage/             # mealplan.json via @capacitor/filesystem, atomic write, migrations
    derive/               # pure functions: nutrition, day totals, shopping, reminder content, balance checks, batch warnings
    seed/                  # v1's 16 recipes + Week 1, migrated into the new schema
    state/                  # @preact/signals store + mutations, debounced save with a flush-on-hide safety net
    styles/                  # the ported v1 HIG design system (Gate D)
    components/UI.tsx         # shared list/row/sheet/segmented/stepper/tab-bar components
    screens/                   # Today, Week, Library (+ recipe/family editors), Shopping, Settings
  android/                 # Capacitor's generated Android project
  scripts/
    checkpoint-shopping-diff.ts   # the step-2 checkpoint comparison, kept as a record
```

## v1 (superseded) — `web/` and `desktop/`

The original single-file web app and its Tauri Mac wrapper. Kept as
migration source material per `BUILD1-SPEC.md`; not developed further.

- **`web/`** — one self-contained `index.html`. No build step, no
  dependencies, no network calls. Opens by double click, works offline,
  works on the phone. State is saved to `localStorage`, keyed under
  `mealplan.week1.v1`.
- **`desktop/`** — a Tauri v2 shell wrapping `web/` in a native macOS
  window, with a menu-bar tray icon showing the current streak. See
  `HANDOFF.md` for the full v1 design rationale and data shapes.

To run the web app: open `web/index.html` directly in a browser. To
build the Mac app, see the Tauri commands in `HANDOFF.md` section 4 —
building the `.app`/`.dmg` has to happen on a Mac itself.

### What v1 left open

Three recipes (naatukodi curry, the North Eastern chicken curry, Turkish
eggs) were placeholders in v1 — their calorie figures were estimates.
Build 1's schema carries this forward explicitly: those three recipes
are migrated with `status: "draft"` and their ingredient quantities
marked `estimated: true`, pending real quantities and yields (see
`BUILD1-SPEC.md` section 10).

Apple Watch/Health sync, smart-scale sync, and Mac widgets were explored
and deliberately parked in v1 — see `BUILD1-SPEC.md` Gate 1, which drops
Mac/Health/Watch integration outright in favor of Android with real
local notifications.
