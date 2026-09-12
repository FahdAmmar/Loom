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
