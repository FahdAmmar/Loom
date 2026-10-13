import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useT } from "@/i18n/useT";
import { buildMonthGrid, firstWeekday, shiftMonth, toDateKey } from "@/lib/calendar";
import { cn } from "@/lib/utils";

interface DailyNotesCalendarProps {
  locale: "en" | "ar";
  /** Date keys that already have a note. */
  noteDates: Set<string>;
  /** Date key of the note currently open, if any. */
  activeDate?: string;
  todayKey: string;
  onSelectDate: (dateKey: string) => void;
}

const DAYS_IN_WEEK = 7;
// 4 Jan 2026 is a Sunday; adding the weekday index gives a base for names.
const SUNDAY_BASE = new Date(2026, 0, 4);

function weekdayName(weekday: number, locale: string, style: "narrow" | "long"): string {
  const date = new Date(SUNDAY_BASE);
  date.setDate(SUNDAY_BASE.getDate() + weekday);
  return date.toLocaleDateString(locale, { weekday: style });
}

export function DailyNotesCalendar({
  locale,
  noteDates,
  activeDate,
  todayKey,
  onSelectDate,
}: DailyNotesCalendarProps) {
  const t = useT();
  const [year, month] = (activeDate ?? todayKey).split("-").map(Number);
  const [view, setView] = useState({ year, monthIndex: month - 1 });

  const weekStart = firstWeekday(locale);
  const weeks = useMemo(
    () => buildMonthGrid(view.year, view.monthIndex, weekStart),
    [view, weekStart],
  );
  const weekdays = Array.from(
    { length: DAYS_IN_WEEK },
    (_, i) => (weekStart + i) % DAYS_IN_WEEK,
  );
  const monthTitle = new Date(view.year, view.monthIndex, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  function move(delta: number) {
    setView((current) => shiftMonth(current.year, current.monthIndex, delta));
  }

  return (
    <div className="px-2">
      <div className="mb-1 flex items-center justify-between">
        <button
          type="button"
          onClick={() => move(-1)}
          aria-label={t("calendar.previous")}
          className="text-muted-foreground hover:bg-accent flex size-6 items-center justify-center rounded"
        >
          <ChevronLeft className="size-3.5 rtl:-scale-x-100" />
        </button>
        <span className="text-foreground text-xs font-medium" aria-live="polite">
          {monthTitle}
        </span>
        <button
          type="button"
          onClick={() => move(1)}
          aria-label={t("calendar.next")}
          className="text-muted-foreground hover:bg-accent flex size-6 items-center justify-center rounded"
        >
          <ChevronRight className="size-3.5 rtl:-scale-x-100" />
        </button>
      </div>

      <table className="w-full table-fixed border-collapse text-center text-xs">
        <thead>
          <tr>
            {weekdays.map((weekday) => (
              <th
                key={weekday}
                scope="col"
                abbr={weekdayName(weekday, locale, "long")}
                className="text-text-faint py-1 font-normal"
              >
                {weekdayName(weekday, locale, "narrow")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.find((c) => c)?.dateKey ?? toDateKey(view.year, view.monthIndex, 0)}>
              {week.map((cell, index) => (
                <td key={cell?.dateKey ?? `empty-${index}`} className="p-0">
                  {cell && (
                    <DayButton
                      day={cell.day}
                      dateKey={cell.dateKey}
                      locale={locale}
                      hasNote={noteDates.has(cell.dateKey)}
                      isToday={cell.dateKey === todayKey}
                      isActive={cell.dateKey === activeDate}
                      onSelect={onSelectDate}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface DayButtonProps {
  day: number;
  dateKey: string;
  locale: string;
  hasNote: boolean;
  isToday: boolean;
  isActive: boolean;
  onSelect: (dateKey: string) => void;
}

function DayButton({
  day,
  dateKey,
  locale,
  hasNote,
  isToday,
  isActive,
  onSelect,
}: DayButtonProps) {
  const t = useT();
  const [year, month, dayOfMonth] = dateKey.split("-").map(Number);
  const fullDate = new Date(year, month - 1, dayOfMonth).toLocaleDateString(locale, {
    dateStyle: "full",
  });
  const label = hasNote ? `${fullDate} — ${t("calendar.hasNote")}` : fullDate;

  return (
    <button
      type="button"
      onClick={() => onSelect(dateKey)}
      aria-label={label}
      aria-current={isActive ? "date" : undefined}
      className={cn(
        "hover:bg-accent relative mx-auto flex size-7 items-center justify-center rounded-md",
        isToday && "border-brand-gold border font-semibold",
        isActive && "bg-secondary text-secondary-foreground font-semibold",
      )}
    >
      {day}
      {hasNote && (
        <span
          aria-hidden="true"
          className="bg-brand-mint absolute bottom-0.5 size-1 rounded-full"
        />
      )}
    </button>
  );
}
