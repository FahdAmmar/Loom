import { create } from "zustand";

import * as blocksApi from "@/api/blocks";
import type { CreateBlockInput } from "@/api/blocks";
import * as linksApi from "@/api/links";
import { extractPageLinkIdsFromHtml } from "@/lib/blocks";
import type { Block } from "@/types/entities";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorState {
  blocksById: Record<string, Block>;
  loadedPageId: string | null;
  isLoading: boolean;
  saveStatus: SaveStatus;
  /** Toggle blocks are expanded by default; collapsed ones are listed here. */
  collapsedToggleIds: Record<string, boolean>;

  loadBlocks: (pageId: string) => Promise<void>;
  clear: () => void;
  createBlock: (input: CreateBlockInput) => Promise<Block>;
  /** Optimistic + debounced (600ms) — safe to call on every keystroke. */
  updateBlockContent: (id: string, content: Block["content"]) => void;
  changeBlockType: (
    id: string,
    type: Block["type"],
    content?: Block["content"],
  ) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  moveBlock: (id: string, direction: "up" | "down") => Promise<void>;
  toggleExpanded: (blockId: string) => void;
}

// Debounce bookkeeping lives outside React/Zustand state — it's not data,
// just timers plus a way to force an immediate save if the page changes
// before the debounce fires (see `clear`).
const pendingSaves = new Map<
  string,
  { timer: ReturnType<typeof setTimeout>; flush: () => void }
>();
const SAVE_DEBOUNCE_MS = 600;

export const useEditorStore = create<EditorState>((set, get) => ({
  blocksById: {},
  loadedPageId: null,
  isLoading: false,
  saveStatus: "idle",
  collapsedToggleIds: {},

  loadBlocks: async (pageId) => {
    set({ isLoading: true, blocksById: {}, loadedPageId: pageId, saveStatus: "idle" });
    const blocks = await blocksApi.listBlocks(pageId);
    // Guard against a fast page-to-page navigation resolving out of order.
    if (get().loadedPageId !== pageId) return;
    set({ blocksById: Object.fromEntries(blocks.map((b) => [b.id, b])), isLoading: false });
  },

  clear: () => {
    const pending = Array.from(pendingSaves.values());
    pendingSaves.clear();
    for (const { timer, flush } of pending) {
      clearTimeout(timer);
      flush(); // fire-and-forget — persist the last edit rather than dropping it
    }
    set({ blocksById: {}, loadedPageId: null, isLoading: false, saveStatus: "idle" });
  },

  createBlock: async (input) => {
    const block = await blocksApi.createBlock(input);
    // A new block can shift siblings' order — simplest correct move is to
    // reload rather than hand-patch every sibling's order locally.
    if (get().loadedPageId === input.pageId) {
      const blocks = await blocksApi.listBlocks(input.pageId);
      set({ blocksById: Object.fromEntries(blocks.map((b) => [b.id, b])) });
    }
    return block;
  },

  updateBlockContent: (id, content) => {
    const previous = get().blocksById[id];
    if (!previous) return;
    set((s) => ({
      blocksById: { ...s.blocksById, [id]: { ...previous, content } },
      saveStatus: "saving",
    }));

    const existing = pendingSaves.get(id);
    if (existing) clearTimeout(existing.timer);

    const flush = () => {
      pendingSaves.delete(id);
      blocksApi
        .updateBlock(id, { content })
        .then(async (updated) => {
          // Only merge back if this id is still part of the currently-loaded
          // state — after `clear()` runs (navigating to a different page),
          // it won't be, and merging it in would resurrect stale data into
          // whatever page has since loaded.
          if (get().blocksById[id]) {
            set((s) => ({ blocksById: { ...s.blocksById, [id]: updated } }));
          }
          if (typeof content.html === "string") {
            await linksApi.syncBlockLinks(
              updated.pageId,
              id,
              extractPageLinkIdsFromHtml(content.html),
            );
          }
          if (pendingSaves.size === 0) set({ saveStatus: "saved" });
        })
        .catch(() => set({ saveStatus: "error" }));
    };

    const timer = setTimeout(flush, SAVE_DEBOUNCE_MS);
    pendingSaves.set(id, { timer, flush });
  },

  changeBlockType: async (id, type, content) => {
    const previous = get().blocksById[id];
    if (!previous) return;
    const nextContent = content ?? previous.content;
    const updated = await blocksApi.updateBlock(id, { type, content: nextContent });
    set((s) => ({ blocksById: { ...s.blocksById, [id]: updated } }));

    const linkedIds =
      typeof nextContent.html === "string" ? extractPageLinkIdsFromHtml(nextContent.html) : [];
    await linksApi.syncBlockLinks(updated.pageId, id, linkedIds);
  },

  deleteBlock: async (id) => {
    const removedIds = await blocksApi.deleteBlock(id);
    set((s) => {
      const next = { ...s.blocksById };
      for (const removedId of removedIds) delete next[removedId];
      return { blocksById: next };
    });
  },

  moveBlock: async (id, direction) => {
    const updated = await blocksApi.moveBlock(id, direction);
    set((s) => {
      const next = { ...s.blocksById };
      for (const block of updated) next[block.id] = block;
      return { blocksById: next };
    });
  },

  toggleExpanded: (blockId) =>
    set((s) => ({
      collapsedToggleIds: {
        ...s.collapsedToggleIds,
        [blockId]: !s.collapsedToggleIds[blockId],
      },
    })),
}));
