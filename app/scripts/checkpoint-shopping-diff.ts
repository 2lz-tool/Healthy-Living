/**
 * Step-2 checkpoint deliverable: the shopping list the new schema derives
 * for seeded Week 1, compared against v1's hand-written SHOPPING const.
 *
 * Not a Vitest test (no assertions, just a report) and deliberately named
 * so Vitest's default include glob skips it. To re-run: copy it to
 * src/seed/checkpoint.test.ts and `npx vitest run src/seed/checkpoint.test.ts`,
 * then discard the copy — it's checked in here as a readable record of
 * the comparison, not as a script meant to run in CI.
 */
import { buildSeedStore } from "../index";
import { shoppingListForWeek } from "../../derive/shopping";

// v1's SHOPPING const, transcribed verbatim from web/index.html for comparison.
const V1_SHOPPING: { cat: string; items: [string, string][] }[] = [
  { cat: "Produce", items: [
    ["Onion", "1.5 kg"], ["Tomato", "1 kg"], ["Cucumber", "7"], ["Carrot", "8"],
    ["Spinach", "500 g"], ["Beans or methi", "300 g"], ["Banana", "6"],
    ["Apple", "5"], ["Spring onion", "1 bunch"], ["Coriander", "2 bunches"],
    ["Green chilli", "12"], ["Curry leaves", "2 sprigs"], ["Ginger", "150 g"],
    ["Garlic", "3 heads"], ["Lemon", "6"], ["Potato", "3"],
  ] },
  { cat: "Protein", items: [
    ["Country chicken", "1 kg"], ["Chicken, curry cut", "800 g"],
    ["Chicken mince", "400 g"], ["Fish, surmai or basa", "400 g"],
    ["Eggs", "20"],
  ] },
  { cat: "Dairy", items: [
    ["Greek yogurt", "500 g tub"], ["Curd", "2 kg"], ["Milk", "2 L"], ["Ghee", "small pack"],
  ] },
  { cat: "Grains and legumes", items: [
    ["Idli rice", "3 cups"], ["Urad dal", "1 cup"], ["Thick poha", "1/2 cup"],
    ["Rajma", "2 cups"], ["Kabuli chana", "2.5 cups"], ["Toor dal", "1.5 cups"],
    ["Yellow moong dal", "1 cup"], ["Rolled oats", "500 g"], ["Besan", "500 g"],
    ["Ragi flour", "500 g"], ["Rice", "as needed"],
  ] },
  { cat: "Other", items: [
    ["Rice paper sheets", "16"], ["Peanuts, roasted", "300 g"], ["Peanut butter", "1 jar"],
    ["Almonds", "200 g"], ["Makhana", "100 g"], ["Chia seeds", "100 g"],
    ["Tamarind", "small block"], ["Soy sauce", "1 bottle"], ["Sesame oil", "small"],
  ] },
];

const v1Names = new Set<string>();
for (const cat of V1_SHOPPING) for (const [name] of cat.items) v1Names.add(name.toLowerCase());

const store = buildSeedStore();
const week = Object.values(store.weeks)[0];
const derived = shoppingListForWeek(week, store.recipes, store.ingredients);

console.log(`\n=== Derived shopping list for Week ${week.id} (${derived.length} items) ===\n`);
const byAisle: Record<string, typeof derived> = {};
for (const item of derived) (byAisle[item.aisle] ??= []).push(item);
for (const [aisle, items] of Object.entries(byAisle)) {
  console.log(`-- ${aisle} --`);
  for (const item of items) console.log(`  ${item.name}: ${item.qty} ${item.unit}`);
}

console.log(`\n=== In v1's hand list but not in the derived list ===\n`);
const derivedNames = new Set(derived.map((i) => i.name.toLowerCase()));
for (const cat of V1_SHOPPING) {
  for (const [name, qty] of cat.items) {
    if (!derivedNames.has(name.toLowerCase())) {
      console.log(`  [${cat.cat}] ${name} (${qty})`);
    }
  }
}

console.log(`\n=== In the derived list but not named in v1's hand list ===\n`);
for (const item of derived) {
  if (!v1Names.has(item.name.toLowerCase())) {
    console.log(`  [${item.aisle}] ${item.name}: ${item.qty} ${item.unit}`);
  }
}

console.log(`\n=== Present in both — quantity comparison ===\n`);
for (const cat of V1_SHOPPING) {
  for (const [name, v1Qty] of cat.items) {
    const match = derived.find((i) => i.name.toLowerCase() === name.toLowerCase());
    if (match) {
      console.log(`  ${name}: v1 "${v1Qty}" vs derived "${match.qty} ${match.unit}"`);
    }
  }
}
