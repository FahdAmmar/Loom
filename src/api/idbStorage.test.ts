import { describe, expect, it } from "vitest";

import { idbDelete, idbGet, idbSet } from "@/api/idbStorage";

describe("idbStorage", () => {
  it("returns undefined for a key that was never set", async () => {
    expect(await idbGet("missing-key")).toBeUndefined();
  });

  it("round-trips a value through set and get", async () => {
    await idbSet("greeting", { text: "hello" });
    expect(await idbGet("greeting")).toEqual({ text: "hello" });
  });

  it("overwrites an existing value for the same key", async () => {
    await idbSet("counter", 1);
    await idbSet("counter", 2);
    expect(await idbGet("counter")).toBe(2);
  });

  it("removes a value on delete", async () => {
    await idbSet("temp", "value");
    await idbDelete("temp");
    expect(await idbGet("temp")).toBeUndefined();
  });

  it("keeps different keys independent", async () => {
    await idbSet("a", "first");
    await idbSet("b", "second");
    expect(await idbGet("a")).toBe("first");
    expect(await idbGet("b")).toBe("second");
  });
});
