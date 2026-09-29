import { describe, expect, it } from "vitest";

import {
  deleteLine,
  extendMerge,
  findMergeAt,
  getColumnWidths,
  insertLine,
  isCoveredCell,
  mergeCells,
  readTableContent,
  setCell,
  setColumnWidth,
  unmergeCell,
  type TableContent,
  type TableMerge,
} from "@/lib/table";

function grid(rows: string[][], merges?: TableMerge[], colWidths?: number[]): TableContent {
  return { rows, ...(colWidths ? { colWidths } : {}), ...(merges ? { merges } : {}) };
}

const ABC = [
  ["a", "b", "c"],
  ["d", "e", "f"],
  ["g", "h", "i"],
];

describe("readTableContent", () => {
  it("returns a default 2×2 table for missing or malformed content", () => {
    expect(readTableContent({}).rows).toEqual([
      ["", ""],
      ["", ""],
    ]);
    expect(readTableContent({ rows: "nope" }).rows).toHaveLength(2);
  });

  it("keeps a plain { rows } table exactly as it was", () => {
    expect(readTableContent({ rows: ABC })).toEqual({ rows: ABC });
  });

  it("pads ragged rows and coerces non-string cells", () => {
    expect(readTableContent({ rows: [["a"], ["b", 2, "c"]] }).rows).toEqual([
      ["a", "", ""],
      ["b", "", "c"],
    ]);
  });

  it("drops merges that are out of bounds or trivial", () => {
    const table = readTableContent({
      rows: ABC,
      merges: [
        { row: 0, col: 0, rowSpan: 1, colSpan: 2 },
        { row: 2, col: 2, rowSpan: 2, colSpan: 1 }, // runs off the bottom
        { row: 1, col: 1, rowSpan: 1, colSpan: 1 }, // 1×1 is not a merge
        "garbage",
      ],
    });
    expect(table.merges).toEqual([{ row: 0, col: 0, rowSpan: 1, colSpan: 2 }]);
  });

  it("clamps column widths and resizes the list to the column count", () => {
    const table = readTableContent({ rows: ABC, colWidths: [10, 9999] });
    expect(table.colWidths).toEqual([64, 640, 160]);
  });
});

describe("setCell", () => {
  it("changes one cell without touching the rest", () => {
    const next = setCell(grid(ABC), 1, 1, "X");
    expect(next.rows[1]).toEqual(["d", "X", "f"]);
    expect(next.rows[0]).toEqual(ABC[0]);
  });
});

describe("insertLine", () => {
  it("inserts an empty row at the given position", () => {
    const next = insertLine(grid(ABC), "row", 1);
    expect(next.rows).toEqual([ABC[0], ["", "", ""], ABC[1], ABC[2]]);
  });

  it("inserts an empty column at the given position", () => {
    const next = insertLine(grid(ABC), "col", 3);
    expect(next.rows[0]).toEqual(["a", "b", "c", ""]);
  });

  it("ignores an out-of-range index", () => {
    expect(insertLine(grid(ABC), "row", 9)).toEqual(grid(ABC));
  });

  it("pushes a merge down when a row is inserted above it", () => {
    const next = insertLine(grid(ABC, [{ row: 1, col: 0, rowSpan: 1, colSpan: 2 }]), "row", 0);
    expect(next.merges).toEqual([{ row: 2, col: 0, rowSpan: 1, colSpan: 2 }]);
  });

  it("grows a merge when a row is inserted inside it", () => {
    const next = insertLine(grid(ABC, [{ row: 0, col: 0, rowSpan: 2, colSpan: 1 }]), "row", 1);
    expect(next.merges).toEqual([{ row: 0, col: 0, rowSpan: 3, colSpan: 1 }]);
  });

  it("leaves a merge alone when a line is inserted just after it", () => {
    const merge = { row: 0, col: 0, rowSpan: 1, colSpan: 2 };
    expect(insertLine(grid(ABC, [merge]), "col", 2).merges).toEqual([merge]);
  });

  it("adds a default-width slot when columns have custom widths", () => {
    const next = insertLine(grid(ABC, undefined, [100, 200, 300]), "col", 1);
    expect(next.colWidths).toEqual([100, 160, 200, 300]);
  });
});

describe("deleteLine", () => {
  it("deletes a row", () => {
    expect(deleteLine(grid(ABC), "row", 1).rows).toEqual([ABC[0], ABC[2]]);
  });

  it("deletes a column and its width", () => {
    const next = deleteLine(grid(ABC, undefined, [100, 200, 300]), "col", 0);
    expect(next.rows[0]).toEqual(["b", "c"]);
    expect(next.colWidths).toEqual([200, 300]);
  });

  it("never deletes the last remaining row or column", () => {
    const single = grid([["only"]]);
    expect(deleteLine(single, "row", 0)).toBe(single);
    expect(deleteLine(single, "col", 0)).toBe(single);
  });

  it("shifts a merge up when a row above it is deleted", () => {
    const next = deleteLine(grid(ABC, [{ row: 2, col: 0, rowSpan: 1, colSpan: 2 }]), "row", 0);
    expect(next.merges).toEqual([{ row: 1, col: 0, rowSpan: 1, colSpan: 2 }]);
  });

  it("removes a merge that lived entirely in the deleted row", () => {
    const next = deleteLine(grid(ABC, [{ row: 1, col: 0, rowSpan: 1, colSpan: 2 }]), "row", 1);
    expect(next.merges).toBeUndefined();
  });

  it("shrinks a merge, and drops it once it is down to a single cell", () => {
    const merge = { row: 0, col: 0, rowSpan: 2, colSpan: 1 };
    expect(deleteLine(grid(ABC, [merge]), "row", 1).merges).toBeUndefined();
    const taller = { row: 0, col: 0, rowSpan: 3, colSpan: 2 };
    expect(deleteLine(grid(ABC, [taller]), "row", 2).merges).toEqual([
      { row: 0, col: 0, rowSpan: 2, colSpan: 2 },
    ]);
  });

  it("hands a merge's text to the next row when its anchor row is deleted", () => {
    const table = grid(
      [
        ["Title", "", "x"],
        ["", "", "y"],
      ],
      [{ row: 0, col: 0, rowSpan: 2, colSpan: 2 }],
    );
    const next = deleteLine(table, "row", 0);
    expect(next.rows).toEqual([["Title", "", "y"]]);
    expect(next.merges).toEqual([{ row: 0, col: 0, rowSpan: 1, colSpan: 2 }]);
  });

  it("hands a merge's text to the next column when its anchor column is deleted", () => {
    const table = grid(
      [
        ["Title", "", "x"],
        ["", "", "y"],
      ],
      [{ row: 0, col: 0, rowSpan: 1, colSpan: 2 }],
    );
    const next = deleteLine(table, "col", 0);
    expect(next.rows).toEqual([
      ["Title", "x"],
      ["", "y"],
    ]);
    expect(next.merges).toBeUndefined();
  });
});

describe("mergeCells", () => {
  it("merges a rectangle, moving all its text into the top-left cell", () => {
    const next = mergeCells(grid(ABC), { row: 0, col: 0, rowSpan: 2, colSpan: 2 });
    expect(next?.rows).toEqual([
      ["a b d e", "", "c"],
      ["", "", "f"],
      ["g", "h", "i"],
    ]);
    expect(next?.merges).toEqual([{ row: 0, col: 0, rowSpan: 2, colSpan: 2 }]);
  });

  it("rejects a single cell and out-of-bounds rectangles", () => {
    expect(mergeCells(grid(ABC), { row: 0, col: 0, rowSpan: 1, colSpan: 1 })).toBeNull();
    expect(mergeCells(grid(ABC), { row: 2, col: 2, rowSpan: 2, colSpan: 1 })).toBeNull();
    expect(mergeCells(grid(ABC), { row: -1, col: 0, rowSpan: 2, colSpan: 1 })).toBeNull();
  });

  it("absorbs an existing merge that sits fully inside the new one", () => {
    const table = grid(ABC, [{ row: 0, col: 0, rowSpan: 1, colSpan: 2 }]);
    const next = mergeCells(table, { row: 0, col: 0, rowSpan: 2, colSpan: 3 });
    expect(next?.merges).toEqual([{ row: 0, col: 0, rowSpan: 2, colSpan: 3 }]);
  });

  it("refuses to slice through an existing merge", () => {
    const table = grid(ABC, [{ row: 0, col: 1, rowSpan: 2, colSpan: 2 }]);
    expect(mergeCells(table, { row: 0, col: 0, rowSpan: 1, colSpan: 2 })).toBeNull();
  });
});

describe("extendMerge", () => {
  it("merges a cell with its right-hand neighbour", () => {
    const next = extendMerge(grid(ABC), 0, 0, "right");
    expect(next?.merges).toEqual([{ row: 0, col: 0, rowSpan: 1, colSpan: 2 }]);
    expect(next?.rows[0]).toEqual(["a b", "", "c"]);
  });

  it("keeps growing an existing merge, from any cell inside it", () => {
    const once = extendMerge(grid(ABC), 0, 0, "right");
    const twice = extendMerge(once as TableContent, 0, 1, "right");
    expect(twice?.merges).toEqual([{ row: 0, col: 0, rowSpan: 1, colSpan: 3 }]);
  });

  it("returns null at the table edge", () => {
    expect(extendMerge(grid(ABC), 0, 2, "right")).toBeNull();
    expect(extendMerge(grid(ABC), 2, 0, "down")).toBeNull();
  });

  it("returns null when the neighbour belongs to a taller merge", () => {
    const table = grid(ABC, [{ row: 0, col: 1, rowSpan: 2, colSpan: 1 }]);
    expect(extendMerge(table, 0, 0, "right")).toBeNull();
  });
});

describe("findMergeAt / isCoveredCell / unmergeCell", () => {
  const table = grid(ABC, [{ row: 0, col: 0, rowSpan: 2, colSpan: 2 }]);

  it("finds the merge from any cell inside it", () => {
    expect(findMergeAt(table, 1, 1)).toEqual({ row: 0, col: 0, rowSpan: 2, colSpan: 2 });
    expect(findMergeAt(table, 2, 2)).toBeUndefined();
  });

  it("treats every cell except the anchor as covered", () => {
    expect(isCoveredCell(table, 0, 0)).toBe(false);
    expect(isCoveredCell(table, 0, 1)).toBe(true);
    expect(isCoveredCell(table, 1, 0)).toBe(true);
    expect(isCoveredCell(table, 2, 2)).toBe(false);
  });

  it("splits a merge back into individual cells, keeping the anchor's text", () => {
    const merged = mergeCells(grid(ABC), {
      row: 0,
      col: 0,
      rowSpan: 1,
      colSpan: 2,
    }) as TableContent;
    const split = unmergeCell(merged, 0, 1);
    expect(split.merges).toBeUndefined();
    expect(split.rows[0]).toEqual(["a b", "", "c"]);
  });
});

describe("setColumnWidth / getColumnWidths", () => {
  it("fills unset columns with the default and sets the one asked for", () => {
    const next = setColumnWidth(grid(ABC), 1, 220);
    expect(next.colWidths).toEqual([160, 220, 160]);
  });

  it("clamps to the allowed range", () => {
    expect(setColumnWidth(grid(ABC), 0, 5).colWidths?.[0]).toBe(64);
    expect(setColumnWidth(grid(ABC), 0, 5000).colWidths?.[0]).toBe(640);
  });

  it("uses measured widths for the other columns when given", () => {
    const next = setColumnWidth(grid(ABC), 2, 300, [111, 222, 333]);
    expect(next.colWidths).toEqual([111, 222, 300]);
  });

  it("ignores a column that doesn't exist", () => {
    const table = grid(ABC);
    expect(setColumnWidth(table, 7, 200)).toBe(table);
    expect(getColumnWidths(table)).toEqual([160, 160, 160]);
  });
});
