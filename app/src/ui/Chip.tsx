import type { ComponentChildren } from "preact";
import type { TintName } from "./tints";

/** DASHBOARD-POLISH-HANDOFF.md 3.6. caption height-20 pill in a family tint. */
export function Chip({ children, tint = "clay" }: { children: ComponentChildren; tint?: TintName }) {
  return (
    <span class="ui-chip" style={{ background: `var(--tint-${tint}-bg)`, color: `var(--tint-${tint}-fg)` }}>
      {children}
    </span>
  );
}
