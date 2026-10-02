import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BlockSelectionBar } from "./BlockSelectionBar";
import { ToastContext } from "@/hooks/useToast";
import { useBlockSelectionStore } from "@/stores/useBlockSelectionStore";
import { useEditorStore } from "@/stores/useEditorStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { Block } from "@/types/entities";

function block(id: string, parentBlockId: string | null = null, type = "paragraph"): Block {
  return { id, pageId: "p1", parentBlockId, type, order: 1, content: { html: "x" } } as Block;
}

const toastApi = { toast: vi.fn() };

function mount() {
  return render(
    <ToastContext.Provider value={toastApi}>
      <BlockSelectionBar />
    </ToastContext.Provider>,
  );
}

beforeEach(() => {
  useBlockSelectionStore.getState().clear();
  useEditorStore.setState({
    blocksById: {
      a: block("a"),
      b: block("b"),
      t: block("t", null, "toggle"),
      c: block("c", "t"),
      d: block("d", null, "divider"),
    },
  });
});
afterEach(() => {
  cleanup();
  useSettingsStore.getState().setDirection("ltr");
});

describe("BlockSelectionBar", () => {
  it("renders nothing when no block is selected", () => {
    const { container } = mount();
    expect(container).toBeEmptyDOMElement();
  });

  it("shows how many blocks are selected and clears on request", () => {
    useBlockSelectionStore.setState({ selectedIds: ["a", "b"], anchorId: "a", focusId: "b" });
    mount();
    expect(screen.getByRole("toolbar", { name: "Selected blocks" })).toBeInTheDocument();
    expect(screen.getByText("2 selected")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(useBlockSelectionStore.getState().selectedIds).toEqual([]);
  });

  it("allows moving blocks that share a parent", () => {
    useBlockSelectionStore.setState({ selectedIds: ["a", "b"], anchorId: "a", focusId: "b" });
    mount();
    expect(screen.getByRole("button", { name: "Move up" })).toBeEnabled();
  });

  it("disables moving when the selected blocks sit at different levels", () => {
    useBlockSelectionStore.setState({ selectedIds: ["a", "c"], anchorId: "a", focusId: "c" });
    mount();
    expect(screen.getByRole("button", { name: "Move up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move down" })).toBeDisabled();
  });

  it("disables Turn into when nothing selected is a text block", () => {
    useBlockSelectionStore.setState({ selectedIds: ["d"], anchorId: "d", focusId: "d" });
    mount();
    expect(screen.getByRole("button", { name: "Turn into" })).toBeDisabled();
  });

  it("speaks Arabic when the interface language is Arabic", () => {
    useSettingsStore.getState().setDirection("rtl");
    useBlockSelectionStore.setState({ selectedIds: ["a"], anchorId: "a", focusId: "a" });
    mount();
    expect(screen.getByText("المحدد: 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إلغاء التحديد" })).toBeInTheDocument();
  });
});
