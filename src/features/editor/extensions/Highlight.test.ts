import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it } from "vitest";

import { Highlight, isHighlightColor } from "./Highlight";

let editor: Editor | null = null;

function makeEditor(content: string): Editor {
  editor = new Editor({ extensions: [StarterKit, Highlight], content });
  return editor;
}

afterEach(() => editor?.destroy());

describe("Highlight mark", () => {
  it("applies a color to the selection and writes it as <mark data-color>", () => {
    const e = makeEditor("<p>hello world</p>");
    e.chain().setTextSelection({ from: 1, to: 6 }).setHighlight("green").run();
    expect(e.getHTML()).toBe('<p><mark data-color="green">hello</mark> world</p>');
  });

  it("switches color and removes the highlight again", () => {
    const e = makeEditor("<p>hello</p>");
    e.chain().selectAll().setHighlight("blue").run();
    e.chain().selectAll().setHighlight("pink").run();
    expect(e.getHTML()).toBe('<p><mark data-color="pink">hello</mark></p>');

    e.chain().selectAll().unsetHighlight().run();
    expect(e.getHTML()).toBe("<p>hello</p>");
  });

  it("falls back to yellow for a color it doesn't know", () => {
    const e = makeEditor('<p><mark data-color="javascript:alert(1)">x</mark></p>');
    expect(e.getHTML()).toBe('<p><mark data-color="yellow">x</mark></p>');
  });

  it("reads highlights from stored HTML without a color attribute", () => {
    const e = makeEditor("<p><mark>x</mark></p>");
    e.commands.selectAll();
    expect(e.isActive("highlight", { color: "yellow" })).toBe(true);
  });
});

describe("isHighlightColor", () => {
  it("accepts only the palette", () => {
    expect(isHighlightColor("pink")).toBe(true);
    expect(isHighlightColor("purple")).toBe(false);
    expect(isHighlightColor(undefined)).toBe(false);
  });
});
