import { beforeEach, describe, expect, it, vi } from "vitest";

import * as blocksApi from "@/api/blocks";
import { useEditorStore } from "@/stores/useEditorStore";

const PAGE_ID = "test-page";

function resetStore() {
  useEditorStore.setState({
    blocksById: {},
    loadedPageId: null,
    isLoading: false,
    saveStatus: "idle",
    collapsedToggleIds: {},
  });
}

beforeEach(() => {
  localStorage.clear();
  resetStore();
});

describe("changeBlockType", () => {
  it(
    "is not reverted by a stale debounced content save queued before the conversion " +
      "(regression: /board and every other slash command used to lose its content ~600ms " +
      "after being selected, if picked within the 600ms debounce window of the last keystroke)",
    async () => {
      vi.useFakeTimers();
      try {
        const block = await blocksApi.createBlock({
          pageId: PAGE_ID,
          type: "paragraph",
          content: { html: "" },
        });
        useEditorStore.setState({ blocksById: { [block.id]: block }, loadedPageId: PAGE_ID });

        // Simulates typing "/board" — the last keystroke arms a 600ms
        // debounced save of that (about to be stale) text.
        useEditorStore.getState().updateBlockContent(block.id, { html: "<p>/board</p>" });

        // Selecting the slash command converts the block before the debounce fires.
        await useEditorStore.getState().changeBlockType(block.id, "board", { columns: [] });

        // Advance past the original debounce window.
        await vi.advanceTimersByTimeAsync(700);

        const current = useEditorStore.getState().blocksById[block.id];
        expect(current.type).toBe("board");
        expect(current.content).toEqual({ columns: [] });
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it("does nothing for a block id that isn't loaded", async () => {
    await expect(
      useEditorStore.getState().changeBlockType("missing", "table", { rows: [] }),
    ).resolves.toBeUndefined();
  });
});

describe("updateBlockContent", () => {
  it("updates local state immediately (optimistic)", async () => {
    const block = await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "paragraph",
      content: { html: "old" },
    });
    useEditorStore.setState({ blocksById: { [block.id]: block }, loadedPageId: PAGE_ID });

    useEditorStore.getState().updateBlockContent(block.id, { html: "new" });

    expect(useEditorStore.getState().blocksById[block.id].content.html).toBe("new");
  });

  it("persists after the debounce window", async () => {
    vi.useFakeTimers();
    try {
      const block = await blocksApi.createBlock({
        pageId: PAGE_ID,
        type: "paragraph",
        content: { html: "old" },
      });
      useEditorStore.setState({ blocksById: { [block.id]: block }, loadedPageId: PAGE_ID });

      useEditorStore.getState().updateBlockContent(block.id, { html: "new" });
      await vi.advanceTimersByTimeAsync(700);

      const persisted = await blocksApi.listBlocks(PAGE_ID);
      expect(persisted.find((b) => b.id === block.id)?.content.html).toBe("new");
    } finally {
      vi.useRealTimers();
    }
  });

  it("does nothing for a block id that isn't loaded", () => {
    expect(() =>
      useEditorStore.getState().updateBlockContent("missing", { html: "x" }),
    ).not.toThrow();
  });
});

describe("loadBlocks", () => {
  it("ignores a stale response after the page changed again before it resolved", async () => {
    await blocksApi.createBlock({
      pageId: "page-a",
      type: "paragraph",
      content: { html: "a" },
    });
    await blocksApi.createBlock({
      pageId: "page-b",
      type: "paragraph",
      content: { html: "b" },
    });

    const firstLoad = useEditorStore.getState().loadBlocks("page-a");
    // Immediately navigate again before the first load resolves.
    await useEditorStore.getState().loadBlocks("page-b");
    await firstLoad;

    expect(useEditorStore.getState().loadedPageId).toBe("page-b");
    const loadedHtml = Object.values(useEditorStore.getState().blocksById).map(
      (b) => b.content.html,
    );
    expect(loadedHtml).toEqual(["b"]);
  });
});

describe("deleteBlock", () => {
  it("removes the block and its descendants from local state", async () => {
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
    useEditorStore.setState({
      blocksById: { [toggle.id]: toggle, [child.id]: child },
      loadedPageId: PAGE_ID,
    });

    await useEditorStore.getState().deleteBlock(toggle.id);

    expect(useEditorStore.getState().blocksById).toEqual({});
  });
});
