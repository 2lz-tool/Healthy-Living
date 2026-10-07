import { useState } from "preact/hooks";
import type { Family, FamilyAxis } from "../../types/schema";
import { FieldRow, Group, List, TextField } from "../../components/UI";

function newFamilyId(name: string, existing: Record<string, Family>): string {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "family";
  let id = base;
  let n = 2;
  while (existing[id]) id = `${base}-${n++}`;
  return id;
}

export function FamilyEditor({
  family,
  existing,
  onSave,
  onCancel,
}: {
  family: Family | null;
  existing: Record<string, Family>;
  onSave: (f: Family) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Family>(family ?? { id: "", name: "", skeleton: "", axes: [] });

  function updateAxis(i: number, patch: Partial<FamilyAxis>) {
    setDraft((d) => ({ ...d, axes: d.axes.map((a, idx) => (idx === i ? { ...a, ...patch } : a)) }));
  }
  function addAxis() {
    setDraft((d) => ({ ...d, axes: [...d.axes, { key: "", label: "", options: [] }] }));
  }
  function removeAxis(i: number) {
    setDraft((d) => ({ ...d, axes: d.axes.filter((_, idx) => idx !== i) }));
  }

  return (
    <div>
      <Group header="Family">
        <List>
          <FieldRow label="Name">
            <TextField value={draft.name} onCommit={(name) => setDraft((d) => ({ ...d, name }))} placeholder="e.g. Chicken curry" />
          </FieldRow>
        </List>
      </Group>

      <Group header="Skeleton — what every variant shares">
        <List>
          <div class="row">
            <textarea
              class="field-textarea"
              style={{ width: "100%", minHeight: 70 }}
              value={draft.skeleton}
              onChange={(e) => setDraft((d) => ({ ...d, skeleton: (e.target as HTMLTextAreaElement).value }))}
            />
          </div>
        </List>
      </Group>

      <Group header="Axes — how variants differ">
        <List>
          {draft.axes.map((axis, i) => (
            <div class="row" key={i} style={{ flexWrap: "wrap" }}>
              <div class="row-main">
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <TextField value={axis.key} onCommit={(key) => updateAxis(i, { key })} placeholder="key, e.g. cut" />
                  <TextField value={axis.label} onCommit={(label) => updateAxis(i, { label })} placeholder="Label, e.g. Cut" />
                </div>
                <TextField
                  value={axis.options.join(", ")}
                  onCommit={(v) => updateAxis(i, { options: v.split(",").map((s) => s.trim()).filter(Boolean) })}
                  placeholder="Options, comma separated"
                />
                <button type="button" class="field-go field-destructive" onClick={() => removeAxis(i)} style={{ marginTop: 8 }}>
                  Remove axis
                </button>
              </div>
            </div>
          ))}
          <button type="button" class="row" onClick={addAxis}>
            <div class="row-main">
              <div class="row-title" style={{ color: "var(--blue)" }}>+ Add axis</div>
            </div>
          </button>
        </List>
      </Group>

      <div style={{ display: "flex", gap: 12, padding: "4px 2px 24px" }}>
        <button
          type="button"
          class="field-go"
          disabled={!draft.name}
          onClick={() => onSave({ ...draft, id: draft.id || newFamilyId(draft.name, existing) })}
        >
          Save
        </button>
        <button type="button" class="field-go" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
