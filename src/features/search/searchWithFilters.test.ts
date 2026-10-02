import { describe, expect, it, vi } from "vitest";

import { searchWithFilters } from "./searchWithFilters";
import type { SearchResult } from "@/api/search";
import { parseSearchQuery } from "@/lib/searchQuery";
import type { Page } from "@/types/entities";

const NOW = new Date("2026-09-30T12:00:00Z");

function page(id: string, title: string, updatedAt: string): Page {
  return { id, title, icon: "📄", updatedAt } as unknown as Page;
}

const pagesById: Record<string, Page> = {
  a: page("a", "Roadmap", "2026-09-30T08:00:00Z"),
  b: page("b", "Notes", "2026-09-20T08:00:00Z"),
  c: page("c", "Archive", "2026-06-01T08:00:00Z"),
};

function hit(id: string, matchType: SearchResult["matchType"]): SearchResult {
  const { title } = pagesById[id];
  return { page: { id, title, icon: "📄" }, matchType };
}

describe("searchWithFilters", () => {
  const search = vi.fn(async () => [hit("a", "title"), hit("b", "content"), hit("c", "tag")]);

  it("returns nothing when there is neither text nor a filter", async () => {
    expect(
      await searchWithFilters(parseSearchQuery("  "), { search, pagesById, now: NOW }),
    ).toEqual([]);
  });

  it("passes only the text (not the filter words) to the search", async () => {
    await searchWithFilters(parseSearchQuery("plan in:title"), { search, pagesById, now: NOW });
    expect(search).toHaveBeenLastCalledWith("plan");
  });

  it("keeps only the requested kinds of match", async () => {
    const results = await searchWithFilters(parseSearchQuery("x in:content in:tag"), {
      search,
      pagesById,
      now: NOW,
    });
    expect(results.map((r) => r.page.id)).toEqual(["b", "c"]);
  });

  it("drops pages that weren't updated inside the window", async () => {
    const results = await searchWithFilters(parseSearchQuery("x updated:week"), {
      search,
      pagesById,
      now: NOW,
    });
    expect(results.map((r) => r.page.id)).toEqual(["a"]);
  });

  it("lists recently edited pages, newest first, when only a date filter is given", async () => {
    const results = await searchWithFilters(parseSearchQuery("updated:month"), {
      search,
      pagesById,
      now: NOW,
    });
    expect(results.map((r) => r.page.id)).toEqual(["a", "b"]);
  });

  it("drops results whose page isn't loaded, since its date can't be checked", async () => {
    const results = await searchWithFilters(parseSearchQuery("x updated:month"), {
      search: async () => [
        hit("a", "title"),
        { ...hit("a", "title"), page: { id: "zz", title: "?", icon: "📄" } },
      ],
      pagesById,
      now: NOW,
    });
    expect(results.map((r) => r.page.id)).toEqual(["a"]);
  });
});
