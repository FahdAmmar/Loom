import { mockDb, networkDelay } from "@/api/_mockDb";
import { extractPlainText } from "@/lib/blocks";
import type { Page } from "@/types/entities";

export interface SearchResult {
  page: Pick<Page, "id" | "title" | "icon">;
  matchType: "title" | "content";
  /** Short excerpt around the match, only set for content matches. */
  snippet?: string;
}

function buildSnippet(text: string, matchIndex: number, matchLength: number): string {
  const radius = 40;
  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(text.length, matchIndex + matchLength + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

export async function search(query: string): Promise<SearchResult[]> {
  await networkDelay(150);
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const db = mockDb.read();
  const results: SearchResult[] = [];

  for (const page of Object.values(db.pages)) {
    const pageRef = { id: page.id, title: page.title, icon: page.icon };

    if (page.title.toLowerCase().includes(trimmed)) {
      results.push({ page: pageRef, matchType: "title" });
      continue; // a title match is enough — don't also scan its blocks
    }

    const pageBlocks = Object.values(db.blocks).filter((b) => b.pageId === page.id);
    for (const block of pageBlocks) {
      const text = extractPlainText(block);
      const matchIndex = text.toLowerCase().indexOf(trimmed);
      if (matchIndex !== -1) {
        results.push({
          page: pageRef,
          matchType: "content",
          snippet: buildSnippet(text, matchIndex, trimmed.length),
        });
        break; // one hit per page is enough for a results list
      }
    }
  }

  return results.slice(0, 20);
}
