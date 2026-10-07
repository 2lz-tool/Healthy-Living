import type { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";

export function LargeTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <h1 class="largetitle">{title}</h1>
      {subtitle && <p class="subtitle">{subtitle}</p>}
    </>
  );
}

export function Group({
  header,
  footer,
  children,
}: {
  header?: string;
  footer?: string;
  children: ComponentChildren;
}) {
  return (
    <div class="group">
      {header && <div class="group-header">{header}</div>}
      {children}
      {footer && <p class="group-footer">{footer}</p>}
    </div>
  );
}

export function List({ children }: { children: ComponentChildren }) {
  return <div class="list">{children}</div>;
}

export function Row({
  title,
  sub,
  value,
  onClick,
  chevron,
  left,
}: {
  title: string;
  sub?: string;
  value?: string;
  onClick?: () => void;
  chevron?: boolean;
  left?: ComponentChildren;
}) {
  const content = (
    <>
      {left}
      <div class="row-main">
        <div class="row-title">{title}</div>
        {sub && <div class="row-sub">{sub}</div>}
      </div>
      {value && <span class="row-value">{value}</span>}
      {chevron && <span class="chevron">&rsaquo;</span>}
    </>
  );
  if (onClick) {
    return (
      <button type="button" class="row" onClick={onClick}>
        {content}
      </button>
    );
  }
  return <div class="row">{content}</div>;
}

export function CheckRow({
  title,
  sub,
  done,
  onToggle,
}: {
  title: string;
  sub?: string;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      class={"row" + (done ? " done" : "")}
      aria-pressed={done}
      onClick={onToggle}
    >
      <span class="check">&#10003;</span>
      <div class="row-main">
        <div class="row-title">{title}</div>
        {sub && <div class="row-sub">{sub}</div>}
      </div>
    </button>
  );
}

export function Tag({ kind, children }: { kind?: "ok" | "warn" | "draft" | "estimated"; children: ComponentChildren }) {
  return <span class={"tag" + (kind ? " " + kind : "")}>{children}</span>;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div class="segmented" role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  value,
  min = 1,
  max = 20,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div class="stepper">
      <button type="button" aria-label={"Fewer " + label} onClick={() => onChange(Math.max(min, value - 1))}>
        &minus;
      </button>
      <span>{value}</span>
      <button type="button" aria-label={"More " + label} onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </button>
    </div>
  );
}

export function FreshnessBar({ fraction, level }: { fraction: number; level: "ok" | "warn" | "late" }) {
  const clamped = Math.max(0, Math.min(1, fraction));
  return (
    <div class={"bar" + (level !== "ok" ? " " + level : "")}>
      <i style={{ width: `${clamped * 100}%` }} />
    </div>
  );
}

export function BalanceStrip({ results }: { results: { level: "ok" | "warn"; message: string }[] }) {
  if (!results.length) return null;
  return (
    <div class="balance-strip">
      {results.map((r, i) => (
        <span key={i} class={"balance-chip" + (r.level === "warn" ? " warn" : "")} title={r.message}>
          {r.message}
        </span>
      ))}
    </div>
  );
}

export function FieldRow({
  label,
  children,
}: {
  label: string;
  children: ComponentChildren;
}) {
  return (
    <div class="field-row">
      <div class="field-label">{label}</div>
      {children}
    </div>
  );
}

export function TextField({
  value,
  placeholder,
  onCommit,
  type = "text",
  step,
}: {
  value: string;
  placeholder?: string;
  onCommit: (v: string) => void;
  type?: "text" | "number";
  step?: string;
}) {
  return (
    <input
      class="field-input"
      type={type}
      inputMode={type === "number" ? "decimal" : undefined}
      step={step}
      placeholder={placeholder}
      value={value}
      onInput={(e) => onCommit((e.target as HTMLInputElement).value)}
    />
  );
}

export function Sheet({
  open,
  title,
  onClose,
  actionLabel,
  onAction,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
  children: ComponentChildren;
}) {
  const doneRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement;
      doneRef.current?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("keydown", onKey);
        (lastFocus.current as HTMLElement | null)?.focus?.();
      };
    }
  }, [open]);

  return (
    <>
      <div class={"scrim" + (open ? " open" : "")} onClick={onClose} />
      <section
        class={"sheet" + (open ? " open" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        hidden={!open}
      >
        <div class="grabber" />
        <div class="sheet-bar">
          <span class="sheet-title">{title}</span>
          {actionLabel && onAction ? (
            <button type="button" class="sheet-action" onClick={onAction}>
              {actionLabel}
            </button>
          ) : (
            <button type="button" class="sheet-action" ref={doneRef} onClick={onClose}>
              Done
            </button>
          )}
        </div>
        <div class="sheet-body">{open && children}</div>
      </section>
    </>
  );
}

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; glyph: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <nav class="tabbar" aria-label="Sections">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          aria-current={t.id === active ? "page" : undefined}
          onClick={() => onChange(t.id)}
        >
          <span class="tab-glyph">{t.glyph}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
