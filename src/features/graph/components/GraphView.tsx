import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Network, Plus, RotateCcw, Search } from "lucide-react";
import { useNavigate } from "react-router";

import * as linksApi from "@/api/links";
import * as tagsApi from "@/api/tags";
import { EmptyState } from "@/components/EmptyState";
import {
  createGraphSimulation,
  nodeRadius,
  type GraphNodeLayout,
} from "@/features/graph/computeGraphLayout";
import { cn } from "@/lib/utils";
import { TAG_COLOR_CLASSES } from "@/lib/tagColors";
import { usePageStore } from "@/stores/usePageStore";
import { useTagStore } from "@/stores/useTagStore";
import type { Link, PageTag, Tag } from "@/types/entities";

const WORKSPACE_ID = "default";
const MIN_SCALE = 0.35;
const MAX_SCALE = 3;
/** Below this zoom level, labels only show for the hovered node and its neighbors — Obsidian's declutter-when-zoomed-out behavior. */
const LABEL_ZOOM_THRESHOLD = 1.1;
const ARROW_LENGTH = 7;

interface Transform {
  x: number;
  y: number;
  k: number;
}

/** Trims a line so it meets the node circles' edges (and leaves room for the arrowhead) instead of running into their centers. */
function trimmedEdgePoints(
  source: GraphNodeLayout,
  target: GraphNodeLayout,
): { x1: number; y1: number; x2: number; y2: number } {
  const sx = source.x ?? 0;
  const sy = source.y ?? 0;
  const tx = target.x ?? 0;
  const ty = target.y ?? 0;
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const sr = nodeRadius(source.weight);
  const tr = nodeRadius(target.weight) + ARROW_LENGTH;
  return { x1: sx + ux * sr, y1: sy + uy * sr, x2: tx - ux * tr, y2: ty - uy * tr };
}

export function GraphView() {
  const navigate = useNavigate();
  const pagesById = usePageStore((s) => s.pagesById);
  const tagsById = useTagStore((s) => s.tagsById);
  const [links, setLinks] = useState<Link[] | null>(null);
  const [pageTags, setPageTags] = useState<PageTag[]>([]);
  const [query, setQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const transformRef = useRef(transform);
  transformRef.current = transform;
  const panRef = useRef<{ startX: number; startY: number; origin: Transform } | null>(null);
  const draggingNodeRef = useRef<GraphNodeLayout | null>(null);

  // The live simulation and its mutable node/edge arrays — d3 updates these
  // in place every tick, so they must never be recreated on a React render.
  const simRef = useRef<ReturnType<typeof createGraphSimulation> | null>(null);
  const nodeElRefs = useRef(new Map<string, SVGGElement>());
  const edgeElRefs = useRef(new Map<string, SVGLineElement>());
  const [simVersion, setSimVersion] = useState(0);

  useEffect(() => {
    linksApi.listAllLinks().then(setLinks);
    tagsApi.listAllPageTags().then(setPageTags);
  }, []);

  const tagIdsByPage = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const pt of pageTags) {
      if (!map.has(pt.pageId)) map.set(pt.pageId, new Set());
      map.get(pt.pageId)?.add(pt.tagId);
    }
    return map;
  }, [pageTags]);

  const availableTags: Tag[] = useMemo(() => {
    const usedTagIds = new Set(pageTags.map((pt) => pt.tagId));
    return Object.values(tagsById).filter((t) => usedTagIds.has(t.id));
  }, [pageTags, tagsById]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Creates (or recreates, when the underlying data or canvas size changes)
  // the live simulation. Runs continuously via d3's own timer — settles
  // naturally as alpha decays, reheats on drag.
  useEffect(() => {
    if (!links) return;
    const pages = Object.values(pagesById);
    const created = createGraphSimulation(pages, links, size.width, size.height);
    simRef.current = created;
    nodeElRefs.current.clear();
    edgeElRefs.current.clear();

    function tick() {
      if (!simRef.current) return;
      for (const node of simRef.current.nodes) {
        const el = nodeElRefs.current.get(node.id);
        if (el) el.setAttribute("transform", `translate(${node.x ?? 0},${node.y ?? 0})`);
      }
      for (const edge of simRef.current.edges) {
        const el = edgeElRefs.current.get(edge.id);
        if (!el) continue;
        const source = edge.source as GraphNodeLayout;
        const target = edge.target as GraphNodeLayout;
        if (typeof source !== "object" || typeof target !== "object") continue;
        const { x1, y1, x2, y2 } = trimmedEdgePoints(source, target);
        el.setAttribute("x1", String(x1));
        el.setAttribute("y1", String(y1));
        el.setAttribute("x2", String(x2));
        el.setAttribute("y2", String(y2));
      }
    }
    created.simulation.on("tick", tick);
    // First render after creation: JSX needs simRef's nodes/edges to exist
    // before it can render <g>/<line> elements for the ref callbacks to fill.
    setSimVersion((v) => v + 1);

    return () => {
      created.simulation.stop();
    };
  }, [links, pagesById, size.width, size.height]);

  const neighborIds = useMemo(() => {
    if (!hoveredId || !simRef.current) return null;
    const ids = new Set<string>([hoveredId]);
    for (const edge of simRef.current.edges) {
      if (edge.sourceId === hoveredId) ids.add(edge.targetId);
      if (edge.targetId === hoveredId) ids.add(edge.sourceId);
    }
    return ids;
    // simVersion/hoveredId are the real triggers; simRef itself is a ref.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredId, simVersion]);

  const normalizedQuery = query.trim().toLowerCase();

  function isNodeDimmed(id: string, title: string): boolean {
    if (activeTagId && !tagIdsByPage.get(id)?.has(activeTagId)) return true;
    if (neighborIds) return !neighborIds.has(id);
    if (normalizedQuery) return !title.toLowerCase().includes(normalizedQuery);
    return false;
  }

  function isEdgeDimmed(sourceId: string, targetId: string): boolean {
    if (activeTagId) {
      const sourceHasTag = tagIdsByPage.get(sourceId)?.has(activeTagId);
      const targetHasTag = tagIdsByPage.get(targetId)?.has(activeTagId);
      if (!sourceHasTag || !targetHasTag) return true;
    }
    if (!neighborIds) return false;
    return !(neighborIds.has(sourceId) && neighborIds.has(targetId));
  }

  function shouldShowLabel(node: GraphNodeLayout, dimmed: boolean): boolean {
    if (dimmed) return false;
    if (hoveredId) return neighborIds?.has(node.id) ?? false;
    if (normalizedQuery) return node.title.toLowerCase().includes(normalizedQuery);
    return transform.k >= LABEL_ZOOM_THRESHOLD;
  }

  function clampScale(k: number): number {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, k));
  }

  /** Zooms toward the center of the current viewport — used by the +/- buttons. */
  function zoomBy(factor: number) {
    setTransform((t) => {
      const nextK = clampScale(t.k * factor);
      const centerX = size.width / 2;
      const centerY = size.height / 2;
      const dataX = (centerX - t.x) / t.k;
      const dataY = (centerY - t.y) / t.k;
      return { k: nextK, x: centerX - dataX * nextK, y: centerY - dataY * nextK };
    });
  }

  function handleWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setTransform((t) => {
      const nextK = clampScale(t.k * (1 - e.deltaY * 0.0012));
      const dataX = (mouseX - t.x) / t.k;
      const dataY = (mouseY - t.y) / t.k;
      return { k: nextK, x: mouseX - dataX * nextK, y: mouseY - dataY * nextK };
    });
  }

  // ---- Background pan (SVG-level) ----
  function handleSvgPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    panRef.current = { startX: e.clientX, startY: e.clientY, origin: transform };
  }

  function handleSvgPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const pan = panRef.current;
    if (!pan) return;
    setTransform({
      ...pan.origin,
      x: pan.origin.x + (e.clientX - pan.startX),
      y: pan.origin.y + (e.clientY - pan.startY),
    });
  }

  function handleSvgPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    panRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  // ---- Node drag (reheats the simulation, pins the node to the pointer) ----
  function screenToData(clientX: number, clientY: number, rect: DOMRect): [number, number] {
    const t = transformRef.current;
    return [(clientX - rect.left - t.x) / t.k, (clientY - rect.top - t.y) / t.k];
  }

  function handleNodePointerDown(node: GraphNodeLayout, e: React.PointerEvent<SVGGElement>) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingNodeRef.current = node;
    simRef.current?.simulation.alphaTarget(0.3).restart();
    node.fx = node.x;
    node.fy = node.y;
  }

  function handleNodePointerMove(e: React.PointerEvent<SVGGElement>) {
    e.stopPropagation();
    const node = draggingNodeRef.current;
    if (!node) return;
    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!rect) return;
    const [dataX, dataY] = screenToData(e.clientX, e.clientY, rect);
    node.fx = dataX;
    node.fy = dataY;
  }

  function handleNodePointerUp(e: React.PointerEvent<SVGGElement>) {
    e.stopPropagation();
    const node = draggingNodeRef.current;
    if (node) {
      node.fx = null;
      node.fy = null;
    }
    simRef.current?.simulation.alphaTarget(0);
    draggingNodeRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  const pageCount = Object.keys(pagesById).length;
  const nodes = simRef.current?.nodes ?? [];
  const edges = simRef.current?.edges ?? [];

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-2">
        <div className="border-border bg-card flex items-center gap-2 rounded-md border px-3 py-1.5 shadow-sm">
          <Search className="text-text-faint size-3.5 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            aria-label="Search graph nodes"
            className="placeholder:text-text-faint w-28 bg-transparent text-sm outline-none sm:w-40"
          />
        </div>

        {availableTags.length > 0 && (
          <div className="flex max-w-[min(20rem,calc(100vw-2rem))] flex-wrap gap-1.5">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() =>
                  setActiveTagId((current) => (current === tag.id ? null : tag.id))
                }
                aria-pressed={activeTagId === tag.id}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium shadow-sm",
                  TAG_COLOR_CLASSES[tag.color],
                  activeTagId === tag.id
                    ? "ring-1 ring-current"
                    : activeTagId
                      ? "opacity-50"
                      : "",
                )}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-border bg-card absolute top-4 right-4 z-10 flex items-center gap-0.5 rounded-md border p-0.5 shadow-sm">
        <button
          type="button"
          onClick={() => zoomBy(0.8)}
          aria-label="Zoom out"
          title="Zoom out"
          className="text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded"
        >
          <Minus className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setTransform({ x: 0, y: 0, k: 1 })}
          aria-label="Reset view"
          title="Reset view"
          className="text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded"
        >
          <RotateCcw className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1.25)}
          aria-label="Zoom in"
          title="Zoom in"
          className="text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {pageCount === 0 ? (
        <EmptyState
          icon={<Network className="size-5" />}
          title="Nothing to graph yet"
          description="Create a page first — every page becomes a node here."
        />
      ) : (
        <>
          <p className="sr-only">
            An interactive, visually-arranged, physics-driven graph of {pageCount} pages — drag
            a node to see its connections respond. It's best explored visually — use the
            sidebar's page list to browse the same pages by keyboard or screen reader.
          </p>
          <svg
            width={size.width}
            height={size.height}
            onWheel={handleWheel}
            onPointerDown={handleSvgPointerDown}
            onPointerMove={handleSvgPointerMove}
            onPointerUp={handleSvgPointerUp}
            className="cursor-grab touch-none active:cursor-grabbing"
            aria-label="Knowledge graph of pages and the links between them"
          >
            <defs>
              <marker
                id="graph-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth={ARROW_LENGTH}
                markerHeight={ARROW_LENGTH}
                orient="auto-start-reverse"
              >
                <path d="M0 0L10 5L0 10z" fill="var(--brand-violet)" />
              </marker>
            </defs>
            <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
              {edges.map((edge) => (
                <line
                  key={edge.id}
                  ref={(el) => {
                    if (el) edgeElRefs.current.set(edge.id, el);
                    else edgeElRefs.current.delete(edge.id);
                  }}
                  stroke="var(--brand-violet)"
                  strokeWidth={1.3}
                  markerEnd="url(#graph-arrow)"
                  opacity={isEdgeDimmed(edge.sourceId, edge.targetId) ? 0.06 : 0.35}
                />
              ))}
              {nodes.map((node) => {
                const dimmed = isNodeDimmed(node.id, node.title);
                const isHovered = hoveredId === node.id;
                const showLabel = shouldShowLabel(node, dimmed);
                return (
                  <g
                    key={node.id}
                    ref={(el) => {
                      if (el) nodeElRefs.current.set(node.id, el);
                      else nodeElRefs.current.delete(node.id);
                    }}
                    opacity={dimmed ? 0.22 : 1}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onPointerDown={(e) => handleNodePointerDown(node, e)}
                    onPointerMove={handleNodePointerMove}
                    onPointerUp={handleNodePointerUp}
                    onClick={() =>
                      navigate(`/w/${WORKSPACE_ID}/p/${node.id}`, { viewTransition: true })
                    }
                    className="cursor-grab touch-none active:cursor-grabbing"
                  >
                    <circle
                      r={nodeRadius(node.weight)}
                      fill={isHovered ? "var(--brand-gold)" : "var(--brand-violet)"}
                      fillOpacity={0.85}
                      stroke={isHovered ? "var(--brand-gold)" : "var(--brand-violet)"}
                      strokeWidth={1.5}
                    />
                    {showLabel && (
                      <text
                        y={nodeRadius(node.weight) + 13}
                        textAnchor="middle"
                        fontSize={11}
                        fill="var(--foreground)"
                        className="pointer-events-none select-none"
                      >
                        {node.title}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </>
      )}
    </div>
  );
}
