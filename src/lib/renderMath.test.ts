import { describe, expect, it } from "vitest";

import { renderMath } from "@/lib/renderMath";

describe("renderMath", () => {
  it("renders a valid equation to KaTeX markup", async () => {
    const result = await renderMath("x^2 + y^2 = z^2");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.html).toContain("katex");
  });

  it("returns an empty result for blank input without loading anything to render", async () => {
    expect(await renderMath("   ")).toEqual({ ok: true, html: "" });
  });

  it("reports a readable error for invalid LaTeX", async () => {
    const result = await renderMath("\\frac{1}{");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
  });

  it("never turns untrusted LaTeX into links, scripts or event handlers", async () => {
    const result = await renderMath("\\href{javascript:alert(1)}{click}");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const doc = new DOMParser().parseFromString(result.html, "text/html");
    expect(doc.querySelector("a, script, [href], [src]")).toBeNull();
    expect(result.html).not.toMatch(/\son\w+=/i);
  });
});
