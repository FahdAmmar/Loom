import { describe, expect, it } from "vitest";

import { COVER_KEYS, coverBackground } from "@/lib/covers";

describe("coverBackground", () => {
  it("returns a gradient for every preset", () => {
    for (const key of COVER_KEYS) expect(coverBackground(key)).toContain("linear-gradient");
  });

  it("ignores unknown or missing keys, such as one from a newer app version", () => {
    expect(coverBackground("neon")).toBeUndefined();
    expect(coverBackground(undefined)).toBeUndefined();
  });
});
