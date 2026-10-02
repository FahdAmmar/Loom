import { beforeEach, describe, expect, it } from "vitest";

import { useBlockSelectionStore } from "./useBlockSelectionStore";

const sel = () => useBlockSelectionStore.getState();
const ORDER = ["a", "b", "c", "d", "e"];

beforeEach(() => sel().clear());

describe("useBlockSelectionStore", () => {
  it("selects a single block and remembers it as the anchor", () => {
    sel().select("b");
    expect(sel()).toMatchObject({ selectedIds: ["b"], anchorId: "b", focusId: "b" });
  });

  it("toggles blocks in and out, and resets once the last one is removed", () => {
    sel().toggle("a");
    sel().toggle("c");
    expect(sel().selectedIds).toEqual(["a", "c"]);
    sel().toggle("a");
    sel().toggle("c");
    expect(sel()).toMatchObject({ selectedIds: [], anchorId: null, focusId: null });
  });

  it("extends from the anchor and keeps the anchor while the far end moves", () => {
    sel().select("b");
    sel().extendTo("d", ORDER);
    expect(sel().selectedIds).toEqual(["b", "c", "d"]);

    sel().extendTo("a", ORDER);
    expect(sel().selectedIds).toEqual(["a", "b"]);
    expect(sel().anchorId).toBe("b");
    expect(sel().focusId).toBe("a");
  });

  it("clears everything", () => {
    sel().select("a");
    sel().clear();
    expect(sel().selectedIds).toEqual([]);
  });
});
