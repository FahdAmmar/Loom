import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { PageStyleButton } from "./PageStyleDialog";
import { usePageViewStore } from "@/stores/usePageViewStore";

// jsdom has no <dialog> modal support; a minimal stand-in keeps the open state observable.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

beforeEach(() => usePageViewStore.setState({ viewsByPageId: {} }));
afterEach(cleanup);

function views() {
  return usePageViewStore.getState().viewsByPageId;
}

describe("PageStyleButton", () => {
  it("saves the chosen font, size, and width for this page only", () => {
    render(<PageStyleButton pageId="p1" />);
    fireEvent.click(screen.getByRole("button", { name: "Page style" }));

    fireEvent.click(screen.getByRole("button", { name: "Serif" }));
    fireEvent.click(screen.getByRole("button", { name: "Large" }));
    fireEvent.click(screen.getByRole("button", { name: "Full width" }));

    expect(views()).toEqual({ p1: { font: "serif", textSize: "large", fullWidth: true } });
  });

  it("marks the current choice as pressed", () => {
    usePageViewStore.setState({ viewsByPageId: { p1: { font: "mono" } } });
    render(<PageStyleButton pageId="p1" />);
    fireEvent.click(screen.getByRole("button", { name: "Page style" }));

    expect(screen.getByRole("button", { name: "Mono" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Serif" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("resets back to the defaults, and the reset is disabled when there is nothing to reset", () => {
    usePageViewStore.setState({ viewsByPageId: { p1: { font: "mono" } } });
    render(<PageStyleButton pageId="p1" />);
    fireEvent.click(screen.getByRole("button", { name: "Page style" }));

    fireEvent.click(screen.getByRole("button", { name: "Reset to default" }));
    expect(views()).toEqual({});
    expect(screen.getByRole("button", { name: "Reset to default" })).toBeDisabled();
  });
});
