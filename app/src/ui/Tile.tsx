import type { TintName } from "./tints";

/** DASHBOARD-POLISH-HANDOFF.md 3.6, 2.1. A dish photo, or — the common
 * case, since photos are optional — the family tint with initials, so
 * every recipe in a family reads as the same object across screens. */
export function Tile({
  size = 120,
  photo,
  initials,
  tint = "clay",
}: {
  size?: number;
  photo?: string;
  initials?: string;
  tint?: TintName;
}) {
  if (photo) {
    return <img src={photo} width={size} height={size} class="ui-tile" style={{ objectFit: "cover" }} />;
  }
  return (
    <div
      class="ui-tile ui-tile-initials"
      style={{ width: size, height: size, background: `var(--tint-${tint}-bg)`, color: `var(--tint-${tint}-fg)` }}
    >
      <span class="text-title-2">{initials}</span>
    </div>
  );
}
