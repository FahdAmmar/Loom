import { ApiError } from "@/api/client";
import { mockDb, networkDelay } from "@/api/_mockDb";
import { getDescendantIds } from "@/lib/tree";
import type { Page } from "@/types/entities";

export async function listPages(workspaceId: string): Promise<Page[]> {
  await networkDelay();
  return Object.values(mockDb.read().pages).filter((p) => p.workspaceId === workspaceId);
}

export interface CreatePageInput {
  workspaceId: string;
  parentId: string | null;
  title?: string;
}

export async function createPage(input: CreatePageInput): Promise<Page> {
  await networkDelay();
  const db = mockDb.read();
  const now = new Date().toISOString();

  const siblingCount = Object.values(db.pages).filter(
    (p) => p.workspaceId === input.workspaceId && p.parentId === input.parentId,
  ).length;

  const page: Page = {
    id: `page-${crypto.randomUUID()}`,
    workspaceId: input.workspaceId,
    parentId: input.parentId,
    title: input.title?.trim() || "Untitled",
    isFavorite: false,
    order: siblingCount,
    createdAt: now,
    updatedAt: now,
  };

  db.pages[page.id] = page;
  mockDb.write(db);
  return page;
}

export async function renamePage(id: string, title: string): Promise<Page> {
  await networkDelay(120);
  const db = mockDb.read();
  const existing = db.pages[id];
  if (!existing) throw new ApiError(`No page found with id "${id}".`, 404);

  const updated: Page = {
    ...existing,
    title: title.trim() || "Untitled",
    updatedAt: new Date().toISOString(),
  };
  db.pages[id] = updated;
  mockDb.write(db);
  return updated;
}

export async function setFavorite(id: string, isFavorite: boolean): Promise<Page> {
  await networkDelay(90);
  const db = mockDb.read();
  const existing = db.pages[id];
  if (!existing) throw new ApiError(`No page found with id "${id}".`, 404);

  const updated: Page = { ...existing, isFavorite, updatedAt: new Date().toISOString() };
  db.pages[id] = updated;
  mockDb.write(db);
  return updated;
}

/**
 * Moves a page to `newIndex` among the children of `newParentId` — covers
 * both plain reordering (newParentId unchanged) and re-parenting (dragging
 * a page to nest under a different one) in one operation, since drag-and-drop
 * doesn't distinguish the two gestures. Renumbers both the old and new
 * sibling lists to a contiguous 0..n-1 order. Returns every page whose
 * order or parentId changed.
 *
 * Note the index convention here is deliberately different from
 * reorderBlock's: `newIndex` is a position among newParentId's children
 * *excluding* the page being moved (0 = first child other than itself),
 * not its raw position in a list that still includes it. That makes "index
 * 0" mean the same thing regardless of where the page is dragged from,
 * which matters here because a page can also change parents mid-drag —
 * reorderBlock never does, so its simpler raw-index/swap convention (see
 * lib/utils.ts arrayMove) is a better fit there.
 */
export async function movePage(
  id: string,
  newParentId: string | null,
  newIndex: number,
): Promise<Page[]> {
  await networkDelay(90);
  const db = mockDb.read();
  const target = db.pages[id];
  if (!target) throw new ApiError(`No page found with id "${id}".`, 404);
  if (newParentId === id) {
    throw new ApiError("A page can't be moved inside itself.", 400);
  }
  if (getDescendantIds(db.pages, id).includes(newParentId ?? "")) {
    throw new ApiError("A page can't be moved inside one of its own descendants.", 400);
  }

  const changed = new Map<string, Page>();
  const sameParent = target.parentId === newParentId;

  if (!sameParent) {
    const oldSiblings = Object.values(db.pages)
      .filter((p) => p.workspaceId === target.workspaceId && p.parentId === target.parentId)
      .sort((a, b) => a.order - b.order)
      .filter((p) => p.id !== id);
    oldSiblings.forEach((p, index) => changed.set(p.id, { ...p, order: index }));
  }

  const newSiblings = Object.values(db.pages)
    .filter(
      (p) => p.workspaceId === target.workspaceId && p.parentId === newParentId && p.id !== id,
    )
    .sort((a, b) => a.order - b.order);
  newSiblings.splice(Math.max(0, Math.min(newIndex, newSiblings.length)), 0, target);
  newSiblings.forEach((p, index) => {
    changed.set(p.id, { ...p, parentId: newParentId, order: index });
  });

  for (const page of changed.values()) db.pages[page.id] = page;
  mockDb.write(db);
  return [...changed.values()];
}

/** Deletes a page and every descendant beneath it (plus their blocks and
 * any links touching them), returning the page ids removed. */
export async function deletePage(id: string): Promise<string[]> {
  await networkDelay();
  const db = mockDb.read();
  if (!db.pages[id]) throw new ApiError(`No page found with id "${id}".`, 404);

  const pageIdsToRemove = [id, ...getDescendantIds(db.pages, id)];
  const pageIdSet = new Set(pageIdsToRemove);

  for (const pageId of pageIdsToRemove) delete db.pages[pageId];

  for (const b of Object.values(db.blocks)) {
    if (pageIdSet.has(b.pageId)) delete db.blocks[b.id];
  }

  for (const link of Object.values(db.links)) {
    if (pageIdSet.has(link.sourcePageId) || pageIdSet.has(link.targetPageId)) {
      delete db.links[link.id];
    }
  }

  for (const pageTag of Object.values(db.pageTags)) {
    if (pageIdSet.has(pageTag.pageId)) delete db.pageTags[`${pageTag.pageId}:${pageTag.tagId}`];
  }

  for (const property of Object.values(db.pageProperties)) {
    if (pageIdSet.has(property.pageId)) delete db.pageProperties[property.id];
  }

  mockDb.write(db);
  return pageIdsToRemove;
}
