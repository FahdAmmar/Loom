import { extractPlainText } from "@/lib/blocks";
import type { Block, BlockType } from "@/types/entities";

export interface OutlineItem {
  blockId: string;
  level: 1 | 2 | 3;
  text: string;
}

const HEADING_LEVELS: Partial<Record<BlockType, OutlineItem["level"]>> = {
  heading1: 1,
  heading2: 2,
  heading3: 3,
};

/**
 * Headings of a page in reading order, including those inside toggles.
 * Derived on demand rather than stored, so it can never go stale. Headings
 * hidden inside a collapsed toggle are left out — there'd be nothing to scroll to.
 */
export function getOutline(
  blocksById: Record<string, Block>,
  pageId: string,
  collapsedToggleIds: Record<string, boolean> = {},
): OutlineItem[] {
  const childrenByParent = new Map<string | null, Block[]>();
  for (const block of Object.values(blocksById)) {
    if (block.pageId !== pageId) continue;
    const siblings = childrenByParent.get(block.parentBlockId) ?? [];
    siblings.push(block);
    childrenByParent.set(block.parentBlockId, siblings);
  }

  const items: OutlineItem[] = [];
  function walk(parentId: string | null) {
    const siblings = childrenByParent.get(parentId) ?? [];
    for (const block of [...siblings].sort((a, b) => a.order - b.order)) {
      const level = HEADING_LEVELS[block.type];
      const text = level ? extractPlainText(block).trim() : "";
      if (level && text) items.push({ blockId: block.id, level, text });
      if (block.type === "toggle" && collapsedToggleIds[block.id]) continue;
      walk(block.id);
    }
  }
  walk(null);
  return items;
}
