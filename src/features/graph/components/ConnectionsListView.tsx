import { Link as RouterLink } from "react-router";

import type { Link, Page } from "@/types/entities";

const WORKSPACE_ID = "default";

interface ConnectionsListViewProps {
  pagesById: Record<string, Page>;
  links: Link[];
  query: string;
  activeTagId: string | null;
  tagIdsByPage: Map<string, Set<string>>;
}

/**
 * The graph's data (same `pagesById`/`links`/search/tag-filter state the
 * SVG view uses) rendered as real, focusable HTML instead of shapes on a
 * canvas — the graph's own `sr-only` note points here for a way to
 * actually browse connections, not just be told the graph exists. One
 * section per page, listing the pages it links to.
 */
export function ConnectionsListView({
  pagesById,
  links,
  query,
  activeTagId,
  tagIdsByPage,
}: ConnectionsListViewProps) {
  const normalizedQuery = query.trim().toLowerCase();

  const pages = Object.values(pagesById)
    .filter((page) => !normalizedQuery || page.title.toLowerCase().includes(normalizedQuery))
    .filter((page) => !activeTagId || tagIdsByPage.get(page.id)?.has(activeTagId))
    .sort((a, b) => a.title.localeCompare(b.title));

  if (pages.length === 0) {
    return (
      <p className="text-muted-foreground p-6 text-sm">No pages match the current filter.</p>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 pt-44">
      <ul className="mx-auto flex max-w-xl flex-col gap-6">
        {pages.map((page) => {
          const outgoing = links
            .filter((link) => link.sourcePageId === page.id)
            .map((link) => pagesById[link.targetPageId])
            .filter((target): target is Page => Boolean(target))
            .sort((a, b) => a.title.localeCompare(b.title));

          return (
            <li key={page.id}>
              <h3 className="text-foreground font-medium">
                <RouterLink
                  viewTransition
                  to={`/w/${WORKSPACE_ID}/p/${page.id}`}
                  className="hover:underline"
                >
                  {page.icon ? `${page.icon} ` : ""}
                  {page.title || "Untitled"}
                </RouterLink>
              </h3>
              {outgoing.length === 0 ? (
                <p className="text-text-faint mt-1 text-sm">No outgoing links.</p>
              ) : (
                <ul className="mt-1 flex flex-col gap-0.5 ps-4 text-sm">
                  {outgoing.map((target) => (
                    <li key={target.id} className="text-muted-foreground">
                      →{" "}
                      <RouterLink
                        viewTransition
                        to={`/w/${WORKSPACE_ID}/p/${target.id}`}
                        className="hover:text-foreground hover:underline"
                      >
                        {target.icon ? `${target.icon} ` : ""}
                        {target.title || "Untitled"}
                      </RouterLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
