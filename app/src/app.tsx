import { useEffect, useState } from "preact/hooks";
import { initStore, loading, loadError, store } from "./state/store";
import { TabBar } from "./components/UI";
import { TodayScreen } from "./screens/Today";
import { WeekScreen } from "./screens/Week";
import { LibraryScreen } from "./screens/Library";
import { ShoppingScreen } from "./screens/Shopping";
import { SettingsScreen } from "./screens/Settings";

type Tab = "today" | "week" | "library" | "shopping" | "settings";

const TABS: { id: Tab; label: string; glyph: string }[] = [
  { id: "today", label: "Today", glyph: "◑" },
  { id: "week", label: "Week", glyph: "▤" },
  { id: "library", label: "Library", glyph: "≡" },
  { id: "shopping", label: "Shopping", glyph: "✓" },
];

export function App() {
  const [tab, setTab] = useState<Tab>("today");

  useEffect(() => {
    initStore();
  }, []);

  if (loading.value) {
    return (
      <div class="container" style={{ paddingTop: 40 }}>
        <p class="subtitle">Loading…</p>
      </div>
    );
  }

  if (loadError.value) {
    return (
      <div class="container" style={{ paddingTop: 40 }}>
        <h1 class="largetitle">Couldn't load your data</h1>
        <p class="subtitle">{loadError.value}</p>
        <p class="group-footer">
          mealplan.json may be corrupted. It hasn't been overwritten — back it up from the device's app data
          directory before trying anything else.
        </p>
      </div>
    );
  }

  const s = store.value;

  return (
    <div class="main">
      <div class="topbar">
        <button type="button" aria-label="Settings" onClick={() => setTab("settings")}>
          &#9881;
        </button>
      </div>
      {tab === "today" && <TodayScreen store={s} onGoToShopping={() => setTab("shopping")} />}
      {tab === "week" && <WeekScreen store={s} />}
      {tab === "library" && <LibraryScreen store={s} />}
      {tab === "shopping" && <ShoppingScreen store={s} />}
      {tab === "settings" && <SettingsScreen store={s} />}

      <TabBar tabs={TABS} active={tab === "settings" ? "today" : tab} onChange={setTab} />
    </div>
  );
}
