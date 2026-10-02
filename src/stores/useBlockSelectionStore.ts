import { create } from "zustand";

import { rangeBetween, toggleId } from "@/lib/blockSelection";
import { useEditorStore } from "@/stores/useEditorStore";

interface BlockSelectionState {
  selectedIds: string[];
  /** Where a Shift-extension starts, and the end of it that moves. */
  anchorId: string | null;
  focusId: string | null;
  select: (id: string) => void;
  toggle: (id: string) => void;
  /** Selects the run from the anchor to `id` (Shift+click, Shift+arrow). */
  extendTo: (id: string, orderedIds: string[]) => void;
  clear: () => void;
}

const EMPTY = { selectedIds: [], anchorId: null, focusId: null };

export const useBlockSelectionStore = create<BlockSelectionState>((set) => ({
  ...EMPTY,
  select: (id) => set({ selectedIds: [id], anchorId: id, focusId: id }),
  toggle: (id) =>
    set((s) => {
      const selectedIds = toggleId(s.selectedIds, id);
      return selectedIds.length === 0 ? EMPTY : { selectedIds, anchorId: id, focusId: id };
    }),
  extendTo: (id, orderedIds) =>
    set((s) => ({
      selectedIds: rangeBetween(orderedIds, s.anchorId ?? id, id),
      anchorId: s.anchorId ?? id,
      focusId: id,
    })),
  clear: () => set(EMPTY),
}));

// A block deleted elsewhere (its menu, undo of an add) must not linger in the selection.
useEditorStore.subscribe((editor) => {
  const { selectedIds } = useBlockSelectionStore.getState();
  if (selectedIds.length === 0) return;
  const alive = selectedIds.filter((id) => editor.blocksById[id]);
  if (alive.length === selectedIds.length) return;
  useBlockSelectionStore.setState(alive.length === 0 ? EMPTY : { selectedIds: alive });
});
