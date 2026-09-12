import { describe, expect, it } from "vitest";

import {
  extractTitleFromMarkdown,
  extractWikilinkTitles,
  markdownToBlocks,
} from "@/features/markdown/importMarkdown";

const noResolve = () => null;

describe("extractWikilinkTitles", () => {
  it("finds every distinct [[title]] in a document", () => {
    const md = "See [[Getting Started]] and also [[Roadmap]].";
    expect(extractWikilinkTitles(md)).toEqual(["Getting Started", "Roadmap"]);
  });

  it("deduplicates repeated mentions of the same title", () => {
    const md = "[[Notes]] and again [[Notes]].";
    expect(extractWikilinkTitles(md)).toEqual(["Notes"]);
  });

  it("returns an empty array when there are no wikilinks", () => {
    expect(extractWikilinkTitles("Just plain text.")).toEqual([]);
  });
});

describe("extractTitleFromMarkdown", () => {
  it("uses a leading H1 as the title", () => {
    expect(extractTitleFromMarkdown("# My Page\n\nSome content.")).toBe("My Page");
  });

  it("returns null when the document doesn't start with an H1", () => {
    expect(extractTitleFromMarkdown("Just a paragraph, no heading.")).toBeNull();
  });

  it("returns null when the first heading isn't a top-level H1", () => {
    expect(extractTitleFromMarkdown("## Not a title\n\nContent.")).toBeNull();
  });
});

describe("markdownToBlocks", () => {
  it("excludes a leading H1 from the blocks (it becomes the page title instead)", () => {
    const blocks = markdownToBlocks("# Title\n\nBody text.", noResolve);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({ type: "paragraph", content: { html: "Body text." } });
  });

  it("maps heading depths 1–3 directly and folds deeper headings into heading3", () => {
    const blocks = markdownToBlocks("## Two\n\n#### Four", noResolve);
    expect(blocks.map((b) => b.type)).toEqual(["heading2", "heading3"]);
  });

  it("converts bold, italic, code, and strikethrough marks", () => {
    const blocks = markdownToBlocks("**bold** *italic* `code` ~~gone~~", noResolve);
    expect(blocks[0].content.html).toBe(
      "<strong>bold</strong> <em>italic</em> <code>code</code> <s>gone</s>",
    );
  });

  it("converts a bullet list", () => {
    const blocks = markdownToBlocks("- one\n- two", noResolve);
    expect(blocks).toEqual([
      { type: "bulletList", content: { html: "one" } },
      { type: "bulletList", content: { html: "two" } },
    ]);
  });

  it("converts an ordered list to numberedList blocks", () => {
    const blocks = markdownToBlocks("1. first\n2. second", noResolve);
    expect(blocks.map((b) => b.type)).toEqual(["numberedList", "numberedList"]);
  });

  it("converts a task list into checklist blocks with the checked state", () => {
    const blocks = markdownToBlocks("- [ ] todo\n- [x] done", noResolve);
    expect(blocks).toEqual([
      { type: "checklist", content: { html: "todo", checked: false } },
      { type: "checklist", content: { html: "done", checked: true } },
    ]);
  });

  it("converts a blockquote to a quote block", () => {
    const blocks = markdownToBlocks("> a quote", noResolve);
    expect(blocks).toEqual([{ type: "quote", content: { html: "a quote" } }]);
  });

  it("converts a fenced code block with its language", () => {
    const blocks = markdownToBlocks("```ts\nconst x = 1;\n```", noResolve);
    expect(blocks).toEqual([
      { type: "code", content: { code: "const x = 1;", language: "ts" } },
    ]);
  });

  it("converts a horizontal rule to a divider", () => {
    expect(markdownToBlocks("---", noResolve)).toEqual([{ type: "divider", content: {} }]);
  });

  it("converts a standalone image paragraph into an image block", () => {
    const blocks = markdownToBlocks("![a cat](https://example.com/cat.png)", noResolve);
    expect(blocks).toEqual([
      { type: "image", content: { url: "https://example.com/cat.png", alt: "a cat" } },
    ]);
  });

  it("converts a table into rows of plain-text cells", () => {
    const md = "| Name | Status |\n| --- | --- |\n| Alice | Done |";
    const blocks = markdownToBlocks(md, noResolve);
    expect(blocks).toEqual([
      {
        type: "table",
        content: {
          rows: [
            ["Name", "Status"],
            ["Alice", "Done"],
          ],
        },
      },
    ]);
  });

  it("drops the URL from a hyperlink but keeps its label text", () => {
    const blocks = markdownToBlocks("See [the docs](https://example.com) for more.", noResolve);
    expect(blocks[0].content.html).toBe("See the docs for more.");
  });

  it("resolves a [[wikilink]] to a real chip when resolveTitle finds a match", () => {
    const resolve = (title: string) => (title === "Getting Started" ? "page-123" : null);
    const blocks = markdownToBlocks("See [[Getting Started]] for more.", resolve);
    expect(blocks[0].content.html).toBe(
      'See <span data-page-link="" data-page-id="page-123" class="page-link-chip">↗ Getting Started</span> for more.',
    );
  });

  it("leaves a wikilink as plain [[Title]] text when resolveTitle can't find it", () => {
    const blocks = markdownToBlocks("See [[Nowhere]] for more.", noResolve);
    expect(blocks[0].content.html).toBe("See [[Nowhere]] for more.");
  });

  it("preserves unsupported content as a visible paragraph instead of silently dropping it", () => {
    const blocks = markdownToBlocks(
      "<details><summary>Toggle</summary>Hidden</details>",
      noResolve,
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("paragraph");
    expect(blocks[0].content.html).toContain("details");
  });

  it("returns an empty array for a blank document", () => {
    expect(markdownToBlocks("", noResolve)).toEqual([]);
  });
});
