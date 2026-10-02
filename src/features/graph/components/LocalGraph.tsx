import { ChevronDown, Network } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router";

import * as linksApi from "@/api/links";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/useT";
import { getLocalGraph, layoutRadial, type LocalGraphDepth } from "@/lib/localGraph";
import { cn } from "@/lib/utils";
import { usePageStore } from "@/stores/usePageStore";
import type { Link as PageLink } from "@/types/entities";

const WORKSPACE_ID = "default";
const WIDTH = 360;
const HEIGHT = 280;
const LABEL_MAX_CHARS = 16;

const NODE_RADIUS = { 0: 9, 1: 6, 2: 4.5 } as const;
const NODE_FILL = {
  0: "fill-primary",
  1: "fill-secondary stroke-border",
  2: "fill-muted stroke-border",
} as const;

function shortLabel(title: string): string {
  return title.length > LABEL_MAX_CHARS ? `${title.slice(0, LABEL_MAX_CHARS - 1)}…` : title;
}

/** The page and the pages around it, within one or two links — a small map to jump along. */
export function LocalGraph({ pageId }: { pageId: string }) {
  const t = useT();
  const pagesById = usePageStore((s) => s.pagesById);
  const [links, setLinks] = useState<PageLink[] | null>(null);
  const [depth, setDepth] = useState<LocalGraphDepth>(1);
  const [isOpen, setOpen] = useState(true);
  const panelId = useId();

  useEffect(() => {
    let cancelled = false;
    linksApi.listAllLinks().then((result) => {
      if (!cancelled) setLinks(result);
    });
    return () => {
      cancelled = true;
    };
  }, [pageId]);

  const graph = useMemo(
    () => (links ? getLocalGraph(pageId, links, pagesById, depth) : null),
    [links, pageId, pagesById, depth],
  );
  const positions = useMemo(
    () => (graph ? layoutRadial(graph.nodes, WIDTH, HEIGHT) : null),
    [graph],
  );

  // A page with no links has nothing to show, however deep we look.
  if (!graph || !positions || graph.nodes.length < 2) return null;

  return (
    <section className="border-border border-t px-6 py-5 print:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setOpen((open) => !open)}
        className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2 text-sm font-medium"
      >
        <Network className="size-3.5" />
        <span className="flex-1 text-start">{t("localGraph.title")}</span>
        <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div id={panelId} className="mt-3">
          <div className="flex gap-2">
            {([1, 2] as const).map((level) => (
              <Button
                key={level}
                type="button"
                size="sm"
                variant={depth === level ? "default" : "outline"}
                aria-pressed={depth === level}
                onClick={() => setDepth(level)}
              >
                {t(level === 1 ? "localGraph.direct" : "localGraph.twoSteps")}
              </Button>
            ))}
          </div>

          <nav aria-label={t("localGraph.label")}>
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="mx-auto mt-2 h-auto w-full max-w-md"
            >
              {graph.edges.map((edge) => {
                const from = positions.get(edge.sourceId);
                const to = positions.get(edge.targetId);
                if (!from || !to) return null;
                return (
                  <line
                    key={`${edge.sourceId}-${edge.targetId}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    className="stroke-border"
                    strokeWidth={1}
                  />
                );
              })}

              {graph.nodes.map((node) => {
                const point = positions.get(node.id);
                if (!point) return null;
                const radius = NODE_RADIUS[node.depth];
                const isCurrent = node.depth === 0;
                const shape = (
                  <>
                    <title>{node.title}</title>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={radius}
                      strokeWidth={1}
                      className={cn(
                        NODE_FILL[node.depth],
                        "group-focus-visible/node:stroke-ring group-focus-visible/node:stroke-2",
                      )}
                    />
                    <text
                      x={point.x}
                      y={point.y + radius + 11}
                      textAnchor="middle"
                      className={cn(
                        "fill-foreground text-[10px]",
                        isCurrent && "font-semibold",
                      )}
                    >
                      {shortLabel(node.title)}
                    </text>
                  </>
                );
                return isCurrent ? (
                  <g key={node.id} aria-current="page">
                    {shape}
                  </g>
                ) : (
                  <Link
                    key={node.id}
                    to={`/w/${WORKSPACE_ID}/p/${node.id}`}
                    viewTransition
                    aria-label={node.title}
                    className="group/node cursor-pointer outline-none"
                  >
                    {shape}
                  </Link>
                );
              })}
            </svg>
          </nav>

          {graph.isTruncated && (
            <p className="text-text-faint mt-1 text-center text-xs">
              {t("localGraph.truncated", { count: graph.nodes.length })}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
