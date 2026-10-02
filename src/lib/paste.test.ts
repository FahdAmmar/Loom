import { describe, expect, it } from "vitest";

import { classifyPaste, looksLikeMarkdown, pickImageFile, type PasteData } from "./paste";

function paste(overrides: Partial<PasteData>): PasteData {
  return {
    text: "",
    hasHtml: false,
    isCodeEditor: false,
    files: [],
    isBlockEmpty: true,
    ...overrides,
  };
}

describe("looksLikeMarkdown", () => {
  it.each([
    ["# Title"],
    ["- item"],
    ["* item"],
    ["1. first"],
    ["2) second"],
    ["> quoted"],
    ["- [ ] task"],
    ["intro\n```js\ncode\n```"],
    ["| a | b |\n| --- | --- |\n| 1 | 2 |"],
  ])("detects %j", (text) => {
    expect(looksLikeMarkdown(text)).toBe(true);
  });

  it.each([
    ["just a sentence"],
    ["#hashtag"],
    ["-5 degrees"],
    ["**bold** only"],
    ["3.14 is pi"],
  ])("ignores %j", (text) => {
    expect(looksLikeMarkdown(text)).toBe(false);
  });
});

describe("classifyPaste", () => {
  it("turns an image-only paste into an image intent", () => {
    const file = new File(["x"], "shot.png", { type: "image/png" });
    expect(classifyPaste(paste({ files: [file] }))).toEqual({ kind: "image", file });
  });

  it("prefers the text when an image preview arrives alongside it", () => {
    const file = new File(["x"], "table.png", { type: "image/png" });
    expect(classifyPaste(paste({ text: "a\tb", hasHtml: true, files: [file] }))).toEqual({
      kind: "default",
    });
  });

  it("leaves empty pastes to the default handler", () => {
    expect(classifyPaste(paste({ text: "   \n " }))).toEqual({ kind: "default" });
  });

  it("turns a lone YouTube URL into an embed, even with HTML attached", () => {
    const url = "https://youtu.be/dQw4w9WgXcQ";
    expect(classifyPaste(paste({ text: `${url}\n`, hasHtml: true }))).toEqual({
      kind: "youtube",
      url,
    });
  });

  it("does not embed a YouTube URL that sits inside a sentence", () => {
    const text = "watch https://youtu.be/dQw4w9WgXcQ later";
    expect(classifyPaste(paste({ text })).kind).toBe("default");
  });

  it("keeps rich HTML pastes on the default path", () => {
    expect(classifyPaste(paste({ text: "# Title", hasHtml: true }))).toEqual({
      kind: "default",
    });
  });

  it("treats VS Code copies as source text despite the attached HTML", () => {
    const result = classifyPaste(
      paste({ text: "# Title\n\n- a", hasHtml: true, isCodeEditor: true }),
    );
    expect(result.kind).toBe("markdown");
  });

  it("detects Markdown in a plain-text paste", () => {
    expect(classifyPaste(paste({ text: "## Plan\n- one\n- two" }))).toEqual({
      kind: "markdown",
      text: "## Plan\n- one\n- two",
    });
  });

  it("splits plain text into paragraphs on blank lines", () => {
    expect(classifyPaste(paste({ text: "first\nline two\n\nsecond" }))).toEqual({
      kind: "paragraphs",
      paragraphs: ["first\nline two", "second"],
    });
  });

  it("leaves a single plain paragraph to the default handler", () => {
    expect(classifyPaste(paste({ text: "one\nwrapped paragraph" }))).toEqual({
      kind: "default",
    });
  });
});

describe("pickImageFile", () => {
  it("returns the first image and skips other files", () => {
    const doc = new File(["x"], "a.pdf", { type: "application/pdf" });
    const png = new File(["x"], "a.png", { type: "image/png" });
    expect(pickImageFile([doc, png])).toBe(png);
  });

  it("returns null when there is no image", () => {
    expect(pickImageFile([])).toBeNull();
  });
});
