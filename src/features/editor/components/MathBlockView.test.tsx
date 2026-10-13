import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MathBlockView } from "@/features/editor/components/MathBlockView";
import { expectNoA11yViolations } from "@/test/axe";

afterEach(cleanup);

describe("MathBlockView", () => {
  it("starts in edit mode when empty and reports typed LaTeX", () => {
    const onChange = vi.fn();
    render(<MathBlockView latex="" onChange={onChange} onBackspaceEmpty={() => {}} />);
    fireEvent.change(screen.getByLabelText("LaTeX equation"), { target: { value: "x^2" } });
    expect(onChange).toHaveBeenCalledWith({ latex: "x^2" });
  });

  it("shows rendered output for an existing equation and opens the editor on click", async () => {
    render(<MathBlockView latex="x^2" onChange={() => {}} onBackspaceEmpty={() => {}} />);
    const preview = await screen.findByRole("button", { name: "Edit equation" });
    expect(preview.querySelector(".katex")).not.toBeNull();
    expect(screen.queryByLabelText("LaTeX equation")).toBeNull();

    fireEvent.click(preview);
    expect(screen.getByLabelText("LaTeX equation")).toBeTruthy();
  });

  it("shows an error message for invalid LaTeX", async () => {
    render(
      <MathBlockView latex="\\frac{1}{" onChange={() => {}} onBackspaceEmpty={() => {}} />,
    );
    const alert = await screen.findByRole("alert");
    expect(alert.textContent?.length).toBeGreaterThan(0);
  });

  it("deletes the block on Backspace in an empty editor", () => {
    const onBackspaceEmpty = vi.fn();
    render(<MathBlockView latex="" onChange={() => {}} onBackspaceEmpty={onBackspaceEmpty} />);
    fireEvent.keyDown(screen.getByLabelText("LaTeX equation"), { key: "Backspace" });
    expect(onBackspaceEmpty).toHaveBeenCalled();
  });

  it("has no accessibility violations in preview and edit modes", async () => {
    const { container } = render(
      <MathBlockView latex="a+b" onChange={() => {}} onBackspaceEmpty={() => {}} />,
    );
    await screen.findByRole("button", { name: "Edit equation" });
    await expectNoA11yViolations(container);
    fireEvent.click(screen.getByRole("button", { name: "Edit equation" }));
    await waitFor(() => expect(screen.getByLabelText("LaTeX equation")).toBeTruthy());
    await expectNoA11yViolations(container);
  });
});
