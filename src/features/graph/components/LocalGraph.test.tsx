import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalGraph } from "./LocalGraph";
import * as linksApi from "@/api/links";
import { usePageStore } from "@/stores/usePageStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { Link, Page } from "@/types/entities";

const page = (id: string, title: string) => ({ id, title }) as Page;
const link = (from: string, to: string): Link => ({
  id: `${from}-${to}`,
  sourcePageId: from,
  targetPageId: to,
});

function mount(links: Link[]) {
  vi.spyOn(linksApi, "listAllLinks").mockResolvedValue(links);
  return render(
    <MemoryRouter>
      <LocalGraph pageId="a" />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  usePageStore.setState({
    pagesById: {
      a: page("a", "Alpha"),
      b: page("b", "Beta"),
      c: page("c", "Gamma"),
      d: page("d", "Delta"),
    },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useSettingsStore.getState().setDirection("ltr");
});

describe("LocalGraph", () => {
  it("shows nothing for a page with no links", async () => {
    const { container } = mount([]);
    await vi.waitFor(() => expect(linksApi.listAllLinks).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("lists linked pages as links and marks the current page", async () => {
    mount([link("a", "b"), link("c", "a")]);
    expect(await screen.findByRole("link", { name: "Beta" })).toHaveAttribute(
      "href",
      "/w/default/p/b",
    );
    expect(screen.getByRole("link", { name: "Gamma" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Alpha" })).toBeNull();
  });

  it("reveals second-step pages only when asked", async () => {
    mount([link("a", "b"), link("b", "d")]);
    await screen.findByRole("link", { name: "Beta" });
    expect(screen.queryByRole("link", { name: "Delta" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Two steps" }));
    expect(screen.getByRole("link", { name: "Delta" })).toBeInTheDocument();
  });

  it("collapses and expands", async () => {
    mount([link("a", "b")]);
    const toggle = await screen.findByRole("button", { name: /connections/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Beta" })).toBeNull();
  });

  it("speaks Arabic when the interface language is Arabic", async () => {
    useSettingsStore.getState().setDirection("rtl");
    mount([link("a", "b")]);
    expect(await screen.findByRole("button", { name: /الروابط/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "روابط مباشرة" })).toBeInTheDocument();
  });
});
