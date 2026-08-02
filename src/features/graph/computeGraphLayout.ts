import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";

import type { Link, Page } from "@/types/entities";

export interface GraphNodeLayout extends SimulationNodeDatum {
  id: string;
  title: string;
  weight: number;
}

interface GraphLinkLayout extends SimulationLinkDatum<GraphNodeLayout> {
  id: string;
}

export interface PositionedEdge {
  id: string;
  sourceId: string;
  targetId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Capped so one heavily-linked hub page doesn't dwarf everything else. */
export function nodeRadius(weight: number): number {
  return Math.min(8 + weight * 2, 26);
}

export function computeGraphLayout(
  pages: Page[],
  links: Link[],
  width: number,
  height: number,
): { nodes: GraphNodeLayout[]; edges: PositionedEdge[] } {
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
  const simLinks: GraphLinkLayout[] = links
    .filter((l) => pageIds.has(l.sourcePageId) && pageIds.has(l.targetPageId))
    .map((l) => ({ id: l.id, source: l.sourcePageId, target: l.targetPageId }));

  if (nodes.length === 0) return { nodes: [], edges: [] };

  const simulation = forceSimulation(nodes)
    .force(
      "link",
      forceLink<GraphNodeLayout, GraphLinkLayout>(simLinks)
        .id((d) => d.id)
        .distance(95)
        .strength(0.5),
    )
    .force("charge", forceManyBody().strength(-260))
    .force("center", forceCenter(width / 2, height / 2))
    .force(
      "collide",
      forceCollide<GraphNodeLayout>().radius((d) => nodeRadius(d.weight) + 14),
    )
    .stop();

  for (let i = 0; i < 300; i++) simulation.tick();

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const edges: PositionedEdge[] = simLinks.map((l) => {
    const source = typeof l.source === "object" ? l.source : nodeById.get(l.source as string)!;
    const target = typeof l.target === "object" ? l.target : nodeById.get(l.target as string)!;
    return {
      id: l.id,
      sourceId: source.id,
      targetId: target.id,
      x1: source.x ?? 0,
      y1: source.y ?? 0,
      x2: target.x ?? 0,
      y2: target.y ?? 0,
    };
  });

  return { nodes, edges };
}
