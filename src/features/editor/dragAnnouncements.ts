import type { Announcements, ScreenReaderInstructions } from "@dnd-kit/core";

import type { MessageKey, MessageParams } from "@/i18n";
import { extractPlainText, getOrderedBlocks } from "@/lib/blocks";
import type { Block } from "@/types/entities";

type Translate = (key: MessageKey, params?: MessageParams) => string;

const NAME_MAX_CHARS = 40;

interface Where {
  name: string;
  position: number;
  total: number;
}

/** What a screen reader needs to place a block: its text, and its slot among its siblings. */
export function describeBlock(
  blockId: string,
  overId: string | null,
  blocksById: Record<string, Block>,
  t: Translate,
): Where | null {
  const block = blocksById[blockId];
  if (!block) return null;

  const siblings = getOrderedBlocks(blocksById, block.pageId, block.parentBlockId);
  const target = overId ? siblings.findIndex((sibling) => sibling.id === overId) : -1;
  const own = siblings.findIndex((sibling) => sibling.id === blockId);
  const text = extractPlainText(block).trim();
  const clipped = text.length > NAME_MAX_CHARS ? `${text.slice(0, NAME_MAX_CHARS)}…` : text;

  return {
    name: clipped ? `“${clipped}”` : t("dnd.emptyBlock"),
    position: (target === -1 ? own : target) + 1,
    total: siblings.length,
  };
}

export function buildDragAnnouncements(
  getBlocks: () => Record<string, Block>,
  t: Translate,
): Announcements {
  const say = (key: MessageKey, activeId: string | number, overId?: string | number | null) => {
    const where = describeBlock(
      String(activeId),
      overId == null ? null : String(overId),
      getBlocks(),
      t,
    );
    return where ? t(key, { ...where }) : undefined;
  };

  return {
    onDragStart: ({ active }) => say("dnd.pickedUp", active.id),
    onDragOver: ({ active, over }) => say("dnd.movedTo", active.id, over?.id),
    onDragEnd: ({ active, over }) => say("dnd.dropped", active.id, over?.id),
    // After a cancel the block is back where it began, so no target applies.
    onDragCancel: ({ active }) => say("dnd.cancelled", active.id),
  };
}

export function buildDragInstructions(t: Translate): ScreenReaderInstructions {
  return { draggable: t("dnd.instructions") };
}
