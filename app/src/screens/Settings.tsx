import { useEffect, useRef, useState } from "preact/hooks";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { DayOfWeek, Store } from "../types/schema";
import { CURRENT_SCHEMA_VERSION } from "../types/schema";
import { FieldRow, Group, LargeTitle, List, Row, TextField } from "../components/UI";
import { replaceStore, updateSettings } from "../state/actions";
import { migrate } from "../storage/migrations";

const DOW: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function SettingsScreen({ store }: { store: Store }) {
  const [permission, setPermission] = useState<string>("unknown");
  const fileInput = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    LocalNotifications.checkPermissions()
      .then((p) => setPermission(p.display))
      .catch(() => setPermission("unavailable"));
  }, []);

  async function requestPermission() {
    try {
      const p = await LocalNotifications.requestPermissions();
      setPermission(p.display);
    } catch {
      setPermission("unavailable");
    }
  }

  function exportJson() {
    const json = JSON.stringify(store, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mealplan-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importJson(file: File) {
    setImportError(null);
    file
      .text()
      .then((text) => {
        const parsed = JSON.parse(text);
        const migrated = migrate(parsed);
        replaceStore(migrated);
      })
      .catch((e) => setImportError(String(e)));
  }

  function toggleDay(day: DayOfWeek) {
    const has = store.settings.prepDays.includes(day);
    updateSettings({
      prepDays: has ? store.settings.prepDays.filter((d) => d !== day) : [...store.settings.prepDays, day],
    });
  }

  return (
    <div class="container">
      <LargeTitle title="Settings" />

      <Group header="Household">
        <List>
          <FieldRow label="People">
            <TextField
              type="number"
              value={String(store.settings.householdSize)}
              onCommit={(v) => updateSettings({ householdSize: parseFloat(v) || 1 })}
            />
          </FieldRow>
        </List>
      </Group>

      <Group header="Targets" footer="Per person, per day.">
        <List>
          <FieldRow label="Calories, min">
            <TextField type="number" value={String(store.settings.targets.kcalMin)} onCommit={(v) => updateSettings({ targets: { ...store.settings.targets, kcalMin: parseFloat(v) || 0 } })} />
          </FieldRow>
          <FieldRow label="Calories, max">
            <TextField type="number" value={String(store.settings.targets.kcalMax)} onCommit={(v) => updateSettings({ targets: { ...store.settings.targets, kcalMax: parseFloat(v) || 0 } })} />
          </FieldRow>
          <FieldRow label="Protein, min (g)">
            <TextField type="number" value={String(store.settings.targets.proteinMin)} onCommit={(v) => updateSettings({ targets: { ...store.settings.targets, proteinMin: parseFloat(v) || 0 } })} />
          </FieldRow>
          <FieldRow label="Protein, max (g)">
            <TextField type="number" value={String(store.settings.targets.proteinMax)} onCommit={(v) => updateSettings({ targets: { ...store.settings.targets, proteinMax: parseFloat(v) || 0 } })} />
          </FieldRow>
          <FieldRow label="Meal protein min (g)">
            <TextField type="number" value={String(store.settings.mealProteinMin)} onCommit={(v) => updateSettings({ mealProteinMin: parseFloat(v) || 0 })} />
          </FieldRow>
          <FieldRow label="Veg grams / serving">
            <TextField type="number" value={String(store.settings.vegServingGrams)} onCommit={(v) => updateSettings({ vegServingGrams: parseFloat(v) || 0 })} />
          </FieldRow>
          <FieldRow label="Veg servings / day">
            <TextField type="number" value={String(store.settings.vegServingsMinPerDay)} onCommit={(v) => updateSettings({ vegServingsMinPerDay: parseFloat(v) || 0 })} />
          </FieldRow>
          <FieldRow label="Max days, same protein">
            <TextField type="number" value={String(store.settings.maxSameProteinSourceDays)} onCommit={(v) => updateSettings({ maxSameProteinSourceDays: parseFloat(v) || 0 })} />
          </FieldRow>
        </List>
      </Group>

      <Group header="Prep days">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "0 16px 18px" }}>
          {DOW.map((d) => (
            <label key={d} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={store.settings.prepDays.includes(d)} onChange={() => toggleDay(d)} />
              {d}
            </label>
          ))}
        </div>
      </Group>

      <Group header="Reminder">
        <List>
          <FieldRow label="Time">
            <input
              class="field-input"
              type="time"
              value={store.settings.reminderTime}
              onChange={(e) => updateSettings({ reminderTime: (e.target as HTMLInputElement).value })}
            />
          </FieldRow>
          <Row
            title="Notification permission"
            value={permission}
            onClick={permission !== "granted" ? requestPermission : undefined}
            chevron={permission !== "granted"}
          />
        </List>
      </Group>

      <Group header="Never suggest" footer="Comma separated. Used by the plan generator in Build 4.">
        <List>
          <div class="row">
            <textarea
              class="field-textarea"
              style={{ width: "100%", minHeight: 60 }}
              value={store.settings.neverSuggest.join(", ")}
              onChange={(e) =>
                updateSettings({ neverSuggest: (e.target as HTMLTextAreaElement).value.split(",").map((s) => s.trim()).filter(Boolean) })
              }
            />
          </div>
        </List>
      </Group>

      <Group header="Data" footer={`Schema version ${CURRENT_SCHEMA_VERSION}.`}>
        <List>
          <Row title="Export JSON" chevron onClick={exportJson} />
          <Row title="Import JSON" chevron onClick={() => fileInput.current?.click()} />
        </List>
        {importError && <p class="group-footer" style={{ color: "var(--red)" }}>{importError}</p>}
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          class="hidden"
          onChange={(e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) importJson(file);
            (e.target as HTMLInputElement).value = "";
          }}
        />
      </Group>
    </div>
  );
}
