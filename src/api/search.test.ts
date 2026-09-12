import { describe, expect, it } from "vitest";

import { mockDb } from "@/api/_mockDb";
import type { MockDb } from "@/api/_mockDb";
import { search } from "@/api/search";
import { makeBlock, makePage } from "@/test/fixtures";

/** Replaces the entire mock db with a minimal, isolated one — search scans
 * the whole workspace by design (this app is single-workspace), so tests
 * need a clean slate rather than the auto-seeded demo content. */
function seed(
  pages: ReturnType<typeof makePage>[],
  blocks: ReturnType<typeof makeBlock>[] = [],
) {
  const db: MockDb = {
    workspaces: {},
    pages: {},
    blocks: {},
    links: {},
    tags: {},
    pageTags: {},
    pageProperties: {},
    templates: {},
    pageVersions: {},
  };
  for (const page of pages) db.pages[page.id] = page;
  for (const block of blocks) db.blocks[block.id] = block;
  mockDb.write(db);
}

describe("search", () => {
  it("returns nothing for an empty or whitespace-only query", async () => {
    seed([makePage({ title: "Roadmap" })]);
    expect(await search("")).toEqual([]);
    expect(await search("   ")).toEqual([]);
  });

  it("finds an exact title match", async () => {
    const page = makePage({ title: "Weekly Planner" });
    seed([page]);

    const results = await search("Weekly Planner");
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ matchType: "title", page: { id: page.id } });
  });

  it("tolerates a typo in the title (fuzzy matching)", async () => {
    const page = makePage({ title: "Getting Started" });
    seed([page]);

    const results = await search("Geting Started"); // one typo
    expect(results.some((r) => r.page.id === page.id)).toBe(true);
  });

  it("falls back to a content match with a snippet when the title doesn't match", async () => {
    const page = makePage({ title: "Journal" });
    seed(
      [page],
      [
        makeBlock(
          "paragraph",
          { html: "Remember to water the plants today." },
          { pageId: page.id },
        ),
      ],
    );

    const results = await search("water the plants");
    expect(results).toHaveLength(1);
    expect(results[0].matchType).toBe("content");
    expect(results[0].snippet).toContain("water the plants");
  });

  it("prefers a title match over a content match on a different page", async () => {
    const titlePage = makePage({ title: "Bug Tracker" });
    const contentPage = makePage({ title: "Notes" });
    seed(
      [titlePage, contentPage],
      [
        makeBlock(
          "paragraph",
          { html: "See the Bug Tracker for open issues." },
          { pageId: contentPage.id },
        ),
      ],
    );

    const results = await search("Bug Tracker");
    expect(results[0]).toMatchObject({ matchType: "title", page: { id: titlePage.id } });
  });

  it("returns at most one result per page", async () => {
    const page = makePage({ title: "Journal" });
    seed(
      [page],
      [
        makeBlock(
          "paragraph",
          { html: "First mention of coffee." },
          { pageId: page.id, order: 0 },
        ),
        makeBlock(
          "paragraph",
          { html: "Second mention of coffee." },
          { pageId: page.id, order: 1 },
        ),
      ],
    );

    const results = await search("coffee");
    expect(results).toHaveLength(1);
  });

  it("finds no results for a completely unrelated query", async () => {
    seed([makePage({ title: "Roadmap" })]);
    expect(await search("xyzzy nonexistent query")).toEqual([]);
  });
});
