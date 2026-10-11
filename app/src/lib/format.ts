export function formatQty(qty: number, unit: string): string {
  const rounded = Math.round(qty * 10) / 10;
  return `${rounded}${unit === "piece" ? (rounded === 1 ? " piece" : " pieces") : unit === "ml" ? " ml" : unit === "g" ? " g" : ""}`;
}

export function formatKcal(kcal: number): string {
  return `${Math.round(kcal)} kcal`;
}

export function formatGrams(g: number): string {
  return `${Math.round(g)} g`;
}

export function formatShortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function formatWeekday(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "long" });
}

export function todayIso(): string {
  return isoDate(new Date());
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysIso(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

/** The ISO date of the Sunday starting the week containing `iso`. */
export function sundayOfWeek(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() - d.getDay());
  return isoDate(d);
}

/** "13:30" -> "1:30 pm". */
export function formatTime12h(hhmm: string): string {
  const [hStr, m] = hhmm.split(":");
  const h = Number(hStr);
  const period = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

/** "today" / "tomorrow" / a weekday name, relative to `today`. */
export function relativeDayLabel(dateIso: string, today: string): string {
  if (dateIso === today) return "today";
  if (dateIso === addDaysIso(today, 1)) return "tomorrow";
  return formatWeekday(dateIso);
}

export const SLOT_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  side: "Side",
};

export const DOW_LABEL: Record<string, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};
