import { unzipSync, strFromU8 } from "fflate";
import { describe, expect, it } from "vitest";

import type { WorkspaceExport } from "@/api/backup";
import { workspaceToMarkdownZip } from "@/features/markdown/exportZip";
import { makeBlock, makePage } from "@/test/fixtures";

function exportOf(pages: WorkspaceExport["pages"], blocks: WorkspaceExport["blocks"]) {
  return { pages, blocks } as WorkspaceExport;
}

describe("workspaceToMarkdownZip", () => {
  it("writes one .md per live page and skips trashed ones", () => {
    const zip = workspaceToMarkdownZip(
      exportOf(
        [
          makePage({ id: "a", title: "Alpha" }),
          makePage({ id: "b", title: "Gone", deletedAt: "2026-01-01T00:00:00Z" }),
        ],
        [makeBlock("paragraph", { html: "hi there" }, { pageId: "a" })],
      ),
    );
    const files = unzipSync(zip);
    expect(Object.keys(files)).toEqual(["Alpha.md"]);
    expect(strFromU8(files["Alpha.md"])).toContain("# Alpha");
    expect(strFromU8(files["Alpha.md"])).toContain("hi there");
  });

  it("de-duplicates equal titles and keeps Arabic names", () => {
    const zip = workspaceToMarkdownZip(
      exportOf(
        [
          makePage({ id: "a", title: "Notes" }),
          makePage({ id: "b", title: "Notes" }),
          makePage({ id: "c", title: "ملاحظات" }),
        ],
        [],
      ),
    );
    expect(Object.keys(unzipSync(zip)).sort()).toEqual(
      ["Notes-2.md", "Notes.md", "ملاحظات.md"].sort(),
    );
  });
});
