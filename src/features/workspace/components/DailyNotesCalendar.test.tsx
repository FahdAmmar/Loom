import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DailyNotesCalendar } from "@/features/workspace/components/DailyNotesCalendar";

afterEach(cleanup);

function setup(overrides: Partial<Parameters<typeof DailyNotesCalendar>[0]> = {}) {
  const onSelectDate = vi.fn();
  render(
    <DailyNotesCalendar
      locale="en"
      noteDates={new Set(["2026-10-05"])}
      todayKey="2026-10-03"
      onSelectDate={onSelectDate}
      {...overrides}
    />,
  );
  return { onSelectDate };
}

describe("DailyNotesCalendar", () => {
  it("shows the month of today and marks days that already have a note", () => {
    setup();
    expect(screen.getByText("October 2026")).toBeTruthy();
    expect(screen.getByRole("button", { name: /October 5, 2026 — has a note/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /October 6, 2026$/ })).toBeTruthy();
  });

  it("reports the picked date as a YYYY-MM-DD key", () => {
    const { onSelectDate } = setup();
    fireEvent.click(screen.getByRole("button", { name: /October 12, 2026/ }));
    expect(onSelectDate).toHaveBeenCalledWith("2026-10-12");
  });

  it("moves between months in both directions", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByText("November 2026")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByText("September 2026")).toBeTruthy();
  });

  it("flags the open note with aria-current", () => {
    setup({ activeDate: "2026-10-05" });
    const active = screen.getByRole("button", { name: /October 5, 2026/ });
    expect(active.getAttribute("aria-current")).toBe("date");
  });
});
