import { describe, expect, it } from "vitest";

import { normalizeLinkUrl } from "@/lib/url";

describe("normalizeLinkUrl", () => {
  it("adds https:// to a bare domain", () => {
    expect(normalizeLinkUrl("example.com")).toBe("https://example.com/");
  });

  it("keeps an explicit http or https URL", () => {
    expect(normalizeLinkUrl("http://example.com/a?b=1")).toBe("http://example.com/a?b=1");
    expect(normalizeLinkUrl("https://example.com")).toBe("https://example.com/");
  });

  it("allows mailto links", () => {
    expect(normalizeLinkUrl("mailto:hi@example.com")).toBe("mailto:hi@example.com");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeLinkUrl("  example.com  ")).toBe("https://example.com/");
  });

  it("rejects script-capable and other non-web schemes", () => {
    expect(normalizeLinkUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeLinkUrl("JaVaScRiPt:alert(1)")).toBeNull();
    expect(normalizeLinkUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(normalizeLinkUrl("file:///etc/passwd")).toBeNull();
  });

  it("returns null for empty or unparseable input", () => {
    expect(normalizeLinkUrl("")).toBeNull();
    expect(normalizeLinkUrl("   ")).toBeNull();
    expect(normalizeLinkUrl("http://")).toBeNull();
  });
});
