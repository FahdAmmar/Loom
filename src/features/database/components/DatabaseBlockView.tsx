import { useEffect, useState } from "react";

import * as propertiesApi from "@/api/pageProperties";
import { TableView } from "@/features/database/components/TableView";
import { deriveTableColumns } from "@/features/database/tableUtils";
import { usePageStore } from "@/stores/usePageStore";
import type { Page, PageProperty } from "@/types/entities";

interface DatabaseBlockViewProps {
  /** The page this block lives in — its direct children are the rows. */
  pageId: string;
}

/**
 * A live table of this page's sub-pages. There's no separately stored
 * "database schema" — the columns are the union of whatever properties
 * the child pages already happen to have (see `deriveTableColumns`), and
 * the rows are just `Page` records with `parentId === pageId`. Nothing
 * here is stored redundantly; it's all computed at render time from data
 * that already exists for other reasons.
 */
export function DatabaseBlockView({ pageId }: DatabaseBlockViewProps) {
  const pagesById = usePageStore((s) => s.pagesById);
  const createPage = usePageStore((s) => s.createPage);
  const [properties, setProperties] = useState<PageProperty[] | null>(null);

  const parentPage = pagesById[pageId] as Page | undefined;
  const childPages = Object.values(pagesById)
    .filter((p) => p.parentId === pageId)
    .sort((a, b) => a.order - b.order);
  const childIds = childPages.map((p) => p.id);
  const childIdsKey = childIds.join(",");

  useEffect(() => {
    let cancelled = false;
    propertiesApi.getPropertiesForPages(childIds).then((props) => {
      if (!cancelled) setProperties(props);
    });
    return () => {
      cancelled = true;
    };
    // Re-fetch only when the *set* of children changes, not on every
    // unrelated pagesById update (e.g. a sibling page being renamed).
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [childIdsKey]);

  async function handleAddPage() {
    if (!parentPage) return;
    await createPage(parentPage.workspaceId, pageId);
  }

  function handlePropertiesChange(next: PageProperty[]) {
    setProperties(next);
  }

  if (properties === null) {
    return (
      <div className="border-border rounded-md border" aria-hidden="true">
        <div className="bg-muted m-3 h-24 animate-pulse rounded" />
      </div>
    );
  }

  const columns = deriveTableColumns(properties);

  return (
    <TableView
      pages={childPages}
      properties={properties}
      columns={columns}
      onPropertiesChange={handlePropertiesChange}
      onAddPage={handleAddPage}
    />
  );
}
