import { create } from "zustand";
import { persist } from "zustand/middleware";

import { isDefaultPageView, type PageView } from "@/lib/pageLayout";

interface PageViewState {
  /** Per-page display choices; a page with no entry uses the defaults. Stays on this device. */
  viewsByPageId: Record<string, Partial<PageView>>;
  setView: (pageId: string, patch: Partial<PageView>) => void;
  resetView: (pageId: string) => void;
}

export const usePageViewStore = create<PageViewState>()(
  persist(
    (set) => ({
      viewsByPageId: {},
      setView: (pageId, patch) =>
        set((state) => {
          const next = { ...state.viewsByPageId[pageId], ...patch };
          const rest = { ...state.viewsByPageId };
          // Drop the entry once it's all defaults so the stored map only holds real choices.
          if (isDefaultPageView(next)) delete rest[pageId];
          else rest[pageId] = next;
          return { viewsByPageId: rest };
        }),
      resetView: (pageId) =>
        set((state) => {
          const rest = { ...state.viewsByPageId };
          delete rest[pageId];
          return { viewsByPageId: rest };
        }),
    }),
    { name: "loom-page-view" },
  ),
);
