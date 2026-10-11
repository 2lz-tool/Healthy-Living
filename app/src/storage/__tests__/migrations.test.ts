import { describe, expect, it } from "vitest";
import { migrate } from "../migrations";

describe("migrate", () => {
  it("brings a v0 (missing schemaVersion) document to current", () => {
    const result = migrate({});
    expect(result.schemaVersion).toBeGreaterThanOrEqual(2);
    expect(result.settings.shoppingDays).toEqual(["sat"]);
    expect(result.settings.slotTimes).toEqual({ breakfast: "08:30", lunch: "13:30", dinner: "20:30", snack: "17:00" });
    expect(result.settings.targets.fibreMin).toBe(25);
  });

  it("v1 -> v2 stamps cookedAt on a past batch and leaves a future one alone", () => {
    const past = Date.now() - 10 * 24 * 60 * 60 * 1000;
    const future = Date.now() + 10 * 24 * 60 * 60 * 1000;
    const pastDate = new Date(past).toISOString().slice(0, 10);
    const futureDate = new Date(future).toISOString().slice(0, 10);

    const doc = {
      schemaVersion: 1,
      weeks: {
        w1: {
          id: "w1",
          householdSize: 2,
          haveIngredients: [],
          boughtIngredients: [],
          batches: [
            { id: "b1", recipeId: "r1", cookDate: pastDate, cookWhen: "evening", scale: 1, frozenPortions: 0, assignments: [] },
            { id: "b2", recipeId: "r1", cookDate: futureDate, cookWhen: "morning", scale: 1, frozenPortions: 0, assignments: [] },
          ],
        },
      },
      settings: { targets: {} },
    };

    const result = migrate(doc);
    const [b1, b2] = result.weeks.w1.batches;
    expect(b1.cookedAt).toBe(`${pastDate}T19:00:00`);
    expect(b2.cookedAt).toBeUndefined();
  });

  it("preserves existing settings values rather than overwriting them with defaults", () => {
    const doc = {
      schemaVersion: 1,
      weeks: {},
      settings: {
        shoppingDays: ["wed"],
        targets: { kcalMin: 1200, kcalMax: 1300, proteinMin: 80, proteinMax: 90 },
      },
    };
    const result = migrate(doc);
    expect(result.settings.shoppingDays).toEqual(["wed"]);
    expect(result.settings.targets.kcalMin).toBe(1200);
    expect(result.settings.targets.fibreMin).toBe(25); // filled in, not overwritten
  });
});
