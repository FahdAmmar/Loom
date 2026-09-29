import { create } from "zustand";
import { persist } from "zustand/middleware";

import * as pagesApi from "@/api/pages";
import type { Page } from "@/types/entities";

const MAX_RECENTS = 8;

interface PageState {
  pagesById: Record<string, Page>;
  currentPageId: Page["id"] | null;
  isLoading: boolean;
  error: string | null;
  /** Persisted across sessions — client-side only, never round-trips through the API. */
  recentPageIds: Page["id"][];

  loadPages: (workspaceId: string) => Promise<void>;
  createPage: (workspaceId: string, parentId: string | null, title?: string) => Promise<Page>;
  /** Syncs a page created through a different API call (e.g. from a
   * template) into the cache — createPage already does this itself, this
   * is for callers that can't go through createPage. */
  addPage: (page: Page) => void;
  /** Drag-and-drop reorder/re-parent — see api/pages.ts movePage for the semantics. */
  movePage: (id: string, newParentId: string | null, newIndex: number) => Promise<void>;
  duplicatePage: (id: string) => Promise<Page>;
  renamePage: (id: string, title: string) => Promise<void>;
  setPageIcon: (id: string, icon: string | undefined) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  deletePage: (id: string) => Promise<pagesApi.PageDeletionSnapshot>;
  /** Brings a page (and its descendants) back out of the trash. */
  restorePage: (id: string) => Promise<void>;
  undoDeletePage: (snapshot: pagesApi.PageDeletionSnapshot) => Promise<void>;
  setCurrentPage: (id: Page["id"] | null) => void;
  recordVisit: (id: Page["id"]) => void;
}

export const usePageStore = create<PageState>()(
  persist(
    (set, get) => ({
      pagesById: {},
      currentPageId: null,
      isLoading: false,
      error: null,
      recentPageIds: [],

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

      addPage: (page) => set((s) => ({ pagesById: { ...s.pagesById, [page.id]: page } })),

      movePage: async (id, newParentId, newIndex) => {
        const previous = get().pagesById;
        try {
          const updated = await pagesApi.movePage(id, newParentId, newIndex);
          set((s) => {
            const next = { ...s.pagesById };
            for (const page of updated) next[page.id] = page;
            return { pagesById: next };
          });
        } catch {
          // The API validates against cycles/self-nesting and can reject a
          // drop — restore exactly what was there before the optimistic UI
          // (dnd-kit) already showed the new position.
          set({ pagesById: previous });
        }
      },

      duplicatePage: async (id) => {
        const page = await pagesApi.duplicatePage(id);
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

      setPageIcon: async (id, icon) => {
        // Same optimistic-then-reconcile shape as renamePage/toggleFavorite —
        // the icon shows immediately in the header and the sidebar tree.
        const previous = get().pagesById[id];
        if (!previous) return;
        set((s) => ({ pagesById: { ...s.pagesById, [id]: { ...previous, icon } } }));
        try {
          const updated = await pagesApi.updatePageIcon(id, icon);
          set((s) => ({ pagesById: { ...s.pagesById, [id]: updated } }));
        } catch {
          set((s) => ({ pagesById: { ...s.pagesById, [id]: previous } }));
        }
      },

      toggleFavorite: async (id) => {
        const previous = get().pagesById[id];
        if (!previous) return;
        const nextValue = !previous.isFavorite;
        set((s) => ({
          pagesById: { ...s.pagesById, [id]: { ...previous, isFavorite: nextValue } },
        }));
        try {
          const updated = await pagesApi.setFavorite(id, nextValue);
          set((s) => ({ pagesById: { ...s.pagesById, [id]: updated } }));
        } catch {
          set((s) => ({ pagesById: { ...s.pagesById, [id]: previous } }));
        }
      },

      deletePage: async (id) => {
        // Captured before the delete so the caller can offer "Undo" —
        // deletePage's own contract (which ids it removes) stays unchanged.
        const snapshot = await pagesApi.getPageDeletionSnapshot(id);
        const removedIds = await pagesApi.deletePage(id);
        const removedSet = new Set(removedIds);
        set((s) => {
          const next = { ...s.pagesById };
          for (const removedId of removedIds) delete next[removedId];
          return {
            pagesById: next,
            currentPageId: removedSet.has(s.currentPageId ?? "") ? null : s.currentPageId,
            recentPageIds: s.recentPageIds.filter((recentId) => !removedSet.has(recentId)),
          };
        });
        return snapshot;
      },

      undoDeletePage: async (snapshot) => {
        await pagesApi.restorePagesFromSnapshot(snapshot);
        set((s) => {
          const next = { ...s.pagesById };
          for (const page of snapshot.pages) next[page.id] = page;
          return { pagesById: next };
        });
      },

      /** Brings a trashed page back. Every descendant comes back with it, so
       * all of them need re-adding to the cache — the store only ever holds
       * live pages, so the trashed ones were dropped from it on delete. */
      restorePage: async (id) => {
        const restored = await pagesApi.restorePage(id);
        set((s) => {
          const next = { ...s.pagesById };
          for (const page of restored) next[page.id] = page;
          return { pagesById: next };
        });
      },

      setCurrentPage: (id) => set({ currentPageId: id }),

      recordVisit: (id) =>
        set((s) => ({
          recentPageIds: [id, ...s.recentPageIds.filter((existing) => existing !== id)].slice(
            0,
            MAX_RECENTS,
          ),
        })),
    }),
    {
      name: "loom-page-preferences",
      // Only recents are worth persisting — pagesById/currentPageId/isLoading
      // are always re-fetched fresh from loadPages on every app load.
      partialize: (s) => ({ recentPageIds: s.recentPageIds }),
    },
  ),
);
