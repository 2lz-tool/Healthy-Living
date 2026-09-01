# Meal Plan

Personal meal planning app for one household of two. Five screens — Week,
Tonight, Batches, Recipes, Shopping — built around the idea that a pot is
cooked once and covers several meals, rather than planning meal by meal.

Two shapes of the same app live in this repo:

- **`web/`** — the whole product. One self-contained `index.html`. No
  build step, no dependencies, no network calls. Opens by double click,
  works offline, works on the phone.
- **`desktop/`** — a Tauri v2 shell that wraps `web/` in a native macOS
  window (unified toolbar, vibrancy sidebar), so it shows up in the Dock
  and Cmd-Tab like any other app. It is the same code, not a fork — there
  is nothing to keep in sync.

See `HANDOFF.md` for the full design rationale, data shapes, and work
queue. This README only covers how to run things.

## Run the web app

No build, no server. Open `web/index.html` in a browser — double-click it
in Finder, or drag it onto a browser window. Works offline. State (ticked
meals, prep tasks, shopping basket, servings count, last tab) is saved to
`localStorage` on the device, keyed under `mealplan.week1.v1`. There is no
sync between devices or between this and the desktop app — each is its
own local store.

## Run the Mac app

Building the `.app`/`.dmg` has to happen on a Mac — this repo may have
been assembled elsewhere, but Tauri cannot cross-compile a macOS bundle
without Apple's SDK, which only ships with Xcode.

**One-time setup on the Mac:**

```bash
xcode-select --install          # Xcode command line tools
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh   # Rust
```

**Then, from the repo root:**

```bash
cd desktop
npm install
npm run tauri dev      # launches a live window, reloads on file changes
```

**To build a distributable app:**

```bash
npm run tauri build -- --target universal-apple-darwin
```

Output lands in
`desktop/src-tauri/target/universal-apple-darwin/release/bundle/` as both
`Meal Plan.app` and `Meal Plan.dmg`.

The build is unsigned (no paid Developer ID — not needed for a personal
app). macOS will refuse the first open. Ad-hoc sign it once:

```bash
codesign --force --deep --sign - "path/to/Meal Plan.app"
```

If it still complains after moving the `.dmg` to `/Applications` or
between machines:

```bash
xattr -dr com.apple.quarantine "/Applications/Meal Plan.app"
```

### Data safety

The desktop app's `localStorage` lives in the app's own WebKit data
directory under `~/Library/`, separate from Safari's. It survives quit,
reopen, and machine restarts, and is not touched by browser cache
clearing. It does *not* sync with the web version's storage in Safari —
they are two independent local stores by design, so testing one can never
overwrite or lose the other's data. If you want one shared source of
truth later, that is a deliberate next step (see `HANDOFF.md`, `Later`),
not something either version does today.

## What is not decided yet

Three recipes (naatukodi curry, the North Eastern chicken curry, Turkish
eggs) are placeholders — their calorie figures are estimates until real
quantities are supplied. See `HANDOFF.md` section 7 for the rest of the
open questions.
