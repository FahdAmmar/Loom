import { ApiError } from "@/api/client";
import { mockDb, networkDelay } from "@/api/_mockDb";
import type { MockDb } from "@/api/_mockDb";
import { syncBlockLinks } from "@/api/links";
import { extractPageLinkIdsFromHtml } from "@/lib/blocks";
import type { PageVersion } from "@/types/entities";

/** How many checkpoints to keep per page — older ones are pruned on save
 * so history doesn't grow without bound. */
const MAX_VERSIONS_PER_PAGE = 20;

/** Snapshots the page's current blocks into `db.pageVersions` and prunes
 * anything past the retention limit. A plain synchronous helper (no
 * `networkDelay` of its own) so both `saveVersion` and `restoreVersion`
 * can call it without stacking two artificial delays on top of each
 * other — each public function applies exactly one. */
function createSnapshot(db: MockDb, pageId: string, label?: string): PageVersion {
  const blocks = Object.values(db.blocks).filter((b) => b.pageId === pageId);
  const version: PageVersion = {
    id: `version-${crypto.randomUUID()}`,
    pageId,
    label,
    createdAt: new Date().toISOString(),
    // A real, independent copy — the version must stay frozen in time even
    // if these same block objects are later mutated in place elsewhere.
    blocks: structuredClone(blocks),
  };
  db.pageVersions[version.id] = version;

  const pageVersions = Object.values(db.pageVersions)
    .filter((v) => v.pageId === pageId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const stale of pageVersions.slice(MAX_VERSIONS_PER_PAGE)) {
    delete db.pageVersions[stale.id];
  }

  return version;
}

/** Every saved checkpoint for a page, most recent first. */
export async function listVersions(pageId: string): Promise<PageVersion[]> {
  await networkDelay();
  return Object.values(mockDb.read().pageVersions)
    .filter((v) => v.pageId === pageId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Manually saves a checkpoint of the page as it is right now. There's no
 * automatic/periodic snapshotting — see the feature README for why. */
export async function saveVersion(pageId: string, label?: string): Promise<PageVersion> {
  await networkDelay(150);
  const db = mockDb.read();
  const version = createSnapshot(db, pageId, label);
  mockDb.write(db);
  return version;
}

/**
 * Replaces the page's current blocks with a saved version's, then
 * re-syncs every restored block's `[[links]]` from its HTML — a normal
 * block delete already cleans up that block's Link records, so anything
 * coming back from an old snapshot needs its links re-derived rather than
 * assumed still valid. Saves a safety snapshot of the state being
 * overwritten first, so restoring is itself always undoable.
 */
export async function restoreVersion(versionId: string): Promise<void> {
  await networkDelay(150);
  const db = mockDb.read();
  const version = db.pageVersions[versionId];
  if (!version) throw new ApiError(`No version found with id "${versionId}".`, 404);

  createSnapshot(db, version.pageId, "Before restoring an older version");

  const currentBlockIds = Object.values(db.blocks)
    .filter((b) => b.pageId === version.pageId)
    .map((b) => b.id);
  for (const id of currentBlockIds) delete db.blocks[id];
  for (const link of Object.values(db.links)) {
    if (link.sourceBlockId && currentBlockIds.includes(link.sourceBlockId)) {
      delete db.links[link.id];
    }
  }
  for (const block of structuredClone(version.blocks)) db.blocks[block.id] = block;
  mockDb.write(db);

  await Promise.all(
    version.blocks.map((block) => {
      const html = block.content.html;
      if (typeof html !== "string") return Promise.resolve();
      return syncBlockLinks(version.pageId, block.id, extractPageLinkIdsFromHtml(html));
    }),
  );
}
