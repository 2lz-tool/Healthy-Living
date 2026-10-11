import type { ComponentChildren } from "preact";

/** DASHBOARD-POLISH-HANDOFF.md 3.6. The "est." marker — attaches to the
 * figure it qualifies, never to a sentence or row title (fix #10, #17). */
export function Badge({ children }: { children: ComponentChildren }) {
  return <span class="ui-badge">{children}</span>;
}
