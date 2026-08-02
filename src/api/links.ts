import { mockDb, networkDelay } from "@/api/_mockDb";
import type { Link, Page } from "@/types/entities";

export interface BacklinkResult {
  link: Link;
  sourcePage: Pick<Page, "id" | "title" | "icon">;
}

/**
 * Reconciles the Link table for one block: delete-then-recreate is simpler
 * and just as correct as diffing here, since Link ids are ephemeral
 * derived data, not something anything else references by id.
 */
export async function syncBlockLinks(
  sourcePageId: string,
  sourceBlockId: string,
  targetPageIds: string[],
): Promise<void> {
  await networkDelay(80);
  const db = mockDb.read();

  for (const link of Object.values(db.links)) {
    if (link.sourceBlockId === sourceBlockId) delete db.links[link.id];
  }

  const uniqueTargets = [...new Set(targetPageIds)].filter((id) => id !== sourcePageId);
  for (const targetPageId of uniqueTargets) {
    const link: Link = {
      id: `link-${crypto.randomUUID()}`,
      sourcePageId,
      targetPageId,
      sourceBlockId,
    };
    db.links[link.id] = link;
  }

  mockDb.write(db);
}

/** Pages that link TO this one — computed by filtering Link on targetPageId, never stored separately. */
export async function getBacklinks(pageId: string): Promise<BacklinkResult[]> {
  await networkDelay();
  const db = mockDb.read();
  const results: BacklinkResult[] = [];

  for (const link of Object.values(db.links)) {
    if (link.targetPageId !== pageId) continue;
    const sourcePage = db.pages[link.sourcePageId];
    if (!sourcePage) continue; // orphaned — source page was deleted without cleanup
    results.push({
      link,
      sourcePage: { id: sourcePage.id, title: sourcePage.title, icon: sourcePage.icon },
    });
  }

  return results;
}

/** Every link in the workspace — the Graph View's edge list. */
export async function listAllLinks(): Promise<Link[]> {
  await networkDelay();
  return Object.values(mockDb.read().links);
}
