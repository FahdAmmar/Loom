import { describe, expect, it } from "vitest";

import {
  buildDragAnnouncements,
  buildDragInstructions,
  describeBlock,
} from "./dragAnnouncements";
import { translate } from "@/i18n";
import type { Block } from "@/types/entities";

const en = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) =>
  translate("en", key, params);
const ar = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) =>
  translate("ar", key, params);

function block(
  id: string,
  order: number,
  html: string,
  parentBlockId: string | null = null,
): Block {
  return {
    id,
    pageId: "p1",
    parentBlockId,
    type: "paragraph",
    order,
    content: { html },
  } as Block;
}

const blocks = Object.fromEntries(
  [
    block("a", 1, "<p>First</p>"),
    block("b", 2, "<p>Second</p>"),
    block("c", 3, "<p></p>"),
    block("n1", 1, "<p>Nested</p>", "t"),
    block("long", 4, `<p>${"word ".repeat(30)}</p>`),
  ].map((b) => [b.id, b]),
);

describe("describeBlock", () => {
  it("names the block by its text and counts its siblings", () => {
    expect(describeBlock("b", null, blocks, en)).toEqual({
      name: "“Second”",
      position: 2,
      total: 4,
    });
  });

  it("uses the slot of the block it is hovering over", () => {
    expect(describeBlock("a", "c", blocks, en)).toMatchObject({ position: 3 });
  });

  it("describes an empty block in words and clips a long one", () => {
    expect(describeBlock("c", null, blocks, en)?.name).toBe("an empty block");
    const clipped = describeBlock("long", null, blocks, en)?.name ?? "";
    expect(clipped.endsWith("…”")).toBe(true);
    expect(clipped.length).toBeLessThan(50);
  });

  it("counts a nested block only among its own siblings", () => {
    expect(describeBlock("n1", null, blocks, en)).toMatchObject({ position: 1, total: 1 });
  });

  it("returns null for an unknown block", () => {
    expect(describeBlock("zz", null, blocks, en)).toBeNull();
  });
});

describe("buildDragAnnouncements", () => {
  const announce = buildDragAnnouncements(() => blocks, en);
  const active = { id: "a" } as never;

  it("announces pick-up, movement, drop, and cancel with positions", () => {
    expect(announce.onDragStart?.({ active })).toBe("Picked up “First”. Position 1 of 4.");
    expect(announce.onDragOver?.({ active, over: { id: "c" } as never })).toBe(
      "“First” moved to position 3 of 4.",
    );
    expect(announce.onDragEnd?.({ active, over: { id: "b" } as never })).toBe(
      "“First” dropped at position 2 of 4.",
    );
    expect(announce.onDragCancel?.({ active, over: null })).toBe(
      "Move cancelled. “First” is back at position 1 of 4.",
    );
  });

  it("stays quiet for a block that no longer exists", () => {
    expect(announce.onDragStart?.({ active: { id: "zz" } as never })).toBeUndefined();
  });

  it("announces in Arabic", () => {
    const arabic = buildDragAnnouncements(() => blocks, ar);
    expect(arabic.onDragStart?.({ active })).toBe("تم التقاط “First”. الموضع 1 من 4.");
    expect(buildDragInstructions(ar).draggable).toContain("مسطرة المسافة");
  });
});
