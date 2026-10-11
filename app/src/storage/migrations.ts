// Each migration takes the document at version N-1 and returns it at
// version N. Index 0 upgrades v0 (pre-schemaVersion / missing file) to v1.
// Add new migrations by pushing to this array — never rewrite an old one,
// since a document could be sitting at any past version on a real device.

export type Migration = (doc: any) => any;

// cookDate -> local-time "HH:MM" for cookWhen, matching derive/reminder.ts's
// COOK_HOUR. Kept local to this migration rather than imported, since a
// migration must stay stable even if that constant later changes.
const COOK_HOUR: Record<"morning" | "evening", string> = { morning: "08:00", evening: "19:00" };

export const migrations: Migration[] = [
  // v0 -> v1: nothing to transform, v1 is the first real shape. Covers a
  // missing or empty document.
  (doc) => ({ ...doc, schemaVersion: 1 }),

  // v1 -> v2: LANDING-HANDOFF.md section 1 — shopping days, slot times, the
  // wider balance targets, and cookedAt. Batches whose cookDate has already
  // passed are assumed cooked (a real device wouldn't have been tracking
  // cookedAt before this version existed), stamped at their cookWhen time.
  (doc) => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const weeks = { ...(doc.weeks ?? {}) };
    for (const weekId of Object.keys(weeks)) {
      const week = weeks[weekId];
      weeks[weekId] = {
        ...week,
        batches: (week.batches ?? []).map((batch: any) =>
          batch.cookDate < todayIso
            ? { ...batch, cookedAt: `${batch.cookDate}T${COOK_HOUR[batch.cookWhen as "morning" | "evening"]}:00` }
            : batch,
        ),
      };
    }
    return {
      ...doc,
      schemaVersion: 2,
      weeks,
      settings: {
        ...doc.settings,
        shoppingDays: doc.settings?.shoppingDays ?? ["sat"],
        slotTimes: doc.settings?.slotTimes ?? { breakfast: "08:30", lunch: "13:30", dinner: "20:30", snack: "17:00" },
        targets: {
          ...doc.settings?.targets,
          carbsPctMax: doc.settings?.targets?.carbsPctMax ?? 50,
          fatPctMin: doc.settings?.targets?.fatPctMin ?? 20,
          fatPctMax: doc.settings?.targets?.fatPctMax ?? 30,
          fibreMin: doc.settings?.targets?.fibreMin ?? 25,
        },
      },
    };
  },
];

export function migrate(doc: any): any {
  let current = doc;
  let version = typeof current?.schemaVersion === "number" ? current.schemaVersion : 0;
  while (version < migrations.length) {
    current = migrations[version](current);
    version += 1;
  }
  return current;
}
