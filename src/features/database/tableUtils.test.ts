import { describe, expect, it } from "vitest";

import {
  comparePropertyValues,
  deriveTableColumns,
  sortPagesByColumn,
} from "@/features/database/tableUtils";
import { makePage } from "@/test/fixtures";
import type { PageProperty } from "@/types/entities";

function makeProperty(overrides: Partial<PageProperty> = {}): PageProperty {
  return {
    id: `prop-${Math.random()}`,
    pageId: "page-1",
    key: "Status",
    type: "text",
    value: null,
    ...overrides,
  };
}

describe("deriveTableColumns", () => {
  it("returns one column per distinct key, alphabetically sorted", () => {
    const columns = deriveTableColumns([
      makeProperty({ key: "Status", type: "select" }),
      makeProperty({ key: "Due date", type: "date" }),
    ]);
    expect(columns).toEqual([
      { key: "Due date", type: "date" },
      { key: "Status", type: "select" },
    ]);
  });

  it("de-duplicates the same key across multiple pages", () => {
    const columns = deriveTableColumns([
      makeProperty({ pageId: "page-1", key: "Status" }),
      makeProperty({ pageId: "page-2", key: "Status" }),
    ]);
    expect(columns).toHaveLength(1);
  });

  it("keeps the type from whichever property was seen first for a given key", () => {
    const columns = deriveTableColumns([
      makeProperty({ pageId: "page-1", key: "Status", type: "select" }),
      makeProperty({ pageId: "page-2", key: "Status", type: "text" }),
    ]);
    expect(columns).toEqual([{ key: "Status", type: "select" }]);
  });

  it("returns an empty array for no properties", () => {
    expect(deriveTableColumns([])).toEqual([]);
  });
});

describe("comparePropertyValues", () => {
  it("compares numbers numerically", () => {
    expect(comparePropertyValues(2, 10)).toBeLessThan(0);
  });

  it("compares booleans as 0/1", () => {
    expect(comparePropertyValues(false, true)).toBeLessThan(0);
  });

  it("compares strings alphabetically", () => {
    expect(comparePropertyValues("apple", "banana")).toBeLessThan(0);
  });

  it("compares ISO date strings correctly as strings", () => {
    expect(comparePropertyValues("2026-01-01", "2026-06-15")).toBeLessThan(0);
  });

  it("sorts null after a real value", () => {
    expect(comparePropertyValues(null, "anything")).toBeGreaterThan(0);
    expect(comparePropertyValues("anything", null)).toBeLessThan(0);
  });

  it("treats two nulls as equal", () => {
    expect(comparePropertyValues(null, null)).toBe(0);
  });
});

describe("sortPagesByColumn", () => {
  const column = { key: "Priority", type: "number" as const };
  const high = makePage({ id: "page-high", title: "High" });
  const low = makePage({ id: "page-low", title: "Low" });
  const missing = makePage({ id: "page-missing", title: "No priority set" });
  const properties: PageProperty[] = [
    makeProperty({ pageId: high.id, key: "Priority", type: "number", value: 10 }),
    makeProperty({ pageId: low.id, key: "Priority", type: "number", value: 1 }),
  ];

  it("sorts ascending by the column's value", () => {
    const sorted = sortPagesByColumn([high, low, missing], properties, column, "asc");
    expect(sorted.map((p) => p.id)).toEqual(["page-low", "page-high", "page-missing"]);
  });

  it("sorts descending by the column's value, without moving missing values to the top", () => {
    const sorted = sortPagesByColumn([high, low, missing], properties, column, "desc");
    expect(sorted.map((p) => p.id)).toEqual(["page-high", "page-low", "page-missing"]);
  });

  it("puts every page last when none of them have the column's value", () => {
    const sorted = sortPagesByColumn([high, low], [], column, "asc");
    expect(sorted).toHaveLength(2);
  });
});
