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

/** Deletes a page and every descendant beneath it, returning the ids removed. */
export async function deletePage(id: string): Promise<string[]> {
  await networkDelay();
  const db = mockDb.read();
  if (!db.pages[id]) throw new ApiError(`No page found with id "${id}".`, 404);

  const idsToRemove = [id, ...getDescendantIds(db.pages, id)];
  for (const removedId of idsToRemove) {
    delete db.pages[removedId];
  }
  mockDb.write(db);
  return idsToRemove;
}
