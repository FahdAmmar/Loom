import { describe, expect, it } from "vitest";

import { orderedBlockIds, planMoves, pruneNested, rangeBetween, toggleId } from "./blockSelection";
import type { Block, BlockType } from "@/types/entities";

function block(id: string, order: number, overrides: Partial<Block> = {}): Block {
  return {
    id,
    pageId: "p1",
    parentBlockId: null,
    type: "paragraph" as BlockType,
    order,
    content: {},
    ...overrides,
  };
}

const byId = (...blocks: Block[]) => Object.fromEntries(blocks.map((b) => [b.id, b]));

describe("orderedBlockIds", () => {
  it("lists blocks in reading order with children after their parent", () => {
    const blocks = byId(
      block("b", 2),
      block("a", 1, { type: "toggle" }),
      block("a2", 2, { parentBlockId: "a" }),
      block("a1", 1, { parentBlockId: "a" }),
      block("other", 1, { pageId: "p2" }),
    );
    expect(orderedBlockIds(blocks, "p1")).toEqual(["a", "a1", "a2", "b"]);
  });

  it("skips the children of a collapsed toggle", () => {
    const blocks = byId(
      block("a", 1, { type: "toggle" }),
      block("a1", 1, { parentBlockId: "a" }),
      block("b", 2),
    );
    expect(orderedBlockIds(blocks, "p1", { a: true })).toEqual(["a", "b"]);
  });
});

describe("rangeBetween", () => {
  const ordered = ["a", "b", "c", "d", "e"];

  it("is inclusive and works in either direction", () => {
    expect(rangeBetween(ordered, "b", "d")).toEqual(["b", "c", "d"]);
    expect(rangeBetween(ordered, "d", "b")).toEqual(["b", "c", "d"]);
  });

  it("falls back to the clicked block when the anchor is unknown", () => {
    expect(rangeBetween(ordered, "zz", "c")).toEqual(["c"]);
  });
});

describe("toggleId", () => {
  it("adds a missing id and removes a present one", () => {
    expect(toggleId(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleId(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("pruneNested", () => {
  it("drops selected blocks that sit under another selected block", () => {
    const blocks = byId(
      block("a", 1, { type: "toggle" }),
      block("a1", 1, { parentBlockId: "a" }),
      block("a11", 1, { parentBlockId: "a1" }),
      block("b", 2),
    );
    expect(pruneNested(["a", "a1", "a11", "b"], blocks)).toEqual(["a", "b"]);
    expect(pruneNested(["a1", "b"], blocks)).toEqual(["a1", "b"]);
  });
});

describe("planMoves", () => {
  const siblings = ["A", "B", "C", "D"];

  it("moves a contiguous selection up as a group", () => {
    expect(planMoves(siblings, new Set(["B", "C"]), "up")).toEqual(["B", "C"]);
  });

  it("moves a contiguous selection down as a group, last block first", () => {
    expect(planMoves(siblings, new Set(["B", "C"]), "down")).toEqual(["C", "B"]);
  });

  it("does nothing once the selection already touches that edge", () => {
    expect(planMoves(siblings, new Set(["A", "B"]), "up")).toEqual([]);
    expect(planMoves(siblings, new Set(["C", "D"]), "down")).toEqual([]);
  });

  it("moves the free blocks of a split selection and leaves the one at the edge", () => {
    expect(planMoves(siblings, new Set(["A", "C"]), "up")).toEqual(["C"]);
  });

  it("applying the planned moves gives the expected order", () => {
    const order = [...siblings];
    for (const id of planMoves(order, new Set(["B", "C"]), "up")) {
      const i = order.indexOf(id);
      [order[i - 1], order[i]] = [order[i], order[i - 1]];
    }
    expect(order).toEqual(["B", "C", "A", "D"]);
  });
});
