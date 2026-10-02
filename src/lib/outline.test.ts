import { describe, expect, it } from "vitest";

import { getOutline } from "./outline";
import type { Block, BlockType } from "@/types/entities";

let counter = 0;
function block(type: BlockType, html: string, overrides: Partial<Block> = {}): Block {
  counter += 1;
  return {
    id: `b${counter}`,
    pageId: "p1",
    parentBlockId: null,
    type,
    order: counter,
    content: { html },
    ...overrides,
  };
}

function byId(...blocks: Block[]): Record<string, Block> {
  return Object.fromEntries(blocks.map((b) => [b.id, b]));
}

describe("getOutline", () => {
  it("lists headings in order with their level and plain text", () => {
    const h1 = block("heading1", "<p>Intro</p>");
    const text = block("paragraph", "<p>not a heading</p>");
    const h2 = block("heading2", "<p>Details <strong>here</strong></p>");
    expect(getOutline(byId(h2, text, h1), "p1")).toEqual([
      { blockId: h1.id, level: 1, text: "Intro" },
      { blockId: h2.id, level: 2, text: "Details here" },
    ]);
  });

  it("skips empty headings and other pages", () => {
    const empty = block("heading1", "<p> </p>");
    const other = block("heading1", "<p>Elsewhere</p>", { pageId: "p2" });
    expect(getOutline(byId(empty, other), "p1")).toEqual([]);
  });

  it("includes headings nested in a toggle, in document order", () => {
    const first = block("heading1", "<p>First</p>");
    const toggle = block("toggle", "<p>More</p>");
    const inner = block("heading3", "<p>Inside</p>", { parentBlockId: toggle.id, order: 1 });
    const last = block("heading1", "<p>Last</p>");
    const items = getOutline(byId(last, inner, toggle, first), "p1");
    expect(items.map((i) => i.text)).toEqual(["First", "Inside", "Last"]);
  });

  it("leaves out headings inside a collapsed toggle", () => {
    const toggle = block("toggle", "<p>More</p>");
    const inner = block("heading2", "<p>Hidden</p>", { parentBlockId: toggle.id, order: 1 });
    expect(getOutline(byId(toggle, inner), "p1", { [toggle.id]: true })).toEqual([]);
    expect(getOutline(byId(toggle, inner), "p1", { [toggle.id]: false })).toHaveLength(1);
  });
});
