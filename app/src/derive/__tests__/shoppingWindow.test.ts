import { describe, expect, it } from "vitest";
import { shoppingWindow } from "../shoppingWindow";

// 2026-10-11 is a Sunday; 10-12 Mon, 10-14 Wed, 10-17 Sat.

describe("shoppingWindow", () => {
  it("finds the next occurrence of a single shopping day", () => {
    const w = shoppingWindow(new Date("2026-10-12T10:00:00"), ["sat"]);
    expect(w.nextShop).toBe("2026-10-17");
    expect(w.followingShop).toBe("2026-10-24");
  });

  it("stays on today when today is the shopping day and before the cutoff", () => {
    const w = shoppingWindow(new Date("2026-10-17T10:00:00"), ["sat"]);
    expect(w.nextShop).toBe("2026-10-17");
    expect(w.followingShop).toBe("2026-10-24");
  });

  it("rolls to the following occurrence when today is the shopping day past 8pm", () => {
    const w = shoppingWindow(new Date("2026-10-17T21:00:00"), ["sat"]);
    expect(w.nextShop).toBe("2026-10-24");
    expect(w.followingShop).toBe("2026-10-31");
  });

  it("picks the nearer of two shopping days", () => {
    const w = shoppingWindow(new Date("2026-10-12T10:00:00"), ["sun", "wed"]);
    expect(w.nextShop).toBe("2026-10-14");
    expect(w.followingShop).toBe("2026-10-18");
  });
});
