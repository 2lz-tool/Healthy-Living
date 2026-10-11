# Meal Plan

Personal meal planning app for one household of two.

**Current direction: Build 1**, specified in `BUILD1-SPEC.md` — a recipe
library with families and variants, a week planner, a shopping list
derived from the plan, an evening reminder, and balance checks. See
`BUILD1-SPEC.md` for the full spec, data model, and work order.

**Extended by `LANDING-HANDOFF.md`**, which reopens Gate 1: desktop is
the first target again (Tauri v2 wrapping the same web app, Capacitor
for the phone later), with a new landing dashboard — three widgets (next
meal, shopping checklist, nutrition balance) replacing the Today tab.
Gate D stays HIG; Gate N confirmed the radial-bloom reading of "loom
infographic". All three gates are now resolved. `web/` and `desktop/`
below are v1, kept as migration source material, not extended directly.

**Further extended by `DASHBOARD-POLISH-HANDOFF.md`**: a token/component
system for the rendered dashboard, a set of specific fixes (alignment,
data bugs, copy), and some visual additions. Its own work order puts the
token file and component library first, with a hard checkpoint — reviewed
at `/styleguide` — before any of the fixes or widget rebuild happen. See
below for where that stands.

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

For trying the app on a Mac before the phone build, `npm run
build:desktop` produces `app/dist-desktop/index.html` — one
self-contained HTML file (all JS/CSS inlined), openable directly from
Finder in any browser, no server and no Xcode/Tauri toolchain needed.
It's the same app and screens, saving to the browser's own IndexedDB
instead of the real `mealplan.json` file the Android build uses — good
for trying the UI and the plan, not a substitute for the on-device data
store.

**Status:** steps 1–3 of `BUILD1-SPEC.md` section 6 are done — scaffold,
schema, storage with migrations, the derived-logic layer (unit tested),
v1's Week 1 and 16 recipes migrated as seed data, and all five screens
(Gate D: kept v1's HIG look rather than moving to Material 3). Verified
by running the app in a browser via Playwright — this container has no
Android SDK, so the real step-3 checkpoint ("APK installed, planning a
full week by hand works end to end") still needs a phone. **Step 4,
notification scheduling, is not built yet.**

**`LANDING-HANDOFF.md` progress:** the full data layer (schema additions,
migration, the five derive functions — `nextMeal`, `shoppingWindow`,
`shoppingChecklist`, `notPlannedOptions`, `nutritionBloom` — all unit
tested) and the desktop shell are both done: a responsive sidebar/tabbar
shell (`app.tsx`, `Sidebar` in `components/UI.tsx`) with a 12-column
`HomeScreen` dashboard, three widgets under `screens/home/`, and the
below-900px single-column collapse. Verified end-to-end via Playwright,
including that "Mark cooked" and the checklist's bought-checkbox persist
across a reload and correctly re-derive the next-meal state.

Known simplifications, not yet resolved: "Open recipe" from the next-meal
card just switches to the Library tab rather than deep-linking to that
specific recipe; the live nutrition widget's ideal/tolerance band is still
conveyed only through petal colour, not the separate ring described in
section 4.3 and now fixed in the new `src/ui/Bloom` component below — that
fix just isn't wired into the live dashboard yet, pending the widget
rebuild; the gap-message sentence doesn't yet name which future meals
close a shortfall, just whether the plan does. Step 4 (notification
scheduling) and an acceptance pass against section 6 are both still
outstanding, as is the actual Tauri native wrapper (same macOS-toolchain
limitation as before — this container can write the Rust/config but
can't build or run it).

**`DASHBOARD-POLISH-HANDOFF.md` progress — work order step 1 only, by
design (its own checkpoint blocks anything further until this is
reviewed):** the token system (`styles/tokens.css`, extended, not
replaced — the pre-polish screens keep rendering off the old token names
unchanged) and the full `src/ui/` component library from section 3.6
(Card, WidgetHeader, Button, SegmentedControl, Checkbox, ListRow,
SectionHeader, DayStrip, Badge, ProgressRing, ProgressBar, Tile, Chip,
Bloom — the last one already carries fixes #12 and #13 from Part 1, since
the component spec cross-references them directly). Icons are Lucide
(`lucide-preact`), per section 3.5. The `/styleguide` route (also reachable
via the `#styleguide` hash, for contexts without path routing) renders
every component forced to both light and dark side by side. None of
Part 1's fixes, Part 2's visual additions, or the actual widget rebuild
have been started — that's steps 2 onward, after this is reviewed.

```
app/
  src/
    types/schema.ts     # Ingredient, Family, Recipe, Week, Batch, Settings, ...
    storage/             # mealplan.json via @capacitor/filesystem, atomic write, migrations
    derive/               # pure functions: nutrition, day totals, shopping, reminder/checklist content, balance checks, batch warnings, next-meal state, nutrition bloom
    seed/                  # v1's 16 recipes + Week 1, migrated into the new schema
    state/                  # @preact/signals store + mutations, debounced save with a flush-on-hide safety net
    styles/                  # the ported v1 HIG design system (Gate D), plus the desktop shell/grid/widget styles
    components/UI.tsx         # shared list/row/sheet/segmented/stepper/tab-bar/sidebar components
    screens/
      Home.tsx                  # the landing dashboard (LANDING-HANDOFF.md)
      home/                       # its three widgets: next meal, checklist, nutrition bloom
      Week, Library, Shopping, Settings.tsx
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
