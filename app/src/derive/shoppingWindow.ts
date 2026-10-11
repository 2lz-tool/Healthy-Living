import type { DayOfWeek } from "../types/schema";
import { addDaysIso, dayOfWeekOf, isoDate } from "./dates";

export type ShoppingWindow = {
  nextShop: string;
  followingShop: string;
};

/** The first date on or after `fromIso` whose day of week is in `days`,
 * scanning at most a week forward (one of the 7 days always matches since
 * onboarding requires at least one shopping day). */
function nextOccurrenceOnOrAfter(fromIso: string, days: DayOfWeek[]): string {
  for (let i = 0; i < 7; i++) {
    const candidate = addDaysIso(fromIso, i);
    if (days.includes(dayOfWeekOf(candidate))) return candidate;
  }
  // Unreachable when `days` is non-empty, per the onboarding contract.
  return fromIso;
}

/** LANDING-HANDOFF.md section 4.2. `nextShop` is the first shopping day on
 * or after today, rolled to the following one if today is a shopping day
 * past 8pm. `followingShop` is the one after that. */
export function shoppingWindow(now: Date, shoppingDays: DayOfWeek[]): ShoppingWindow {
  const todayIso = isoDate(now);
  const isShoppingDay = shoppingDays.includes(dayOfWeekOf(todayIso));
  const pastCutoff = now.getHours() + now.getMinutes() / 60 >= 20;
  const searchFrom = isShoppingDay && pastCutoff ? addDaysIso(todayIso, 1) : todayIso;

  const nextShop = nextOccurrenceOnOrAfter(searchFrom, shoppingDays);
  const followingShop = nextOccurrenceOnOrAfter(addDaysIso(nextShop, 1), shoppingDays);
  return { nextShop, followingShop };
}
