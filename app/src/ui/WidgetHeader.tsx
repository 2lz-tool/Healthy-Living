import type { ComponentChildren } from "preact";

/** One 24px row: eyebrow title left, at most one control or link right. */
export function WidgetHeader({ title, children }: { title: string; children?: ComponentChildren }) {
  return (
    <div class="ui-widget-header">
      <span class="text-eyebrow ui-widget-header-title">{title}</span>
      {children}
    </div>
  );
}
