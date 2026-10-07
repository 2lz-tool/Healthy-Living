import { CURRENT_SCHEMA_VERSION, DEFAULT_SETTINGS, type Store } from "../types/schema";
import { INGREDIENTS } from "./ingredients";
import { FAMILIES } from "./families";
import { RECIPES } from "./recipes";
import { WEEK1 } from "./week1";

export { INGREDIENTS, INGREDIENTS_BY_ID } from "./ingredients";
export { FAMILIES } from "./families";
export { RECIPES, RECIPES_BY_ID } from "./recipes";
export { WEEK1 } from "./week1";

/** v1's Week 1 and 16 recipes, migrated into the Build 1 schema — the
 * first-run state for this household's one and only library. */
export function buildSeedStore(): Store {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ingredients: Object.fromEntries(INGREDIENTS.map((i) => [i.id, i])),
    families: Object.fromEntries(FAMILIES.map((f) => [f.id, f])),
    recipes: Object.fromEntries(RECIPES.map((r) => [r.id, r])),
    weeks: { [WEEK1.id]: WEEK1 },
    log: { eaten: [], prepDone: [] },
    settings: { ...DEFAULT_SETTINGS },
  };
}
