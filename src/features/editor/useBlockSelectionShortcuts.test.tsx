import { cleanup, fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as blocksApi from "@/api/blocks";
import { useBlockSelectionShortcuts } from "./useBlockSelectionShortcuts";
import { ToastContext } from "@/hooks/useToast";
import { getOrderedBlocks } from "@/lib/blocks";
import { useBlockSelectionStore } from "@/stores/useBlockSelectionStore";
import { editorHistory, useEditorStore } from "@/stores/useEditorStore";

const PAGE_ID = "shortcut-page";
const toast = vi.fn();
const toastApi = { toast };

function Probe(): ReactNode {
  useBlockSelectionShortcuts(PAGE_ID);
  return <input data-testid="field" />;
}

function mount() {
  return render(
    <ToastContext.Provider value={toastApi}>
      <Probe />
    </ToastContext.Provider>,
  );
}

const sel = () => useBlockSelectionStore.getState();
const ids = () =>
  getOrderedBlocks(useEditorStore.getState().blocksById, PAGE_ID, null).map((b) => b.id);

async function seed(count: number): Promise<string[]> {
  for (let i = 0; i < count; i++) {
    // oxlint-disable-next-line no-await-in-loop
    await blocksApi.createBlock({
      pageId: PAGE_ID,
      type: "paragraph",
      content: { html: `<p>block ${i}</p>` },
      parentBlockId: null,
    });
  }
  await useEditorStore.getState().loadBlocks(PAGE_ID);
  return ids();
}

beforeEach(() => {
  localStorage.clear();
  toast.mockClear();
  useEditorStore.setState({ blocksById: {}, loadedPageId: null, isLoading: false });
  editorHistory.clear();
  sel().clear();
});
afterEach(cleanup);

describe("useBlockSelectionShortcuts", () => {
  it("clears the selection on Escape", async () => {
    const [a] = await seed(2);
    sel().select(a);
    mount();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(sel().selectedIds).toEqual([]);
  });

  it("deletes the selected blocks on Delete and says so", async () => {
    const [a, b, c] = await seed(3);
    sel().select(a);
    sel().extendTo(b, [a, b, c]);
    mount();

    fireEvent.keyDown(window, { key: "Delete" });
    await vi.waitFor(() => expect(ids()).toEqual([c]));
    expect(toast).toHaveBeenCalledWith(expect.any(String), "default");
  });

  it("grows the selection with Shift+ArrowDown", async () => {
    const order = await seed(3);
    sel().select(order[0]);
    mount();

    fireEvent.keyDown(window, { key: "ArrowDown", shiftKey: true });
    expect(sel().selectedIds).toEqual([order[0], order[1]]);
  });

  it("leaves the keys alone while the user is typing in a field", async () => {
    const [a] = await seed(2);
    sel().select(a);
    const { getByTestId } = mount();

    fireEvent.keyDown(getByTestId("field"), { key: "Delete" });
    fireEvent.keyDown(getByTestId("field"), { key: "Escape" });
    expect(sel().selectedIds).toEqual([a]);
    expect(ids()).toHaveLength(2);
  });

  it("does nothing when nothing is selected", async () => {
    await seed(2);
    mount();
    fireEvent.keyDown(window, { key: "Delete" });
    expect(ids()).toHaveLength(2);
  });
});
