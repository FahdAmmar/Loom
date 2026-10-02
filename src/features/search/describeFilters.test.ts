import { describe, expect, it } from "vitest";

import { describeFilters } from "./describeFilters";
import { parseSearchQuery } from "@/lib/searchQuery";

describe("describeFilters", () => {
  it("shows nothing for a plain query", () => {
    expect(describeFilters(parseSearchQuery("hello"))).toEqual([]);
  });

  it("gives each scope and the date window a chip", () => {
    const chips = describeFilters(parseSearchQuery("in:title in:tag updated:week"));
    expect(chips.map((c) => c.label)).toEqual([
      "palette.filter.title",
      "palette.filter.tag",
      "palette.filter.week",
    ]);
  });

  it("names a custom window with its day count", () => {
    expect(describeFilters(parseSearchQuery("updated:14d"))).toEqual([
      { key: "updated", label: "palette.filter.days", params: { days: 14 } },
    ]);
  });
});
