import type { ComponentChildren, JSX } from "preact";

/** DASHBOARD-POLISH-HANDOFF.md 3.6. Surface, radius-lg, hairline border,
 * space-5 padding. The one card shape every widget and panel uses. */
export function Card({
  header,
  children,
  style,
  class: className,
}: {
  header?: ComponentChildren;
  children: ComponentChildren;
  style?: JSX.CSSProperties;
  class?: string;
}) {
  return (
    <div class={"ui-card" + (className ? " " + className : "")} style={style}>
      {header}
      {children}
    </div>
  );
}
