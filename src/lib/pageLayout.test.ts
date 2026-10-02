import { describe, expect, it } from "vitest";

import { getPageLayoutClasses, isDefaultPageView } from "./pageLayout";

describe("getPageLayoutClasses", () => {
  it("keeps the app-wide width and adds no font or size classes by default", () => {
    expect(getPageLayoutClasses(undefined, "max-w-3xl")).toEqual({
      widthClass: "max-w-3xl",
      fontClass: "",
      sizeClass: "",
    });
  });

  it("maps a page's font and text size to classes", () => {
    const result = getPageLayoutClasses({ font: "serif", textSize: "large" }, "max-w-3xl");
    expect(result.fontClass).toBe("font-serif");
    expect(result.sizeClass).toBe("text-lg");
  });

  it("lets full width override the app-wide width", () => {
    expect(getPageLayoutClasses({ fullWidth: true }, "max-w-3xl").widthClass).toBe(
      "max-w-none",
    );
  });
});

describe("isDefaultPageView", () => {
  it("treats missing and explicit defaults alike", () => {
    expect(isDefaultPageView(undefined)).toBe(true);
    expect(isDefaultPageView({ font: "sans", textSize: "default", fullWidth: false })).toBe(
      true,
    );
  });

  it("is false once anything differs", () => {
    expect(isDefaultPageView({ font: "mono" })).toBe(false);
    expect(isDefaultPageView({ fullWidth: true })).toBe(false);
  });
});
