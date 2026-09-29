import { beforeEach, describe, expect, it } from "vitest";

import { ApiError } from "@/api/client";
import { mockDb } from "@/api/_mockDb";
import * as blocksApi from "@/api/blocks";
import * as pagesApi from "@/api/pages";

// A workspace id distinct from "default" so these tests are fully isolated
// from the app's built-in demo content, which auto-seeds the first time
// localStorage is read.
const WS = "test-workspace";

beforeEach(() => {});

describe("createPage", () => {
  it("creates a page with the given title", async () => {
    const page = await pagesApi.createPage({ workspaceId: WS, parentId: null, title: "Notes" });
    expect(page.title).toBe("Notes");
    expect(page.workspaceId).toBe(WS);
    expect(page.parentId).toBeNull();
    expect(page.isFavorite).toBe(false);
  });

  it("defaults to 'Untitled' when no title is given", async () => {
    const page = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    expect(page.title).toBe("Untitled");
  });

  it("defaults to 'Untitled' when given only whitespace", async () => {
    const page = await pagesApi.createPage({ workspaceId: WS, parentId: null, title: "   " });
    expect(page.title).toBe("Untitled");
  });

  it("assigns increasing order among siblings", async () => {
    const first = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const second = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    expect(second.order).toBe(first.order + 1);
  });

  it("orders children independently per parent", async () => {
    const parentA = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const parentB = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const childOfA = await pagesApi.createPage({ workspaceId: WS, parentId: parentA.id });
    const childOfB = await pagesApi.createPage({ workspaceId: WS, parentId: parentB.id });
    expect(childOfA.order).toBe(0);
    expect(childOfB.order).toBe(0);
  });

  it("persists the page so a subsequent listPages sees it", async () => {
    const created = await pagesApi.createPage({ workspaceId: WS, parentId: null, title: "X" });
    const pages = await pagesApi.listPages(WS);
    expect(pages.map((p) => p.id)).toContain(created.id);
  });
});

describe("listPages", () => {
  it("only returns pages for the requested workspace", async () => {
    await pagesApi.createPage({ workspaceId: WS, parentId: null, title: "Mine" });
    await pagesApi.createPage({
      workspaceId: "other-workspace",
      parentId: null,
      title: "Theirs",
    });

    const pages = await pagesApi.listPages(WS);
    expect(pages).toHaveLength(1);
    expect(pages[0].title).toBe("Mine");
  });
});

describe("renamePage", () => {
  it("updates the title and updatedAt", async () => {
    const page = await pagesApi.createPage({ workspaceId: WS, parentId: null, title: "Old" });
    const renamed = await pagesApi.renamePage(page.id, "New");
    expect(renamed.title).toBe("New");
    expect(renamed.id).toBe(page.id);
  });

  it("falls back to 'Untitled' for a blank title", async () => {
    const page = await pagesApi.createPage({ workspaceId: WS, parentId: null, title: "Old" });
    const renamed = await pagesApi.renamePage(page.id, "   ");
    expect(renamed.title).toBe("Untitled");
  });

  it("throws an ApiError for an unknown page id", async () => {
    await expect(pagesApi.renamePage("nope", "New")).rejects.toBeInstanceOf(ApiError);
  });

  it(
    "propagates a rename to every wikilink chip pointing at this page " +
      "(regression: a chip's title is a snapshot taken at insertion time, " +
      "not a live lookup — the link itself still navigated correctly by id " +
      "after a rename, but every chip kept showing the old title forever)",
    async () => {
      const target = await pagesApi.createPage({
        workspaceId: WS,
        parentId: null,
        title: "Old title",
      });
      const source = await pagesApi.createPage({ workspaceId: WS, parentId: null });

      const db = mockDb.read();
      db.blocks["block-1"] = {
        id: "block-1",
        pageId: source.id,
        parentBlockId: null,
        type: "paragraph",
        content: {
          html: `<p>See <span data-page-link data-page-id="${target.id}" class="page-link-chip">↗ Old title</span></p>`,
        },
        order: 0,
      };
      db.links["link-1"] = {
        id: "link-1",
        sourcePageId: source.id,
        targetPageId: target.id,
        sourceBlockId: "block-1",
      };
      mockDb.write(db);

      await pagesApi.renamePage(target.id, "New title");

      const html = mockDb.read().blocks["block-1"].content.html;
      expect(html).toContain("↗ New title");
      expect(html).not.toContain("Old title");
    },
  );

  it("leaves blocks with no link to the renamed page untouched", async () => {
    const target = await pagesApi.createPage({
      workspaceId: WS,
      parentId: null,
      title: "Old title",
    });
    const unrelatedPage = await pagesApi.createPage({ workspaceId: WS, parentId: null });

    const db = mockDb.read();
    const unrelatedHtml = "<p>Nothing to do with the renamed page.</p>";
    db.blocks["block-2"] = {
      id: "block-2",
      pageId: unrelatedPage.id,
      parentBlockId: null,
      type: "paragraph",
      content: { html: unrelatedHtml },
      order: 0,
    };
    mockDb.write(db);

    await pagesApi.renamePage(target.id, "New title");

    expect(mockDb.read().blocks["block-2"].content.html).toBe(unrelatedHtml);
  });
});

describe("setFavorite", () => {
  it("toggles isFavorite", async () => {
    const page = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const favorited = await pagesApi.setFavorite(page.id, true);
    expect(favorited.isFavorite).toBe(true);
    const unfavorited = await pagesApi.setFavorite(page.id, false);
    expect(unfavorited.isFavorite).toBe(false);
  });
});

describe("movePage", () => {
  it("reorders a page among its existing siblings", async () => {
    const a = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const b = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const c = await pagesApi.createPage({ workspaceId: WS, parentId: null });

    await pagesApi.movePage(a.id, null, 2);

    const pages = (await pagesApi.listPages(WS)).sort((x, y) => x.order - y.order);
    expect(pages.map((p) => p.id)).toEqual([b.id, c.id, a.id]);
  });

  it("re-parents a page under a different page", async () => {
    const oldParent = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const newParent = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const child = await pagesApi.createPage({ workspaceId: WS, parentId: oldParent.id });

    await pagesApi.movePage(child.id, newParent.id, 0);

    const pages = await pagesApi.listPages(WS);
    expect(pages.find((p) => p.id === child.id)?.parentId).toBe(newParent.id);
  });

  it("renumbers the old parent's remaining siblings after re-parenting away", async () => {
    const parent = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const first = await pagesApi.createPage({ workspaceId: WS, parentId: parent.id });
    const second = await pagesApi.createPage({ workspaceId: WS, parentId: parent.id });
    const otherParent = await pagesApi.createPage({ workspaceId: WS, parentId: null });

    await pagesApi.movePage(first.id, otherParent.id, 0);

    const pages = await pagesApi.listPages(WS);
    expect(pages.find((p) => p.id === second.id)?.order).toBe(0);
  });

  it("moving to top level sets parentId to null", async () => {
    const parent = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const child = await pagesApi.createPage({ workspaceId: WS, parentId: parent.id });

    await pagesApi.movePage(child.id, null, 0);

    const pages = await pagesApi.listPages(WS);
    expect(pages.find((p) => p.id === child.id)?.parentId).toBeNull();
  });

  it("rejects moving a page inside itself", async () => {
    const page = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    await expect(pagesApi.movePage(page.id, page.id, 0)).rejects.toBeInstanceOf(ApiError);
  });

  it("rejects moving a page inside one of its own descendants", async () => {
    const root = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const child = await pagesApi.createPage({ workspaceId: WS, parentId: root.id });
    const grandchild = await pagesApi.createPage({ workspaceId: WS, parentId: child.id });

    await expect(pagesApi.movePage(root.id, grandchild.id, 0)).rejects.toBeInstanceOf(ApiError);
  });

  it("throws an ApiError for an unknown page id", async () => {
    await expect(pagesApi.movePage("nope", null, 0)).rejects.toBeInstanceOf(ApiError);
  });
});

describe("duplicatePage", () => {
  it("creates a copy with '(copy)' appended to the title", async () => {
    const source = await pagesApi.createPage({
      workspaceId: WS,
      parentId: null,
      title: "Notes",
    });
    const copy = await pagesApi.duplicatePage(source.id);
    expect(copy.id).not.toBe(source.id);
    expect(copy.title).toBe("Notes (copy)");
    expect(copy.parentId).toBe(source.parentId);
  });

  it("copies the page's own blocks, including nested ones, with remapped ids", async () => {
    const source = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const toggle = await blocksApi.createBlock({
      pageId: source.id,
      type: "toggle",
      content: { html: "Details" },
    });
    await blocksApi.createBlock({
      pageId: source.id,
      type: "paragraph",
      content: { html: "child" },
      parentBlockId: toggle.id,
    });

    const copy = await pagesApi.duplicatePage(source.id);
    const copiedBlocks = await blocksApi.listBlocks(copy.id);

    expect(copiedBlocks).toHaveLength(2);
    const copiedToggle = copiedBlocks.find((b) => b.type === "toggle");
    const copiedChild = copiedBlocks.find((b) => b.type === "paragraph");
    expect(copiedToggle?.id).not.toBe(toggle.id);
    expect(copiedChild?.parentBlockId).toBe(copiedToggle?.id);
  });

  it("does not copy sub-pages", async () => {
    const parent = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    await pagesApi.createPage({ workspaceId: WS, parentId: parent.id });

    await pagesApi.duplicatePage(parent.id);

    const pages = await pagesApi.listPages(WS);
    // Original parent + original child + the one duplicate = 3, not 4.
    expect(pages).toHaveLength(3);
  });

  it("throws an ApiError for an unknown page id", async () => {
    await expect(pagesApi.duplicatePage("nope")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("deletePage", () => {
  it("removes the page itself", async () => {
    const page = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    await pagesApi.deletePage(page.id);
    const pages = await pagesApi.listPages(WS);
    expect(pages.map((p) => p.id)).not.toContain(page.id);
  });

  it("cascades to descendant pages at any depth", async () => {
    const root = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const child = await pagesApi.createPage({ workspaceId: WS, parentId: root.id });
    const grandchild = await pagesApi.createPage({ workspaceId: WS, parentId: child.id });

    const removedIds = await pagesApi.deletePage(root.id);
    expect(new Set(removedIds)).toEqual(new Set([root.id, child.id, grandchild.id]));

    const remaining = await pagesApi.listPages(WS);
    expect(remaining).toHaveLength(0);
  });

  it("does not remove unrelated pages", async () => {
    const root = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const unrelated = await pagesApi.createPage({ workspaceId: WS, parentId: null });

    await pagesApi.deletePage(root.id);
    const remaining = await pagesApi.listPages(WS);
    expect(remaining.map((p) => p.id)).toEqual([unrelated.id]);
  });

  it("keeps the page's blocks, so a trashed page can be restored intact", async () => {
    const page = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const db = mockDb.read();
    db.blocks["block-1"] = {
      id: "block-1",
      pageId: page.id,
      parentBlockId: null,
      type: "paragraph",
      content: { html: "hi" },
      order: 0,
    };
    mockDb.write(db);

    await pagesApi.deletePage(page.id);
    expect(mockDb.read().blocks["block-1"]).toBeDefined();
  });

  it("keeps links touching a trashed page, either direction", async () => {
    const a = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const b = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const db = mockDb.read();
    db.links["link-1"] = {
      id: "link-1",
      sourcePageId: a.id,
      targetPageId: b.id,
      sourceBlockId: "block-x",
    };
    mockDb.write(db);

    await pagesApi.deletePage(a.id);
    expect(mockDb.read().links["link-1"]).toBeDefined();
  });

  it("throws an ApiError for an unknown page id", async () => {
    await expect(pagesApi.deletePage("nope")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("trash", () => {
  it("hides a trashed page from listPages without destroying it", async () => {
    const page = await pagesApi.createPage({ workspaceId: WS, parentId: null, title: "Draft" });

    await pagesApi.deletePage(page.id);

    expect((await pagesApi.listPages(WS)).map((p) => p.id)).not.toContain(page.id);
    expect(mockDb.read().pages[page.id]?.deletedAt).toBeDefined();
  });

  it("trashes a whole sub-tree, stamping one shared deletedAt on it", async () => {
    const root = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const child = await pagesApi.createPage({ workspaceId: WS, parentId: root.id });
    const grandchild = await pagesApi.createPage({ workspaceId: WS, parentId: child.id });

    const trashed = await pagesApi.deletePage(root.id);

    expect(new Set(trashed)).toEqual(new Set([root.id, child.id, grandchild.id]));
    const stamps = [root.id, child.id, grandchild.id].map(
      (id) => mockDb.read().pages[id].deletedAt,
    );
    expect(new Set(stamps).size).toBe(1);
    expect(stamps[0]).toBeDefined();
  });

  it("lists only the root of a trashed sub-tree, so a folder is one row", async () => {
    const root = await pagesApi.createPage({
      workspaceId: WS,
      parentId: null,
      title: "Folder",
    });
    await pagesApi.createPage({ workspaceId: WS, parentId: root.id, title: "Inner" });
    const standalone = await pagesApi.createPage({
      workspaceId: WS,
      parentId: null,
      title: "Loose",
    });

    await pagesApi.deletePage(root.id);
    await pagesApi.deletePage(standalone.id);

    const listed = await pagesApi.listTrashedPages(WS);
    expect(listed.map((p) => p.id).sort()).toEqual([root.id, standalone.id].sort());
  });

  it("restores a trashed sub-tree whole, returning every restored page", async () => {
    const root = await pagesApi.createPage({
      workspaceId: WS,
      parentId: null,
      title: "Folder",
    });
    const child = await pagesApi.createPage({
      workspaceId: WS,
      parentId: root.id,
      title: "Inner",
    });

    await pagesApi.deletePage(root.id);
    const restored = await pagesApi.restorePage(root.id);

    expect(new Set(restored.map((p) => p.id))).toEqual(new Set([root.id, child.id]));
    expect(restored.every((p) => !("deletedAt" in p))).toBe(true);
    expect((await pagesApi.listPages(WS)).map((p) => p.id).sort()).toEqual(
      [root.id, child.id].sort(),
    );
  });

  it("permanently deletes a trashed sub-tree along with its blocks and links", async () => {
    const a = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const b = await pagesApi.createPage({ workspaceId: WS, parentId: null });
    const db = mockDb.read();
    db.blocks["block-1"] = {
      id: "block-1",
      pageId: a.id,
      parentBlockId: null,
      type: "paragraph",
      content: { html: "hi" },
      order: 0,
    };
    db.links["link-1"] = {
      id: "link-1",
      sourcePageId: a.id,
      targetPageId: b.id,
      sourceBlockId: "block-1",
    };
    mockDb.write(db);

    await pagesApi.deletePage(a.id);
    await pagesApi.permanentlyDeletePage(a.id);

    const after = mockDb.read();
    expect(after.pages[a.id]).toBeUndefined();
    expect(after.blocks["block-1"]).toBeUndefined();
    expect(after.links["link-1"]).toBeUndefined();
  });

  it("empties the trash for good, leaving live pages alone", async () => {
    const trashed = await pagesApi.createPage({
      workspaceId: WS,
      parentId: null,
      title: "Gone",
    });
    const live = await pagesApi.createPage({ workspaceId: WS, parentId: null, title: "Kept" });

    await pagesApi.deletePage(trashed.id);
    await pagesApi.emptyTrash(WS);

    const db = mockDb.read();
    expect(db.pages[trashed.id]).toBeUndefined();
    expect(db.pages[live.id]).toBeDefined();
    expect(await pagesApi.listTrashedPages(WS)).toEqual([]);
  });
});

describe("getPageDeletionSnapshot / restorePagesFromSnapshot", () => {
  it("restores a deleted page (and a deleted descendant) with the same ids, undoing deletePage", async () => {
    const parent = await pagesApi.createPage({
      workspaceId: WS,
      parentId: null,
      title: "Parent",
    });
    const child = await pagesApi.createPage({
      workspaceId: WS,
      parentId: parent.id,
      title: "Child",
    });

    const snapshot = await pagesApi.getPageDeletionSnapshot(parent.id);
    await pagesApi.deletePage(parent.id);
    expect(await pagesApi.listPages(WS)).toHaveLength(0);

    await pagesApi.restorePagesFromSnapshot(snapshot);
    const restored = await pagesApi.listPages(WS);
    expect(restored.map((p) => p.id).sort()).toEqual([child.id, parent.id].sort());
    expect(restored.find((p) => p.id === child.id)?.parentId).toBe(parent.id);
  });
});
