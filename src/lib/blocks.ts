import type { Block, BlockType } from "@/types/entities";

/** Matches the HTML the pageLink Tiptap node renders/parses (see features/editor/nodes),
 * regardless of attribute order within the tag. */
const PAGE_LINK_ID_PATTERN =
  /<span\b(?=[^>]*\bdata-page-link\b)(?=[^>]*\bdata-page-id="([^"]+)")[^>]*>/g;

/** Every page id referenced by [[wikilink]] chips inside a block's stored HTML. */
export function extractPageLinkIdsFromHtml(html: string): string[] {
  const ids: string[] = [];
  for (const match of html.matchAll(PAGE_LINK_ID_PATTERN)) ids.push(match[1]);
  return ids;
}

/**
 * Rewrites the displayed text of every wikilink chip pointing at `pageId`
 * to `newTitle`, leaving every other attribute (and every chip pointing
 * elsewhere) untouched. A chip's title is a snapshot taken at insertion
 * time, not a live lookup — this is what keeps it in sync when the target
 * page gets renamed later. Safe against a chip's HTML attribute order
 * varying (Tiptap's own serialization vs. hand-authored seed HTML don't
 * necessarily match byte-for-byte) since it reuses the same
 * order-independent matching as `extractPageLinkIdsFromHtml`. Chips are
 * Tiptap `atom` nodes — no nested markup ever lives inside one — so a
 * plain-text replacement between the tags is safe without a full HTML
 * parser.
 */
export function updateWikilinkTitlesInHtml(
  html: string,
  pageId: string,
  newTitle: string,
): string {
  const escapedId = pageId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(<span\\b(?=[^>]*\\bdata-page-link\\b)(?=[^>]*\\bdata-page-id="${escapedId}")[^>]*>)([^<]*)(</span>)`,
    "g",
  );
  return html.replace(
    pattern,
    (_match, openTag: string, _oldText: string, closeTag: string) =>
      `${openTag}↗ ${newTitle}${closeTag}`,
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Searchable plain text for a block, regardless of its content shape. */
export function extractPlainText(block: Block): string {
  const { content } = block;
  if (typeof content.html === "string") return stripHtml(content.html);
  if (typeof content.code === "string") return content.code;
  if (Array.isArray(content.rows)) {
    return (content.rows as string[][]).flat().join(" ");
  }
  if (typeof content.alt === "string" || typeof content.caption === "string") {
    return [content.alt, content.caption].filter(Boolean).join(" ");
  }
  if (Array.isArray(content.columns)) {
    const columns = content.columns as { title: string; cards: { title: string }[] }[];
    const words: string[] = [];
    for (const col of columns) {
      words.push(col.title);
      for (const card of col.cards) words.push(card.title);
    }
    return words.join(" ");
  }
  return "";
}

/** Ordered top-level (or nested, via parentBlockId) blocks for a page. */
export function getOrderedBlocks(
  blocksById: Record<string, Block>,
  pageId: string,
  parentBlockId: string | null = null,
): Block[] {
  return Object.values(blocksById)
    .filter((b) => b.pageId === pageId && b.parentBlockId === parentBlockId)
    .sort((a, b) => a.order - b.order);
}

/** Every descendant id of a block (e.g. a toggle's children) — for cascade delete. */
export function getDescendantBlockIds(
  blocksById: Record<string, Block>,
  blockId: string,
): string[] {
  const result: string[] = [];
  const directChildren = Object.values(blocksById).filter((b) => b.parentBlockId === blockId);
  for (const child of directChildren) {
    result.push(child.id);
    result.push(...getDescendantBlockIds(blocksById, child.id));
  }
  return result;
}

const LIST_TYPES: BlockType[] = ["bulletList", "numberedList", "checklist"];

export type BlockRun =
  { kind: "list"; type: BlockType; blocks: Block[] } | { kind: "single"; block: Block };

/**
 * Groups consecutive same-type list blocks into one run, so BlockList can
 * wrap them in a single <ul>/<ol> instead of one per item — matters for
 * both correct semantics and for markers (1. 2. 3.) rendering right.
 */
export function groupIntoRuns(blocks: Block[]): BlockRun[] {
  const runs: BlockRun[] = [];
  for (const b of blocks) {
    const isListType = LIST_TYPES.includes(b.type);
    const last = runs.at(-1);
    if (isListType && last?.kind === "list" && last.type === b.type) {
      last.blocks.push(b);
    } else if (isListType) {
      runs.push({ kind: "list", type: b.type, blocks: [b] });
    } else {
      runs.push({ kind: "single", block: b });
    }
  }
  return runs;
}
