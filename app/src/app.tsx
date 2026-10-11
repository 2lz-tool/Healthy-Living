import { useEffect, useState } from "preact/hooks";
import { initStore, loading, loadError, store } from "./state/store";
import { Sidebar, TabBar } from "./components/UI";
import { HomeScreen } from "./screens/Home";
import { WeekScreen } from "./screens/Week";
import { LibraryScreen } from "./screens/Library";
import { ShoppingScreen } from "./screens/Shopping";
import { SettingsScreen } from "./screens/Settings";

type Tab = "home" | "week" | "library" | "shopping" | "settings";

// Home replaces Today as the opening screen (LANDING-HANDOFF.md section 0,
// Gate 1). Settings is a full sidebar destination on desktop (section 2's
// diagram) but stays a phone topbar icon below 900px, as it already was.
const PHONE_TABS: { id: Tab; label: string; glyph: string }[] = [
  { id: "home", label: "Home", glyph: "⌂" },
  { id: "week", label: "Week", glyph: "▤" },
  { id: "library", label: "Library", glyph: "≡" },
  { id: "shopping", label: "Shopping", glyph: "✓" },
];
const SIDEBAR_TABS: { id: Tab; label: string; glyph: string }[] = [...PHONE_TABS, { id: "settings", label: "Settings", glyph: "⚙" }];

export function App() {
  const [tab, setTab] = useState<Tab>("home");

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
  const navigate = (t: Tab) => setTab(t);

  return (
    <div class="shell">
      <Sidebar tabs={SIDEBAR_TABS} active={tab} onChange={setTab} />
      <div class="content">
        <div class="main">
          <div class="topbar">
            <button type="button" aria-label="Settings" onClick={() => setTab("settings")}>
              &#9881;
            </button>
          </div>
          {tab === "home" && <HomeScreen store={s} onNavigate={navigate} />}
          {tab === "week" && <WeekScreen store={s} />}
          {tab === "library" && <LibraryScreen store={s} />}
          {tab === "shopping" && <ShoppingScreen store={s} />}
          {tab === "settings" && <SettingsScreen store={s} />}

          <TabBar tabs={PHONE_TABS} active={tab === "settings" ? "home" : tab} onChange={setTab} />
        </div>
      </div>
    </div>
  );
}
