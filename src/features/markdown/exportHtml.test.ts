import { describe, expect, it } from "vitest";

import { markdownToHtmlDocument } from "@/features/markdown/exportHtml";

describe("markdownToHtmlDocument", () => {
  it("renders markdown into a complete document with direction and language", () => {
    const html = markdownToHtmlDocument("Plan", "# Plan\n\n**bold** text", { dir: "rtl" });
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain("<h1>Plan</h1>");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("escapes the title", () => {
    const html = markdownToHtmlDocument("<b>x</b>", "text", { dir: "ltr" });
    expect(html).toContain("<title>&lt;b&gt;x&lt;/b&gt;</title>");
  });

  it("strips scripts and event handlers from page content", () => {
    const html = markdownToHtmlDocument(
      "t",
      '<script>alert(1)</script><img src=x onerror="alert(2)">\n\nok',
      { dir: "ltr" },
    );
    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain("onerror");
    expect(html).toContain("ok");
  });
});
