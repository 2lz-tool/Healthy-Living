import type { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import {
  Badge,
  Bloom,
  Button,
  Card,
  Checkbox,
  Chip,
  DayStrip,
  HomeIcon,
  LibraryIcon,
  ListRow,
  ProgressBar,
  ProgressRing,
  SectionHeader,
  SegmentedControl,
  SettingsIcon,
  ShoppingIcon,
  Tile,
  WeekIcon,
  WidgetHeader,
  TINT_NAMES,
  type BloomPetal,
} from "../ui";

const SAMPLE_PETALS: BloomPetal[] = [
  { key: "calories", label: "Calories", ratio: 0.72, projectedRatio: 1.05, status: "warn", valueText: "1,116 of 1,550 kcal · 72%" },
  { key: "protein", label: "Protein", ratio: 1.0, projectedRatio: 1.3, status: "ok", valueText: "95 of 95 g · 100%" },
  { key: "carbs", label: "Carbs", ratio: 1.3, projectedRatio: 1.4, status: "over", valueText: "252 of 194 g · 130%" },
  { key: "fat", label: "Fat", ratio: 0.6, projectedRatio: 0.9, status: "warn", valueText: "26 of 43 g · 60%" },
  { key: "fibre", label: "Fibre", ratio: 1.1, projectedRatio: 1.4, status: "ok", valueText: "28 of 25 g · 112%" },
  { key: "vegetables", label: "Vegetables", ratio: 0.3, projectedRatio: 0.8, status: "warn", valueText: "0.9 of 3.0 servings · 30%" },
];

const SAMPLE_DAYS = [
  { key: "sun", letter: "S", date: 11, isToday: true },
  { key: "mon", letter: "M", date: 12 },
  { key: "tue", letter: "T", date: 13 },
  { key: "wed", letter: "W", date: 14 },
  { key: "thu", letter: "T", date: 15 },
  { key: "fri", letter: "F", date: 16 },
  { key: "sat", letter: "S", date: 17, isShoppingDay: true, isNextShop: true },
];

function Section({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 class="text-title-2" style={{ margin: "0 0 14px" }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
    </section>
  );
}

function Row({ children }: { children: ComponentChildren }) {
  return <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>{children}</div>;
}

function Swatch({ name, bg, fg }: { name: string; bg: string; fg?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ width: 56, height: 56, borderRadius: "var(--radius-md)", background: `var(${bg})`, display: "flex", alignItems: "center", justifyContent: "center", border: "0.5px solid var(--separator)" }}>
        {fg && <span class="text-caption" style={{ color: `var(${fg})` }}>Aa</span>}
      </div>
      <span class="text-caption" style={{ color: "var(--label-2)" }}>{name}</span>
    </div>
  );
}

function Panel() {
  const [checked, setChecked] = useState<Record<string, boolean>>({ a: true, b: false });
  const [segment, setSegment] = useState<"week" | "today">("week");

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column" }}>
      <Section title="Color">
        <Row>
          <Swatch name="bg" bg="--bg" />
          <Swatch name="surface" bg="--surface" />
          <Swatch name="surface-2" bg="--surface-2" />
          <Swatch name="accent" bg="--accent" />
          <Swatch name="green" bg="--green" />
          <Swatch name="orange" bg="--orange" />
          <Swatch name="red" bg="--red" />
        </Row>
        <Row>
          {TINT_NAMES.map((t) => (
            <Swatch key={t} name={t} bg={`--tint-${t}-bg`} fg={`--tint-${t}-fg`} />
          ))}
        </Row>
      </Section>

      <Section title="Typography">
        <div class="text-title-1">Title 1 · Sun 11 Oct</div>
        <div class="text-title-2">Title 2 · Naatukodi curry</div>
        <div class="text-headline">Headline · Curd</div>
        <div class="text-body">Body · default running text</div>
        <div class="text-callout">Callout · secondary line, usage text</div>
        <div class="text-eyebrow">Eyebrow · widget title</div>
        <div class="text-caption">Caption · chart label, footnote</div>
        <div class="text-figure">750 kcal</div>
      </Section>

      <Section title="Icons (sidebar set)">
        <Row>
          <HomeIcon size={18} />
          <WeekIcon size={18} />
          <LibraryIcon size={18} />
          <ShoppingIcon size={18} />
          <SettingsIcon size={18} />
        </Row>
      </Section>

      <Section title="Button">
        <Row>
          <Button variant="primary">Mark eaten</Button>
          <Button variant="secondary">Open recipe</Button>
          <Button variant="plain">Full list</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </Row>
      </Section>

      <Section title="SegmentedControl">
        <SegmentedControl
          ariaLabel="Range"
          value={segment}
          onChange={setSegment}
          options={[
            { value: "week", label: "This week" },
            { value: "today", label: "Today" },
          ]}
        />
      </Section>

      <Section title="Checkbox">
        <Row>
          <Checkbox checked={checked.a} onToggle={() => setChecked((c) => ({ ...c, a: !c.a }))} label="Checked example" />
          <Checkbox checked={checked.b} onToggle={() => setChecked((c) => ({ ...c, b: !c.b }))} label="Unchecked example" />
        </Row>
      </Section>

      <Section title="Badge">
        <Badge>est.</Badge>
      </Section>

      <Section title="ProgressRing / ProgressBar">
        <Row>
          <ProgressRing value={38} total={53} label="38 of 53 bought" />
          <div style={{ width: 160 }}>
            <ProgressBar value={38} total={53} />
          </div>
        </Row>
      </Section>

      <Section title="Tile / Chip">
        <Row>
          <Tile size={64} initials="NK" tint="clay" />
          <Tile size={64} initials="RJ" tint="teal" />
          <Chip tint="clay">Mon lunch</Chip>
          <Chip tint="teal">Tue lunch, Wed dinner</Chip>
        </Row>
      </Section>

      <Section title="DayStrip">
        <DayStrip days={SAMPLE_DAYS} />
      </Section>

      <Section title="SectionHeader + ListRow">
        <Card>
          <SectionHeader label="Short before Sat 17 Oct" count={3} warn />
          <ListRow
            checkbox={<Checkbox checked onToggle={() => {}} label="Mark Curd as bought" />}
            title="Curd"
            sub="Mon, Tue, Wed, Thu, Fri lunch"
            value="1800 g"
            done
          />
          <ListRow
            checkbox={<Checkbox checked={false} onToggle={() => {}} label="Mark Greek yogurt as bought" />}
            title="Greek yogurt"
            sub="Mon, Thu, Tue breakfast"
            value="500 g"
          />
          <SectionHeader label="Buy on Sat 17 Oct" count={1} />
          <ListRow
            checkbox={<Checkbox checked={false} onToggle={() => {}} label="Mark Chicken, curry cut as bought" />}
            title="Chicken, curry cut"
            sub="Sat lunch, Sat dinner"
            value="1.6 kg"
          />
        </Card>
      </Section>

      <Section title="WidgetHeader + Card">
        <Card
          header={
            <WidgetHeader title="Next meal">
              <Button variant="plain">Full list</Button>
            </WidgetHeader>
          }
        >
          <div class="text-title-2">Naatukodi curry</div>
          <div class="text-callout" style={{ color: "var(--label-2)", marginTop: 4 }}>
            Ready · reheat
          </div>
        </Card>
      </Section>

      <Section title="Bloom (240 and 96)">
        <Row>
          <Bloom petals={SAMPLE_PETALS} size={240} ariaLabel="Nutrition balance sample" />
          <Bloom petals={SAMPLE_PETALS} size={96} showTable={false} ariaLabel="Nutrition balance sample, small" />
        </Row>
      </Section>
    </div>
  );
}

export function StyleguideScreen() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
      <h1 class="text-title-1" style={{ margin: "0 0 4px" }}>
        Style guide
      </h1>
      <p class="text-callout" style={{ color: "var(--label-2)", margin: "0 0 24px" }}>
        Every src/ui/ component, forced to light and dark regardless of system setting. DASHBOARD-POLISH-HANDOFF.md
        part 3, work order step 1.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div class="theme-light" style={{ borderRadius: "var(--radius-lg)", border: "1px solid #ddd" }}>
          <Panel />
        </div>
        <div class="theme-dark" style={{ borderRadius: "var(--radius-lg)", border: "1px solid #333" }}>
          <Panel />
        </div>
      </div>
    </div>
  );
}
