import { describe, expect, it } from "vitest";

import { buildMonthGrid, firstWeekday, shiftMonth, toDateKey } from "@/lib/calendar";

describe("buildMonthGrid", () => {
  it("pads the first week to the chosen week start (Sunday)", () => {
    // 1 Oct 2026 is a Thursday.
    const weeks = buildMonthGrid(2026, 9, 0);
    expect(weeks[0].slice(0, 4)).toEqual([null, null, null, null]);
    expect(weeks[0][4]).toEqual({ dateKey: "2026-10-01", day: 1 });
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });

  it("respects a Saturday week start", () => {
    // Thursday sits 5 cells after Saturday.
    const weeks = buildMonthGrid(2026, 9, 6);
    expect(weeks[0].slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(weeks[0][5]?.day).toBe(1);
  });

  it("contains every day exactly once, including leap-year February", () => {
    const days = buildMonthGrid(2028, 1, 1)
      .flat()
      .filter((c) => c !== null)
      .map((c) => c!.day);
    expect(days).toEqual(Array.from({ length: 29 }, (_, i) => i + 1));
  });
});

describe("helpers", () => {
  it("formats date keys with zero padding", () => {
    expect(toDateKey(2026, 0, 5)).toBe("2026-01-05");
  });

  it("wraps months across years in both directions", () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, monthIndex: 0 });
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, monthIndex: 11 });
  });

  it("returns a valid weekday for known locales", () => {
    for (const locale of ["en", "ar"]) {
      const day = firstWeekday(locale);
      expect(day).toBeGreaterThanOrEqual(0);
      expect(day).toBeLessThanOrEqual(6);
    }
  });
});
