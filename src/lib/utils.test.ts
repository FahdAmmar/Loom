import { describe, expect, it } from "vitest";

import { arrayMove } from "@/lib/utils";

describe("arrayMove", () => {
  it("moving backward (to a lower index) inserts before the original occupant of that index", () => {
    expect(arrayMove(["a", "b", "c", "d"], 2, 0)).toEqual(["c", "a", "b", "d"]);
  });

  it("moving forward (to a higher index) inserts after the original occupant of that index", () => {
    expect(arrayMove(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
  });

  it("does not mutate the original array", () => {
    const original = ["a", "b", "c"];
    arrayMove(original, 0, 2);
    expect(original).toEqual(["a", "b", "c"]);
  });

  it("is a no-op moving an item to its own index", () => {
    expect(arrayMove(["a", "b", "c"], 1, 1)).toEqual(["a", "b", "c"]);
  });

  it("moving the first item to the last index appends it", () => {
    expect(arrayMove(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("moving the last item to the first index prepends it", () => {
    expect(arrayMove(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });
});
