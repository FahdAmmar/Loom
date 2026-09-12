import { describe, expect, it } from "vitest";

import { mockDb } from "@/api/_mockDb";
import type { MockDb } from "@/api/_mockDb";
import * as linksApi from "@/api/links";
import { makeBlock, makePage } from "@/test/fixtures";

/** Replaces the entire mock db with a minimal, isolated one — getUnlinkedMentions
 * and search scan the whole workspace by design (this app is single-workspace),
 * so tests need a clean slate rather than the auto-seeded demo content. */
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

describe("getUnlinkedMentions", () => {
  it("finds a page whose block text mentions the target title in plain text", async () => {
    const target = makePage({ id: "page-target", title: "Getting Started" });
    const mentioner = makePage({ id: "page-mentioner", title: "Journal" });
    seed(
      [target, mentioner],
      [
        makeBlock(
          "paragraph",
          { html: "Check the Getting Started guide first." },
          { pageId: mentioner.id },
        ),
      ],
    );

    const mentions = await linksApi.getUnlinkedMentions(target.id);

    expect(mentions).toHaveLength(1);
    expect(mentions[0].sourcePage.id).toBe(mentioner.id);
    expect(mentions[0].snippet).toContain("Getting Started");
  });

  it("excludes a page that already links to the target, even if it also mentions it in plain text", async () => {
    const target = makePage({ id: "page-target", title: "Getting Started" });
    const mentioner = makePage({ id: "page-mentioner", title: "Journal" });
    const block = makeBlock(
      "paragraph",
      { html: "Also see Getting Started again here." },
      { pageId: mentioner.id },
    );
    seed([target, mentioner], [block]);

    const db = mockDb.read();
    db.links["link-1"] = {
      id: "link-1",
      sourcePageId: mentioner.id,
      targetPageId: target.id,
      sourceBlockId: block.id,
    };
    mockDb.write(db);

    const mentions = await linksApi.getUnlinkedMentions(target.id);
    expect(mentions).toEqual([]);
  });

  it("ignores titles shorter than the minimum mentionable length", async () => {
    const target = makePage({ id: "page-target", title: "Q1" });
    const mentioner = makePage({ id: "page-mentioner", title: "Journal" });
    seed(
      [target, mentioner],
      [makeBlock("paragraph", { html: "Q1 numbers are in." }, { pageId: mentioner.id })],
    );

    expect(await linksApi.getUnlinkedMentions(target.id)).toEqual([]);
  });

  it("returns nothing for a page with no mentions anywhere", async () => {
    const target = makePage({ id: "page-target", title: "Roadmap" });
    seed([target], []);
    expect(await linksApi.getUnlinkedMentions(target.id)).toEqual([]);
  });
});

describe("linkifyMention", () => {
  it("converts a plain-text mention into a real wikilink and creates a Link record", async () => {
    const target = makePage({ id: "page-target", title: "Getting Started" });
    const mentioner = makePage({ id: "page-mentioner", title: "Journal" });
    const block = makeBlock(
      "paragraph",
      { html: "Check the Getting Started guide first." },
      { pageId: mentioner.id },
    );
    seed([target, mentioner], [block]);

    await linksApi.linkifyMention(block.id, target.id);

    const updatedBlock = mockDb.read().blocks[block.id];
    expect(updatedBlock.content.html).toContain(`data-page-id="${target.id}"`);

    const backlinks = await linksApi.getBacklinks(target.id);
    expect(backlinks).toHaveLength(1);
    expect(backlinks[0].sourcePage.id).toBe(mentioner.id);

    // it's no longer an unlinked mention now that a real link exists
    expect(await linksApi.getUnlinkedMentions(target.id)).toEqual([]);
  });

  it("does nothing when the block no longer contains the mention", async () => {
    const target = makePage({ id: "page-target", title: "Getting Started" });
    const block = makeBlock(
      "paragraph",
      { html: "Unrelated content." },
      { pageId: "page-mentioner" },
    );
    seed([target, makePage({ id: "page-mentioner" })], [block]);

    await linksApi.linkifyMention(block.id, target.id);

    expect(mockDb.read().blocks[block.id].content.html).toBe("Unrelated content.");
    expect(await linksApi.getBacklinks(target.id)).toEqual([]);
  });
});
