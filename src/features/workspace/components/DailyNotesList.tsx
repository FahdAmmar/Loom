import { useState } from "react";
import { CalendarDays, CalendarRange, Plus } from "lucide-react";
import { NavLink, useNavigate, useParams } from "react-router";

import * as dailyNotesApi from "@/api/dailyNotes";
import { DailyNotesCalendar } from "@/features/workspace/components/DailyNotesCalendar";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/utils";
import { usePageStore } from "@/stores/usePageStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

const WORKSPACE_ID = "default";
const MAX_VISIBLE = 5;

export function DailyNotesList({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const pagesById = usePageStore((s) => s.pagesById);
  const addPage = usePageStore((s) => s.addPage);
  const t = useT();
  const direction = useSettingsStore((s) => s.direction);
  const { pageId } = useParams();
  const [isCalendarOpen, setCalendarOpen] = useState(false);

  const allNotes = Object.values(pagesById).filter((p) => p.dailyNoteDate && !p.deletedAt);
  const noteDates = new Set(allNotes.map((p) => p.dailyNoteDate as string));
  const activeDate = pageId ? pagesById[pageId]?.dailyNoteDate : undefined;
  const dailyNotes = [...allNotes]
    .sort((a, b) => (b.dailyNoteDate as string).localeCompare(a.dailyNoteDate as string))
    .slice(0, MAX_VISIBLE);

  async function openDate(dateKey: string) {
    const page = await dailyNotesApi.getOrCreateDailyNote(WORKSPACE_ID, dateKey);
    addPage(page);
    navigate(`/w/${WORKSPACE_ID}/p/${page.id}`, { viewTransition: true });
    onNavigate?.();
  }

  async function handleToday() {
    // getOrCreateTodayNote persists straight to the mock DB, bypassing
    // usePageStore.createPage — sync it in manually, same as the
    // "use template" flow does, so the sidebar and PageRoute see it
    // immediately instead of "page doesn't exist".
    const page = await dailyNotesApi.getOrCreateTodayNote(WORKSPACE_ID);
    addPage(page);
    navigate(`/w/${WORKSPACE_ID}/p/${page.id}`, { viewTransition: true });
    onNavigate?.();
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-3">
        <span className="text-text-faint text-xs font-medium tracking-wide uppercase">
          {t("daily.title")}
        </span>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setCalendarOpen((open) => !open)}
            aria-expanded={isCalendarOpen}
            aria-label={isCalendarOpen ? t("calendar.hide") : t("calendar.show")}
            title={isCalendarOpen ? t("calendar.hide") : t("calendar.show")}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex size-6 items-center justify-center rounded"
          >
            <CalendarRange className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex size-6 items-center justify-center rounded"
            aria-label={t("daily.today")}
            title={t("daily.today")}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      {isCalendarOpen && (
        <DailyNotesCalendar
          locale={direction === "rtl" ? "ar" : "en"}
          noteDates={noteDates}
          activeDate={activeDate}
          todayKey={dailyNotesApi.todayDateKey()}
          onSelectDate={openDate}
        />
      )}

      {dailyNotes.length > 0 && (
        <nav className="flex flex-col gap-0.5 px-1">
          {dailyNotes.map((page) => (
            <NavLink
              viewTransition
              key={page.id}
              to={`/w/${WORKSPACE_ID}/p/${page.id}`}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                  isActive && "bg-secondary text-secondary-foreground font-medium",
                )
              }
            >
              <CalendarDays className="text-brand-mint size-3.5 shrink-0" />
              <span className="truncate">{page.title}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
