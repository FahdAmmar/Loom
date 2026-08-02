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
