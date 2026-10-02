import type { Link } from "@/types/entities";

export type LocalGraphDepth = 1 | 2;

export interface LocalGraphNode {
  id: string;
  title: string;
  /** 0 is the page itself, 1 its direct neighbours, 2 their neighbours. */
  depth: 0 | 1 | 2;
}

export interface LocalGraphEdge {
  sourceId: string;
  targetId: string;
}

export interface LocalGraph {
  nodes: LocalGraphNode[];
  edges: LocalGraphEdge[];
  /** More pages were reachable than the cap allows; the closest ones are kept. */
  isTruncated: boolean;
}

/** Enough to stay readable in a small panel. */
export const MAX_LOCAL_NODES = 24;

/**
 * The pages within `depth` links of `pageId`, following links in either
 * direction. Derived from the link list on demand, like backlinks.
 */
export function getLocalGraph(
  pageId: string,
  links: Link[],
  pagesById: Record<string, { id: string; title: string }>,
  depth: LocalGraphDepth,
): LocalGraph {
  if (!pagesById[pageId]) return { nodes: [], edges: [], isTruncated: false };

  const neighbours = new Map<string, Set<string>>();
  const connect = (a: string, b: string) => {
    if (!neighbours.has(a)) neighbours.set(a, new Set());
    neighbours.get(a)?.add(b);
  };
  for (const link of links) {
    const { sourcePageId: from, targetPageId: to } = link;
    // Links to deleted pages, and a page linking to itself, aren't connections.
    if (from === to || !pagesById[from] || !pagesById[to]) continue;
    connect(from, to);
    connect(to, from);
  }

  const nodes: LocalGraphNode[] = [{ id: pageId, title: pagesById[pageId].title, depth: 0 }];
  const included = new Set([pageId]);
  let isTruncated = false;
  let frontier = [pageId];

  for (const level of [1, 2] as const) {
    if (level > depth) break;
    const found = new Set<string>();
    for (const id of frontier) {
      for (const next of neighbours.get(id) ?? []) if (!included.has(next)) found.add(next);
    }
    // Sorted by title so the layout doesn't shuffle between renders.
    const ordered = [...found].sort((a, b) =>
      pagesById[a].title.localeCompare(pagesById[b].title),
    );
    const accepted: string[] = [];
    for (const id of ordered) {
      if (nodes.length >= MAX_LOCAL_NODES) {
        isTruncated = true;
        break;
      }
      included.add(id);
      nodes.push({ id, title: pagesById[id].title, depth: level });
      accepted.push(id);
    }
    frontier = accepted;
  }

  // One line per pair of pages, however many blocks link them or in which direction.
  const seen = new Set<string>();
  const edges: LocalGraphEdge[] = [];
  for (const link of links) {
    const { sourcePageId: from, targetPageId: to } = link;
    if (!included.has(from) || !included.has(to) || from === to) continue;
    const key = from < to ? `${from}|${to}` : `${to}|${from}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ sourceId: from, targetId: to });
  }
  return { nodes, edges, isTruncated };
}

export interface Point {
  x: number;
  y: number;
}

/** Concentric rings: the page in the middle, direct links around it, second-step links outside. */
export function layoutRadial(
  nodes: LocalGraphNode[],
  width: number,
  height: number,
): Map<string, Point> {
  const centerX = width / 2;
  const centerY = height / 2;
  const hasOuterRing = nodes.some((node) => node.depth === 2);
  const available = Math.min(width, height) / 2 - 22; // room for a label
  const ringRadius = {
    1: hasOuterRing ? available * 0.55 : available * 0.8,
    2: available,
  } as const;

  const positions = new Map<string, Point>();
  for (const level of [1, 2] as const) {
    const ring = nodes.filter((node) => node.depth === level);
    // The outer ring is turned half a step so its nodes don't sit behind the inner ones.
    const offset = level === 2 && ring.length > 0 ? Math.PI / ring.length : 0;
    ring.forEach((node, index) => {
      const angle = -Math.PI / 2 + offset + (2 * Math.PI * index) / ring.length;
      positions.set(node.id, {
        x: centerX + ringRadius[level] * Math.cos(angle),
        y: centerY + ringRadius[level] * Math.sin(angle),
      });
    });
  }
  const center = nodes.find((node) => node.depth === 0);
  if (center) positions.set(center.id, { x: centerX, y: centerY });
  return positions;
}
