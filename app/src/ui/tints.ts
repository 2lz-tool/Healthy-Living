// DASHBOARD-POLISH-HANDOFF.md 3.2 — the 8 family tints, in creation order.
// Families are assigned the next tint in this list as they're created;
// once 8 exist, assignment wraps.
export const TINT_NAMES = ["clay", "saffron", "olive", "teal", "slate", "plum", "rose", "sand"] as const;
export type TintName = (typeof TINT_NAMES)[number];

export function tintForIndex(index: number): TintName {
  return TINT_NAMES[((index % TINT_NAMES.length) + TINT_NAMES.length) % TINT_NAMES.length];
}
