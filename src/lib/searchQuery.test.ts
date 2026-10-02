import { describe, expect, it } from "vitest";

import { hasFilters, parseSearchQuery, updatedSince } from "./searchQuery";

describe("parseSearchQuery", () => {
  it("leaves a plain query untouched", () => {
    expect(parseSearchQuery("weekly  planner")).toEqual({
      text: "weekly planner",
      scopes: [],
      updated: null,
    });
  });

  it("takes scope and date filters out of the text, wherever they sit", () => {
    const parsed = parseSearchQuery("in:title roadmap updated:week");
    expect(parsed).toEqual({
      text: "roadmap",
      scopes: ["title"],
      updated: { kind: "days", days: 7 },
    });
  });

  it("accepts several scopes without duplicates, and 'tags' as 'tag'", () => {
    expect(parseSearchQuery("x in:tags in:content in:tag").scopes).toEqual(["tag", "content"]);
  });

  it("understands today, month, and Nd windows, and the last one wins", () => {
    expect(parseSearchQuery("updated:today").updated).toEqual({ kind: "today" });
    expect(parseSearchQuery("updated:month").updated).toEqual({ kind: "days", days: 30 });
    expect(parseSearchQuery("updated:3d updated:14d").updated).toEqual({
      kind: "days",
      days: 14,
    });
  });

  it("is case-insensitive about the filter words", () => {
    const parsed = parseSearchQuery("IN:Title UPDATED:Week notes");
    expect(parsed.scopes).toEqual(["title"]);
    expect(parsed.updated).toEqual({ kind: "days", days: 7 });
  });

  it("keeps unrecognised filters as ordinary search text", () => {
    expect(parseSearchQuery("in:foo updated:soon updated:0d").text).toBe(
      "in:foo updated:soon updated:0d",
    );
  });

  it("reports whether any filter is active", () => {
    expect(hasFilters(parseSearchQuery("hello"))).toBe(false);
    expect(hasFilters(parseSearchQuery("hello in:title"))).toBe(true);
    expect(hasFilters(parseSearchQuery("updated:today"))).toBe(true);
  });
});

describe("updatedSince", () => {
  const now = new Date(2026, 8, 30, 15, 45); // 30 Sep 2026, local time

  it("starts today at local midnight", () => {
    expect(updatedSince({ kind: "today" }, now)).toBe(new Date(2026, 8, 30).getTime());
  });

  it("counts back whole days from now", () => {
    expect(updatedSince({ kind: "days", days: 7 }, now)).toBe(
      now.getTime() - 7 * 24 * 60 * 60 * 1000,
    );
  });
});
