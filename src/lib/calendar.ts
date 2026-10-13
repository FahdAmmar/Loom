export interface CalendarCell {
  /** "YYYY-MM-DD" in local time. */
  dateKey: string;
  day: number;
}

export type CalendarWeek = (CalendarCell | null)[];

export function toDateKey(year: number, monthIndex: number, day: number): string {
  const month = String(monthIndex + 1).padStart(2, "0");
  return `${year}-${month}-${String(day).padStart(2, "0")}`;
}

/** First day of the week as a JS weekday (0 = Sunday ... 6 = Saturday) for a locale. */
export function firstWeekday(locale: string): number {
  try {
    const info = (
      new Intl.Locale(locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number } }
    ).getWeekInfo?.();
    // Intl numbers days 1 = Monday ... 7 = Sunday.
    if (info) return info.firstDay % 7;
  } catch {
    // Fall through to the language defaults.
  }
  return locale.startsWith("ar") ? 6 : 0;
}

/** Weeks of a month, padded with `null` so every week has seven cells. */
export function buildMonthGrid(
  year: number,
  monthIndex: number,
  weekStart: number,
): CalendarWeek[] {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leading = (new Date(year, monthIndex, 1).getDay() - weekStart + 7) % 7;

  const cells: CalendarWeek = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ dateKey: toDateKey(year, monthIndex, day), day });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: CalendarWeek[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Moves a (year, monthIndex) pair by whole months, wrapping the year. */
export function shiftMonth(year: number, monthIndex: number, delta: number) {
  const date = new Date(year, monthIndex + delta, 1);
  return { year: date.getFullYear(), monthIndex: date.getMonth() };
}
