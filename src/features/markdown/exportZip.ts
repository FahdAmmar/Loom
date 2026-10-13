import { strToU8, zipSync } from "fflate";

import type { WorkspaceExport } from "@/api/backup";
import { pageToMarkdown } from "@/features/markdown/exportMarkdown";
import { toSafeFileName, uniqueName } from "@/lib/fileName";

/** One Markdown file per live page (trashed pages are left out), zipped. */
export function workspaceToMarkdownZip(data: WorkspaceExport): Uint8Array {
  const taken = new Set<string>();
  const files: Record<string, Uint8Array> = {};

  const pages = data.pages
    .filter((page) => !page.deletedAt)
    .sort((a, b) => a.title.localeCompare(b.title));

  for (const page of pages) {
    const name = uniqueName(toSafeFileName(page.title), taken);
    files[`${name}.md`] = strToU8(pageToMarkdown(page.title, page.id, data.blocks));
  }
  return zipSync(files);
}
