import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";

import type { Link, Page } from "@/types/entities";

export interface GraphNodeLayout extends SimulationNodeDatum {
  id: string;
  title: string;
  weight: number;
}

export interface GraphLinkLayout extends SimulationLinkDatum<GraphNodeLayout> {
  id: string;
  /** Kept alongside the resolved source/target node objects — used before the simulation resolves them. */
  sourceId: string;
  targetId: string;
}

/** Capped so one heavily-linked hub page doesn't dwarf everything else. */
export function nodeRadius(weight: number): number {
  return Math.min(8 + weight * 2, 26);
}

/**
 * Creates a *live* d3-force simulation — Obsidian's graph is defined by
 * continuous, interruptible physics (nodes settle, dragging one perturbs
 * its neighbors), not a frozen snapshot. Caller owns the simulation's
 * lifecycle (tick subscription, alphaTarget for dragging, .stop() on
 * cleanup) and must not recreate the node/link arrays — d3 mutates them
 * in place every tick.
 */
export function createGraphSimulation(
  pages: Page[],
  links: Link[],
  width: number,
  height: number,
): {
  simulation: Simulation<GraphNodeLayout, GraphLinkLayout>;
  nodes: GraphNodeLayout[];
  edges: GraphLinkLayout[];
} {
  const degreeByPageId = new Map<string, number>();
  for (const link of links) {
    degreeByPageId.set(link.sourcePageId, (degreeByPageId.get(link.sourcePageId) ?? 0) + 1);
    degreeByPageId.set(link.targetPageId, (degreeByPageId.get(link.targetPageId) ?? 0) + 1);
  }

  const nodes: GraphNodeLayout[] = pages.map((p) => ({
    id: p.id,
    title: p.title,
    weight: degreeByPageId.get(p.id) ?? 0,
  }));

  const pageIds = new Set(pages.map((p) => p.id));
  const edges: GraphLinkLayout[] = links
    .filter((l) => pageIds.has(l.sourcePageId) && pageIds.has(l.targetPageId))
    .map((l) => ({
      id: l.id,
      sourceId: l.sourcePageId,
      targetId: l.targetPageId,
      source: l.sourcePageId,
      target: l.targetPageId,
    }));

  const simulation = forceSimulation(nodes)
    .force(
      "link",
      forceLink<GraphNodeLayout, GraphLinkLayout>(edges)
        .id((d) => d.id)
        .distance(95)
        .strength(0.5),
    )
    .force("charge", forceManyBody().strength(-260))
    .force("center", forceCenter(width / 2, height / 2))
    .force(
      "collide",
      forceCollide<GraphNodeLayout>().radius((d) => nodeRadius(d.weight) + 14),
    );

  return { simulation, nodes, edges };
}
