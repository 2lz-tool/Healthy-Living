/** ISO date ("YYYY-MM-DD") helpers shared across the derivation layer. */

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
