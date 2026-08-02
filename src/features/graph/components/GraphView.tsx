import { useEffect, useMemo, useRef, useState } from "react";
import { Network, RotateCcw, Search } from "lucide-react";
import { useNavigate } from "react-router";

import * as linksApi from "@/api/links";
import { EmptyState } from "@/components/EmptyState";
import { computeGraphLayout, nodeRadius } from "@/features/graph/computeGraphLayout";
import { usePageStore } from "@/stores/usePageStore";
import type { Link } from "@/types/entities";

const WORKSPACE_ID = "default";
const MIN_SCALE = 0.35;
const MAX_SCALE = 3;

interface Transform {
  x: number;
  y: number;
  k: number;
}

export function GraphView() {
  const navigate = useNavigate();
  const pagesById = usePageStore((s) => s.pagesById);
  const [links, setLinks] = useState<Link[] | null>(null);
  const [query, setQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const dragRef = useRef<{ startX: number; startY: number; origin: Transform } | null>(null);

  useEffect(() => {
    linksApi.listAllLinks().then(setLinks);
  }, []);

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

  const layout = useMemo(() => {
    if (!links) return null;
    return computeGraphLayout(Object.values(pagesById), links, size.width, size.height);
  }, [pagesById, links, size.width, size.height]);

  const neighborIds = useMemo(() => {
    if (!hoveredId || !layout) return null;
    const ids = new Set<string>([hoveredId]);
    for (const edge of layout.edges) {
      if (edge.sourceId === hoveredId) ids.add(edge.targetId);
      if (edge.targetId === hoveredId) ids.add(edge.sourceId);
    }
    return ids;
  }, [hoveredId, layout]);

  const normalizedQuery = query.trim().toLowerCase();

  function isNodeDimmed(id: string, title: string): boolean {
    if (neighborIds) return !neighborIds.has(id);
    if (normalizedQuery) return !title.toLowerCase().includes(normalizedQuery);
    return false;
  }

  function isEdgeDimmed(sourceId: string, targetId: string): boolean {
    if (!neighborIds) return false;
    return !(neighborIds.has(sourceId) && neighborIds.has(targetId));
  }

  function clampScale(k: number): number {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, k));
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

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origin: transform };
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    setTransform({
      ...drag.origin,
      x: drag.origin.x + (e.clientX - drag.startX),
      y: drag.origin.y + (e.clientY - drag.startY),
    });
  }

  function handlePointerUp(e: React.PointerEvent<SVGSVGElement>) {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  const pageCount = Object.keys(pagesById).length;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <div className="border-border bg-card absolute top-4 left-4 z-10 flex items-center gap-2 rounded-md border px-3 py-1.5 shadow-sm">
        <Search className="text-text-faint size-3.5 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pages…"
          aria-label="Search graph nodes"
          className="placeholder:text-text-faint w-40 bg-transparent text-sm outline-none"
        />
      </div>

      <button
        type="button"
        onClick={() => setTransform({ x: 0, y: 0, k: 1 })}
        aria-label="Reset view"
        title="Reset view"
        className="border-border bg-card text-muted-foreground hover:text-foreground absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-md border shadow-sm"
      >
        <RotateCcw className="size-3.5" />
      </button>

      {pageCount === 0 ? (
        <EmptyState
          icon={<Network className="size-5" />}
          title="Nothing to graph yet"
          description="Create a page first — every page becomes a node here."
        />
      ) : !layout ? null : (
        <>
          <p className="sr-only">
            An interactive, visually-arranged graph of {pageCount} pages. It's best explored
            visually — use the sidebar's page list to browse the same pages by keyboard or
            screen reader.
          </p>
          <svg
            width={size.width}
            height={size.height}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="cursor-grab touch-none active:cursor-grabbing"
            aria-label="Knowledge graph of pages and the links between them"
          >
            <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
              {layout.edges.map((edge) => (
                <line
                  key={edge.id}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke="var(--brand-violet)"
                  strokeWidth={1.3}
                  opacity={isEdgeDimmed(edge.sourceId, edge.targetId) ? 0.08 : 0.4}
                />
              ))}
              {layout.nodes.map((node) => {
                const dimmed = isNodeDimmed(node.id, node.title);
                const isHovered = hoveredId === node.id;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x ?? 0},${node.y ?? 0})`}
                    opacity={dimmed ? 0.22 : 1}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => navigate(`/w/${WORKSPACE_ID}/p/${node.id}`)}
                    className="cursor-pointer"
                  >
                    <circle
                      r={nodeRadius(node.weight)}
                      fill={isHovered ? "var(--brand-gold)" : "var(--brand-violet)"}
                      fillOpacity={0.85}
                      stroke={isHovered ? "var(--brand-gold)" : "var(--brand-violet)"}
                      strokeWidth={1.5}
                    />
                    <text
                      y={nodeRadius(node.weight) + 13}
                      textAnchor="middle"
                      fontSize={11}
                      fill="var(--foreground)"
                      className="pointer-events-none select-none"
                    >
                      {node.title}
                    </text>
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
