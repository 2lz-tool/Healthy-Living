import { describe, expect, it } from "vitest";
import type { Batch, Recipe } from "../../types/schema";
import { batchWarnings, hasBlockingError } from "../batchWarnings";

function recipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "r1",
    familyId: null,
    name: "Test",
    axisValues: {},
    yieldServings: 2,
    ingredients: [],
    steps: [],
    prepActions: [],
    shelfLifeDays: 3,
    freezable: false,
    slots: ["dinner"],
    activeMinutes: 10,
    source: { kind: "own" },
    status: "draft",
    ...overrides,
  };
}

function batch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: "b1",
    recipeId: "r1",
    cookDate: "2026-10-11",
    cookWhen: "evening",
    scale: 1,
    frozenPortions: 0,
    assignments: [{ date: "2026-10-12", slot: "dinner" }],
    ...overrides,
  };
}

describe("batchWarnings", () => {
  it("is empty for a batch with enough scale and everything within shelf life", () => {
    const warnings = batchWarnings(batch(), recipe(), 2);
    expect(warnings).toHaveLength(0);
  });

  it("warns when scale doesn't cover the assignments", () => {
    const b = batch({ assignments: [{ date: "2026-10-12", slot: "lunch" }, { date: "2026-10-12", slot: "dinner" }, { date: "2026-10-13", slot: "lunch" }] });
    const warnings = batchWarnings(b, recipe(), 2);
    expect(warnings.some((w) => w.level === "warn" && w.message.includes("6 servings needed"))).toBe(true);
  });

  it("warns when an assignment is past shelf life and nothing is frozen", () => {
    const b = batch({ assignments: [{ date: "2026-10-16", slot: "dinner" }] }); // 5 days after cookDate, shelfLifeDays=3
    const warnings = batchWarnings(b, recipe(), 2);
    expect(warnings.some((w) => w.message.includes("past the 3-day shelf life"))).toBe(true);
  });

  it("does not warn about shelf life when the batch has frozen portions", () => {
    const b = batch({ assignments: [{ date: "2026-10-16", slot: "dinner" }], frozenPortions: 2 });
    const warnings = batchWarnings(b, recipe(), 2);
    expect(warnings.some((w) => w.message.includes("shelf life"))).toBe(false);
  });

  it("errors (blocking) when an assignment is before the cook date", () => {
    const b = batch({ assignments: [{ date: "2026-10-10", slot: "dinner" }] });
    const warnings = batchWarnings(b, recipe(), 2);
    expect(hasBlockingError(warnings)).toBe(true);
  });
});
