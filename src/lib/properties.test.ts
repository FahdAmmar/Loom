import { describe, expect, it } from "vitest";

import { getSelectOptions, parseOptionList, SELECT_PRESET_OPTIONS } from "@/lib/properties";

describe("parseOptionList", () => {
  it("splits on commas and trims each option", () => {
    expect(parseOptionList("Low, Medium ,High")).toEqual(["Low", "Medium", "High"]);
  });

  it("drops empty entries", () => {
    expect(parseOptionList(",, A ,, ,B,")).toEqual(["A", "B"]);
    expect(parseOptionList("   ")).toEqual([]);
  });

  it("removes duplicates case-insensitively, keeping the first spelling", () => {
    expect(parseOptionList("Bug, bug, BUG, Feature")).toEqual(["Bug", "Feature"]);
  });

  it("collapses inner whitespace", () => {
    expect(parseOptionList("In    review")).toEqual(["In review"]);
  });

  it("truncates an over-long option and caps the number of options", () => {
    expect(parseOptionList("x".repeat(100))[0]).toHaveLength(40);
    const many = Array.from({ length: 50 }, (_, i) => `opt${i}`).join(",");
    expect(parseOptionList(many)).toHaveLength(20);
  });
});

describe("getSelectOptions", () => {
  it("falls back to the shared preset when a property has no options of its own", () => {
    expect(getSelectOptions({ value: null })).toEqual(SELECT_PRESET_OPTIONS);
    expect(getSelectOptions({ options: [], value: null })).toEqual(SELECT_PRESET_OPTIONS);
  });

  it("uses the property's own options when it has them", () => {
    expect(getSelectOptions({ options: ["Low", "High"], value: "Low" })).toEqual([
      "Low",
      "High",
    ]);
  });

  it("keeps a current value that is no longer in the options", () => {
    expect(getSelectOptions({ options: ["Low", "High"], value: "Urgent" })).toEqual([
      "Low",
      "High",
      "Urgent",
    ]);
  });
});
