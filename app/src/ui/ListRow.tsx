import type { ComponentChildren } from "preact";

/** DASHBOARD-POLISH-HANDOFF.md 3.6, fix #20. Fixed grid: checkbox, then a
 * bordered body (name + usage, qty, overflow) so the hairline insets to
 * the text start rather than running under the checkbox column. */
export function ListRow({
  checkbox,
  title,
  sub,
  value,
  overflow,
  done,
}: {
  checkbox?: ComponentChildren;
  title: string;
  sub?: string;
  value?: string;
  overflow?: ComponentChildren;
  done?: boolean;
}) {
  return (
    <div class="ui-listrow">
      {checkbox && <div class="ui-listrow-check">{checkbox}</div>}
      <div class={"ui-listrow-body" + (done ? " done" : "")}>
        <div class="ui-listrow-main">
          <div class="text-headline ui-listrow-title">{title}</div>
          {sub && <div class="text-callout ui-listrow-sub">{sub}</div>}
        </div>
        {value && <div class="text-callout text-tabular ui-listrow-value">{value}</div>}
        {overflow && <div class="ui-listrow-overflow">{overflow}</div>}
      </div>
    </div>
  );
}
