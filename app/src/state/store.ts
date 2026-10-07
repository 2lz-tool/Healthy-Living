import { signal } from "@preact/signals";
import { emptyStore, type Store } from "../types/schema";
import { loadStore, saveStore } from "../storage/storage";

export const store = signal<Store>(emptyStore());
export const loading = signal(true);
export const loadError = signal<string | null>(null);

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let dirty = false;

export async function initStore() {
  try {
    store.value = await loadStore();
  } catch (e) {
    loadError.value = String(e);
  } finally {
    loading.value = false;
  }
}

/** Applies an immutable update to the store and persists it, debounced so
 * a burst of ticks (e.g. checking off several meals in a row) doesn't
 * write to disk on every single one. The debounce window is short (120ms)
 * and backed by a flush-on-hide listener below — a phone can background
 * or kill this app at any moment, and "survives app kill" is an explicit
 * acceptance bar (BUILD1-SPEC.md section 9), not just a nice-to-have. */
export function updateStore(updater: (s: Store) => Store) {
  store.value = updater(store.value);
  dirty = true;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(doSave, 120);
}

function doSave() {
  saveTimer = null;
  if (!dirty) return;
  dirty = false;
  saveStore(store.value).catch((e) => {
    console.error("Failed to save store", e);
    dirty = true; // retry on the next change or flush
  });
}

/** Flushes any pending debounced save immediately — call before an action
 * that's about to read the just-written file back (export), and wired
 * below to fire on visibilitychange/pagehide so backgrounding the app
 * never loses the last 120ms of edits. */
export async function flushSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!dirty) return;
  dirty = false;
  await saveStore(store.value);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flushSave();
  });
  window.addEventListener("pagehide", () => {
    flushSave();
  });
}
