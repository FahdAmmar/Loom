import { create } from "zustand";

import type { Page, Tag } from "@/types/entities";

interface GraphState {
  activeTagFilter: Tag["id"] | null;
  highlightedNodeId: Page["id"] | null;
  setTagFilter: (id: Tag["id"] | null) => void;
  setHighlightedNode: (id: Page["id"] | null) => void;
}

/** TODO(Phase 4): zoom/pan viewport state once GraphView renders real data. */
export const useGraphStore = create<GraphState>((set) => ({
  activeTagFilter: null,
  highlightedNodeId: null,
  setTagFilter: (id) => set({ activeTagFilter: id }),
  setHighlightedNode: (id) => set({ highlightedNodeId: id }),
}));
