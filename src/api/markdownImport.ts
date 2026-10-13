import { mockDb, networkDelay } from "@/api/_mockDb";
import { ApiError } from "@/api/client";
import {
  extractTitleFromMarkdown,
  extractWikilinkTitles,
  markdownToBlocks,
} from "@/features/markdown/importMarkdown";
import { extractPageLinkIdsFromHtml } from "@/lib/blocks";
import type { Block, Link, Page } from "@/types/entities";

export const MAX_IMPORT_FILES = 50;
export const MAX_IMPORT_FILE_BYTES = 1_000_000;

export interface MarkdownFile {
  name: string;
  text: string;
}

export interface MarkdownImportResult {
  /** Pages created from the files themselves. */
  imported: number;
  /** Empty pages created so a `[[Title]]` has somewhere to point. */
  placeholders: number;
}

function titleFromFile(file: MarkdownFile): string {
  const fromHeading = extractTitleFromMarkdown(file.text)?.trim();
  if (fromHeading) return fromHeading;
  return file.name.replace(/\.(md|markdown|txt)$/i, "").trim() || "Untitled";
}

/**
 * Creates one root-level page per file, and an empty page for every
 * `[[Title]]` that matches nothing, in a single storage write — so a failed
 * import can never leave a half-imported workspace behind.
 */
export async function importMarkdownFiles(
  files: MarkdownFile[],
  workspaceId: string,
): Promise<MarkdownImportResult> {
  if (files.length === 0) throw new ApiError("Choose at least one Markdown file.");
  if (files.length > MAX_IMPORT_FILES) {
    throw new ApiError(`Import at most ${MAX_IMPORT_FILES} files at a time.`);
  }
  const tooLarge = files.find((file) => file.text.length > MAX_IMPORT_FILE_BYTES);
  if (tooLarge) throw new ApiError(`"${tooLarge.name}" is too large to import.`);

  await networkDelay(250);
  const db = mockDb.read();
  const now = new Date().toISOString();

  const pageIdByTitle = new Map<string, string>();
  for (const page of Object.values(db.pages)) {
    if (page.workspaceId === workspaceId && !page.deletedAt) {
      pageIdByTitle.set(page.title.trim().toLowerCase(), page.id);
    }
  }

  let nextOrder = Object.values(db.pages).filter(
    (p) => p.workspaceId === workspaceId && p.parentId === null,
  ).length;

  function addPage(title: string): Page {
    const page: Page = {
      id: `page-${crypto.randomUUID()}`,
      workspaceId,
      parentId: null,
      title,
      isFavorite: false,
      order: nextOrder,
      createdAt: now,
      updatedAt: now,
    };
    nextOrder += 1;
    db.pages[page.id] = page;
    pageIdByTitle.set(title.trim().toLowerCase(), page.id);
    return page;
  }

  const imported = files.map((file) => ({ file, page: addPage(titleFromFile(file)) }));

  let placeholders = 0;
  for (const { file } of imported) {
    for (const title of extractWikilinkTitles(file.text)) {
      if (!pageIdByTitle.has(title.toLowerCase())) {
        addPage(title);
        placeholders += 1;
      }
    }
  }

  const resolveTitle = (title: string) => pageIdByTitle.get(title.trim().toLowerCase()) ?? null;

  for (const { file, page } of imported) {
    markdownToBlocks(file.text, resolveTitle).forEach((draft, order) => {
      const block: Block = {
        id: `block-${crypto.randomUUID()}`,
        pageId: page.id,
        parentBlockId: null,
        type: draft.type,
        content: draft.content,
        order,
      };
      db.blocks[block.id] = block;

      const html = typeof draft.content.html === "string" ? draft.content.html : "";
      for (const targetPageId of new Set(extractPageLinkIdsFromHtml(html))) {
        if (targetPageId === page.id) continue;
        const link: Link = {
          id: `link-${crypto.randomUUID()}`,
          sourcePageId: page.id,
          targetPageId,
          sourceBlockId: block.id,
        };
        db.links[link.id] = link;
      }
    });
  }

  mockDb.write(db);
  return { imported: imported.length, placeholders };
}
