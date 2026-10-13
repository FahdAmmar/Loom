import { beforeEach, describe, expect, it } from "vitest";

import { initDb } from "@/api/_mockDb";
import { exportWorkspace, parseWorkspaceExport } from "@/api/backup";

beforeEach(async () => {
  await initDb();
});

describe("parseWorkspaceExport", () => {
  it("accepts a real export of the seed workspace", async () => {
    const exported = await exportWorkspace("default");
    const parsed = parseWorkspaceExport(JSON.stringify(exported));
    expect(parsed.pages.length).toBe(exported.pages.length);
    expect(parsed.blocks.length).toBe(exported.blocks.length);
    expect(parsed.templates.length).toBe(exported.templates.length);
  });

  it("rejects invalid JSON", () => {
    expect(() => parseWorkspaceExport("{nope")).toThrow(/valid JSON/);
  });

  it("rejects a file from a newer Loom version", () => {
    expect(() => parseWorkspaceExport(JSON.stringify({ formatVersion: 99 }))).toThrow(/newer/);
  });

  it("points at the first invalid field", async () => {
    const exported = await exportWorkspace("default");
    const broken = { ...exported, pages: [{ ...exported.pages[0], title: 42 }] };
    expect(() => parseWorkspaceExport(JSON.stringify(broken))).toThrow(/pages\[0\]\.title/);
  });

  it("rejects an unknown block type", async () => {
    const exported = await exportWorkspace("default");
    const broken = { ...exported, blocks: [{ ...exported.blocks[0], type: "script" }] };
    expect(() => parseWorkspaceExport(JSON.stringify(broken))).toThrow(/blocks\[0\]\.type/);
  });

  it("fills missing secondary tables with empty arrays", async () => {
    const { workspace, pages, blocks, formatVersion, exportedAt } =
      await exportWorkspace("default");
    const parsed = parseWorkspaceExport(
      JSON.stringify({ formatVersion, exportedAt, workspace, pages, blocks }),
    );
    expect(parsed.links).toEqual([]);
    expect(parsed.templates).toEqual([]);
  });
});
