/** ISO date ("YYYY-MM-DD") helpers shared across the derivation layer. */

import type { DayOfWeek } from "../types/schema";

const DOW_ORDER: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function dayOfWeekOf(iso: string): DayOfWeek {
  return DOW_ORDER[new Date(iso + "T00:00:00").getDay()];
}

/** Hours-of-day ("HH:MM") as a fractional number, e.g. "13:30" -> 13.5. */
export function parseHhmm(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h + m / 60;
}

export function addDaysIso(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Hours since epoch at local midnight on the given date — for comparing
 * "is this moment on or before that moment" across dates and hour offsets. */
export function dateToHours(iso: string): number {
  return new Date(iso + "T00:00:00").getTime() / 3_600_000;
}

/** Whole days from `from` to `to` — negative if `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((dateToHours(to) - dateToHours(from)) / 24);
}

/** The ISO date of the Sunday starting the week containing `iso`. Kept
 * local to derive/ (lib/format.ts has its own copy for the UI layer) per
 * the project's existing split between the two. */
export function sundayOfWeekIso(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() - d.getDay());
  return isoDate(d);
}
