import { useEffect, useState } from "preact/hooks";

/** LANDING-HANDOFF.md section 3: "The dashboard re-derives on focus, on
 * any data change, and every minute so that 'next meal' rolls over at
 * slot times." Data changes already trigger a re-render via the signals
 * store; this covers the other two. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const interval = setInterval(tick, intervalMs);
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  return now;
}
