import { describe, expect, it } from "vitest";

import { getLocalGraph, layoutRadial, MAX_LOCAL_NODES } from "./localGraph";
import type { Link } from "@/types/entities";

const pages = (...titles: string[]) =>
  Object.fromEntries(titles.map((t) => [t.toLowerCase(), { id: t.toLowerCase(), title: t }]));
const link = (from: string, to: string, n = 1): Link => ({
  id: `${from}-${to}-${n}`,
  sourcePageId: from,
  targetPageId: to,
});

describe("getLocalGraph", () => {
  const pagesById = pages("A", "B", "C", "D", "E");
  // a -> b, c -> a (so c is an incoming neighbour), b -> d, d -> e
  const links = [link("a", "b"), link("c", "a"), link("b", "d"), link("d", "e")];

  it("is empty for a page that doesn't exist", () => {
    expect(getLocalGraph("zz", links, pagesById, 1)).toEqual({
      nodes: [],
      edges: [],
      isTruncated: false,
    });
  });

  it("finds direct neighbours in both directions at depth 1", () => {
    const graph = getLocalGraph("a", links, pagesById, 1);
    expect(graph.nodes.map((n) => [n.id, n.depth])).toEqual([
      ["a", 0],
      ["b", 1],
      ["c", 1],
    ]);
    expect(graph.edges).toHaveLength(2);
  });

  it("adds the next ring at depth 2 but no further", () => {
    const graph = getLocalGraph("a", links, pagesById, 2);
    expect(graph.nodes.map((n) => [n.id, n.depth])).toEqual([
      ["a", 0],
      ["b", 1],
      ["c", 1],
      ["d", 2],
    ]);
    expect(graph.nodes.some((n) => n.id === "e")).toBe(false);
  });

  it("draws one line per pair, however many blocks or directions link them", () => {
    const graph = getLocalGraph(
      "a",
      [link("a", "b", 1), link("a", "b", 2), link("b", "a")],
      pagesById,
      1,
    );
    expect(graph.edges).toHaveLength(1);
  });

  it("ignores self-links and links to pages that no longer exist", () => {
    const graph = getLocalGraph("a", [link("a", "a"), link("a", "gone")], pagesById, 2);
    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toEqual([]);
  });

  it("keeps an edge between two neighbours of the page", () => {
    const graph = getLocalGraph(
      "a",
      [link("a", "b"), link("a", "c"), link("b", "c")],
      pagesById,
      1,
    );
    expect(graph.edges).toHaveLength(3);
  });

  it("keeps only the closest pages once the cap is reached", () => {
    const many = pages(
      "Hub",
      ...Array.from({ length: 40 }, (_, i) => `P${String(i).padStart(2, "0")}`),
    );
    const hubLinks = Object.keys(many)
      .filter((id) => id !== "hub")
      .map((id) => link("hub", id));
    const graph = getLocalGraph("hub", hubLinks, many, 2);
    expect(graph.nodes).toHaveLength(MAX_LOCAL_NODES);
    expect(graph.isTruncated).toBe(true);
    expect(graph.edges.every((e) => graph.nodes.some((n) => n.id === e.targetId))).toBe(true);
  });
});

describe("layoutRadial", () => {
  const graph = getLocalGraph(
    "a",
    [link("a", "b"), link("a", "c"), link("b", "d"), link("c", "e")],
    pages("A", "B", "C", "D", "E"),
    2,
  );

  it("puts the page in the middle", () => {
    const positions = layoutRadial(graph.nodes, 360, 280);
    expect(positions.get("a")).toEqual({ x: 180, y: 140 });
  });

  it("places every node inside the canvas, each at its own spot", () => {
    const positions = layoutRadial(graph.nodes, 360, 280);
    expect(positions.size).toBe(graph.nodes.length);
    const spots = new Set<string>();
    for (const { x, y } of positions.values()) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(360);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(280);
      spots.add(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    expect(spots.size).toBe(positions.size);
  });

  it("pushes direct links further out when there is no second ring", () => {
    const direct = getLocalGraph("a", [link("a", "b")], pages("A", "B"), 1);
    const withOuter = layoutRadial(graph.nodes, 360, 280).get("b");
    const alone = layoutRadial(direct.nodes, 360, 280).get("b");
    expect(Math.hypot(alone!.x - 180, alone!.y - 140)).toBeGreaterThan(
      Math.hypot(withOuter!.x - 180, withOuter!.y - 140),
    );
  });
});
