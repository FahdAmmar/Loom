import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PageOutline } from "./PageOutline";
import { useEditorStore } from "@/stores/useEditorStore";
import type { Block } from "@/types/entities";

function heading(id: string, type: Block["type"], text: string, order: number): Block {
  return {
    id,
    pageId: "p1",
    parentBlockId: null,
    type,
    order,
    content: { html: `<p>${text}</p>` },
  } as Block;
}

afterEach(cleanup);

beforeEach(() => {
  useEditorStore.setState({ blocksById: {}, collapsedToggleIds: {} });
  window.matchMedia = vi
    .fn()
    .mockReturnValue({ matches: false }) as unknown as typeof matchMedia;
});

describe("PageOutline", () => {
  it("renders nothing for a page with fewer than two headings", () => {
    useEditorStore.setState({ blocksById: { a: heading("a", "heading1", "Only one", 1) } });
    const { container } = render(<PageOutline pageId="p1" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists headings and scrolls the chosen one into view", () => {
    useEditorStore.setState({
      blocksById: {
        a: heading("a", "heading1", "Intro", 1),
        b: heading("b", "heading2", "Setup", 2),
      },
    });
    const target = document.createElement("div");
    target.dataset.blockId = "b";
    target.scrollIntoView = vi.fn();
    document.body.append(target);

    render(<PageOutline pageId="p1" />);
    fireEvent.click(screen.getByRole("button", { name: "Setup" }));

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    target.remove();
  });

  it("collapses and expands the list", () => {
    useEditorStore.setState({
      blocksById: {
        a: heading("a", "heading1", "Intro", 1),
        b: heading("b", "heading1", "Setup", 2),
      },
    });
    render(<PageOutline pageId="p1" />);
    const toggle = screen.getByRole("button", { name: /on this page/i });

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Intro" })).toBeNull();
  });
});
