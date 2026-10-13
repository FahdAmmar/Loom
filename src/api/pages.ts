import { ApiError } from "@/api/client";
import { mockDb, networkDelay } from "@/api/_mockDb";
import { updateWikilinkTitlesInHtml } from "@/lib/blocks";
import { getDescendantIds } from "@/lib/tree";
import type { Block, Link, Page, PageProperty, PageTag } from "@/types/entities";

/** A trashed page is kept, not destroyed, so it can be restored — see
 * `restorePage`. It disappears from every listing that isn't explicitly about
 * the trash, and is purged for good past this window (see `initDb`). */
export const TRASH_RETENTION_DAYS = 30;

export async function listPages(workspaceId: string): Promise<Page[]> {
  await networkDelay();
  return Object.values(mockDb.read().pages).filter(
    (p) => p.workspaceId === workspaceId && !p.deletedAt,
  );
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

  const newTitle = title.trim() || "Untitled";
  const updated: Page = { ...existing, title: newTitle, updatedAt: new Date().toISOString() };
  db.pages[id] = updated;

  // A wikilink chip's displayed title is a snapshot taken when it was
  // inserted, not a live lookup — without this, every chip pointing at
  // this page keeps showing the old title indefinitely after a rename,
  // even though the link itself (keyed by page id, not title) still
  // navigates correctly. Rewrite each one in place.
  for (const link of Object.values(db.links)) {
    if (link.targetPageId !== id || !link.sourceBlockId) continue;
    const sourceBlock = db.blocks[link.sourceBlockId];
    if (!sourceBlock || typeof sourceBlock.content.html !== "string") continue;
    const nextHtml = updateWikilinkTitlesInHtml(sourceBlock.content.html, id, newTitle);
    if (nextHtml !== sourceBlock.content.html) {
      db.blocks[sourceBlock.id] = {
        ...sourceBlock,
        content: { ...sourceBlock.content, html: nextHtml },
      };
    }
  }

  mockDb.write(db);
  return updated;
}

export async function updatePageIcon(id: string, icon: string | undefined): Promise<Page> {
  await networkDelay(90);
  const db = mockDb.read();
  const existing = db.pages[id];
  if (!existing) throw new ApiError(`No page found with id "${id}".`, 404);

  const updated: Page = { ...existing, icon, updatedAt: new Date().toISOString() };
  db.pages[id] = updated;
  mockDb.write(db);
  return updated;
}

export async function updatePageCover(id: string, cover: string | undefined): Promise<Page> {
  await networkDelay(90);
  const db = mockDb.read();
  const existing = db.pages[id];
  if (!existing) throw new ApiError(`No page found with id "${id}".`, 404);

  const updated: Page = { ...existing, cover, updatedAt: new Date().toISOString() };
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

/**
 * Duplicates a page and its own blocks — not its sub-pages, matching the
 * common "Duplicate" default (Notion does the same): copying an entire
 * sub-tree is a bigger, more surprising operation a user would expect a
 * separate, explicit action for, not a plain "Duplicate".
 */
export async function duplicatePage(id: string): Promise<Page> {
  await networkDelay();
  const db = mockDb.read();
  const source = db.pages[id];
  if (!source) throw new ApiError(`No page found with id "${id}".`, 404);

  const now = new Date().toISOString();
  const siblingCount = Object.values(db.pages).filter(
    (p) => p.workspaceId === source.workspaceId && p.parentId === source.parentId,
  ).length;

  const page: Page = {
    ...source,
    id: `page-${crypto.randomUUID()}`,
    title: `${source.title} (copy)`,
    isFavorite: false,
    order: siblingCount,
    createdAt: now,
    updatedAt: now,
  };
  db.pages[page.id] = page;

  // Remap every source block to a fresh id first, then rewrite
  // parentBlockId through that map — needed so a nested block still
  // points at its (also-copied) parent's *new* id, not the original's.
  const idMap = new Map<string, string>();
  const sourceBlocks = Object.values(db.blocks).filter((b) => b.pageId === id);
  for (const block of sourceBlocks) idMap.set(block.id, `block-${crypto.randomUUID()}`);
  for (const block of sourceBlocks) {
    const newId = idMap.get(block.id);
    if (!newId) continue;
    db.blocks[newId] = {
      ...block,
      id: newId,
      pageId: page.id,
      parentBlockId: block.parentBlockId ? (idMap.get(block.parentBlockId) ?? null) : null,
    };
  }

  mockDb.write(db);
  return page;
}

/** Everything a `deletePage` call would remove — capture this beforehand so the deletion can be undone with `restorePagesFromSnapshot`. */
export interface PageDeletionSnapshot {
  pages: Page[];
  blocks: Block[];
  links: Link[];
  pageTags: PageTag[];
  pageProperties: PageProperty[];
}

/** Read-only preview of exactly what `deletePage(id)` would remove — the page, every descendant, and everything referencing them. */
export async function getPageDeletionSnapshot(id: string): Promise<PageDeletionSnapshot> {
  await networkDelay();
  const db = mockDb.read();
  if (!db.pages[id]) throw new ApiError(`No page found with id "${id}".`, 404);

  const pageIdsToRemove = [id, ...getDescendantIds(db.pages, id)];
  const pageIdSet = new Set(pageIdsToRemove);

  return {
    pages: pageIdsToRemove
      .map((pageId) => db.pages[pageId])
      .filter((p): p is Page => Boolean(p)),
    blocks: Object.values(db.blocks).filter((b) => pageIdSet.has(b.pageId)),
    links: Object.values(db.links).filter(
      (link) => pageIdSet.has(link.sourcePageId) || pageIdSet.has(link.targetPageId),
    ),
    pageTags: Object.values(db.pageTags).filter((pt) => pageIdSet.has(pt.pageId)),
    pageProperties: Object.values(db.pageProperties).filter((p) => pageIdSet.has(p.pageId)),
  };
}

/** Reinserts a snapshot captured by `getPageDeletionSnapshot` — undoes a `deletePage` call, restoring the original ids exactly. */
export async function restorePagesFromSnapshot(snapshot: PageDeletionSnapshot): Promise<void> {
  await networkDelay();
  const db = mockDb.read();
  for (const page of snapshot.pages) db.pages[page.id] = page;
  for (const block of snapshot.blocks) db.blocks[block.id] = block;
  for (const link of snapshot.links) db.links[link.id] = link;
  for (const pageTag of snapshot.pageTags) {
    db.pageTags[`${pageTag.pageId}:${pageTag.tagId}`] = pageTag;
  }
  for (const property of snapshot.pageProperties) db.pageProperties[property.id] = property;
  mockDb.write(db);
}

/** Strips the given pages, and everything hanging off them, out of `db` in
 * place. Split out from the async wrappers so a caller that already has the
 * database open (e.g. emptying the whole trash) can do it in one pass. */
function purgePagesFrom(db: ReturnType<typeof mockDb.read>, ids: string[]): void {
  const pageIdSet = new Set(ids);

  for (const pageId of pageIdSet) delete db.pages[pageId];

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
}

/** Physically removes a page and everything hanging off it. This is the
 * irreversible half of the trash — `deletePage` is the reversible one. */
async function purgeSubtree(id: string): Promise<string[]> {
  await networkDelay();
  const db = mockDb.read();
  if (!db.pages[id]) throw new ApiError(`No page found with id "${id}".`, 404);

  const pageIdsToRemove = [id, ...getDescendantIds(db.pages, id)];
  purgePagesFrom(db, pageIdsToRemove);
  mockDb.write(db);
  return pageIdsToRemove;
}

/** Moves a page and every descendant beneath it to the trash, returning the
 * page ids trashed. Nothing is destroyed: the rows stay put, marked with
 * `deletedAt`, so `restorePage` can bring the whole subtree back and
 * `permanentlyDeletePage` can finish the job later. */
export async function deletePage(id: string): Promise<string[]> {
  await networkDelay();
  const db = mockDb.read();
  if (!db.pages[id]) throw new ApiError(`No page found with id "${id}".`, 404);

  const pageIdsToTrash = [id, ...getDescendantIds(db.pages, id)];
  const deletedAt = new Date().toISOString();
  // One timestamp for the whole subtree, so restoring or purging the root
  // treats its descendants as a single unit with one shared age.
  for (const pageId of pageIdsToTrash) {
    const page = db.pages[pageId];
    if (page) db.pages[pageId] = { ...page, deletedAt };
  }

  mockDb.write(db);
  return pageIdsToTrash;
}

/** Brings a trashed page and its descendants back out of the trash, returning
 * the restored page records so a caller can drop them straight back into a
 * cache that only ever held live pages. */
export async function restorePage(id: string): Promise<Page[]> {
  await networkDelay();
  const db = mockDb.read();
  if (!db.pages[id]) throw new ApiError(`No page found with id "${id}".`, 404);

  const pageIdsToRestore = [id, ...getDescendantIds(db.pages, id)];
  const restored: Page[] = [];
  for (const pageId of pageIdsToRestore) {
    const page = db.pages[pageId];
    if (!page?.deletedAt) continue;
    const { deletedAt: _trashedAt, ...live } = page;
    db.pages[pageId] = live;
    restored.push(live);
  }

  mockDb.write(db);
  return restored;
}

/** The trashed pages a user can act on: the roots of each trashed sub-tree
 * only, so deleting a folder shows up as one row rather than one per
 * descendant. */
export async function listTrashedPages(workspaceId: string): Promise<Page[]> {
  await networkDelay();
  const db = mockDb.read();
  return Object.values(db.pages)
    .filter(
      (p) =>
        p.workspaceId === workspaceId &&
        !!p.deletedAt &&
        !(p.parentId && db.pages[p.parentId]?.deletedAt),
    )
    .sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? ""));
}

/** Deletes one trashed page — and its whole sub-tree — for good. */
export async function permanentlyDeletePage(id: string): Promise<void> {
  await purgeSubtree(id);
}

/** Empties the trash for a workspace, for good. Every trashed page is already
 * a known id here, so this is one read/write rather than a purge call per
 * page — `purgeSubtree` would re-scan the tree for descendants we've
 * already enumerated. */
export async function emptyTrash(workspaceId: string): Promise<void> {
  await networkDelay();
  const db = mockDb.read();
  const trashedIds = Object.values(db.pages)
    .filter((p) => p.workspaceId === workspaceId && p.deletedAt)
    .map((p) => p.id);
  if (trashedIds.length === 0) return;

  purgePagesFrom(db, trashedIds);
  mockDb.write(db);
}
