import { beforeEach, describe, expect, it } from "vitest";

import * as blocksApi from "@/api/blocks";
import { getOrderedBlocks } from "@/lib/blocks";
import { editorHistory, useEditorStore } from "@/stores/useEditorStore";

const PAGE_ID = "history-page";

function store() {
  return useEditorStore.getState();
}

function topLevelIds() {
  return getOrderedBlocks(store().blocksById, PAGE_ID, null).map((b) => b.id);
}

async function seedBlocks(count: number): Promise<string[]> {
  for (let i = 0; i < count; i++) {
    // Sequential on purpose: creation order defines block order.
    // oxlint-disable-next-line no-await-in-loop
    await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "paragraph",
      content: { html: `<p>block ${i}</p>` },
      parentBlockId: null,
    });
  }
  await store().loadBlocks(PAGE_ID);
  return topLevelIds();
}

beforeEach(() => {
  localStorage.clear();
  useEditorStore.setState({ blocksById: {}, loadedPageId: null, isLoading: false });
  editorHistory.clear();
});

describe("undo/redo of structural edits", () => {
  it("removes an added block on undo and brings the same block back on redo", async () => {
    const [first] = await seedBlocks(1);
    const added = await store().createBlock({
      pageId: PAGE_ID,
      type: "paragraph",
      content: { html: "<p>new</p>" },
      parentBlockId: null,
      afterBlockId: first,
    });

    expect(store().undoLabel).toBe("history.addBlock");
    await store().undo();
    expect(topLevelIds()).toEqual([first]);

    await store().redo();
    expect(topLevelIds()).toEqual([first, added.id]);
    expect(store().blocksById[added.id].content).toEqual({ html: "<p>new</p>" });
  });

  it("restores a deleted block, including text that had not been saved yet", async () => {
    const [first, second] = await seedBlocks(2);
    store().updateBlockContent(second, { html: "<p>typed just now</p>" });
    await store().deleteBlock(second);
    expect(topLevelIds()).toEqual([first]);

    await store().undo();
    expect(topLevelIds()).toEqual([first, second]);
    expect(store().blocksById[second].content).toEqual({ html: "<p>typed just now</p>" });

    await store().redo();
    expect(topLevelIds()).toEqual([first]);
  });

  it("does not restore twice when the delete toast's Undo runs after ⌘Z", async () => {
    const [first, second] = await seedBlocks(2);
    const snapshot = await store().deleteBlock(second);
    await store().undo();
    await store().undoDeleteBlock(snapshot);

    expect(topLevelIds()).toEqual([first, second]);
    expect(store().redoLabel).toBe("history.deleteBlock");
  });

  it("drops the recorded delete when the toast's Undo restores the block itself", async () => {
    const [, second] = await seedBlocks(2);
    const snapshot = await store().deleteBlock(second);
    await store().undoDeleteBlock(snapshot);

    expect(store().undoLabel).toBeNull();
    expect(await store().undo()).toBeNull();
  });

  it("reverts and reapplies a block type change", async () => {
    const [first] = await seedBlocks(1);
    await store().changeBlockType(first, "heading1", { html: "<p>Title</p>" });

    await store().undo();
    expect(store().blocksById[first].type).toBe("paragraph");
    expect(store().blocksById[first].content).toEqual({ html: "<p>block 0</p>" });

    await store().redo();
    expect(store().blocksById[first].type).toBe("heading1");
  });

  it("undoes a move up or down", async () => {
    const [a, b, c] = await seedBlocks(3);
    await store().moveBlock(c, "up");
    expect(topLevelIds()).toEqual([a, c, b]);

    await store().undo();
    expect(topLevelIds()).toEqual([a, b, c]);
  });

  it("records nothing for a move that cannot happen", async () => {
    const [a] = await seedBlocks(2);
    await store().moveBlock(a, "up");
    expect(store().undoLabel).toBeNull();
  });

  it("undoes a drag-and-drop reorder", async () => {
    const [a, b, c] = await seedBlocks(3);
    await store().reorderBlock(a, 2);
    expect(topLevelIds()).toEqual([b, c, a]);

    await store().undo();
    expect(topLevelIds()).toEqual([a, b, c]);
    await store().redo();
    expect(topLevelIds()).toEqual([b, c, a]);
  });

  it("undoes a grouped multi-block insert in one step", async () => {
    const [first] = await seedBlocks(1);
    await editorHistory.group("history.paste", async () => {
      let after = first;
      for (const text of ["x", "y", "z"]) {
        // oxlint-disable-next-line no-await-in-loop
        const created = await store().createBlock({
          pageId: PAGE_ID,
          type: "paragraph",
          content: { html: `<p>${text}</p>` },
          parentBlockId: null,
          afterBlockId: after,
        });
        after = created.id;
      }
    });
    expect(topLevelIds()).toHaveLength(4);

    await store().undo();
    expect(topLevelIds()).toEqual([first]);
    await store().redo();
    expect(topLevelIds()).toHaveLength(4);
  });

  it("forgets history when another page is loaded", async () => {
    const [first] = await seedBlocks(1);
    await store().changeBlockType(first, "heading1", { html: "<p>T</p>" });
    expect(store().undoLabel).toBe("history.changeType");

    await store().loadBlocks("some-other-page");
    expect(store().undoLabel).toBeNull();
    expect(await store().undo()).toBeNull();
  });
});
