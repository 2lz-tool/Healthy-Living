import type { Store } from "../types/schema";
import { dayTotalsForDate, tomorrowReminderContent } from "../derive";
import { CheckRow, Group, LargeTitle, List, Row } from "../components/UI";
import { formatKcal, todayIso } from "../lib/format";
import { togglePrepDone, toggleEaten } from "../state/actions";

export function TodayScreen({ store, onGoToShopping }: { store: Store; onGoToShopping: () => void }) {
  const today = todayIso();
  const allWeeks = Object.values(store.weeks);
  const day = dayTotalsForDate(today, allWeeks, store.recipes, store.ingredients);

  // "Tonight" == the reminder content computed for today, which covers D+1.
  const reminder = tomorrowReminderContent(today, allWeeks, store.recipes, store.ingredients);

  return (
    <div class="container">
      <LargeTitle title="Today" subtitle={`${formatKcal(day.totals.kcal)} planned`} />

      <Group header="Meals">
        <List>
          {day.meals.length === 0 && <Row title="Nothing planned for today" />}
          {day.meals.map((meal, i) => {
            const eaten = store.log.eaten.some((e) => e.date === today && e.slot === meal.slot && e.batchId === meal.batchId);
            return (
              <CheckRow
                key={i}
                title={`${meal.slot[0].toUpperCase()}${meal.slot.slice(1)}: ${meal.recipeName}`}
                sub={formatKcal(meal.totals.kcal)}
                done={eaten}
                onToggle={() => toggleEaten(today, meal.slot, meal.batchId)}
              />
            );
          })}
        </List>
      </Group>

      <Group header="Tonight" footer="Soaking, marinating, grinding — whatever tomorrow's cook needs started tonight.">
        <List>
          {reminder.prepTonight.length === 0 && <Row title="Nothing to prep tonight" />}
          {reminder.prepTonight.map((p, i) => {
            const key = `${p.batchId}:${i}`;
            const done = store.log.prepDone.some((d) => d.date === today && d.key === key);
            return (
              <CheckRow
                key={key}
                title={p.text}
                sub={p.recipeName}
                done={done}
                onToggle={() => togglePrepDone(today, key)}
              />
            );
          })}
        </List>
      </Group>

      {reminder.moveFromFreezer.length > 0 && (
        <Group header="Move from freezer">
          <List>
            {reminder.moveFromFreezer.map((f, i) => (
              <Row key={i} title={`${f.recipeName} — ${f.portions} portions`} sub={`for tomorrow's ${f.slot}`} />
            ))}
          </List>
        </Group>
      )}

      <Group>
        <List>
          <Row
            title="Tomorrow's shopping"
            value={reminder.buy.length > 0 ? `${reminder.buy.length} items` : "Nothing to buy"}
            chevron
            onClick={onGoToShopping}
          />
        </List>
      </Group>
    </div>
  );
}
