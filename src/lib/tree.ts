import type { Page } from "@/types/entities";

export interface PageTreeNode {
  page: Page;
  children: PageTreeNode[];
}

/** Builds a nested tree from the flat pagesById map, ordered by `order`. */
export function buildPageTree(pagesById: Record<string, Page>): PageTreeNode[] {
  const childrenByParent = new Map<string | null, Page[]>();

  for (const page of Object.values(pagesById)) {
    const key = page.parentId;
    const bucket = childrenByParent.get(key) ?? [];
    bucket.push(page);
    childrenByParent.set(key, bucket);
  }

  for (const bucket of childrenByParent.values()) {
    bucket.sort((a, b) => a.order - b.order);
  }

  function toNode(page: Page): PageTreeNode {
    const children = (childrenByParent.get(page.id) ?? []).map(toNode);
    return { page, children };
  }

  return (childrenByParent.get(null) ?? []).map(toNode);
}

export interface FlatPageTreeItem {
  page: Page;
  depth: number;
  hasChildren: boolean;
}

/**
 * Flattens a page tree into the ordered list of rows actually on screen —
 * a collapsed page's children are left out entirely, not just hidden.
 * Built for drag-and-drop: dnd-kit's sortable list needs one flat array of
 * ids, and a dragged page's new parent/position both fall out of where it
 * lands in this list (see api/pages.ts movePage).
 */
export function flattenVisibleTree(
  nodes: PageTreeNode[],
  collapsedPageIds: Record<string, boolean>,
  depth = 0,
): FlatPageTreeItem[] {
  const result: FlatPageTreeItem[] = [];
  for (const node of nodes) {
    result.push({ page: node.page, depth, hasChildren: node.children.length > 0 });
    if (node.children.length > 0 && !collapsedPageIds[node.page.id]) {
      result.push(...flattenVisibleTree(node.children, collapsedPageIds, depth + 1));
    }
  }
  return result;
}
export function getAncestors(pagesById: Record<string, Page>, pageId: string): Page[] {
  const chain: Page[] = [];
  let current = pagesById[pageId]?.parentId ?? null;
  while (current) {
    const parent = pagesById[current];
    if (!parent) break;
    chain.unshift(parent);
    current = parent.parentId;
  }
  return chain;
}

/** Every descendant id of a page, used to cascade-delete and to warn the user first. */
export function getDescendantIds(pagesById: Record<string, Page>, pageId: string): string[] {
  const result: string[] = [];
  const directChildren = Object.values(pagesById).filter((p) => p.parentId === pageId);
  for (const child of directChildren) {
    result.push(child.id);
    result.push(...getDescendantIds(pagesById, child.id));
  }
  return result;
}
