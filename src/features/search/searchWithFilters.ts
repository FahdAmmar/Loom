import type { SearchResult } from "@/api/search";
import { hasFilters, updatedSince, type ParsedSearch } from "@/lib/searchQuery";
import type { Page } from "@/types/entities";

const MAX_RESULTS = 20;

interface Deps {
  search: (text: string) => Promise<SearchResult[]>;
  pagesById: Record<string, Page>;
  now?: Date;
}

/**
 * The regular search plus the `in:` / `updated:` filters. Filters are applied
 * to its results, so the search itself doesn't need to know about them.
 * With no text, `updated:` alone lists the most recently edited pages.
 */
export async function searchWithFilters(
  parsed: ParsedSearch,
  { search, pagesById, now = new Date() }: Deps,
): Promise<SearchResult[]> {
  let results: SearchResult[];

  if (parsed.text) {
    results = await search(parsed.text);
    if (parsed.scopes.length > 0) {
      const scopes: string[] = parsed.scopes;
      results = results.filter((result) => scopes.includes(result.matchType));
    }
  } else if (hasFilters(parsed)) {
    // A scope like in:title means nothing without text to look for.
    results = Object.values(pagesById)
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .map((page) => ({
        page: { id: page.id, title: page.title, icon: page.icon },
        matchType: "title" as const,
      }));
  } else {
    return [];
  }

  if (parsed.updated) {
    const since = updatedSince(parsed.updated, now);
    results = results.filter((result) => {
      const page = pagesById[result.page.id];
      return page !== undefined && Date.parse(page.updatedAt) >= since;
    });
  }
  return results.slice(0, MAX_RESULTS);
}
