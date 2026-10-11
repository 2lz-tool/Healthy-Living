import { ShoppingIcon } from "./icons";

export type DayStripDay = {
  key: string;
  letter: string;
  date: number;
  isToday?: boolean;
  isShoppingDay?: boolean;
  isNextShop?: boolean;
};

/** DASHBOARD-POLISH-HANDOFF.md 3.6, fix #22. One encoding per meaning:
 * today = filled circle, a shopping day = basket glyph, the next shopping
 * day = an accent ring — never doubled up on one cell. */
export function DayStrip({ days }: { days: DayStripDay[] }) {
  return (
    <div class="ui-daystrip">
      {days.map((d) => (
        <div key={d.key} class="ui-daystrip-cell">
          <span class="text-caption ui-daystrip-letter">{d.letter}</span>
          <span class={"ui-daystrip-circle" + (d.isToday ? " today" : "") + (d.isNextShop ? " next-shop" : "")}>
            {d.date}
          </span>
          {d.isShoppingDay && <ShoppingIcon size={10} class="ui-daystrip-basket" />}
        </div>
      ))}
    </div>
  );
}
