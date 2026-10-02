import { markdownToBlocks, type BlockDraft } from "@/features/markdown/importMarkdown";
import { escapeHtml, type PasteIntent } from "@/lib/paste";

/** Keeps one huge paste from creating hundreds of blocks one request at a time. */
export const MAX_PASTED_BLOCKS = 100;

// markdownToBlocks treats a leading "# Title" as a page title and drops it;
// in a paste it is just content, so it's peeled off and kept as a heading.
const LEADING_H1 = /^\s*#\s+(.+?)[ \t]*(?:\n|$)/;

export function draftsFromPaste(
  intent: PasteIntent,
  resolveTitle: (title: string) => string | null,
): BlockDraft[] {
  switch (intent.kind) {
    case "youtube":
      return [{ type: "embed", content: { url: intent.url } }];
    case "paragraphs":
      return intent.paragraphs.map((paragraph) => ({
        type: "paragraph",
        content: { html: escapeHtml(paragraph).replace(/\n/g, "<br>") },
      }));
    case "markdown": {
      const heading = LEADING_H1.exec(intent.text);
      if (!heading) return markdownToBlocks(intent.text, resolveTitle);
      const rest = intent.text.slice(heading[0].length);
      return [
        { type: "heading1", content: { html: escapeHtml(heading[1]) } },
        ...markdownToBlocks(rest, resolveTitle),
      ];
    }
    case "image": // needs a file read first, so the editor handles it separately
    case "default":
      return [];
  }
}
