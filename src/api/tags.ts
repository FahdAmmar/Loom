import { ApiError } from "@/api/client";
import { mockDb, networkDelay } from "@/api/_mockDb";
import type { Page, PageTag, Tag } from "@/types/entities";

const TAG_COLORS = ["gold", "violet", "mint"] as const;

export async function listTags(workspaceId: string): Promise<Tag[]> {
  await networkDelay();
  return Object.values(mockDb.read().tags).filter((t) => t.workspaceId === workspaceId);
}

export async function createTag(workspaceId: string, name: string): Promise<Tag> {
  await networkDelay(120);
  const db = mockDb.read();
  const trimmed = name.trim();
  if (!trimmed) throw new ApiError("A tag needs a name.");

  const existing = Object.values(db.tags).find(
    (t) => t.workspaceId === workspaceId && t.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (existing) return existing;

  const color = TAG_COLORS[Object.keys(db.tags).length % TAG_COLORS.length];
  const tag: Tag = { id: `tag-${crypto.randomUUID()}`, workspaceId, name: trimmed, color };
  db.tags[tag.id] = tag;
  mockDb.write(db);
  return tag;
}

export async function deleteTag(tagId: string): Promise<void> {
  await networkDelay();
  const db = mockDb.read();
  delete db.tags[tagId];
  for (const pageTag of Object.values(db.pageTags)) {
    if (pageTag.tagId === tagId) delete db.pageTags[`${pageTag.pageId}:${pageTag.tagId}`];
  }
  mockDb.write(db);
}

export async function getTagsForPage(pageId: string): Promise<Tag[]> {
  await networkDelay(100);
  const db = mockDb.read();
  const tagIds = Object.values(db.pageTags)
    .filter((pt) => pt.pageId === pageId)
    .map((pt) => pt.tagId);
  return tagIds.map((id) => db.tags[id]).filter((t): t is Tag => Boolean(t));
}

/** Every page-tag pairing in the workspace — used by the Graph View's tag filter. */
export async function listAllPageTags(): Promise<PageTag[]> {
  await networkDelay(100);
  return Object.values(mockDb.read().pageTags);
}

/** Reconciles a page's tags in one shot — delete-then-recreate, same pattern as syncBlockLinks. */
export async function setPageTags(pageId: string, tagIds: string[]): Promise<void> {
  await networkDelay(90);
  const db = mockDb.read();
  for (const pageTag of Object.values(db.pageTags)) {
    if (pageTag.pageId === pageId) delete db.pageTags[`${pageTag.pageId}:${pageTag.tagId}`];
  }
  for (const tagId of new Set(tagIds)) {
    db.pageTags[`${pageId}:${tagId}`] = { pageId, tagId };
  }
  mockDb.write(db);
}

export async function getPagesForTag(tagId: string): Promise<Page[]> {
  await networkDelay();
  const db = mockDb.read();
  const pageIds = Object.values(db.pageTags)
    .filter((pt) => pt.tagId === tagId)
    .map((pt) => pt.pageId);
  return pageIds.map((id) => db.pages[id]).filter((p): p is Page => Boolean(p));
}

/** Page count per tag — used by the Tags gallery. */
export async function getTagCounts(workspaceId: string): Promise<Record<string, number>> {
  await networkDelay();
  const db = mockDb.read();
  const workspaceTagIds = new Set(
    Object.values(db.tags)
      .filter((t) => t.workspaceId === workspaceId)
      .map((t) => t.id),
  );
  const counts: Record<string, number> = {};
  for (const pageTag of Object.values(db.pageTags)) {
    if (!workspaceTagIds.has(pageTag.tagId)) continue;
    counts[pageTag.tagId] = (counts[pageTag.tagId] ?? 0) + 1;
  }
  return counts;
}
