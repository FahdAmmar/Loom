import { beforeEach, describe, expect, it } from "vitest";

import { initDb, mockDb } from "@/api/_mockDb";
import { importMarkdownFiles, MAX_IMPORT_FILES } from "@/api/markdownImport";

const WORKSPACE = "default";

beforeEach(async () => {
  await initDb();
});

function pagesTitled(title: string) {
  return Object.values(mockDb.read().pages).filter((p) => p.title === title);
}

describe("importMarkdownFiles", () => {
  it("creates a page per file, titled from the first H1 or the file name", async () => {
    const result = await importMarkdownFiles(
      [
        { name: "a.md", text: "# Heading title\n\nBody" },
        { name: "plain-note.md", text: "Just text" },
      ],
      WORKSPACE,
    );
    expect(result.imported).toBe(2);
    const [page] = pagesTitled("Heading title");
    expect(page).toBeDefined();
    expect(pagesTitled("plain-note")).toHaveLength(1);

    const blocks = Object.values(mockDb.read().blocks).filter((b) => b.pageId === page.id);
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.every((b) => b.parentBlockId === null)).toBe(true);
  });

  it("links [[wikilinks]] between imported files and creates placeholders for unknown ones", async () => {
    const result = await importMarkdownFiles(
      [
        { name: "one.md", text: "# One\n\nSee [[Two]] and [[Ghost Page]]" },
        { name: "two.md", text: "# Two\n\nBack to [[One]]" },
      ],
      WORKSPACE,
    );
    expect(result.placeholders).toBe(1);

    const db = mockDb.read();
    const one = pagesTitled("One")[0];
    const two = pagesTitled("Two")[0];
    const ghost = pagesTitled("Ghost Page")[0];
    const links = Object.values(db.links);
    const has = (from: string, to: string) =>
      links.some((l) => l.sourcePageId === from && l.targetPageId === to);
    expect(has(one.id, two.id)).toBe(true);
    expect(has(one.id, ghost.id)).toBe(true);
    expect(has(two.id, one.id)).toBe(true);
  });

  it("links to an existing page instead of creating a duplicate", async () => {
    const existing = Object.values(mockDb.read().pages).find((p) => !p.deletedAt)!;
    const result = await importMarkdownFiles(
      [{ name: "x.md", text: `# X\n\n[[${existing.title.toUpperCase()}]]` }],
      WORKSPACE,
    );
    expect(result.placeholders).toBe(0);
  });

  it("rejects an empty selection, too many files, and oversized files", async () => {
    await expect(importMarkdownFiles([], WORKSPACE)).rejects.toThrow(/at least one/);
    const many = Array.from({ length: MAX_IMPORT_FILES + 1 }, (_, i) => ({
      name: `${i}.md`,
      text: "x",
    }));
    await expect(importMarkdownFiles(many, WORKSPACE)).rejects.toThrow(/at most/);
    await expect(
      importMarkdownFiles([{ name: "big.md", text: "x".repeat(1_000_001) }], WORKSPACE),
    ).rejects.toThrow(/too large/);
  });
});
