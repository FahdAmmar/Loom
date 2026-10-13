import { describe, expect, it } from "vitest";

import { toSafeFileName, uniqueName } from "@/lib/fileName";

describe("toSafeFileName", () => {
  it("removes characters file systems reject", () => {
    expect(toSafeFileName('a/b\\c:d*e?f"g<h>i|j')).toBe("a b c d e f g h i j");
  });

  it("keeps Arabic and other Unicode letters", () => {
    expect(toSafeFileName("ملاحظات المشروع")).toBe("ملاحظات المشروع");
  });

  it("falls back for empty or dot-only names", () => {
    expect(toSafeFileName("   ")).toBe("Untitled");
    expect(toSafeFileName("...")).toBe("Untitled");
  });

  it("limits the length", () => {
    expect(toSafeFileName("x".repeat(200)).length).toBe(80);
  });
});

describe("uniqueName", () => {
  it("appends a counter for repeats, ignoring case", () => {
    const taken = new Set<string>();
    expect(uniqueName("Notes", taken)).toBe("Notes");
    expect(uniqueName("notes", taken)).toBe("notes-2");
    expect(uniqueName("Notes", taken)).toBe("Notes-3");
  });
});
