import { create } from "zustand";

import * as pagesApi from "@/api/pages";
import type { Page } from "@/types/entities";

interface PageState {
  pagesById: Record<string, Page>;
  currentPageId: Page["id"] | null;
  isLoading: boolean;
  error: string | null;

  loadPages: (workspaceId: string) => Promise<void>;
  createPage: (workspaceId: string, parentId: string | null, title?: string) => Promise<Page>;
  renamePage: (id: string, title: string) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  setCurrentPage: (id: Page["id"] | null) => void;
}

export const usePageStore = create<PageState>((set, get) => ({
  pagesById: {},
  currentPageId: null,
  isLoading: false,
  error: null,

  loadPages: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const pages = await pagesApi.listPages(workspaceId);
      const pagesById = Object.fromEntries(pages.map((p) => [p.id, p]));
      set({ pagesById, isLoading: false });
    } catch {
      set({ isLoading: false, error: "Couldn't load your pages. Try refreshing." });
    }
  },

  createPage: async (workspaceId, parentId, title) => {
    const page = await pagesApi.createPage({ workspaceId, parentId, title });
    set((s) => ({ pagesById: { ...s.pagesById, [page.id]: page } }));
    return page;
  },

  renamePage: async (id, title) => {
    // Optimistic update — the title field is what users watch while typing.
    const previous = get().pagesById[id];
    if (previous) {
      set((s) => ({
        pagesById: { ...s.pagesById, [id]: { ...previous, title } },
      }));
    }
    try {
      const updated = await pagesApi.renamePage(id, title);
      set((s) => ({ pagesById: { ...s.pagesById, [id]: updated } }));
    } catch {
      if (previous) set((s) => ({ pagesById: { ...s.pagesById, [id]: previous } }));
    }
  },

  deletePage: async (id) => {
    const removedIds = await pagesApi.deletePage(id);
    set((s) => {
      const next = { ...s.pagesById };
      for (const removedId of removedIds) delete next[removedId];
      return {
        pagesById: next,
        currentPageId: removedIds.includes(s.currentPageId ?? "") ? null : s.currentPageId,
      };
    });
  },

  setCurrentPage: (id) => set({ currentPageId: id }),
}));
