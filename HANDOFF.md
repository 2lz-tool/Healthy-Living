# Meal Plan — handoff

Personal meal planning app for one household of two. Web app now, Mac app next.

Built as a single self-contained `index.html`. No build step, no dependencies, no network calls. Opens by double click, works offline, works on the phone.

---

## 1. Gate before you write code

Two decisions are baked into the current build. Confirm or reverse them before extending, because both are load-bearing on the data model.

**Gate A — the unit of the plan is the batch, not the day.**
Days are a rendering of batches. A pot is cooked once and points at the meals it covers. If you would rather edit day by day and let batches be derived, that inverts the model and is much cheaper to change now than after weeks 2 to 4 are entered.

**Gate B — Tauri, not native SwiftUI, for v1 of the Mac app.**
Reasoning in section 4. The consequence is that HIG is approximated in CSS rather than inherited from AppKit. If HIG fidelity matters more than shipping this month, reverse it and treat the web app as a spec rather than a codebase.

Do not start section 5 until both are answered.

---

## 2. What is in the build

Five screens, tab bar under 900px, sidebar above.

| Screen | Does |
|---|---|
| Week | Seven days, four meal slots each, tap to tick off. Day calorie totals, weekly average, servings stepper. Today marked with a dot. |
| Tonight | The four evening cook sessions (Sun, Wed, Fri, Sat) as checklists. Tonight's session labelled from the system date. |
| Batches | Nine batches with shelf life, a freshness bar, and the meals each one covers. Colour shifts to orange at 3 days and red at 2. |
| Recipes | Sixteen recipes in a sheet. Three are placeholders for Tulika's own dishes. |
| Shopping | One week for two, grouped by aisle, with a running basket count. |

State in `localStorage` under `mealplan.week1.v1`: ticked meals, ticked prep tasks, basket, servings count, last tab. No sync, no accounts.

### Data shapes

```js
RECIPES[key] = { title, meta, yieldServes, ingredients: [[name, qty]], steps: [], note }
DAYS = [{ key, name, dow, activity: "run"|"yoga"|null, cookTonight: recipeKey|null,
          meals: [{ slot, title, kcal, recipe: recipeKey|null }] }]
BATCHES = [{ id, name, cooked, life, unit, covers: [], recipe, warn }]
PREP[dayKey] = { label, minutes, tasks: [] }
SHOPPING = [{ cat, items: [[name, qty]] }]
```

All five are top-level consts in the inline script. First refactor is to lift them out to `src/data/week1.js` unchanged.

---

## 3. Repo

There is no `healthy-living` repo visible from this session, so nothing was pushed. Either point Claude Code at the existing repo and drop `index.html` in as `week1-reference.html`, or start fresh with the structure below.

```
meal-plan/
  README.md
  HANDOFF.md
  web/
    index.html            # current build, works standalone
    src/
      data/week1.js
      data/week2.js       # not written yet
      views/*.js
      styles/tokens.css   # HIG variables, already isolated in :root
  desktop/                # added in section 4
```

Keep `web/index.html` runnable without a bundler for as long as possible. The moment it needs `npm run dev` to open, it stops being usable on the phone in a pinch.

---

## 4. Mac app

**Recommendation: Tauri v2.** The web app is already the whole product. Tauri wraps it in a native shell using the system WebKit view, so the binary lands around 5 MB rather than the 90 MB an Electron build would cost, and there is no second implementation to keep in sync.

```bash
cd meal-plan
npm create tauri-app@latest desktop -- --template vanilla
# point src/ at ../web, or symlink
cd desktop
npm run tauri dev
npm run tauri build -- --target universal-apple-darwin
```

Output lands in `src-tauri/target/universal-apple-darwin/release/bundle/` as both `.app` and `.dmg`.

Requires Rust and Xcode command line tools. Both are one-time installs.

### Making it install cleanly

Unsigned, macOS will refuse the first open. For a personal app, ad-hoc signing is enough:

```bash
codesign --force --deep --sign - "path/to/Meal Plan.app"
```

If it still complains after moving the `.dmg` between machines:

```bash
xattr -dr com.apple.quarantine "/Applications/Meal Plan.app"
```

A paid Developer ID and notarisation are only worth it if this ever goes to anyone else.

### `tauri.conf.json` settings that matter

```json
{
  "app": {
    "windows": [{
      "title": "Meal Plan",
      "width": 1000, "height": 760, "minWidth": 380, "minHeight": 500,
      "titleBarStyle": "Overlay",
      "hiddenTitle": true
    }]
  }
}
```

`Overlay` plus `hiddenTitle` gives the unified toolbar look. The sidebar in the CSS already has `backdrop-filter`, so it will read as a real vibrancy sidebar once the title bar is transparent. Add 28px of top padding to `.sidebar` under a `.is-desktop` class so content clears the traffic lights.

### What Tauri does not give you

These need native work, in rough order of value:

1. Menu bar with real commands. Tauri v2 exposes `tauri::menu`. At minimum: Week / Tonight / Batches / Recipes / Shopping under a View menu with Cmd 1 through 5.
2. Local notifications. `tauri-plugin-notification`. The genuinely useful one is a 7pm reminder on Sunday, Wednesday and Friday that a pot needs to go on.
3. Persistence beyond `localStorage`. `tauri-plugin-store` writes JSON to Application Support and survives a webview cache clear.
4. Dock badge for uncooked batches.

### If you reverse Gate B

Native SwiftUI. `NavigationSplitView` for the sidebar, `List` with `.insetGrouped`, `.sheet` for recipes, `@AppStorage` or SwiftData for state. The data files convert to a `Codable` struct set almost one to one. Budget two to three days rather than an afternoon, and you get HIG for free instead of imitating it, plus Shortcuts and widgets. A "cook rajma tonight" widget on the Mac desktop is the strongest argument for this route.

---

## 5. Work queue

**Now**
1. Lift the five data consts into `web/src/data/week1.js`, export them, import in `index.html` with `<script type="module">`. No behaviour change.
2. Replace the three placeholder recipes once Tulika supplies quantities and calories for naatukodi, the North Eastern chicken curry and Turkish eggs. Every calorie figure touching those three is currently an estimate and the day totals inherit the error.
3. Add weeks 2 to 4 as `week2.js` through `week4.js`. Same shape. Add a week switcher to the Week screen header.

**Next**
4. Derive `SHOPPING` from the recipes in the selected week instead of hand-maintaining it. This is the single highest-value change in the file: the hand list will drift the first time a meal is swapped.
5. Derive `BATCHES.covers` from `DAYS` rather than duplicating the mapping. Right now the same fact lives in two places.
6. Swap a meal. Long press a meal row, pick a replacement from a compatible list, recompute the batch and the shopping list.

**Later**
7. Tauri wrap, per section 4.
8. Weight and run log, plotted against the plan.
9. Export the week to a printable card for the fridge.

---

## 6. Accept when

- Opens from Finder with no server and no network, on Mac and on iPhone Safari.
- Ticked state survives quit and reopen.
- Dark mode follows the system without a manual toggle.
- Every tap target clears 44px.
- Keyboard: Tab reaches every control with a visible focus ring, Escape closes the recipe sheet.
- `prefers-reduced-motion` kills the sheet animation.
- No calorie figure in the shipped build is an estimate of a dish Tulika actually cooks.

---

## 7. Open questions

- Calorie and quantity figures for the three of her own recipes.
- Does the plan need a shared mode for two people ticking independently, or is one device enough.
- Weeks 2 to 4: rotate the same batches on a different order, or introduce new dishes.
- Braces or aligners. It changes whether roasted chana, raw carrot sticks and whole almonds stay in the snack list at all.
