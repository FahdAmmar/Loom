import { beforeEach, describe, expect, it } from "vitest";

import { usePageViewStore } from "./usePageViewStore";

beforeEach(() => usePageViewStore.setState({ viewsByPageId: {} }));

describe("usePageViewStore", () => {
  it("keeps each page's choices separate and merges partial updates", () => {
    const { setView } = usePageViewStore.getState();
    setView("a", { font: "serif" });
    setView("a", { fullWidth: true });
    setView("b", { textSize: "large" });

    expect(usePageViewStore.getState().viewsByPageId).toEqual({
      a: { font: "serif", fullWidth: true },
      b: { textSize: "large" },
    });
  });

  it("removes a page's entry once every choice is back to default", () => {
    const { setView } = usePageViewStore.getState();
    setView("a", { font: "mono" });
    setView("a", { font: "sans" });
    expect(usePageViewStore.getState().viewsByPageId).toEqual({});
  });

  it("resets one page without touching the others", () => {
    const { setView, resetView } = usePageViewStore.getState();
    setView("a", { font: "mono" });
    setView("b", { font: "serif" });
    resetView("a");
    expect(Object.keys(usePageViewStore.getState().viewsByPageId)).toEqual(["b"]);
  });
});
