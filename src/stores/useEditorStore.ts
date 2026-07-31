import { create } from "zustand";

import type { Block } from "@/types/entities";

interface EditorState {
  draftBlocks: Block[];
  selectedBlockId: Block["id"] | null;
  isDirty: boolean;
  setSelectedBlock: (id: Block["id"] | null) => void;
}

/** TODO(Phase 3): block CRUD, slash commands, autosave, undo stack. */
export const useEditorStore = create<EditorState>((set) => ({
  draftBlocks: [],
  selectedBlockId: null,
  isDirty: false,
  setSelectedBlock: (id) => set({ selectedBlockId: id }),
}));
