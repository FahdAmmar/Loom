import { describe, expect, it } from "vitest";

import {
  comparePropertyValues,
  deriveTableColumns,
  filterPages,
  groupPagesByColumn,
  operatorNeedsValue,
  operatorsForType,
  sortPagesByColumn,
  TITLE_FILTER_KEY,
  type DerivedColumn,
  type TableFilter,
} from "@/features/database/tableUtils";
import { makePage } from "@/test/fixtures";
import type { Page, PageProperty, PagePropertyType } from "@/types/entities";

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

describe("filterPages", () => {
  const a = makePage({ id: "a", title: "Alpha launch" });
  const b = makePage({ id: "b", title: "Beta" });
  const c = makePage({ id: "c", title: "Gamma" });
  const pages = [a, b, c];
  const prop = (
    pageId: string,
    key: string,
    type: PagePropertyType,
    value: PageProperty["value"],
  ) => ({ id: `${pageId}-${key}`, pageId, key, type, value }) as PageProperty;
  const properties = [
    prop("a", "Status", "select", "Done"),
    prop("b", "Status", "select", "Todo"),
    prop("a", "Points", "number", 5),
    prop("b", "Points", "number", 12),
    prop("a", "Due", "date", "2026-10-01"),
    prop("b", "Due", "date", "2026-12-01"),
    prop("a", "Shipped", "checkbox", true),
    prop("b", "Shipped", "checkbox", false),
  ];
  const columns = deriveTableColumns(properties);
  const filter = (key: string, operator: TableFilter["operator"], value = ""): TableFilter => ({
    id: `${key}-${operator}`,
    key,
    operator,
    value,
  });
  const ids = (result: Page[]) => result.map((p) => p.id);

  it("returns every page when there are no filters", () => {
    expect(filterPages(pages, properties, columns, [])).toBe(pages);
  });

  it("matches the Name column case-insensitively", () => {
    const result = filterPages(pages, properties, columns, [
      filter(TITLE_FILTER_KEY, "contains", "LAUNCH"),
    ]);
    expect(ids(result)).toEqual(["a"]);
  });

  it("filters select values, treating a missing value as not equal", () => {
    expect(
      ids(filterPages(pages, properties, columns, [filter("Status", "equals", "done")])),
    ).toEqual(["a"]);
    expect(
      ids(filterPages(pages, properties, columns, [filter("Status", "notEquals", "Done")])),
    ).toEqual(["b", "c"]);
  });

  it("compares numbers numerically, not alphabetically", () => {
    expect(ids(filterPages(pages, properties, columns, [filter("Points", "gt", "9")]))).toEqual(
      ["b"],
    );
    expect(ids(filterPages(pages, properties, columns, [filter("Points", "lt", "9")]))).toEqual(
      ["a"],
    );
  });

  it("compares ISO dates", () => {
    expect(
      ids(filterPages(pages, properties, columns, [filter("Due", "lt", "2026-11-01")])),
    ).toEqual(["a"]);
  });

  it("handles empty and checkbox operators", () => {
    expect(ids(filterPages(pages, properties, columns, [filter("Status", "isEmpty")]))).toEqual(
      ["c"],
    );
    expect(
      ids(filterPages(pages, properties, columns, [filter("Shipped", "checked")])),
    ).toEqual(["a"]);
    expect(
      ids(filterPages(pages, properties, columns, [filter("Shipped", "unchecked")])),
    ).toEqual(["b", "c"]);
  });

  it("combines filters with AND", () => {
    const result = filterPages(pages, properties, columns, [
      filter("Points", "gt", "1"),
      filter("Status", "equals", "Todo"),
    ]);
    expect(ids(result)).toEqual(["b"]);
  });

  it("ignores filters that are still incomplete or point at a removed column", () => {
    const result = filterPages(pages, properties, columns, [
      filter("Status", "equals", ""),
      filter("Points", "gt", "abc"),
      filter("Gone", "equals", "x"),
    ]);
    expect(result).toBe(pages);
  });
});

describe("operatorsForType", () => {
  it("offers value-free operators for checkboxes only", () => {
    expect(operatorsForType("checkbox")).toEqual(["checked", "unchecked"]);
    expect(operatorNeedsValue("checked")).toBe(false);
    expect(operatorNeedsValue("contains")).toBe(true);
  });
});

describe("groupPagesByColumn", () => {
  const column: DerivedColumn = { key: "Status", type: "select" };
  const pages = [
    makePage({ id: "a" }),
    makePage({ id: "b" }),
    makePage({ id: "c" }),
    makePage({ id: "d" }),
  ];
  const prop = (pageId: string, value: PageProperty["value"]): PageProperty => ({
    id: `p-${pageId}`,
    pageId,
    key: "Status",
    type: "select",
    value,
  });

  it("groups by value, alphabetically, with empty values last", () => {
    const groups = groupPagesByColumn(
      pages,
      [prop("a", "Todo"), prop("b", "Done"), prop("c", "Todo")],
      column,
    );
    expect(groups.map((g) => g.value)).toEqual(["Done", "Todo", null]);
    expect(groups[1].pages.map((p) => p.id)).toEqual(["a", "c"]);
    expect(groups[2].pages.map((p) => p.id)).toEqual(["d"]);
  });

  it("treats an empty string like a missing value", () => {
    const groups = groupPagesByColumn(pages, [prop("a", ""), prop("b", null)], column);
    expect(groups).toHaveLength(1);
    expect(groups[0].value).toBeNull();
    expect(groups[0].pages).toHaveLength(4);
  });

  it("orders number groups numerically", () => {
    const numeric: DerivedColumn = { key: "Status", type: "number" };
    const groups = groupPagesByColumn(
      pages.slice(0, 3),
      [prop("a", 10), prop("b", 2), prop("c", 10)],
      numeric,
    );
    expect(groups.map((g) => g.value)).toEqual([2, 10]);
  });
});
