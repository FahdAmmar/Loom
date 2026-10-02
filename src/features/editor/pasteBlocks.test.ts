import { describe, expect, it } from "vitest";

import { draftsFromPaste } from "./pasteBlocks";

const noTitles = () => null;

describe("draftsFromPaste", () => {
  it("returns nothing for the default intent", () => {
    expect(draftsFromPaste({ kind: "default" }, noTitles)).toEqual([]);
  });

  it("builds an embed from a YouTube URL", () => {
    const url = "https://youtu.be/dQw4w9WgXcQ";
    expect(draftsFromPaste({ kind: "youtube", url }, noTitles)).toEqual([
      { type: "embed", content: { url } },
    ]);
  });

  it("escapes HTML and keeps single newlines as line breaks in pasted paragraphs", () => {
    const drafts = draftsFromPaste(
      { kind: "paragraphs", paragraphs: ["a <b>\nsecond line", "two"] },
      noTitles,
    );
    expect(drafts).toEqual([
      { type: "paragraph", content: { html: "a &lt;b&gt;<br>second line" } },
      { type: "paragraph", content: { html: "two" } },
    ]);
  });

  it("converts Markdown headings and lists into blocks", () => {
    const drafts = draftsFromPaste(
      { kind: "markdown", text: "## Plan\n\n- one\n- two" },
      noTitles,
    );
    expect(drafts.map((d) => d.type)).toEqual(["heading2", "bulletList", "bulletList"]);
  });

  it("keeps a leading H1 as a heading block instead of dropping it as a title", () => {
    const drafts = draftsFromPaste({ kind: "markdown", text: "# Title\n\nbody" }, noTitles);
    expect(drafts.map((d) => d.type)).toEqual(["heading1", "paragraph"]);
    expect(drafts[0].content).toEqual({ html: "Title" });
  });

  it("does not mistake a level-2 heading for a leading H1", () => {
    const drafts = draftsFromPaste({ kind: "markdown", text: "## Sub" }, noTitles);
    expect(drafts.map((d) => d.type)).toEqual(["heading2"]);
  });

  it("turns a fenced code block into a code block", () => {
    const drafts = draftsFromPaste(
      { kind: "markdown", text: "```js\nlet a = 1;\n```" },
      noTitles,
    );
    expect(drafts).toEqual([{ type: "code", content: { code: "let a = 1;", language: "js" } }]);
  });
});
