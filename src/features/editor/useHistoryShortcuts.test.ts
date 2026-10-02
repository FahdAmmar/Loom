import { describe, expect, it } from "vitest";

import { historyDirection } from "./useHistoryShortcuts";

function key(init: KeyboardEventInit) {
  return new KeyboardEvent("keydown", init);
}

describe("historyDirection", () => {
  it("maps ⌘Z and Ctrl+Z to undo", () => {
    expect(historyDirection(key({ key: "z", metaKey: true }))).toBe("undo");
    expect(historyDirection(key({ key: "Z", ctrlKey: true }))).toBe("undo");
  });

  it("maps ⌘⇧Z and Ctrl+Y to redo", () => {
    expect(historyDirection(key({ key: "z", metaKey: true, shiftKey: true }))).toBe("redo");
    expect(historyDirection(key({ key: "y", ctrlKey: true }))).toBe("redo");
  });

  it("ignores plain keys, other shortcuts, and Alt combinations", () => {
    expect(historyDirection(key({ key: "z" }))).toBeNull();
    expect(historyDirection(key({ key: "b", metaKey: true }))).toBeNull();
    expect(historyDirection(key({ key: "z", metaKey: true, altKey: true }))).toBeNull();
  });
});
