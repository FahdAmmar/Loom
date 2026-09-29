import Fuse from "fuse.js";

import { mockDb, networkDelay } from "@/api/_mockDb";
import { SNIPPET_RADIUS, buildSnippet, extractPlainText } from "@/lib/blocks";
import type { Page } from "@/types/entities";

export interface SearchResult {
  page: Pick<Page, "id" | "title" | "icon">;
  matchType: "title" | "tag" | "content";
  /** Short excerpt around the match, only set for content matches. */
  snippet?: string;
  /** The tag that matched, only set for tag matches. */
  tagName?: string;
  /** Where to highlight the match: an index range into `page.title` for a
   * title match, or into `snippet` for a content one. Undefined for a tag
   * match — the tag name is shown separately rather than in the title. */
  highlightStart?: number;
  highlightEnd?: number;
}

const FUSE_OPTIONS = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.35, // 0 = exact match only, 1 = match anything — 0.35 tolerates a typo or two
  minMatchCharLength: 2,
} as const;

// Title hits first, then tag hits, then body-text hits.
const MATCH_RANK: Record<SearchResult["matchType"], number> = { title: 0, tag: 1, content: 2 };

interface TitleDoc {
  page: Pick<Page, "id" | "title" | "icon">;
  title: string;
}

interface ContentDoc {
  page: Pick<Page, "id" | "title" | "icon">;
  text: string;
}

/** Offset of a match *within the snippet* `buildSnippet` returns for it.
 * `buildSnippet` prepends a one-character ellipsis whenever it trims the
 * front, so the match shifts by one in that case. */
function offsetInSnippet(matchIndex: number): number {
  const start = Math.max(0, matchIndex - SNIPPET_RADIUS);
  return matchIndex - start + (start > 0 ? 1 : 0);
}

export async function search(query: string): Promise<SearchResult[]> {
  await networkDelay(150);
  const trimmed = query.trim();
  if (!trimmed) return [];

  const db = mockDb.read();
  const results: SearchResult[] = [];
  const matchedPageIds = new Set<string>();

  // Title matches rank highest and are checked first — a page whose title
  // matches is shown once, without also scanning its content.
  const titleDocs: TitleDoc[] = Object.values(db.pages).map((page) => ({
    page: { id: page.id, title: page.title, icon: page.icon },
    title: page.title,
  }));
  const titleFuse = new Fuse(titleDocs, { ...FUSE_OPTIONS, keys: ["title"] });
  for (const result of titleFuse.search(trimmed)) {
    matchedPageIds.add(result.item.page.id);
    // A fuzzy hit may not be a literal substring, so fall back to the
    // matched range Fuse reports rather than searching for it again.
    const [start, end] = result.matches?.[0]?.indices[0] ?? [0, result.item.title.length];
    results.push({
      page: result.item.page,
      matchType: "title",
      highlightStart: start,
      highlightEnd: end + 1,
    });
  }

  // Tag matches, next best. "#guide" is read as "the tag guide" — a leading
  // # is what people type when they mean a tag, so it shouldn't also have to
  // appear in the tag's own name. One tag per page is enough to surface it.
  const tagQuery = trimmed.startsWith("#") ? trimmed.slice(1).trim() : trimmed;
  if (tagQuery) {
    const alreadyTagged = new Set<string>();
    for (const pageTag of Object.values(db.pageTags)) {
      const tag = db.tags[pageTag.tagId];
      if (!tag || !tag.name.toLowerCase().includes(tagQuery)) continue;
      if (matchedPageIds.has(pageTag.pageId) || alreadyTagged.has(pageTag.pageId)) continue;
      alreadyTagged.add(pageTag.pageId);
      matchedPageIds.add(pageTag.pageId);
      const page = db.pages[pageTag.pageId];
      if (!page) continue;
      results.push({
        page: { id: page.id, title: page.title, icon: page.icon },
        matchType: "tag",
        tagName: tag.name,
      });
    }
  }

  // Content matches: one search across every block, then keep only the
  // best-scoring block per page (Fuse results are already score-sorted).
  const contentDocs: ContentDoc[] = [];
  for (const block of Object.values(db.blocks)) {
    const page = db.pages[block.pageId];
    if (!page || matchedPageIds.has(page.id)) continue;
    const text = extractPlainText(block);
    if (text) {
      contentDocs.push({ page: { id: page.id, title: page.title, icon: page.icon }, text });
    }
  }
  const contentFuse = new Fuse(contentDocs, { ...FUSE_OPTIONS, keys: ["text"] });
  for (const result of contentFuse.search(trimmed)) {
    if (matchedPageIds.has(result.item.page.id)) continue; // already have this page's best match
    matchedPageIds.add(result.item.page.id);

    const textMatch = result.matches?.find((m) => m.key === "text");
    const [start, end] = textMatch?.indices[0] ?? [0, trimmed.length - 1];
    results.push({
      page: result.item.page,
      matchType: "content",
      snippet: buildSnippet(result.item.text, start, end - start + 1),
      highlightStart: offsetInSnippet(start),
      highlightEnd: offsetInSnippet(start) + (end - start + 1),
    });
  }

  // Array.prototype.sort is stable, so pages keep their relative order
  // within each match type.
  results.sort((a, b) => MATCH_RANK[a.matchType] - MATCH_RANK[b.matchType]);
  return results.slice(0, 20);
}
