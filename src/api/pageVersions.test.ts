import { describe, expect, it } from "vitest";

import { mockDb } from "@/api/_mockDb";
import type { MockDb } from "@/api/_mockDb";
import { ApiError } from "@/api/client";
import * as linksApi from "@/api/links";
import * as versionsApi from "@/api/pageVersions";
import { makeBlock, makePage } from "@/test/fixtures";
import type { PageVersion } from "@/types/entities";

/** Replaces the entire mock db with a minimal, isolated one, mirroring the
 * pattern already used in links.test.ts / search.test.ts. */
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

describe("saveVersion", () => {
  it("snapshots every block currently on the page", async () => {
    const page = makePage({ id: "page-1" });
    const blocks = [
      makeBlock("paragraph", { html: "First" }, { pageId: page.id, order: 0 }),
      makeBlock("paragraph", { html: "Second" }, { pageId: page.id, order: 1 }),
    ];
    seed([page], blocks);

    const version = await versionsApi.saveVersion(page.id);

    expect(version.pageId).toBe(page.id);
    expect(version.blocks).toHaveLength(2);
    expect(version.blocks.map((b) => b.content.html).sort()).toEqual(["First", "Second"]);
  });

  it("stores a true copy — later mutating the live block doesn't change the saved version", async () => {
    const page = makePage({ id: "page-1" });
    const block = makeBlock("paragraph", { html: "Original" }, { pageId: page.id });
    seed([page], [block]);

    const version = await versionsApi.saveVersion(page.id);

    const db = mockDb.read();
    db.blocks[block.id] = { ...db.blocks[block.id], content: { html: "Changed after saving" } };
    mockDb.write(db);

    expect(version.blocks[0].content.html).toBe("Original");
  });

  it("keeps only the most recent 20 versions per page, dropping the oldest first", async () => {
    const page = makePage({ id: "page-1" });
    seed([page], []);

    const db = mockDb.read();
    for (let i = 0; i < 20; i++) {
      const stale: PageVersion = {
        id: `version-old-${i}`,
        pageId: page.id,
        createdAt: new Date(2020, 0, i + 1).toISOString(), // deliberately far in the past
        blocks: [],
      };
      db.pageVersions[stale.id] = stale;
    }
    mockDb.write(db);

    await versionsApi.saveVersion(page.id); // the 21st version for this page

    const remaining = await versionsApi.listVersions(page.id);
    expect(remaining).toHaveLength(20);
    expect(remaining.some((v) => v.id === "version-old-0")).toBe(false); // the very oldest was dropped
  });
});

describe("listVersions", () => {
  it("returns versions newest first", async () => {
    const page = makePage({ id: "page-1" });
    seed([page], []);
    const db = mockDb.read();
    db.pageVersions["version-older"] = {
      id: "version-older",
      pageId: page.id,
      createdAt: new Date(2026, 0, 1).toISOString(),
      blocks: [],
    };
    db.pageVersions["version-newer"] = {
      id: "version-newer",
      pageId: page.id,
      createdAt: new Date(2026, 5, 1).toISOString(),
      blocks: [],
    };
    mockDb.write(db);

    const versions = await versionsApi.listVersions(page.id);
    expect(versions.map((v) => v.id)).toEqual(["version-newer", "version-older"]);
  });
});

describe("restoreVersion", () => {
  it("replaces the page's current blocks with the version's", async () => {
    const page = makePage({ id: "page-1" });
    const oldBlock = makeBlock("paragraph", { html: "Old content" }, { pageId: page.id });
    seed([page], [oldBlock]);
    const version = await versionsApi.saveVersion(page.id);

    // Simulate edits made after the snapshot: change the old block and add a new one.
    const db = mockDb.read();
    db.blocks[oldBlock.id] = { ...db.blocks[oldBlock.id], content: { html: "Edited" } };
    const newerBlock = makeBlock(
      "paragraph",
      { html: "Added later" },
      { pageId: page.id, order: 1 },
    );
    db.blocks[newerBlock.id] = newerBlock;
    mockDb.write(db);

    await versionsApi.restoreVersion(version.id);

    const currentBlocks = Object.values(mockDb.read().blocks).filter(
      (b) => b.pageId === page.id,
    );
    expect(currentBlocks).toHaveLength(1);
    expect(currentBlocks[0].content.html).toBe("Old content");
  });

  it("saves a safety snapshot of the pre-restore state before overwriting", async () => {
    const page = makePage({ id: "page-1" });
    const block = makeBlock("paragraph", { html: "Version A" }, { pageId: page.id });
    seed([page], [block]);
    const versionA = await versionsApi.saveVersion(page.id);

    const db = mockDb.read();
    db.blocks[block.id] = { ...db.blocks[block.id], content: { html: "Version B" } };
    mockDb.write(db);

    await versionsApi.restoreVersion(versionA.id);

    const allVersions = await versionsApi.listVersions(page.id);
    const safetySnapshot = allVersions.find(
      (v) => v.label === "Before restoring an older version",
    );
    expect(safetySnapshot?.blocks[0].content.html).toBe("Version B");
  });

  it("re-syncs links for a restored block instead of leaving them stale", async () => {
    const target = makePage({ id: "page-target", title: "Target" });
    const source = makePage({ id: "page-source" });
    const block = makeBlock(
      "paragraph",
      { html: `<span data-page-link="" data-page-id="${target.id}">↗ Target</span>` },
      { pageId: source.id },
    );
    seed([target, source], [block]);
    const version = await versionsApi.saveVersion(source.id);

    // Delete the block entirely (as if the user removed it) — this also
    // cleans up its Link record, same as the live editor would.
    const db = mockDb.read();
    delete db.blocks[block.id];
    for (const link of Object.values(db.links)) {
      if (link.sourceBlockId === block.id) delete db.links[link.id];
    }
    mockDb.write(db);
    expect(await linksApi.getBacklinks(target.id)).toEqual([]);

    await versionsApi.restoreVersion(version.id);

    const backlinks = await linksApi.getBacklinks(target.id);
    expect(backlinks).toHaveLength(1);
    expect(backlinks[0].sourcePage.id).toBe(source.id);
  });

  it("throws for a version id that doesn't exist", async () => {
    seed([makePage({ id: "page-1" })], []);
    await expect(versionsApi.restoreVersion("nonexistent")).rejects.toThrow(ApiError);
  });
});
