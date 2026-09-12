import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/client";
import * as blocksApi from "@/api/blocks";

const PAGE_ID = "test-page";

describe("createBlock", () => {
  it("appends a block at order 0 on an empty page", async () => {
    const block = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "paragraph",
      content: { html: "hi" },
    });
    expect(block.order).toBe(0);
    expect(block.parentBlockId).toBeNull();
  });

  it("appends subsequent blocks at the end by default", async () => {
    const first = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "paragraph",
      content: { html: "1" },
    });
    const second = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "paragraph",
      content: { html: "2" },
    });
    expect(second.order).toBe(first.order + 1);
  });

  it("inserts after a specific block and bumps later siblings", async () => {
    const a = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "paragraph",
      content: { html: "a" },
    });
    const b = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "paragraph",
      content: { html: "b" },
    });
    const inserted = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "paragraph",
      content: { html: "inserted" },
      afterBlockId: a.id,
    });

    const blocks = await blocksApi.listBlocks(PAGE_ID);
    const ordered = [...blocks].sort((x, y) => x.order - y.order);
    expect(ordered.map((x) => x.content.html)).toEqual(["a", "inserted", "b"]);
    expect(ordered.find((x) => x.id === b.id)?.order).toBeGreaterThan(inserted.order);
  });

  it("keeps a nested block's siblings scoped to its own parentBlockId", async () => {
    const toggle = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "toggle",
      content: { html: "Toggle" },
    });
    const child = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "bulletList",
      content: { html: "child" },
      parentBlockId: toggle.id,
    });
    expect(child.order).toBe(0);
    expect(child.parentBlockId).toBe(toggle.id);
  });
});

describe("updateBlock", () => {
  it("patches content without touching type", async () => {
    const block = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "paragraph",
      content: { html: "old" },
    });
    const updated = await blocksApi.updateBlock(block.id, { content: { html: "new" } });
    expect(updated.content.html).toBe("new");
    expect(updated.type).toBe("paragraph");
  });

  it("changes type and content together (slash-command conversion)", async () => {
    const block = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "paragraph",
      content: { html: "/table" },
    });
    const updated = await blocksApi.updateBlock(block.id, {
      type: "table",
      content: { rows: [["", ""]] },
    });
    expect(updated.type).toBe("table");
    expect(updated.content.rows).toEqual([["", ""]]);
  });

  it("throws an ApiError for an unknown block id", async () => {
    await expect(
      blocksApi.updateBlock("nope", { content: { html: "x" } }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe("deleteBlock", () => {
  it("removes the block", async () => {
    const block = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "paragraph",
      content: { html: "x" },
    });
    await blocksApi.deleteBlock(block.id);
    const blocks = await blocksApi.listBlocks(PAGE_ID);
    expect(blocks.map((b) => b.id)).not.toContain(block.id);
  });

  it("cascades to a toggle's nested children", async () => {
    const toggle = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "toggle",
      content: { html: "Toggle" },
    });
    const child = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "bulletList",
      content: { html: "child" },
      parentBlockId: toggle.id,
    });

    const removedIds = await blocksApi.deleteBlock(toggle.id);
    expect(new Set(removedIds)).toEqual(new Set([toggle.id, child.id]));

    const remaining = await blocksApi.listBlocks(PAGE_ID);
    expect(remaining).toHaveLength(0);
  });

  it("throws an ApiError for an unknown block id", async () => {
    await expect(blocksApi.deleteBlock("nope")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("reorderBlock", () => {
  async function fourBlocks() {
    const created = await Promise.all(
      ["a", "b", "c", "d"].map((html) =>
        blocksApi.createBlock({ pageId: PAGE_ID, type: "paragraph", content: { html } }),
      ),
    );
    return created.map((b) => b.id);
  }

  it("moves a block forward across multiple positions in one call", async () => {
    const [a] = await fourBlocks();
    await blocksApi.reorderBlock(a, 2);
    const blocks = await blocksApi.listBlocks(PAGE_ID);
    const ordered = [...blocks].sort((x, y) => x.order - y.order);
    expect(ordered.map((b) => b.content.html)).toEqual(["b", "c", "a", "d"]);
  });

  it("moves a block backward across multiple positions in one call", async () => {
    const ids = await fourBlocks();
    const d = ids[3];
    await blocksApi.reorderBlock(d, 0);
    const blocks = await blocksApi.listBlocks(PAGE_ID);
    const ordered = [...blocks].sort((x, y) => x.order - y.order);
    expect(ordered.map((b) => b.content.html)).toEqual(["d", "a", "b", "c"]);
  });

  it("leaves order untouched (empty result) when the index doesn't change", async () => {
    const [a] = await fourBlocks();
    const result = await blocksApi.reorderBlock(a, 0);
    expect(result).toEqual([]);
  });

  it("renumbers order as a contiguous 0..n-1 sequence after the move", async () => {
    const [a] = await fourBlocks();
    await blocksApi.reorderBlock(a, 3);
    const blocks = await blocksApi.listBlocks(PAGE_ID);
    const orders = blocks.map((b) => b.order).sort((x, y) => x - y);
    expect(orders).toEqual([0, 1, 2, 3]);
  });

  it("only reorders siblings within the same parentBlockId scope", async () => {
    const toggle = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "toggle",
      content: { html: "Toggle" },
    });
    const child = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "bulletList",
      content: { html: "child" },
      parentBlockId: toggle.id,
    });
    const [topLevelA] = await fourBlocks();

    await blocksApi.reorderBlock(child.id, 0);

    const topLevelBlocks = await blocksApi.listBlocks(PAGE_ID);
    const topA = topLevelBlocks.find((b) => b.id === topLevelA);
    expect(topA?.parentBlockId).toBeNull();
  });

  it("throws an ApiError for an unknown block id", async () => {
    await expect(blocksApi.reorderBlock("nope", 0)).rejects.toBeInstanceOf(ApiError);
  });
});

describe("moveBlock", () => {
  async function threeBlocks() {
    const a = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "paragraph",
      content: { html: "a" },
    });
    const b = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "paragraph",
      content: { html: "b" },
    });
    const c = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "paragraph",
      content: { html: "c" },
    });
    return { a, b, c };
  }

  it("swaps order with the previous sibling when moving up", async () => {
    const { b } = await threeBlocks();
    await blocksApi.moveBlock(b.id, "up");
    const blocks = await blocksApi.listBlocks(PAGE_ID);
    const ordered = [...blocks].sort((x, y) => x.order - y.order);
    expect(ordered.map((x) => x.content.html)).toEqual(["b", "a", "c"]);
  });

  it("swaps order with the next sibling when moving down", async () => {
    const { b } = await threeBlocks();
    await blocksApi.moveBlock(b.id, "down");
    const blocks = await blocksApi.listBlocks(PAGE_ID);
    const ordered = [...blocks].sort((x, y) => x.order - y.order);
    expect(ordered.map((x) => x.content.html)).toEqual(["a", "c", "b"]);
  });

  it("is a no-op moving the first block up", async () => {
    const { a } = await threeBlocks();
    const result = await blocksApi.moveBlock(a.id, "up");
    expect(result).toHaveLength(1);
    expect(result[0].order).toBe(0);
  });

  it("is a no-op moving the last block down", async () => {
    const { c } = await threeBlocks();
    const result = await blocksApi.moveBlock(c.id, "down");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(c.id);
  });

  it("throws an ApiError for an unknown block id", async () => {
    await expect(blocksApi.moveBlock("nope", "up")).rejects.toBeInstanceOf(ApiError);
  });
});
