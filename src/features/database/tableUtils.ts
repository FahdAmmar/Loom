import type { Page, PageProperty, PagePropertyType } from "@/types/entities";

export interface DerivedColumn {
  key: string;
  type: PagePropertyType;
}

/**
 * A table view's columns aren't a stored schema — each child page's
 * properties are created independently (see the feature README) — so the
 * columns are the union of every distinct property key seen across a set
 * of pages, sorted alphabetically for a stable order. If the same key
 * shows up with two different types on different pages, whichever
 * property record was encountered first wins; this is a known, documented
 * edge case of not having a real shared schema.
 */
export function deriveTableColumns(properties: PageProperty[]): DerivedColumn[] {
  const columnByKey = new Map<string, DerivedColumn>();
  for (const property of properties) {
    if (!columnByKey.has(property.key)) {
      columnByKey.set(property.key, { key: property.key, type: property.type });
    }
  }
  return [...columnByKey.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Ascending comparator across every property value type: numbers compare
 * numerically, checkboxes compare as 0/1, and everything else (text,
 * select, and ISO "YYYY-MM-DD" dates, which sort correctly as plain
 * strings) compares alphabetically. `null`/missing values always sort
 * last, in either direction.
 */
export function comparePropertyValues(
  a: PageProperty["value"],
  b: PageProperty["value"],
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b));
}

/**
 * Sorts pages by one column's value, looking each page's value up from
 * the flat `properties` list. Pages with no value for that column always
 * sort last, in either direction — they're set aside and appended after
 * sorting the rest, rather than sorted in and then flipped by a blanket
 * `.reverse()` for "desc" (which would incorrectly push them to the top).
 */
export function sortPagesByColumn(
  pages: Page[],
  properties: PageProperty[],
  column: DerivedColumn,
  direction: "asc" | "desc",
): Page[] {
  const valueByPageId = new Map<string, PageProperty["value"]>(
    properties.filter((p) => p.key === column.key).map((p) => [p.pageId, p.value]),
  );

  const withValue: Page[] = [];
  const withoutValue: Page[] = [];
  for (const page of pages) {
    (valueByPageId.get(page.id) == null ? withoutValue : withValue).push(page);
  }

  withValue.sort((a, b) => {
    const cmp = comparePropertyValues(
      valueByPageId.get(a.id) ?? null,
      valueByPageId.get(b.id) ?? null,
    );
    return direction === "desc" ? -cmp : cmp;
  });

  return [...withValue, ...withoutValue];
}

/** The Name column isn't a property, so filters address it with this reserved key. */
export const TITLE_FILTER_KEY = "__title";

export type FilterOperator =
  | "contains"
  | "equals"
  | "notEquals"
  | "gt"
  | "lt"
  | "isEmpty"
  | "isNotEmpty"
  | "checked"
  | "unchecked";

export interface TableFilter {
  id: string;
  key: string;
  operator: FilterOperator;
  value: string;
}

const OPERATORS_BY_TYPE: Record<PagePropertyType | "title", FilterOperator[]> = {
  title: ["contains", "equals"],
  text: ["contains", "equals", "notEquals", "isEmpty", "isNotEmpty"],
  select: ["equals", "notEquals", "isEmpty", "isNotEmpty"],
  number: ["equals", "gt", "lt", "isEmpty", "isNotEmpty"],
  date: ["equals", "gt", "lt", "isEmpty", "isNotEmpty"],
  checkbox: ["checked", "unchecked"],
};

export function operatorsForType(type: PagePropertyType | "title"): FilterOperator[] {
  return OPERATORS_BY_TYPE[type];
}

/** Operators that compare against a typed value (the rest stand on their own). */
export function operatorNeedsValue(operator: FilterOperator): boolean {
  return !["isEmpty", "isNotEmpty", "checked", "unchecked"].includes(operator);
}

function matchesFilter(
  cell: PageProperty["value"] | undefined,
  type: PagePropertyType | "title",
  filter: TableFilter,
): boolean {
  const empty = cell == null || cell === "";
  switch (filter.operator) {
    case "isEmpty":
      return empty;
    case "isNotEmpty":
      return !empty;
    case "checked":
      return cell === true;
    case "unchecked":
      return cell !== true;
  }

  const wanted = filter.value.trim();
  if (type === "number") {
    if (empty) return false;
    const a = Number(cell);
    const b = Number(wanted);
    if (filter.operator === "gt") return a > b;
    if (filter.operator === "lt") return a < b;
    return a === b;
  }

  const have = empty ? "" : String(cell).toLowerCase();
  const want = wanted.toLowerCase();
  switch (filter.operator) {
    case "contains":
      return have.includes(want);
    case "equals":
      return !empty && have === want;
    case "notEquals":
      return have !== want;
    case "gt":
      return !empty && have > want; // ISO dates compare correctly as strings
    case "lt":
      return !empty && have < want;
    default:
      return true;
  }
}

/** A filter that still needs its value (or whose number is unreadable) is skipped, so typing never blanks the table. */
function isFilterReady(filter: TableFilter, type: PagePropertyType | "title"): boolean {
  if (!operatorNeedsValue(filter.operator)) return true;
  const value = filter.value.trim();
  if (value === "") return false;
  return type !== "number" || !Number.isNaN(Number(value));
}

/** Keeps the pages that satisfy every ready filter (AND). */
export function filterPages(
  pages: Page[],
  properties: PageProperty[],
  columns: DerivedColumn[],
  filters: TableFilter[],
): Page[] {
  const typeByKey = new Map<string, PagePropertyType | "title">(
    columns.map((c) => [c.key, c.type]),
  );
  typeByKey.set(TITLE_FILTER_KEY, "title");

  const active = filters.filter((f) => {
    const type = typeByKey.get(f.key);
    return type !== undefined && isFilterReady(f, type);
  });
  if (active.length === 0) return pages;

  const cellByPageAndKey = new Map<string, PageProperty["value"]>(
    properties.map((p) => [`${p.pageId}:${p.key}`, p.value]),
  );

  return pages.filter((page) =>
    active.every((filter) => {
      const type = typeByKey.get(filter.key)!;
      const cell =
        filter.key === TITLE_FILTER_KEY
          ? page.title
          : cellByPageAndKey.get(`${page.id}:${filter.key}`);
      return matchesFilter(cell, type, filter);
    }),
  );
}

export interface PageGroup {
  /** The raw cell value shared by the group; `null` collects pages with no value. */
  value: PageProperty["value"];
  pages: Page[];
}

/**
 * Splits pages into groups by one column's value. Groups follow the
 * column's natural order (numbers numerically, text alphabetically), with
 * the "no value" group always last. Row order inside a group is preserved,
 * so a sort applied beforehand still holds.
 */
export function groupPagesByColumn(
  pages: Page[],
  properties: PageProperty[],
  column: DerivedColumn,
): PageGroup[] {
  const valueByPageId = new Map<string, PageProperty["value"]>(
    properties.filter((p) => p.key === column.key).map((p) => [p.pageId, p.value]),
  );

  const groups = new Map<PageProperty["value"], Page[]>();
  for (const page of pages) {
    const raw = valueByPageId.get(page.id);
    const value = raw === undefined || raw === "" ? null : raw;
    const members = groups.get(value);
    if (members) members.push(page);
    else groups.set(value, [page]);
  }

  return [...groups.entries()]
    .map(([value, members]) => ({ value, pages: members }))
    .sort((a, b) => comparePropertyValues(a.value, b.value));
}
