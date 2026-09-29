/**
 * Pure operations on a table block's content. A table is still a plain
 * `rows: string[][]` grid — the same shape the markdown export, plain-text
 * search and template preview already read — with two optional extras
 * layered on top: `colWidths` (per-column pixel widths) and `merges`
 * (rectangles of cells shown as one). A merged rectangle's text lives in
 * its top-left "anchor" cell; every other cell inside it is kept as "".
 * That way code that knows nothing about merges still sees sensible text.
 */

export type TableMerge = { row: number; col: number; rowSpan: number; colSpan: number };

export type TableContent = {
  rows: string[][];
  colWidths?: number[];
  merges?: TableMerge[];
};

type Axis = "row" | "col";

export const DEFAULT_COLUMN_WIDTH = 160;
export const MIN_COLUMN_WIDTH = 64;
export const MAX_COLUMN_WIDTH = 640;

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function clampWidth(width: number): number {
  return Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, Math.round(width)));
}

/** Drops empty optional fields so an untouched table keeps its original `{ rows }` shape. */
function compact(table: TableContent): TableContent {
  return {
    rows: table.rows,
    ...(table.colWidths ? { colWidths: table.colWidths } : {}),
    ...(table.merges?.length ? { merges: table.merges } : {}),
  };
}

export function getColumnCount(table: TableContent): number {
  return table.rows[0]?.length ?? 0;
}

/** Reads a block's raw `content` into a well-formed table, repairing anything malformed. */
export function readTableContent(content: Record<string, unknown>): TableContent {
  const rawRows = Array.isArray(content.rows) ? content.rows : [];
  const parsed = rawRows.map((row: unknown) =>
    Array.isArray(row)
      ? row.map((cell: unknown) => (typeof cell === "string" ? cell : ""))
      : [],
  );

  const columnCount = Math.max(1, ...parsed.map((row) => row.length));
  const rows = parsed.length
    ? parsed.map((row) => Array.from({ length: columnCount }, (_, c) => row[c] ?? ""))
    : Array.from({ length: 2 }, () => Array<string>(Math.max(columnCount, 2)).fill(""));
  const width = rows[0].length;

  const merges = Array.isArray(content.merges)
    ? content.merges.filter(
        (m): m is TableMerge =>
          typeof m === "object" &&
          m !== null &&
          Number.isInteger(m.row) &&
          Number.isInteger(m.col) &&
          m.row >= 0 &&
          m.col >= 0 &&
          isPositiveInt(m.rowSpan) &&
          isPositiveInt(m.colSpan) &&
          m.rowSpan * m.colSpan > 1 &&
          m.row + m.rowSpan <= rows.length &&
          m.col + m.colSpan <= width,
      )
    : undefined;

  const colWidths =
    Array.isArray(content.colWidths) &&
    content.colWidths.every((w: unknown) => typeof w === "number" && Number.isFinite(w))
      ? Array.from({ length: width }, (_, i) =>
          clampWidth((content.colWidths as number[])[i] ?? DEFAULT_COLUMN_WIDTH),
        )
      : undefined;

  return compact({ rows, colWidths, merges });
}

export function setCell(
  table: TableContent,
  row: number,
  col: number,
  value: string,
): TableContent {
  return compact({
    ...table,
    rows: table.rows.map((r, ri) =>
      ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r,
    ),
  });
}

export function findMergeAt(
  table: TableContent,
  row: number,
  col: number,
): TableMerge | undefined {
  return table.merges?.find(
    (m) => row >= m.row && row < m.row + m.rowSpan && col >= m.col && col < m.col + m.colSpan,
  );
}

/** True for a cell hidden underneath a merge (the merge's own anchor cell is not covered). */
export function isCoveredCell(table: TableContent, row: number, col: number): boolean {
  const merge = findMergeAt(table, row, col);
  return Boolean(merge && (merge.row !== row || merge.col !== col));
}

function spanOf(merge: TableMerge, axis: Axis): { pos: number; span: number } {
  return axis === "row"
    ? { pos: merge.row, span: merge.rowSpan }
    : { pos: merge.col, span: merge.colSpan };
}

function withSpan(merge: TableMerge, axis: Axis, pos: number, span: number): TableMerge {
  return axis === "row"
    ? { ...merge, row: pos, rowSpan: span }
    : { ...merge, col: pos, colSpan: span };
}

/** Inserts an empty row or column so it ends up at `index` (0 → before the first, length → after the last). */
export function insertLine(table: TableContent, axis: Axis, index: number): TableContent {
  const count = axis === "row" ? table.rows.length : getColumnCount(table);
  if (index < 0 || index > count) return table;

  const rows =
    axis === "row"
      ? [
          ...table.rows.slice(0, index),
          Array<string>(getColumnCount(table)).fill(""),
          ...table.rows.slice(index),
        ]
      : table.rows.map((row) => [...row.slice(0, index), "", ...row.slice(index)]);

  const merges = table.merges?.map((merge) => {
    const { pos, span } = spanOf(merge, axis);
    if (index <= pos) return withSpan(merge, axis, pos + 1, span); // pushed along
    if (index < pos + span) return withSpan(merge, axis, pos, span + 1); // grows to include it
    return merge;
  });

  const colWidths =
    axis === "col" && table.colWidths
      ? [
          ...table.colWidths.slice(0, index),
          DEFAULT_COLUMN_WIDTH,
          ...table.colWidths.slice(index),
        ]
      : table.colWidths;

  return compact({ rows, colWidths, merges });
}

/** Deletes the row or column at `index`. The last remaining row/column is never deleted. */
export function deleteLine(table: TableContent, axis: Axis, index: number): TableContent {
  const count = axis === "row" ? table.rows.length : getColumnCount(table);
  if (count <= 1 || index < 0 || index >= count) return table;

  // A merge whose anchor sits on the deleted line hands its text to the
  // line after it, which becomes the new anchor once everything shifts up.
  let rows = table.rows.map((row) => [...row]);
  for (const merge of table.merges ?? []) {
    const { pos, span } = spanOf(merge, axis);
    if (pos === index && span > 1) {
      if (axis === "row") rows[index + 1][merge.col] = rows[index][merge.col];
      else rows[merge.row][index + 1] = rows[merge.row][index];
    }
  }

  rows =
    axis === "row"
      ? rows.filter((_, r) => r !== index)
      : rows.map((row) => row.filter((_, c) => c !== index));

  const merges = table.merges
    ?.flatMap((merge) => {
      const { pos, span } = spanOf(merge, axis);
      if (pos > index) return [withSpan(merge, axis, pos - 1, span)];
      if (index < pos + span) return span > 1 ? [withSpan(merge, axis, pos, span - 1)] : [];
      return [merge];
    })
    .filter((merge) => merge.rowSpan * merge.colSpan > 1);

  const colWidths =
    axis === "col" && table.colWidths
      ? table.colWidths.filter((_, c) => c !== index)
      : table.colWidths;

  return compact({ rows, colWidths, merges });
}

function intersects(a: TableMerge, b: TableMerge): boolean {
  return (
    a.row < b.row + b.rowSpan &&
    b.row < a.row + a.rowSpan &&
    a.col < b.col + b.colSpan &&
    b.col < a.col + a.colSpan
  );
}

function contains(outer: TableMerge, inner: TableMerge): boolean {
  return (
    inner.row >= outer.row &&
    inner.col >= outer.col &&
    inner.row + inner.rowSpan <= outer.row + outer.rowSpan &&
    inner.col + inner.colSpan <= outer.col + outer.colSpan
  );
}

/**
 * Merges a rectangle of cells into one, joining any text they held (in
 * reading order) into the top-left cell. Returns `null` if the rectangle is
 * out of bounds, a single cell, or would slice through an existing merge —
 * an existing merge fully inside the rectangle is simply absorbed.
 */
export function mergeCells(table: TableContent, rect: TableMerge): TableContent | null {
  const columnCount = getColumnCount(table);
  if (
    ![rect.row, rect.col].every((n) => Number.isInteger(n) && n >= 0) ||
    !isPositiveInt(rect.rowSpan) ||
    !isPositiveInt(rect.colSpan) ||
    rect.rowSpan * rect.colSpan < 2 ||
    rect.row + rect.rowSpan > table.rows.length ||
    rect.col + rect.colSpan > columnCount
  ) {
    return null;
  }

  const touched = (table.merges ?? []).filter((m) => intersects(m, rect));
  if (touched.some((m) => !contains(rect, m))) return null;

  const texts: string[] = [];
  const rows = table.rows.map((row, r) =>
    row.map((cell, c) => {
      const inside =
        r >= rect.row &&
        r < rect.row + rect.rowSpan &&
        c >= rect.col &&
        c < rect.col + rect.colSpan;
      if (inside && cell.trim()) texts.push(cell.trim());
      return inside ? "" : cell;
    }),
  );
  rows[rect.row][rect.col] = texts.join(" ");

  const merges = [...(table.merges ?? []).filter((m) => !touched.includes(m)), rect];
  return compact({ ...table, rows, merges });
}

/** Grows the merge containing (row, col) — or that lone cell — one step right or down. */
export function extendMerge(
  table: TableContent,
  row: number,
  col: number,
  direction: "right" | "down",
): TableContent | null {
  const current = findMergeAt(table, row, col) ?? { row, col, rowSpan: 1, colSpan: 1 };
  return mergeCells(
    table,
    direction === "right"
      ? { ...current, colSpan: current.colSpan + 1 }
      : { ...current, rowSpan: current.rowSpan + 1 },
  );
}

/** Splits the merge containing (row, col) back into individual cells. */
export function unmergeCell(table: TableContent, row: number, col: number): TableContent {
  const merge = findMergeAt(table, row, col);
  if (!merge) return table;
  return compact({ ...table, merges: table.merges?.filter((m) => m !== merge) });
}

/** Every column's current width, filling in the default for any that were never resized. */
export function getColumnWidths(table: TableContent): number[] {
  return Array.from(
    { length: getColumnCount(table) },
    (_, i) => table.colWidths?.[i] ?? DEFAULT_COLUMN_WIDTH,
  );
}

/** Sets one column's width (clamped to a sensible range), fixing every other column at its current width. */
export function setColumnWidth(
  table: TableContent,
  col: number,
  width: number,
  measuredWidths?: number[],
): TableContent {
  if (col < 0 || col >= getColumnCount(table)) return table;
  const base = measuredWidths ?? getColumnWidths(table);
  const colWidths = base.map((w, i) => clampWidth(i === col ? width : w));
  return compact({ ...table, colWidths });
}
