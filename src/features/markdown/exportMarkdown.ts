import { getOrderedBlocks, groupIntoRuns, inlineHtmlToMarkdown } from "@/lib/blocks";
import type { Block, BoardColumn } from "@/types/entities";

function html(block: Block): string {
  return typeof block.content.html === "string" ? block.content.html : "";
}

function escapeTableCell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function tableToMarkdown(block: Block): string {
  const rows = Array.isArray(block.content.rows) ? (block.content.rows as string[][]) : [];
  if (rows.length === 0) return "";
  const [header, ...body] = rows;
  const line = (cells: string[]) => `| ${cells.map(escapeTableCell).join(" | ")} |`;
  return [line(header), line(header.map(() => "---")), ...body.map(line)].join("\n");
}

function boardToMarkdown(block: Block): string {
  const columns = Array.isArray(block.content.columns)
    ? (block.content.columns as BoardColumn[])
    : [];
  return columns
    .map((column) => {
      const heading = `**${column.icon ? `${column.icon} ` : ""}${column.title}**`;
      const cards = column.cards.map((card) => `- ${card.title || "Untitled card"}`).join("\n");
      return cards ? `${heading}\n${cards}` : heading;
    })
    .join("\n\n");
}

/** Renders a "list" run (consecutive bulletList/numberedList/checklist
 * blocks of the same type — see `groupIntoRuns`) as one Markdown list,
 * numbering a numberedList run 1, 2, 3, ... rather than converting each
 * item in isolation. */
function listRunToMarkdown(type: Block["type"], blocks: Block[]): string {
  return blocks
    .map((block, index) => {
      const text = inlineHtmlToMarkdown(html(block));
      if (type === "numberedList") return `${index + 1}. ${text}`;
      if (type === "checklist") return `- [${block.content.checked ? "x" : " "}] ${text}`;
      return `- ${text}`;
    })
    .join("\n");
}

/** Renders one non-list block. `allBlocks` and `indent` exist only for
 * `toggle`, whose children are separate blocks (via `parentBlockId`) that
 * need to be rendered recursively and indented underneath it. */
function singleBlockToMarkdown(block: Block, allBlocks: Block[], indent: string): string {
  switch (block.type) {
    case "paragraph":
      return inlineHtmlToMarkdown(html(block));
    case "heading1":
      return `# ${inlineHtmlToMarkdown(html(block))}`;
    case "heading2":
      return `## ${inlineHtmlToMarkdown(html(block))}`;
    case "heading3":
      return `### ${inlineHtmlToMarkdown(html(block))}`;
    case "quote":
      return `> ${inlineHtmlToMarkdown(html(block))}`;
    case "callout": {
      const icon = typeof block.content.icon === "string" ? block.content.icon : "💡";
      return `> ${icon} ${inlineHtmlToMarkdown(html(block))}`;
    }
    case "divider":
      return "---";
    case "code": {
      const code = typeof block.content.code === "string" ? block.content.code : "";
      const language = typeof block.content.language === "string" ? block.content.language : "";
      return `\`\`\`${language}\n${code}\n\`\`\``;
    }
    case "image": {
      const url = typeof block.content.url === "string" ? block.content.url : "";
      const alt = typeof block.content.alt === "string" ? block.content.alt : "";
      const caption = typeof block.content.caption === "string" ? block.content.caption : "";
      const image = `![${alt}](${url})`;
      return caption ? `${image}\n*${caption}*` : image;
    }
    case "embed": {
      const url = typeof block.content.url === "string" ? block.content.url : "";
      return `[Video](${url})`;
    }
    case "table":
      return tableToMarkdown(block);
    case "board":
      return boardToMarkdown(block);
    case "database":
      // A live view of sub-pages, not stored content — nothing to export.
      return "_[Database view — open in Loom to see it]_";
    case "toggle": {
      const children = getOrderedBlocks(
        Object.fromEntries(allBlocks.map((b) => [b.id, b])),
        block.pageId,
        block.id,
      );
      const childMarkdown = blocksToMarkdown(children, allBlocks, `${indent}  `);
      return [
        "<details>",
        `<summary>${inlineHtmlToMarkdown(html(block))}</summary>`,
        "",
        childMarkdown,
        "",
        "</details>",
      ].join("\n");
    }
    default:
      return inlineHtmlToMarkdown(html(block));
  }
}

/** Renders an ordered list of same-level blocks (siblings) as Markdown,
 * grouping consecutive list items into one list each via `groupIntoRuns`
 * rather than converting block-by-block. */
function blocksToMarkdown(blocks: Block[], allBlocks: Block[], indent: string): string {
  const runs = groupIntoRuns(blocks);
  const rendered = runs.map((run) =>
    run.kind === "list"
      ? listRunToMarkdown(run.type, run.blocks)
      : singleBlockToMarkdown(run.block, allBlocks, indent),
  );
  return rendered
    .filter((section) => section !== "")
    .map((section) =>
      indent
        ? section
            .split("\n")
            .map((line) => `${indent}${line}`)
            .join("\n")
        : section,
    )
    .join("\n\n");
}

/** Converts a page's blocks into a standalone Markdown document, with the
 * title as an H1. Wikilinks come out as Obsidian-style `[[Title]]` plain
 * text (see `inlineHtmlToMarkdown`) — re-importing that text elsewhere in
 * Loom turns it back into a real link if a page with that title exists,
 * or creates one (see `features/markdown/importMarkdown.ts`). */
export function pageToMarkdown(title: string, pageId: string, allBlocks: Block[]): string {
  const topLevel = getOrderedBlocks(
    Object.fromEntries(allBlocks.map((b) => [b.id, b])),
    pageId,
    null,
  );
  const body = blocksToMarkdown(topLevel, allBlocks, "");
  return `# ${title}\n\n${body}\n`;
}
