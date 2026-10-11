import type { ComponentChildren } from "preact";

export type ButtonVariant = "primary" | "secondary" | "plain";

/** DASHBOARD-POLISH-HANDOFF.md 3.6. One button component, three variants.
 * Primary is reserved for a card's one primary action (fix #9). */
export function Button({
  variant = "primary",
  children,
  onClick,
  type = "button",
  disabled,
}: {
  variant?: ButtonVariant;
  children: ComponentChildren;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button type={type} class={`ui-btn ui-btn-${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
