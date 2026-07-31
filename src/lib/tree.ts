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

/** A page's ancestor chain, root first — used for breadcrumbs. */
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
