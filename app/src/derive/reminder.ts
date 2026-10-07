import type { Ingredient, Recipe, Slot, Week } from "../types/schema";
import { addDaysIso, dateToHours } from "./dates";
import { roundShopQty, type ShoppingItem } from "./shopping";

const COOK_HOUR: Record<"morning" | "evening", number> = { morning: 8, evening: 19 };
/** The hour "D evening" means, for comparing a prep action's required start
 * time against "tonight" — matches the default reminder time. */
const EVENING_HOUR = 19;

export type PrepTonightItem = {
  batchId: string;
  recipeId: string;
  recipeName: string;
  text: string;
};

export type FreezerItem = {
  batchId: string;
  recipeId: string;
  recipeName: string;
  portions: number;
  slot: Slot;
};

export type ReminderContent = {
  /** The date being prepared for — D+1 relative to the date passed in. */
  date: string;
  buy: ShoppingItem[];
  prepTonight: PrepTonightItem[];
  moveFromFreezer: FreezerItem[];
  isEmpty: boolean;
};

/** Tomorrow's reminder content for date D (fires the evening of D, about
 * D+1). Three groups per spec section 4: buy, prep tonight, move from
 * freezer. If all three are empty, the caller should schedule nothing. */
export function tomorrowReminderContent(
  dateD: string,
  weeks: Week[],
  recipes: Record<string, Recipe>,
  ingredients: Record<string, Ingredient>,
): ReminderContent {
  const dPlus1 = addDaysIso(dateD, 1);
  const dEveningMoment = dateToHours(dateD) + EVENING_HOUR;

  const buyTotals = new Map<string, number>();
  const prepTonight: PrepTonightItem[] = [];
  const moveFromFreezer: FreezerItem[] = [];

  for (const week of weeks) {
    for (const batch of week.batches) {
      const recipe = recipes[batch.recipeId];
      if (!recipe) continue;

      if (batch.cookDate === dPlus1) {
        for (const ri of recipe.ingredients) {
          if (week.haveIngredients.includes(ri.ingredientId)) continue;
          if (week.boughtIngredients.includes(ri.ingredientId)) continue;
          buyTotals.set(ri.ingredientId, (buyTotals.get(ri.ingredientId) ?? 0) + ri.qty * batch.scale);
        }

        const cookMoment = dateToHours(dPlus1) + COOK_HOUR[batch.cookWhen];
        for (const action of recipe.prepActions) {
          if (cookMoment - action.leadHours <= dEveningMoment) {
            prepTonight.push({
              batchId: batch.id,
              recipeId: recipe.id,
              recipeName: recipe.name,
              text: action.text,
            });
          }
        }
      }

      if (batch.frozenPortions > 0) {
        for (const a of batch.assignments) {
          if (a.date === dPlus1) {
            moveFromFreezer.push({
              batchId: batch.id,
              recipeId: recipe.id,
              recipeName: recipe.name,
              portions: batch.frozenPortions,
              slot: a.slot,
            });
          }
        }
      }
    }
  }

  const buy: ShoppingItem[] = [...buyTotals.entries()]
    .map(([ingredientId, rawQty]) => {
      const ing = ingredients[ingredientId];
      return {
        ingredientId,
        name: ing?.name ?? ingredientId,
        aisle: ing?.aisle ?? "other",
        qty: ing ? roundShopQty(rawQty, ing) : Math.ceil(rawQty),
        unit: ing?.unit ?? "g",
        bought: false,
      } satisfies ShoppingItem;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    date: dPlus1,
    buy,
    prepTonight,
    moveFromFreezer,
    isEmpty: buy.length === 0 && prepTonight.length === 0 && moveFromFreezer.length === 0,
  };
}
