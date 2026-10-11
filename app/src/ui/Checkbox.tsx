import { CheckIcon } from "./icons";

/** DASHBOARD-POLISH-HANDOFF.md 3.6. 20px circle; filled accent + white
 * check when checked. The row's strikethrough-on-done is ListRow's job. */
export function Checkbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button type="button" class="ui-checkbox" aria-pressed={checked} aria-label={label} onClick={onToggle}>
      {checked && <CheckIcon size={12} stroke-width={3} />}
    </button>
  );
}
