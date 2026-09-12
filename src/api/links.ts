import { mockDb, networkDelay } from "@/api/_mockDb";
import {
  buildSnippet,
  extractPageLinkIdsFromHtml,
  extractPlainText,
  insertWikilinkForMention,
} from "@/lib/blocks";
import type { Link, Page } from "@/types/entities";

export interface BacklinkResult {
  link: Link;
  sourcePage: Pick<Page, "id" | "title" | "icon">;
}

export interface UnlinkedMentionResult {
  sourcePage: Pick<Page, "id" | "title" | "icon">;
  sourceBlockId: string;
  snippet: string;
}

/** Titles shorter than this are too generic to search for as plain text —
 * matching e.g. a two-letter page title against every block in the
 * workspace would surface mostly noise. */
const MIN_MENTIONABLE_TITLE_LENGTH = 3;

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

/**
 * Pages that mention this page's title as plain text without an actual
 * [[link]] to it — one snippet per page, from its first matching block. A
 * page that already links here anywhere is excluded entirely, even if it
 * also happens to mention the title again in plain text elsewhere.
 */
export async function getUnlinkedMentions(pageId: string): Promise<UnlinkedMentionResult[]> {
  await networkDelay();
  const db = mockDb.read();
  const targetPage = db.pages[pageId];
  if (!targetPage) return [];

  const needle = targetPage.title.trim().toLowerCase();
  if (needle.length < MIN_MENTIONABLE_TITLE_LENGTH) return [];

  const alreadyLinkedFrom = new Set(
    Object.values(db.links)
      .filter((link) => link.targetPageId === pageId)
      .map((link) => link.sourcePageId),
  );

  const results: UnlinkedMentionResult[] = [];
  for (const page of Object.values(db.pages)) {
    if (page.id === pageId || alreadyLinkedFrom.has(page.id)) continue;

    const pageBlocks = Object.values(db.blocks)
      .filter((b) => b.pageId === page.id)
      .sort((a, b) => a.order - b.order);

    for (const block of pageBlocks) {
      const text = extractPlainText(block);
      const matchIndex = text.toLowerCase().indexOf(needle);
      if (matchIndex === -1) continue;
      results.push({
        sourcePage: { id: page.id, title: page.title, icon: page.icon },
        sourceBlockId: block.id,
        snippet: buildSnippet(text, matchIndex, needle.length),
      });
      break; // one mention per page is enough to surface it
    }
  }

  return results;
}

/** Converts one unlinked mention into a real [[wikilink]] chip and syncs
 * the Link table — the "Link" button in the Unlinked Mentions panel. */
export async function linkifyMention(
  sourceBlockId: string,
  targetPageId: string,
): Promise<void> {
  await networkDelay(90);
  const db = mockDb.read();
  const block = db.blocks[sourceBlockId];
  const targetPage = db.pages[targetPageId];
  if (!block || !targetPage || typeof block.content.html !== "string") return;

  const nextHtml = insertWikilinkForMention(block.content.html, targetPageId, targetPage.title);
  if (nextHtml === null) return; // mention was edited away since the panel loaded

  db.blocks[sourceBlockId] = { ...block, content: { ...block.content, html: nextHtml } };
  mockDb.write(db);

  await syncBlockLinks(block.pageId, sourceBlockId, extractPageLinkIdsFromHtml(nextHtml));
}
