import { describe, expect, it } from "vitest";

import { pageToMarkdown } from "@/features/markdown/exportMarkdown";
import { inlineHtmlToMarkdown } from "@/lib/blocks";
import { makeBlock } from "@/test/fixtures";

describe("inlineHtmlToMarkdown", () => {
  it("converts bold and italic marks", () => {
    expect(inlineHtmlToMarkdown("<strong>bold</strong> and <em>italic</em>")).toBe(
      "**bold** and *italic*",
    );
  });

  it("converts nested marks (bold and italic together)", () => {
    expect(inlineHtmlToMarkdown("<strong><em>both</em></strong>")).toBe("***both***");
  });

  it("converts inline code and strikethrough", () => {
    expect(inlineHtmlToMarkdown("<code>const x</code> <s>old</s>")).toBe("`const x` ~~old~~");
  });

  it("converts a wikilink chip to Obsidian-style plain text, dropping the ↗ label prefix", () => {
    const html = '<span data-page-link="" data-page-id="page-1">↗ Getting Started</span>';
    expect(inlineHtmlToMarkdown(html)).toBe("[[Getting Started]]");
  });

  it("passes plain text through unchanged", () => {
    expect(inlineHtmlToMarkdown("just text")).toBe("just text");
  });
});

describe("pageToMarkdown", () => {
  it("renders the title as an H1 followed by a paragraph", () => {
    const blocks = [makeBlock("paragraph", { html: "Hello world" }, { pageId: "page-1" })];
    const markdown = pageToMarkdown("My Page", "page-1", blocks);
    expect(markdown).toBe("# My Page\n\nHello world\n");
  });

  it("renders headings at the right level", () => {
    const blocks = [makeBlock("heading2", { html: "Section" }, { pageId: "page-1" })];
    expect(pageToMarkdown("T", "page-1", blocks)).toContain("## Section");
  });

  it("groups consecutive numbered-list blocks into one numbered list", () => {
    const blocks = [
      makeBlock("numberedList", { html: "First" }, { pageId: "page-1", order: 0 }),
      makeBlock("numberedList", { html: "Second" }, { pageId: "page-1", order: 1 }),
      makeBlock("numberedList", { html: "Third" }, { pageId: "page-1", order: 2 }),
    ];
    const markdown = pageToMarkdown("T", "page-1", blocks);
    expect(markdown).toContain("1. First\n2. Second\n3. Third");
  });

  it("renders a checklist item's checked state", () => {
    const blocks = [
      makeBlock("checklist", { html: "Done", checked: true }, { pageId: "page-1" }),
    ];
    expect(pageToMarkdown("T", "page-1", blocks)).toContain("- [x] Done");
  });

  it("renders a code block with its language tag", () => {
    const blocks = [
      makeBlock("code", { code: "const x = 1;", language: "ts" }, { pageId: "page-1" }),
    ];
    const markdown = pageToMarkdown("T", "page-1", blocks);
    expect(markdown).toContain("```ts\nconst x = 1;\n```");
  });

  it("renders an image with alt text and caption", () => {
    const blocks = [
      makeBlock(
        "image",
        { url: "https://example.com/cat.png", alt: "A cat", caption: "My cat" },
        { pageId: "page-1" },
      ),
    ];
    const markdown = pageToMarkdown("T", "page-1", blocks);
    expect(markdown).toContain("![A cat](https://example.com/cat.png)");
    expect(markdown).toContain("*My cat*");
  });

  it("renders a table with a header separator row", () => {
    const blocks = [
      makeBlock(
        "table",
        {
          rows: [
            ["Name", "Status"],
            ["Alice", "Done"],
          ],
        },
        { pageId: "page-1" },
      ),
    ];
    const markdown = pageToMarkdown("T", "page-1", blocks);
    expect(markdown).toContain("| Name | Status |\n| --- | --- |\n| Alice | Done |");
  });

  it("renders a toggle's children indented inside a <details> block", () => {
    const toggle = makeBlock("toggle", { html: "More info" }, { pageId: "page-1", order: 0 });
    const child = makeBlock(
      "paragraph",
      { html: "Hidden detail" },
      { pageId: "page-1", parentBlockId: toggle.id, order: 0 },
    );
    const markdown = pageToMarkdown("T", "page-1", [toggle, child]);
    expect(markdown).toContain("<summary>More info</summary>");
    expect(markdown).toContain("  Hidden detail");
  });

  it("produces just the title heading for a page with no blocks", () => {
    expect(pageToMarkdown("Empty Page", "page-1", [])).toBe("# Empty Page\n\n\n");
  });
});
