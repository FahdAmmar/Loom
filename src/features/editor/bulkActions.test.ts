import { beforeEach, describe, expect, it } from "vitest";

import * as blocksApi from "@/api/blocks";
import {
  convertSelected,
  deleteSelected,
  moveSelected,
  selectedText,
  sharedParentId,
} from "@/features/editor/bulkActions";
import { getOrderedBlocks } from "@/lib/blocks";
import { useBlockSelectionStore } from "@/stores/useBlockSelectionStore";
import { editorHistory, useEditorStore } from "@/stores/useEditorStore";

const PAGE_ID = "bulk-page";

const store = () => useEditorStore.getState();
const topLevel = () => getOrderedBlocks(store().blocksById, PAGE_ID, null);
const ids = () => topLevel().map((b) => b.id);

async function seed(count: number): Promise<string[]> {
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
  return ids();
}

function selectIds(...selected: string[]) {
  useBlockSelectionStore.setState({
    selectedIds: selected,
    anchorId: selected[0] ?? null,
    focusId: selected.at(-1) ?? null,
  });
}

beforeEach(() => {
  localStorage.clear();
  useEditorStore.setState({ blocksById: {}, loadedPageId: null, isLoading: false });
  editorHistory.clear();
  useBlockSelectionStore.getState().clear();
});

describe("bulk actions", () => {
  it("deletes every selected block and clears the selection", async () => {
    const [a, b, c, d] = await seed(4);
    selectIds(b, c);
    await deleteSelected();

    expect(ids()).toEqual([a, d]);
    expect(useBlockSelectionStore.getState().selectedIds).toEqual([]);
  });

  it("restores all deleted blocks with a single undo", async () => {
    const [a, b, c, d] = await seed(4);
    selectIds(b, c);
    await deleteSelected();
    expect(store().undoLabel).toBe("history.deleteBlocks");

    await store().undo();
    expect(ids()).toEqual([a, b, c, d]);
    await store().redo();
    expect(ids()).toEqual([a, d]);
  });

  it("moves a selected group up and back down with one undo", async () => {
    const [a, b, c, d] = await seed(4);
    selectIds(b, c);
    await moveSelected("up");
    expect(ids()).toEqual([b, c, a, d]);

    await store().undo();
    expect(ids()).toEqual([a, b, c, d]);
  });

  it("leaves blocks alone when the group already sits at the edge", async () => {
    const [a, b, c] = await seed(3);
    selectIds(a, b);
    await moveSelected("up");
    expect(ids()).toEqual([a, b, c]);
    expect(store().undoLabel).toBeNull();
  });

  it("converts selected text blocks and skips ones already of that type", async () => {
    const [a, b, c] = await seed(3);
    await store().changeBlockType(b, "heading1", { html: "<p>block 1</p>" });
    editorHistory.clear();
    selectIds(a, b, c);
    await convertSelected("heading1");

    expect(topLevel().map((x) => x.type)).toEqual(["heading1", "heading1", "heading1"]);
    expect(store().blocksById[a].content).toEqual({ html: "<p>block 0</p>" });

    await store().undo();
    expect(topLevel().map((x) => x.type)).toEqual(["paragraph", "heading1", "paragraph"]);
  });

  it("starts a converted checklist unchecked", async () => {
    const [a] = await seed(1);
    selectIds(a);
    await convertSelected("checklist");
    expect(store().blocksById[a].content).toEqual({ html: "<p>block 0</p>", checked: false });
  });

  it("copies the selection's text in reading order", async () => {
    const [a, b, c] = await seed(3);
    selectIds(c, a); // selected out of order
    expect(selectedText()).toBe("block 0\n\nblock 2");
    expect(b).toBeDefined();
  });

  it("drops a block from the selection when it is deleted elsewhere", async () => {
    const [a, b] = await seed(2);
    selectIds(a, b);
    await store().deleteBlock(a);
    expect(useBlockSelectionStore.getState().selectedIds).toEqual([b]);
  });
});

describe("sharedParentId", () => {
  it("is undefined for an empty or mixed-parent selection", () => {
    expect(sharedParentId([])).toBeUndefined();
    const at = (parentBlockId: string | null) =>
      ({
        id: "x",
        pageId: "p",
        parentBlockId,
        type: "paragraph",
        order: 1,
        content: {},
      }) as never;
    expect(sharedParentId([at(null), at("t")])).toBeUndefined();
    expect(sharedParentId([at("t"), at("t")])).toBe("t");
  });
});
