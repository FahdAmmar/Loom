import { mockDb, networkDelay } from "@/api/_mockDb";
import type { Page } from "@/types/entities";

/**
 * "YYYY-MM-DD" in the given date's local timezone (defaults to now) — a
 * daily note is "today" wherever the person actually is, not in UTC.
 * Takes the date as a parameter (instead of always reading `new Date()`
 * internally) purely so tests can pass a fixed date without fake timers.
 */
export function todayDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDailyNoteTitle(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Returns today's daily note, creating one titled with today's date the
 * first time it's opened. A page's `dailyNoteDate` is the source of
 * truth for "is this today's note", not its title — the title can be
 * renamed freely without breaking the lookup on a later visit.
 */
export async function getOrCreateTodayNote(workspaceId: string): Promise<Page> {
  await networkDelay();
  const dateKey = todayDateKey();
  const db = mockDb.read();

  const existing = Object.values(db.pages).find(
    (p) => p.workspaceId === workspaceId && p.dailyNoteDate === dateKey,
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const page: Page = {
    id: `page-${crypto.randomUUID()}`,
    workspaceId,
    parentId: null,
    title: formatDailyNoteTitle(dateKey),
    isFavorite: false,
    dailyNoteDate: dateKey,
    order: 0, // daily notes are found via the sidebar's own chronological list, not the page tree — sibling order doesn't matter
    createdAt: now,
    updatedAt: now,
  };
  db.pages[page.id] = page;
  mockDb.write(db);
  return page;
}
