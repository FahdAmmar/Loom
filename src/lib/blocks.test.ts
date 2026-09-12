import { describe, expect, it } from "vitest";

import {
  detectMentionTrigger,
  extractPageLinkIdsFromHtml,
  extractPlainText,
  getDescendantBlockIds,
  getOrderedBlocks,
  groupIntoRuns,
  insertWikilinkForMention,
  updateWikilinkTitlesInHtml,
} from "@/lib/blocks";
import { makeBlock } from "@/test/fixtures";

describe("extractPageLinkIdsFromHtml", () => {
  it("returns an empty array when there are no links", () => {
    expect(extractPageLinkIdsFromHtml("<p>just text</p>")).toEqual([]);
  });

  it("extracts a single wikilink chip's target id", () => {
    const html =
      '<span data-page-link data-page-id="page-42" class="page-link-chip">↗ Notes</span>';
    expect(extractPageLinkIdsFromHtml(html)).toEqual(["page-42"]);
  });

  it("extracts multiple chips regardless of attribute order", () => {
    const html =
      '<p>See <span data-page-id="page-1" data-page-link>A</span> and ' +
      '<span data-page-link data-page-id="page-2">B</span></p>';
    expect(extractPageLinkIdsFromHtml(html)).toEqual(["page-1", "page-2"]);
  });

  it("ignores a span with data-page-id but no data-page-link marker", () => {
    const html = '<span data-page-id="page-1">not a real chip</span>';
    expect(extractPageLinkIdsFromHtml(html)).toEqual([]);
  });
});

describe("updateWikilinkTitlesInHtml", () => {
  it("rewrites the displayed title of a matching chip", () => {
    const html =
      '<span data-page-link data-page-id="page-1" class="page-link-chip">↗ Old</span>';
    const result = updateWikilinkTitlesInHtml(html, "page-1", "New");
    expect(result).toBe(
      '<span data-page-link data-page-id="page-1" class="page-link-chip">↗ New</span>',
    );
  });

  it("leaves chips pointing at a different page untouched", () => {
    const html =
      '<span data-page-link data-page-id="page-2" class="page-link-chip">↗ Old</span>';
    const result = updateWikilinkTitlesInHtml(html, "page-1", "New");
    expect(result).toBe(html);
  });

  it("only updates the matching chip when several point at different pages", () => {
    const html =
      '<p>See <span data-page-link data-page-id="page-1">↗ Old A</span> and ' +
      '<span data-page-link data-page-id="page-2">↗ Old B</span></p>';
    const result = updateWikilinkTitlesInHtml(html, "page-1", "New A");
    expect(result).toBe(
      '<p>See <span data-page-link data-page-id="page-1">↗ New A</span> and ' +
        '<span data-page-link data-page-id="page-2">↗ Old B</span></p>',
    );
  });

  it("updates every chip pointing at the same page when there are several", () => {
    const html =
      '<span data-page-link data-page-id="page-1">↗ Old</span> and again ' +
      '<span data-page-link data-page-id="page-1">↗ Old</span>';
    const result = updateWikilinkTitlesInHtml(html, "page-1", "New");
    expect(result).toBe(
      '<span data-page-link data-page-id="page-1">↗ New</span> and again ' +
        '<span data-page-link data-page-id="page-1">↗ New</span>',
    );
  });

  it("works regardless of attribute order", () => {
    const html =
      '<span data-page-id="page-1" data-page-link class="page-link-chip">↗ Old</span>';
    const result = updateWikilinkTitlesInHtml(html, "page-1", "New");
    expect(result).toContain("↗ New");
    expect(result).not.toContain("Old");
  });

  it("returns the html unchanged when there's no matching chip", () => {
    const html = "<p>No links here.</p>";
    expect(updateWikilinkTitlesInHtml(html, "page-1", "New")).toBe(html);
  });

  it("is safe against regex-special characters in the page id", () => {
    const html = '<span data-page-link data-page-id="page-(1)">↗ Old</span>';
    const result = updateWikilinkTitlesInHtml(html, "page-(1)", "New");
    expect(result).toBe('<span data-page-link data-page-id="page-(1)">↗ New</span>');
  });
});

describe("extractPlainText", () => {
  it("strips HTML tags from text-bearing blocks", () => {
    const block = makeBlock("paragraph", { html: "<p>Hello <strong>world</strong></p>" });
    expect(extractPlainText(block)).toBe("Hello world");
  });

  it("collapses repeated whitespace left behind by stripped tags", () => {
    const block = makeBlock("paragraph", { html: "<p>a</p><p>b</p>" });
    expect(extractPlainText(block)).toBe("a b");
  });

  it("returns code content verbatim for code blocks", () => {
    const block = makeBlock("code", { code: "const x = 1;", language: "ts" });
    expect(extractPlainText(block)).toBe("const x = 1;");
  });

  it("flattens table rows into a single string", () => {
    const block = makeBlock("table", {
      rows: [
        ["Name", "Status"],
        ["Alice", "Done"],
      ],
    });
    expect(extractPlainText(block)).toBe("Name Status Alice Done");
  });

  it("combines alt and caption for image blocks", () => {
    const block = makeBlock("image", { url: "x.png", alt: "A cat", caption: "so fluffy" });
    expect(extractPlainText(block)).toBe("A cat so fluffy");
  });

  it("omits a missing alt or caption instead of leaving a gap", () => {
    const block = makeBlock("image", { url: "x.png", caption: "only a caption" });
    expect(extractPlainText(block)).toBe("only a caption");
  });

  it("flattens board columns and card titles", () => {
    const block = makeBlock("board", {
      columns: [
        { id: "c1", title: "To Do", color: "gold", cards: [{ id: "k1", title: "Ship it" }] },
        { id: "c2", title: "Done", color: "mint", cards: [] },
      ],
    });
    expect(extractPlainText(block)).toBe("To Do Ship it Done");
  });

  it("returns an empty string for an unrecognized content shape", () => {
    const block = makeBlock("divider", {});
    expect(extractPlainText(block)).toBe("");
  });
});

describe("getOrderedBlocks", () => {
  it("filters by page and sorts by order", () => {
    const b1 = makeBlock("paragraph", { html: "1" }, { pageId: "p1", order: 2 });
    const b2 = makeBlock("paragraph", { html: "2" }, { pageId: "p1", order: 0 });
    const b3 = makeBlock("paragraph", { html: "3" }, { pageId: "p1", order: 1 });
    const otherPage = makeBlock("paragraph", { html: "x" }, { pageId: "p2", order: 0 });
    const blocksById = Object.fromEntries([b1, b2, b3, otherPage].map((b) => [b.id, b]));

    const result = getOrderedBlocks(blocksById, "p1");
    expect(result.map((b) => b.content.html)).toEqual(["2", "3", "1"]);
  });

  it("defaults to top-level blocks (parentBlockId null)", () => {
    const top = makeBlock("paragraph", { html: "top" }, { pageId: "p1", parentBlockId: null });
    const nested = makeBlock(
      "bulletList",
      { html: "nested" },
      { pageId: "p1", parentBlockId: "toggle-1" },
    );
    const blocksById = { [top.id]: top, [nested.id]: nested };

    expect(getOrderedBlocks(blocksById, "p1").map((b) => b.id)).toEqual([top.id]);
  });

  it("returns a toggle's children when given its id as parentBlockId", () => {
    const child = makeBlock(
      "bulletList",
      { html: "child" },
      { pageId: "p1", parentBlockId: "toggle-1" },
    );
    const blocksById = { [child.id]: child };
    expect(getOrderedBlocks(blocksById, "p1", "toggle-1").map((b) => b.id)).toEqual([child.id]);
  });
});

describe("getDescendantBlockIds", () => {
  it("returns a toggle's nested children recursively", () => {
    const toggle = makeBlock("toggle", { html: "Toggle" }, { id: "toggle-1" });
    const child = makeBlock(
      "bulletList",
      { html: "child" },
      { id: "child-1", parentBlockId: "toggle-1" },
    );
    const grandchild = makeBlock(
      "bulletList",
      { html: "grandchild" },
      { id: "grandchild-1", parentBlockId: "child-1" },
    );
    const blocksById = {
      [toggle.id]: toggle,
      [child.id]: child,
      [grandchild.id]: grandchild,
    };

    expect(getDescendantBlockIds(blocksById, "toggle-1").sort()).toEqual(
      ["child-1", "grandchild-1"].sort(),
    );
  });

  it("returns an empty array for a block with no children", () => {
    const block = makeBlock("paragraph", { html: "leaf" }, { id: "leaf-1" });
    expect(getDescendantBlockIds({ [block.id]: block }, "leaf-1")).toEqual([]);
  });
});

describe("groupIntoRuns", () => {
  it("groups consecutive same-type list blocks into one run", () => {
    const blocks = [
      makeBlock("bulletList", { html: "a" }),
      makeBlock("bulletList", { html: "b" }),
      makeBlock("bulletList", { html: "c" }),
    ];
    const runs = groupIntoRuns(blocks);
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({ kind: "list", type: "bulletList" });
    if (runs[0].kind === "list") expect(runs[0].blocks).toHaveLength(3);
  });

  it("starts a new run when the list type changes", () => {
    const blocks = [
      makeBlock("bulletList", { html: "a" }),
      makeBlock("numberedList", { html: "b" }),
    ];
    const runs = groupIntoRuns(blocks);
    expect(runs).toHaveLength(2);
  });

  it("does not merge lists separated by a non-list block", () => {
    const blocks = [
      makeBlock("bulletList", { html: "a" }),
      makeBlock("paragraph", { html: "interrupts" }),
      makeBlock("bulletList", { html: "b" }),
    ];
    const runs = groupIntoRuns(blocks);
    expect(runs).toHaveLength(3);
    expect(runs.map((r) => r.kind)).toEqual(["list", "single", "list"]);
  });

  it("treats non-list block types as their own single-block run", () => {
    const blocks = [makeBlock("heading1", { html: "Title" }), makeBlock("table", { rows: [] })];
    const runs = groupIntoRuns(blocks);
    expect(runs).toEqual([
      { kind: "single", block: blocks[0] },
      { kind: "single", block: blocks[1] },
    ]);
  });

  it("returns an empty array for no blocks", () => {
    expect(groupIntoRuns([])).toEqual([]);
  });
});

describe("insertWikilinkForMention", () => {
  it("wraps the first plain-text mention in a wikilink chip", () => {
    const result = insertWikilinkForMention(
      "<p>See the Getting Started guide.</p>",
      "page-1",
      "Getting Started",
    );
    expect(result).toBe(
      '<p>See the <span data-page-link="" data-page-id="page-1" class="page-link-chip">↗ Getting Started</span> guide.</p>',
    );
  });

  it("matches case-insensitively but labels the chip with the target page's own title casing", () => {
    const result = insertWikilinkForMention(
      "<p>see getting started today</p>",
      "page-1",
      "Getting Started",
    );
    expect(result).toBe(
      '<p>see <span data-page-link="" data-page-id="page-1" class="page-link-chip">↗ Getting Started</span> today</p>',
    );
  });

  it("only replaces the first occurrence when a title appears twice", () => {
    const result = insertWikilinkForMention("<p>Notes and more Notes</p>", "page-1", "Notes");
    expect(result).toBe(
      '<p><span data-page-link="" data-page-id="page-1" class="page-link-chip">↗ Notes</span> and more Notes</p>',
    );
  });

  it("finds a mention in a text node immediately following an inline formatting tag", () => {
    // "Getting" is bold, "Started" isn't — the match lives entirely in the
    // second text node, right after the </strong> boundary.
    const result = insertWikilinkForMention(
      "<p><strong>Getting</strong> Started guide</p>",
      "page-1",
      "Started",
    );
    expect(result).toBe(
      '<p><strong>Getting</strong> <span data-page-link="" data-page-id="page-1" class="page-link-chip">↗ Started</span> guide</p>',
    );
  });

  it("never re-links an existing chip's own label text", () => {
    const html =
      '<p>See <span data-page-link="" data-page-id="page-2" class="page-link-chip">↗ Getting Started</span> for more.</p>';
    expect(insertWikilinkForMention(html, "page-1", "Getting Started")).toBeNull();
  });

  it("returns null when the title isn't present in the block", () => {
    expect(
      insertWikilinkForMention("<p>Unrelated content.</p>", "page-1", "Getting Started"),
    ).toBeNull();
  });

  it("returns null for an empty or whitespace-only title", () => {
    expect(insertWikilinkForMention("<p>Some text</p>", "page-1", "   ")).toBeNull();
  });
});

describe("detectMentionTrigger", () => {
  it("detects an active [[ trigger and its query", () => {
    expect(detectMentionTrigger("See the [[Getting")).toEqual({
      query: "Getting",
      length: "[[Getting".length,
    });
  });

  it("detects an active [[ trigger with an empty query right after typing it", () => {
    expect(detectMentionTrigger("See the [[")).toEqual({ query: "", length: 2 });
  });

  it("detects an @ trigger at the start of the text", () => {
    expect(detectMentionTrigger("@getti")).toEqual({ query: "getti", length: "@getti".length });
  });

  it("detects an @ trigger right after whitespace", () => {
    expect(detectMentionTrigger("ping @getti")).toEqual({
      query: "getti",
      length: "@getti".length,
    });
  });

  it("does not trigger on an @ with no whitespace or line-start before it (e.g. an email address)", () => {
    expect(detectMentionTrigger("contact me at foo@bar")).toBeNull();
  });

  it("prefers a [[ match over an @ match when both could apply", () => {
    // an unrelated "@" earlier in the line shouldn't win over the active [[ at the cursor
    expect(detectMentionTrigger("ping @someone then [[Getting")).toEqual({
      query: "Getting",
      length: "[[Getting".length,
    });
  });

  it("stops matching once the query contains whitespace", () => {
    expect(detectMentionTrigger("@two words")).toBeNull();
  });

  it("returns null when neither trigger is active", () => {
    expect(detectMentionTrigger("just some plain text")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(detectMentionTrigger("")).toBeNull();
  });
});
