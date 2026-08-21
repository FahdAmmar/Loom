import { describe, expect, it } from "vitest";

import { buildPageTree, flattenVisibleTree, getAncestors, getDescendantIds } from "@/lib/tree";
import { makePage } from "@/test/fixtures";

describe("buildPageTree", () => {
  it("returns an empty array for an empty map", () => {
    expect(buildPageTree({})).toEqual([]);
  });

  it("nests children under their parent", () => {
    const root = makePage({ id: "root", parentId: null, order: 0 });
    const child = makePage({ id: "child", parentId: "root", order: 0 });
    const grandchild = makePage({ id: "grandchild", parentId: "child", order: 0 });

    const tree = buildPageTree({
      [root.id]: root,
      [child.id]: child,
      [grandchild.id]: grandchild,
    });

    expect(tree).toHaveLength(1);
    expect(tree[0].page.id).toBe("root");
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].page.id).toBe("child");
    expect(tree[0].children[0].children[0].page.id).toBe("grandchild");
  });

  it("orders siblings by their order field, not insertion order", () => {
    const second = makePage({ id: "second", parentId: null, order: 1 });
    const first = makePage({ id: "first", parentId: null, order: 0 });

    // Deliberately inserted out of order.
    const tree = buildPageTree({ [second.id]: second, [first.id]: first });

    expect(tree.map((n) => n.page.id)).toEqual(["first", "second"]);
  });

  it("keeps multiple top-level pages as separate roots", () => {
    const a = makePage({ id: "a", parentId: null, order: 0 });
    const b = makePage({ id: "b", parentId: null, order: 1 });

    const tree = buildPageTree({ [a.id]: a, [b.id]: b });

    expect(tree).toHaveLength(2);
  });

  it("silently drops a page whose parentId points at a page that doesn't exist", () => {
    // Matches real usage: a page mid-delete, or a corrupt import — the tree
    // builder shouldn't throw, it should just not surface the orphan.
    const orphan = makePage({ id: "orphan", parentId: "missing-parent", order: 0 });
    const tree = buildPageTree({ [orphan.id]: orphan });
    expect(tree).toEqual([]);
  });
});

describe("flattenVisibleTree", () => {
  it("flattens a nested tree into depth-annotated rows in visual order", () => {
    const root = makePage({ id: "root", parentId: null, order: 0 });
    const child = makePage({ id: "child", parentId: "root", order: 0 });
    const sibling = makePage({ id: "sibling", parentId: null, order: 1 });
    const tree = buildPageTree({
      [root.id]: root,
      [child.id]: child,
      [sibling.id]: sibling,
    });

    const flat = flattenVisibleTree(tree, {});
    expect(flat.map((r) => [r.page.id, r.depth])).toEqual([
      ["root", 0],
      ["child", 1],
      ["sibling", 0],
    ]);
  });

  it("marks a page with children as hasChildren", () => {
    const root = makePage({ id: "root", parentId: null });
    const child = makePage({ id: "child", parentId: "root" });
    const tree = buildPageTree({ [root.id]: root, [child.id]: child });

    const flat = flattenVisibleTree(tree, {});
    expect(flat.find((r) => r.page.id === "root")?.hasChildren).toBe(true);
    expect(flat.find((r) => r.page.id === "child")?.hasChildren).toBe(false);
  });

  it("omits a collapsed page's descendants entirely, not just hides them", () => {
    const root = makePage({ id: "root", parentId: null });
    const child = makePage({ id: "child", parentId: "root" });
    const grandchild = makePage({ id: "grandchild", parentId: "child" });
    const tree = buildPageTree({
      [root.id]: root,
      [child.id]: child,
      [grandchild.id]: grandchild,
    });

    const flat = flattenVisibleTree(tree, { root: true });
    expect(flat.map((r) => r.page.id)).toEqual(["root"]);
  });

  it("still shows a nested branch when only an ancestor further up is expanded", () => {
    const root = makePage({ id: "root", parentId: null });
    const child = makePage({ id: "child", parentId: "root" });
    const grandchild = makePage({ id: "grandchild", parentId: "child" });
    const tree = buildPageTree({
      [root.id]: root,
      [child.id]: child,
      [grandchild.id]: grandchild,
    });

    // Collapsing an unrelated page shouldn't affect this branch.
    const flat = flattenVisibleTree(tree, { "some-other-page": true });
    expect(flat.map((r) => r.page.id)).toEqual(["root", "child", "grandchild"]);
  });
});

describe("getAncestors", () => {
  it("returns an empty array for a top-level page", () => {
    const root = makePage({ id: "root", parentId: null });
    expect(getAncestors({ [root.id]: root }, "root")).toEqual([]);
  });

  it("returns ancestors root-first", () => {
    const root = makePage({ id: "root", parentId: null });
    const mid = makePage({ id: "mid", parentId: "root" });
    const leaf = makePage({ id: "leaf", parentId: "mid" });
    const pagesById = { [root.id]: root, [mid.id]: mid, [leaf.id]: leaf };

    expect(getAncestors(pagesById, "leaf").map((p) => p.id)).toEqual(["root", "mid"]);
  });

  it("stops cleanly if an ancestor id is missing from the map", () => {
    const leaf = makePage({ id: "leaf", parentId: "missing" });
    expect(getAncestors({ [leaf.id]: leaf }, "leaf")).toEqual([]);
  });

  it("returns an empty array for an unknown page id", () => {
    expect(getAncestors({}, "nope")).toEqual([]);
  });
});

describe("getDescendantIds", () => {
  it("returns an empty array for a leaf page", () => {
    const leaf = makePage({ id: "leaf", parentId: null });
    expect(getDescendantIds({ [leaf.id]: leaf }, "leaf")).toEqual([]);
  });

  it("collects all descendants, not just direct children", () => {
    const root = makePage({ id: "root", parentId: null });
    const child = makePage({ id: "child", parentId: "root" });
    const grandchild = makePage({ id: "grandchild", parentId: "child" });
    const pagesById = { [root.id]: root, [child.id]: child, [grandchild.id]: grandchild };

    const ids = getDescendantIds(pagesById, "root");
    expect(ids.sort()).toEqual(["child", "grandchild"]);
  });

  it("doesn't include unrelated siblings", () => {
    const root = makePage({ id: "root", parentId: null });
    const child = makePage({ id: "child", parentId: "root" });
    const unrelated = makePage({ id: "unrelated", parentId: null });
    const pagesById = { [root.id]: root, [child.id]: child, [unrelated.id]: unrelated };

    expect(getDescendantIds(pagesById, "root")).toEqual(["child"]);
  });
});
