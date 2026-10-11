# Meal Plan: Dashboard Polish, Visuals, Style Guide

Handoff for Claude Code. Applies to the rendered dashboard from `LANDING-HANDOFF.md` ("LH"). Data model references point to `BUILD1-SPEC.md` ("B1").

Three parts:
1. Fixes to the current render, alignment and data bugs.
2. Visual additions.
3. Style guide that every screen follows from now on.

Do part 3 first. The token file is what makes part 1 stick. Parts 1 and 2 are then built against the tokens, not with ad hoc values.

This guide assumes HIG styling (LH Gate D) since the rendered build already uses it. All tokens are named semantically, so a Material 3 theme for the phone later is a token swap, not a rewrite.

---

## Part 1. Fixes to the current render

### 1.1 Page and grid

| # | Problem in render | Fix |
|---|---|---|
| 1 | Header title sits at a different baseline from the sidebar "Meal Plan" title. | Header and sidebar title share one 52 px top bar height and are vertically centred in it. |
| 2 | Shopping card ends at ~684 px while the left column runs to ~854 px. LH §2 said the checklist spans both rows. | Right card uses `grid-row: 1 / span 2; align-self: stretch`. Its list area flexes to fill and scrolls internally (1.4). |
| 3 | Card inner padding varies: 16 px at the card edge, items in the shopping card indented to ~32 px, the "Short before" label indented further than the title. | One padding token for all cards: `--space-5` (20 px). Everything inside a card aligns to that left edge. No nested indents except the checkbox column (1.4). |
| 4 | Header has no separation from content when scrolled. | Header becomes sticky with the `--material-bar` background and a hairline bottom border that only appears after scroll. |

### 1.2 Next meal card

| # | Problem | Fix |
|---|---|---|
| 5 | Title line "Lunch · 1:30 pm — Naatukodi curry" uses an em dash and buries the dish name. | Dish name is the title (`title-2`). Slot and time go above it as an eyebrow: "LUNCH · 1:30 PM". No em dashes anywhere in UI strings (3.8). |
| 6 | **Data bug.** At 18:19 the card still shows lunch at 1:30 pm. LH §4.1 says a slot drops off at slot time plus 60 minutes. | Fix `nextMeal(now)`. At 18:19 the card must show dinner. Add a test at 18:19 with lunch uneaten. |
| 7 | **Data bug.** 750 kcal and 100 g protein per person for one lunch is impossible against a 95 g daily target. Per-serving nutrition is being computed before dividing by `yieldServings`, or yield is wrong in the seed. | Fix the derivation in B1 §4 and add a test: per-person nutrition × `yieldServings` equals the recipe total. If the seed yield is the problem, correct the seed and leave `estimated` on. |
| 8 | "Then: Snack · not planned". Snack is optional, and 17:00 had passed anyway. | Empty `snack` and `side` slots are skipped by `nextMeal` and by the "Then" line. They only appear when something is assigned. |
| 9 | "Mark eaten" is a grey tinted button, which reads as secondary. | It is the card's one primary action: filled accent button (3.6). |
| 10 | The "est." badge sits inline with the status text and breaks the line rhythm. | It moves next to the nutrition figure it qualifies (3.7). |

### 1.3 Nutrition card

| # | Problem | Fix |
|---|---|---|
| 11 | Chart occupies ~210 px of a ~540 px card, left-aligned, with dead space to its right and the table stacked below. | Two-column card body: chart at fixed 240 × 240 on the left, metrics list on the right filling the remaining width, top-aligned. |
| 12 | The "Vegetables" label clips at the left edge ("getables"). | The SVG viewBox includes a 36 px label margin on all sides. Labels sit outside the petal tips with `text-anchor` set by angle (start, middle, end). No label may cross the viewBox. |
| 13 | Ideal and projected layers are both dashed petal outlines, so they cannot be told apart. | Ideal: one solid hairline circle at radius 1.0 in `--label-3`, plus a tolerance band as a 10% tint ring. Actual: filled petals in the status colour at 80% opacity. Projected: dashed petal outline in `--label-2`. The legend matches these three encodings, not the status colours. |
| 14 | Segmented control "This week" wraps to two lines and the control is taller than the card title. | Segmented control uses `white-space: nowrap` and a fixed 24 px height (3.6), vertically centred on the title row. |
| 15 | "Calories is 1500 kcal short this week. The rest of the plan closes it." Ungrammatical, contradicts the 1550 in the table, and says nothing useful at 0%. | When nothing is logged: "Nothing logged yet. Mark lunch eaten to start tracking." Otherwise use the template from LH §4.3, with grammar fixed: "Calories are 420 kcal short." |
| 16 | **Data bug.** Proration uses whole days, so at 18:19 on day 1 the ideal is the full day or zero. | Prorate by slots passed: ideal-to-date is the target times the fraction of planned slots whose time has passed. |
| 17 | "est." badge on all six rows is noise. | If every row is estimated, show one footnote under the list: "est. Some recipes have estimated quantities." Per-row badges only when rows differ. |
| 18 | "0.0 of 3.0 servings" vs "0 of 25 g": inconsistent decimals. | Integers for kcal and grams. One decimal for servings only when non-integer. All figures use tabular numerals (3.3). |

### 1.4 Shopping card

| # | Problem | Fix |
|---|---|---|
| 19 | Title "SHOP BY 10-17", and usage lines like "10-12 lunch". | Title: "Shop by Sat 17 Oct". Usage: weekday names, "Mon, Tue lunch". Date format rules in 3.8. |
| 20 | **Row layout broken.** On "Curd" the checkbox sits on its own line above the name. Names are centre-aligned. Quantity and "Have it" wrap onto a third line on some rows but not on "Besan". | Every row uses one fixed grid: `[checkbox 20px] [name + usage, flex] [qty, right-aligned, tabular] [overflow 24px]`. Left-aligned text, single-line name, usage truncated with ellipsis on one line. Row min height 44 px. |
| 21 | "Have it" renders as an inline link. LH §4.2 put it in the overflow menu. | Move it to the overflow menu, as specced. |
| 22 | Week strip: 16 px dots with 7 px letters are unreadable. Today uses a heavy black ring, the shopping day uses an orange ring plus blue fill (two encodings), and the strip starts 4 px left of the card padding. | Use the Day strip component (3.6). |
| 23 | "Short before 17 Oct" contains Curd with usage through 10-17 lunch. **Data bug:** meals on the shopping day itself belong in "Buy on". | Window for "Short before" is `today` to `nextShop - 1` inclusive. Split an ingredient across both sections when its uses span the boundary, with quantities split accordingly. Add a test. |
| 24 | Only the "Short before" section has a header. "Buy on" is missing. | Both sections get a sticky section header (3.6): label left, item count right. |
| 25 | "1 of 53 bought". 53 items means salt, spices, and oil are on the list. | Add `staple: boolean` to Ingredient (B1 §3). Staples collapse into one last group, "Staples, check stock", collapsed by default, and are excluded from the count. |
| 26 | List cut off mid-row ("Rolled oats") with no scroll cue. | Internal scroll with 24 px fade masks at top and bottom. Section headers stick. |

---

## Part 2. Visual additions

The rule for every addition: it carries information. No decorative illustrations, no stock photography.

### 2.1 Dashboard

**Next meal card**
- **Dish image.** Add an optional `image` field to Recipe, for Tulika's own photo of the dish. It shows as a 120 × 120 rounded tile on the left of the card. Without a photo, show a **family tile**: the family's accent tint (3.2) with the dish name's initials in `title-2`. Every recipe in a family shares the tint, so families are recognisable at a glance across screens.
- **Today's timeline** below the main content. A horizontal track of today's non-empty slots, each a dot on a line at its time, with a "now" marker. Dot states: eaten (filled `--green`), ready (filled `--accent`), needs cooking (ring `--orange`), not planned (ring `--label-3`). The "Then" text line is removed; the timeline replaces it.
- **Cook-first state** gets a prep progress ring next to the status: done tasks over total `prepActions`.

**Nutrition card**
- **Fix the bloom per 1.3**, then add a **7-day strip** under the two-column body: seven narrow columns, Sun to Sat. Each column shows kcal eaten as a filled bar and planned as an outline bar, against a target line. Today is highlighted, and future days show the planned outline only. Tapping a day switches the bloom to that day.
- **Metrics list** rows get an inline progress bar (4 px tall, full row width under the label) in the petal's status colour, so the list and chart read together.

**Shopping card**
- **Aisle icons** on section sub-groups (Produce, Meat and fish, Dairy and eggs, Grains, Legumes, Spices, Oils, Frozen). Icon set in 3.5.
- **Progress ring** in the card header (24 px) showing bought over total, replacing the plain "1 of 53" footer text. Keep the count as the ring's accessible label.
- **Meal chips** in place of usage text on hover or expand: small chips "Mon lunch", "Tue lunch" in the family tint of the recipe that needs the ingredient.

### 2.2 Other screens

These apply when those screens are next touched. They are not a blocker for the dashboard.

- **Week planner:** batches drawn as horizontal bars spanning cook day to last assignment, in the family tint. A lighter extension of the bar shows the remaining shelf life. This makes the "chicken is on a 48-hour clock" problem visible.
- **Library:** families as cards with the family tint header and a row of variant tiles (photo or initials tile). Axis values as chips on each variant.
- **Recipe detail:** a nutrition mini-bloom per serving at 96 px, same component as the dashboard bloom, ideal set to one meal's share of the day.

---

## Part 3. Style guide

All values live in `src/styles/tokens.css` as CSS custom properties. Components reference tokens only. A literal colour, size, or spacing value in component CSS is a review failure.

### 3.1 Platform scale

Desktop (window width ≥ 900 px) follows macOS text sizes. Below 900 px switches to iOS sizes. Only the type tokens change between the two; spacing and colour stay the same.

### 3.2 Colour

Use system colours, light and dark, as in v1.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | #F2F2F7 | #000000 | Window background |
| `--surface` | #FFFFFF | #1C1C1E | Cards |
| `--surface-2` | #F2F2F7 | #2C2C2E | Inset areas, segmented control track |
| `--label` | #000000 | #FFFFFF | Primary text |
| `--label-2` | rgba(60,60,67,.60) | rgba(235,235,245,.60) | Secondary text, metadata |
| `--label-3` | rgba(60,60,67,.30) | rgba(235,235,245,.30) | Tertiary, placeholders, ideal outlines |
| `--separator` | rgba(60,60,67,.18) | rgba(84,84,88,.6) | Hairlines, row dividers |
| `--accent` | #007AFF | #0A84FF | Primary actions, links, selection |
| `--green` | #34C759 | #30D158 | On target, eaten |
| `--orange` | #FF9500 | #FF9F0A | Under target, needs cooking, short before shop |
| `--red` | #FF3B30 | #FF453A | Over limit, overdue prep, errors |
| `--material-bar` | rgba(246,246,248,.8) + blur 20 | rgba(28,28,30,.8) + blur 20 | Sticky header, sidebar |

Status colours mean status only. They never identify a family, nutrient, or aisle.

**Family tints.** Eight muted tints for dish family identity, assigned in order of family creation. Each has a `-bg` (tile fill) and `-fg` (text on the tile) value, with `-fg` checked at 4.5:1 contrast against `-bg` in both modes:

`--tint-clay`, `--tint-saffron`, `--tint-olive`, `--tint-teal`, `--tint-slate`, `--tint-plum`, `--tint-rose`, `--tint-sand`

Light mode `-bg` values sit around 85 to 90% lightness; dark mode around 25 to 30%. Claude Code defines the exact hex values and adds a contrast test.

### 3.3 Typography

Font: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`. Numbers in figures, tables, and quantities use `font-variant-numeric: tabular-nums`.

| Token | Desktop size/line | Phone size/line | Weight | Use |
|---|---|---|---|---|
| `title-1` | 22/28 | 28/34 | 700 | Page title (header) |
| `title-2` | 17/22 | 22/28 | 600 | Card hero text (dish name) |
| `headline` | 13/16 | 17/22 | 600 | Row titles, list item names |
| `body` | 13/18 | 17/22 | 400 | Default text |
| `callout` | 12/16 | 16/21 | 400 | Secondary lines, usage text |
| `eyebrow` | 11/13 | 13/18 | 600, uppercase, letter-spacing .06em | Widget titles, slot eyebrows, section headers |
| `caption` | 10/13 | 12/16 | 400 | Chart labels, footnotes, badges |
| `figure` | 22/26 | 28/32 | 600, tabular | Large numbers |

Widget titles use `eyebrow` in `--label-2`. Nothing else on the dashboard is uppercase.

### 3.4 Spacing, radius, elevation

- **Spacing scale (4 px base):** `--space-1` 4, `--space-2` 8, `--space-3` 12, `--space-4` 16, `--space-5` 20, `--space-6` 24, `--space-8` 32, `--space-10` 40.
- **Grid:** 12 columns, gutter `--space-6`, page padding `--space-8`, max content width 1280. Phone: one column, page padding `--space-4`.
- **Card:** padding `--space-5`, gap between internal blocks `--space-4`, widget header to content `--space-3`.
- **Radius:** `--radius-sm` 6 (buttons, controls, badges), `--radius-md` 10 (tiles, inputs), `--radius-lg` 14 (cards), `--radius-full` for dots and rings.
- **Elevation:** cards have no shadow in light mode, only a 0.5 px `--separator` border. In dark mode, the border plus `--surface` contrast. Popovers and menus: `0 8px 24px rgba(0,0,0,.12)`.

### 3.5 Icons

Lucide icons (ISC licence), stroke 1.75, sized 16 px in rows and 18 px in the sidebar. Replace the current Unicode glyphs (⌂ ▤ ≡ ✓ ⚙) in the sidebar. SF Symbols are not used: their licence restricts them to Apple platforms, and the phone build is Android.

Fixed icon map: Home `house`, Week `calendar-days`, Library `book-open`, Shopping `shopping-basket`, Settings `settings`. Aisles: Produce `carrot`, Meat and fish `drumstick`, Dairy and eggs `milk`, Grains `wheat`, Legumes `bean`, Spices `flame`, Oils `droplet`, Frozen `snowflake`, Other `package`.

### 3.6 Components

Each component lives in `src/ui/` and is the only way that pattern appears.

| Component | Spec |
|---|---|
| **Card** | `--surface`, `--radius-lg`, border per 3.4, padding `--space-5`. Optional header slot. |
| **WidgetHeader** | One row, 24 px tall: eyebrow title left; right side holds at most one control or one text link, vertically centred. |
| **Button, primary** | Filled `--accent`, white `headline` text, height 28 desktop / 44 phone, `--radius-sm`, padding x `--space-3`. One per card. |
| **Button, secondary** | `--accent` at 12% fill, `--accent` text. Same size. |
| **Button, plain** | Text only, `--accent`. For "Full list" type links. |
| **SegmentedControl** | Track `--surface-2`, height 24 desktop / 32 phone, `--radius-sm`. Selected segment `--surface` with a 1 px shadow. Labels `callout`, nowrap. |
| **Checkbox** | 20 px circle, 1.5 px `--label-3` border. Checked: filled `--accent` with a white check. The row label gets strikethrough in `--label-2` when checked. |
| **ListRow** | Grid per fix 20. Min height 44. `--separator` hairline between rows, inset to the text start, not the checkbox. |
| **SectionHeader** | `eyebrow` label left, count right in `caption`, sticky inside scroll areas, `--surface` background. A warning variant uses an `--orange` label. |
| **DayStrip** | 7 equal cells, each 28 px wide: weekday letter (`caption`, `--label-2`) above a 24 px circle with the date number (`callout`). Today: circle filled `--label`, text `--surface`. Shopping day: small basket icon under the circle. Next shopping day: circle ring 2 px `--accent`. One encoding per meaning. Aligned to the card padding edge. |
| **Badge (est.)** | `caption`, `--orange` text on `--orange` at 12%, `--radius-sm`, padding 1/6. |
| **ProgressRing** | 24 px, stroke 3, track `--separator`, value `--accent` or status colour. |
| **ProgressBar** | 4 px tall, `--radius-full`, track `--separator`. |
| **Tile** | Square, `--radius-md`. Photo with `object-fit: cover`, or the family tint with initials. |
| **Chip** | `caption`, height 20, family tint `-bg` and `-fg`, `--radius-full`. |
| **Bloom** | Per 1.3 #12 and #13. Sizes 240 (dashboard) and 96 (recipe detail); labels hidden at 96, with a table fallback. |

### 3.7 Data display rules

- Units with a space: "750 kcal", "25 g", "1.2 kg", "800 ml".
- Grams switch to kilograms at 1,000. Millilitres switch to litres at 1,000.
- The "est." marker attaches to the figure, not to the sentence or the row title.
- Zero states say what to do next, never "0%" alone.
- Shortfalls name the cause when one meal accounts for most of it (LH §4.3).

### 3.8 Copy rules

- No em dashes in any UI string. Use a middle dot (·) to join metadata, a colon to introduce, or two sentences.
- Sentence case everywhere except `eyebrow`.
- Dates: "Sat 17 Oct" in titles and headers, weekday alone ("Mon lunch") when inside the current week, never "10-17" or ISO in the UI.
- Times: "1:30 pm", lowercase, no leading zero.
- Verbs on buttons: "Mark eaten", "Mark cooked", "Plan week". No "Click here", no "Submit".

### 3.9 Motion

- Durations: 150 ms for state changes (ticks, toggles), 250 ms for layout (expand, panel), 400 ms maximum for chart entry.
- Easing: `cubic-bezier(.2,.8,.2,1)`.
- Everything respects `prefers-reduced-motion`: transitions become instant, the chart draws without animation.

### 3.10 Accessibility

- Text contrast 4.5:1 minimum, 3:1 for icons and chart strokes, checked in both modes.
- Tap targets 44 × 44 minimum, including the overflow button and DayStrip cells.
- Every chart has a text or table equivalent. Status is never colour alone: pair it with an icon or text.
- Focus ring: 2 px `--accent` at 2 px offset, visible on keyboard focus only.

---

## Work order

1. **Tokens and components.** `tokens.css` and the `src/ui/` components from 3.6, with a `/styleguide` dev route that renders every component in light and dark. **Checkpoint:** Tulika reviews the styleguide route before anything else changes.
2. **Data bugs.** #6, #7, #8, #16, #23, #25 with tests. **Checkpoint:** test output.
3. **Rebuild the three widgets** on the components, applying every Part 1 fix. **Checkpoint:** screenshot at 1280 and 1000 wide, light and dark.
4. **Part 2.1 visuals.** **Checkpoint:** screenshot.
5. **Part 2.2** when those screens are next worked on.

## Accept when

- Every Part 1 row is fixed and screenshot-verified at 1000, 1280, and 1600 wide.
- No literal colour, size, or spacing value remains in component CSS (grep check in CI).
- No em dash character in `src/` strings (grep check in CI).
- The `/styleguide` route shows every component in both modes.
- The dashboard at 18:19 shows dinner as the next meal.
- Left and right columns end at the same y position.
- Nothing clips, wraps unexpectedly, or scrolls horizontally at 1000 px.
