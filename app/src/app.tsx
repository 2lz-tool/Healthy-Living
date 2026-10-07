import { useEffect, useState } from "preact/hooks";
import { loadStore } from "./storage/storage";
import type { Store } from "./types/schema";

/**
 * Placeholder shell. Real screens wait on Gate D (visual language —
 * Material 3 vs. keep HIG styling) per BUILD1-SPEC.md section 1 and 6.
 * This exists to prove the data/storage layer boots on device, not as
 * a screen to iterate on.
 */
export function App() {
  const [store, setStore] = useState<Store | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStore()
      .then(setStore)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>Meal Plan — Build 1</h1>
      <p>
        Screens are pending Gate D (Material 3 vs. the v1 HIG look) — see{" "}
        <code>BUILD1-SPEC.md</code>. This is the data layer only.
      </p>
      {error && <p style={{ color: "#b00" }}>Store error: {error}</p>}
      {store && (
        <ul>
          <li>Recipes: {Object.keys(store.recipes).length}</li>
          <li>Families: {Object.keys(store.families).length}</li>
          <li>Ingredients: {Object.keys(store.ingredients).length}</li>
          <li>Weeks: {Object.keys(store.weeks).length}</li>
          <li>Schema version: {store.schemaVersion}</li>
        </ul>
      )}
    </div>
  );
}
