import { describe, expect, it } from "vitest";

import { highlightCode, resolveCodeLanguage } from "@/lib/highlightCode";

describe("resolveCodeLanguage", () => {
  it("maps aliases and ignores case", () => {
    expect(resolveCodeLanguage("TS")).toBe("typescript");
    expect(resolveCodeLanguage("html")).toBe("xml");
  });

  it("returns null for unknown or empty names", () => {
    expect(resolveCodeLanguage("cobol")).toBeNull();
    expect(resolveCodeLanguage(undefined)).toBeNull();
  });
});

describe("highlightCode", () => {
  it("wraps tokens in hljs spans", async () => {
    const html = await highlightCode("const a = 1;", "javascript");
    expect(html).toContain('<span class="hljs-keyword">const</span>');
  });

  it("escapes markup so source can never become HTML", async () => {
    const html = await highlightCode('const s = "<img onerror=x>";', "javascript");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("returns null for plain text and empty code", async () => {
    expect(await highlightCode("hello", undefined)).toBeNull();
    expect(await highlightCode("", "javascript")).toBeNull();
  });
});
