import Fuse from "fuse.js";

import { mockDb, networkDelay } from "@/api/_mockDb";
import { buildSnippet, extractPlainText } from "@/lib/blocks";
import type { Page } from "@/types/entities";

export interface SearchResult {
  page: Pick<Page, "id" | "title" | "icon">;
  matchType: "title" | "content";
  /** Short excerpt around the match, only set for content matches. */
  snippet?: string;
}

const FUSE_OPTIONS = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.35, // 0 = exact match only, 1 = match anything — 0.35 tolerates a typo or two
  minMatchCharLength: 2,
} as const;

interface TitleDoc {
  page: Pick<Page, "id" | "title" | "icon">;
  title: string;
}

interface ContentDoc {
  page: Pick<Page, "id" | "title" | "icon">;
  text: string;
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
    results.push({ page: result.item.page, matchType: "title" });
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
    });
  }

  return results.slice(0, 20);
}
