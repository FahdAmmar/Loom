import { describe, expect, it } from "vitest";

import { getOrCreateTodayNote, todayDateKey } from "@/api/dailyNotes";

describe("todayDateKey", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(todayDateKey(new Date(2026, 8, 10))).toBe("2026-09-10"); // month is 0-indexed: 8 = September
  });

  it("zero-pads single-digit months and days", () => {
    expect(todayDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("getOrCreateTodayNote", () => {
  it("creates a new page titled with today's date on first call", async () => {
    const page = await getOrCreateTodayNote("ws-1");
    expect(page.dailyNoteDate).toBe(todayDateKey());
    expect(page.workspaceId).toBe("ws-1");
    expect(page.title.length).toBeGreaterThan(0);
  });

  it("returns the same page on a second call the same day, without creating a duplicate", async () => {
    const first = await getOrCreateTodayNote("ws-1");
    const second = await getOrCreateTodayNote("ws-1");
    expect(second.id).toBe(first.id);
  });

  it("keeps daily notes independent per workspace", async () => {
    const inWorkspaceOne = await getOrCreateTodayNote("ws-1");
    const inWorkspaceTwo = await getOrCreateTodayNote("ws-2");
    expect(inWorkspaceTwo.id).not.toBe(inWorkspaceOne.id);
    expect(inWorkspaceTwo.workspaceId).toBe("ws-2");
  });
});
