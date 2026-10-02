import type { MouseEvent } from "react";

import { orderedBlockIds } from "@/lib/blockSelection";
import { useBlockSelectionStore } from "@/stores/useBlockSelectionStore";
import { useEditorStore } from "@/stores/useEditorStore";

/** A click on a block while a selection exists: toggle it, or extend the run with Shift. */
export function pickBlock(blockId: string, extend: boolean) {
  const selection = useBlockSelectionStore.getState();
  const block = useEditorStore.getState().blocksById[blockId];
  if (extend && block) {
    const { blocksById, collapsedToggleIds } = useEditorStore.getState();
    selection.extendTo(blockId, orderedBlockIds(blocksById, block.pageId, collapsedToggleIds));
  } else {
    selection.toggle(blockId);
  }
}

/**
 * Selection state for one block, plus the capture handlers that turn its clicks
 * into selection clicks. Handlers only exist while something is selected, so an
 * ordinary click still places the caret.
 */
export function useBlockSelectable(blockId: string) {
  const isSelected = useBlockSelectionStore((s) => s.selectedIds.includes(blockId));
  const isSelecting = useBlockSelectionStore((s) => s.selectedIds.length > 0);

  const captureProps = isSelecting
    ? {
        // Keeps the caret (and the keyboard shortcuts' "not typing" check) out of the block.
        onMouseDownCapture: (event: MouseEvent) => event.preventDefault(),
        onClickCapture: (event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();
          pickBlock(blockId, event.shiftKey);
        },
      }
    : {};

  return { isSelected, captureProps };
}

export const SELECTED_BLOCK_CLASS = "bg-primary/10 ring-primary/40 rounded-md ring-1";
