import { describe, expect, it } from "vitest";

import { makeBlock, makePage } from "@/test/fixtures";
import { collectTasks, filterTasks, groupTasksByPage } from "@/lib/tasks";

const pageA = makePage({ id: "a", title: "Alpha" });
const pageB = makePage({ id: "b", title: "Beta" });
const trashed = makePage({ id: "t", title: "Gone", deletedAt: "2026-01-02T00:00:00.000Z" });
const pagesById = { a: pageA, b: pageB, t: trashed };

const blocks = [
  makeBlock(
    "checklist",
    { html: "<strong>Write</strong> docs", checked: false },
    { pageId: "b" },
  ),
  makeBlock("checklist", { html: "Ship it", checked: true }, { pageId: "a" }),
  makeBlock("checklist", { html: "", checked: false }, { pageId: "a" }),
  makeBlock("paragraph", { html: "Not a task" }, { pageId: "a" }),
  makeBlock("checklist", { html: "Deleted page task", checked: false }, { pageId: "t" }),
  makeBlock("checklist", { html: "Orphan", checked: false }, { pageId: "missing" }),
];

describe("collectTasks", () => {
  const tasks = collectTasks(blocks, pagesById);

  it("keeps only non-empty checklist items on live pages", () => {
    expect(tasks.map((t) => t.text)).toEqual(["Write docs", "Ship it"]);
  });

  it("strips markup and reads the checked state", () => {
    expect(tasks[0].checked).toBe(false);
    expect(tasks[1].checked).toBe(true);
  });
});

describe("filterTasks", () => {
  const tasks = collectTasks(blocks, pagesById);

  it("filters by status", () => {
    expect(filterTasks(tasks, "open").map((t) => t.text)).toEqual(["Write docs"]);
    expect(filterTasks(tasks, "done").map((t) => t.text)).toEqual(["Ship it"]);
    expect(filterTasks(tasks, "all")).toHaveLength(2);
  });
});

describe("groupTasksByPage", () => {
  it("orders groups by page title", () => {
    const groups = groupTasksByPage(collectTasks(blocks, pagesById));
    expect(groups.map((g) => g.pageTitle)).toEqual(["Alpha", "Beta"]);
    expect(groups[0].tasks).toHaveLength(1);
  });

  it("returns nothing for no tasks", () => {
    expect(groupTasksByPage([])).toEqual([]);
  });
});
