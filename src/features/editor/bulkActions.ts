import { extractPlainText, getOrderedBlocks } from "@/lib/blocks";
import { orderedBlockIds, planMoves, pruneNested } from "@/lib/blockSelection";
import { useBlockSelectionStore } from "@/stores/useBlockSelectionStore";
import { editorHistory, useEditorStore } from "@/stores/useEditorStore";
import type { Block, BlockType } from "@/types/entities";

/** Block types whose content is just rich text, so they can be converted into each other. */
export const TEXT_BLOCK_TYPES = [
  "paragraph",
  "heading1",
  "heading2",
  "heading3",
  "quote",
  "bulletList",
  "numberedList",
  "checklist",
] as const satisfies readonly BlockType[];

export type TextBlockType = (typeof TEXT_BLOCK_TYPES)[number];

export function isTextBlockType(type: BlockType): type is TextBlockType {
  return (TEXT_BLOCK_TYPES as readonly BlockType[]).includes(type);
}

function selected(): Block[] {
  const { blocksById } = useEditorStore.getState();
  const { selectedIds } = useBlockSelectionStore.getState();
  return selectedIds
    .map((id) => blocksById[id])
    .filter((block): block is Block => Boolean(block));
}

/** The selection in reading order, so copy and convert follow what the reader sees. */
function selectedInDocumentOrder(): Block[] {
  const { blocksById } = useEditorStore.getState();
  const chosen = new Set(useBlockSelectionStore.getState().selectedIds);
  const first = selected()[0];
  if (!first) return [];
  return orderedBlockIds(blocksById, first.pageId)
    .filter((id) => chosen.has(id))
    .map((id) => blocksById[id]);
}

/** Nothing to move unless every selected block shares one parent. */
export function sharedParentId(blocks: Block[]): string | null | undefined {
  if (blocks.length === 0) return undefined;
  const parent = blocks[0].parentBlockId;
  return blocks.every((block) => block.parentBlockId === parent) ? parent : undefined;
}

export async function deleteSelected(): Promise<void> {
  const { blocksById, deleteBlock } = useEditorStore.getState();
  const ids = pruneNested(useBlockSelectionStore.getState().selectedIds, blocksById);
  await editorHistory.group("history.deleteBlocks", async () => {
    for (const id of ids) {
      // Sequential: each delete reloads the page's blocks and records its own undo step.
      // oxlint-disable-next-line no-await-in-loop
      await deleteBlock(id);
    }
  });
  useBlockSelectionStore.getState().clear();
}

export async function convertSelected(type: TextBlockType): Promise<void> {
  const { changeBlockType } = useEditorStore.getState();
  const targets = selectedInDocumentOrder().filter(
    (block) => isTextBlockType(block.type) && block.type !== type,
  );
  await editorHistory.group("history.changeType", async () => {
    for (const block of targets) {
      const html = typeof block.content.html === "string" ? block.content.html : "";
      // oxlint-disable-next-line no-await-in-loop
      await changeBlockType(
        block.id,
        type,
        type === "checklist" ? { html, checked: false } : { html },
      );
    }
  });
}

export async function moveSelected(direction: "up" | "down"): Promise<void> {
  const { blocksById, moveBlock } = useEditorStore.getState();
  const blocks = selected();
  const parentId = sharedParentId(blocks);
  if (parentId === undefined) return;

  const siblings = getOrderedBlocks(blocksById, blocks[0].pageId, parentId).map((b) => b.id);
  const moves = planMoves(siblings, new Set(blocks.map((b) => b.id)), direction);
  await editorHistory.group("history.moveBlock", async () => {
    for (const id of moves) {
      // oxlint-disable-next-line no-await-in-loop
      await moveBlock(id, direction);
    }
  });
}

/** Plain text of the selection, blocks separated by a blank line. */
export function selectedText(): string {
  return selectedInDocumentOrder()
    .map((block) => extractPlainText(block))
    .filter((text) => text !== "")
    .join("\n\n");
}
