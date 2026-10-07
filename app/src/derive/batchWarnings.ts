import type { Batch, Recipe } from "../types/schema";
import { daysBetween } from "./dates";

export type BatchWarning = { level: "warn" | "error"; message: string };

/** The three rules from spec section 3: enough servings, within shelf
 * life (or frozen), never assigned before it's cooked. Shown live as
 * slots are tapped in the planner — warnings, except the before-cookDate
 * case, which section 3 calls out as the one that's actually blocked. */
export function batchWarnings(batch: Batch, recipe: Recipe, householdSize: number): BatchWarning[] {
  const warnings: BatchWarning[] = [];

  const neededServings = batch.assignments.length * householdSize;
  const availableServings = recipe.yieldServings * batch.scale;
  if (neededServings > availableServings) {
    warnings.push({
      level: "warn",
      message: `${neededServings} servings needed across ${batch.assignments.length} meal${batch.assignments.length === 1 ? "" : "s"}, only ${availableServings} at this scale.`,
    });
  }

  for (const a of batch.assignments) {
    const days = daysBetween(batch.cookDate, a.date);
    if (days < 0) {
      warnings.push({ level: "error", message: `${a.date} is before the cook date ${batch.cookDate}.` });
    } else if (days > recipe.shelfLifeDays && batch.frozenPortions <= 0) {
      warnings.push({
        level: "warn",
        message: `${a.date} is ${days} day${days === 1 ? "" : "s"} after cooking — past the ${recipe.shelfLifeDays}-day shelf life.`,
      });
    }
  }

  return warnings;
}

export function hasBlockingError(warnings: BatchWarning[]): boolean {
  return warnings.some((w) => w.level === "error");
}
