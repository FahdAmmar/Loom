import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, it } from "vitest";

import { ToastProvider } from "@/components/ui/toast";
import { TableFilters } from "@/features/database/components/TableFilters";
import { CodeBlockView } from "@/features/editor/components/CodeBlockView";
import { MarkdownTransfer } from "@/features/settings/components/MarkdownTransfer";
import { StorageStatus } from "@/features/settings/components/StorageStatus";
import { DailyNotesCalendar } from "@/features/workspace/components/DailyNotesCalendar";
import { TasksRoute } from "@/routes/TasksRoute";
import { expectNoA11yViolations } from "@/test/axe";

afterEach(cleanup);

describe("accessibility (axe)", () => {
  it("daily notes calendar", async () => {
    const { container } = render(
      <DailyNotesCalendar
        locale="en"
        noteDates={new Set(["2026-10-05"])}
        activeDate="2026-10-05"
        todayKey="2026-10-03"
        onSelectDate={() => {}}
      />,
    );
    await expectNoA11yViolations(container);
  });

  it("table filters with an active filter row", async () => {
    const { container } = render(
      <TableFilters
        columns={[{ key: "Status", type: "select" }]}
        filters={[{ id: "f1", key: "Status", operator: "equals", value: "Done" }]}
        onChange={() => {}}
      />,
    );
    await expectNoA11yViolations(container);
  });

  it("code block with a language selected", async () => {
    const { container } = render(
      <CodeBlockView
        code="const a = 1;"
        language="javascript"
        onChange={() => {}}
        onBackspaceEmpty={() => {}}
      />,
    );
    await expectNoA11yViolations(container);
  });

  it("storage status panel", async () => {
    const { container } = render(<StorageStatus />);
    await expectNoA11yViolations(container);
  });

  it("markdown transfer controls", async () => {
    const { container } = render(
      <ToastProvider>
        <MarkdownTransfer />
      </ToastProvider>,
    );
    await expectNoA11yViolations(container);
  });

  it("tasks page", async () => {
    const { container } = render(
      <MemoryRouter>
        <ToastProvider>
          <TasksRoute />
        </ToastProvider>
      </MemoryRouter>,
    );
    await expectNoA11yViolations(container);
  });
});
