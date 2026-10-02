import { create } from "zustand";

import * as blocksApi from "@/api/blocks";
import type { CreateBlockInput } from "@/api/blocks";
import * as linksApi from "@/api/links";
import { extractPageLinkIdsFromHtml, getOrderedBlocks } from "@/lib/blocks";
import type { MessageKey } from "@/i18n";
import { createCommandHistory } from "@/lib/commandHistory";
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
  /** Label of the step ⌘Z would reverse / ⌘⇧Z would reapply; null when there is none. */
  undoLabel: MessageKey | null;
  redoLabel: MessageKey | null;
  undo: () => Promise<MessageKey | null>;
  redo: () => Promise<MessageKey | null>;
  changeBlockType: (
    id: string,
    type: Block["type"],
    content?: Block["content"],
  ) => Promise<void>;
  deleteBlock: (id: string) => Promise<blocksApi.BlockDeletionSnapshot>;
  undoDeleteBlock: (snapshot: blocksApi.BlockDeletionSnapshot) => Promise<void>;
  moveBlock: (id: string, direction: "up" | "down") => Promise<void>;
  /** Drag-and-drop reorder within the same parent scope — see api/blocks.ts reorderBlock. */
  reorderBlock: (id: string, newIndex: number) => Promise<void>;
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
const HISTORY_LIMIT = 100;

/**
 * Undo history for structural edits (add, delete, convert, move, paste).
 * Typing stays with each block's own text-editor history.
 */
export const editorHistory = createCommandHistory<MessageKey>(HISTORY_LIMIT);

export const useEditorStore = create<EditorState>((set, get) => ({
  blocksById: {},
  loadedPageId: null,
  isLoading: false,
  saveStatus: "idle",
  collapsedToggleIds: {},
  undoLabel: null,
  redoLabel: null,

  undo: async () => (await editorHistory.undo())?.label ?? null,
  redo: async () => (await editorHistory.redo())?.label ?? null,

  loadBlocks: async (pageId) => {
    editorHistory.clear(); // steps refer to the previous page's block ids
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
    editorHistory.clear();
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

    let snapshot: blocksApi.BlockDeletionSnapshot | null = null;
    editorHistory.record({
      label: "history.addBlock",
      undo: async () => {
        snapshot = await get().deleteBlock(block.id);
      },
      redo: async () => {
        if (snapshot) await get().undoDeleteBlock(snapshot);
      },
    });
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

    // A slash-command conversion supersedes whatever content-only edit is
    // still debounced from the keystrokes that typed the "/command" text
    // itself — without cancelling it, that stale save fires ~600ms later
    // and silently overwrites the new block's content (type stays right,
    // content reverts), since it only patches `content`, not `type`.
    const pending = pendingSaves.get(id);
    if (pending) {
      clearTimeout(pending.timer);
      pendingSaves.delete(id);
    }

    const updated = await blocksApi.updateBlock(id, { type, content: nextContent });
    set((s) => ({ blocksById: { ...s.blocksById, [id]: updated } }));

    const linkedIds =
      typeof nextContent.html === "string" ? extractPageLinkIdsFromHtml(nextContent.html) : [];
    await linksApi.syncBlockLinks(updated.pageId, id, linkedIds);

    editorHistory.record({
      label: "history.changeType",
      undo: () => get().changeBlockType(id, previous.type, previous.content),
      redo: () => get().changeBlockType(id, type, nextContent),
    });
  },

  deleteBlock: async (id) => {
    // Captured before the delete so the caller can offer "Undo" —
    // deleteBlock's own contract (which ids it removes) stays unchanged.
    const stored = await blocksApi.getBlockDeletionSnapshot(id);
    // The store holds text typed in the last few hundred ms that isn't saved
    // yet — keep it in the snapshot so restoring doesn't lose it.
    const snapshot = {
      ...stored,
      blocks: stored.blocks.map((block) => get().blocksById[block.id] ?? block),
    };
    const removedIds = await blocksApi.deleteBlock(id);
    for (const removedId of removedIds) {
      // A queued save would otherwise fire against a block that no longer exists.
      const pending = pendingSaves.get(removedId);
      if (pending) clearTimeout(pending.timer);
      pendingSaves.delete(removedId);
    }
    set((s) => {
      const next = { ...s.blocksById };
      for (const removedId of removedIds) delete next[removedId];
      return { blocksById: next };
    });

    let current = snapshot;
    editorHistory.record({
      label: "history.deleteBlock",
      key: snapshot,
      undo: () => get().undoDeleteBlock(current),
      redo: async () => {
        current = await get().deleteBlock(id);
      },
    });
    return snapshot;
  },

  undoDeleteBlock: async (snapshot) => {
    // Already back (e.g. ⌘Z ran first and the toast's Undo is clicked later).
    if (snapshot.blocks.every((block) => get().blocksById[block.id])) return;
    editorHistory.remove(snapshot); // this restore replaces the recorded step
    await blocksApi.restoreBlocksFromSnapshot(snapshot);
    set((s) => {
      const next = { ...s.blocksById };
      for (const block of snapshot.blocks) next[block.id] = block;
      return { blocksById: next };
    });
  },

  moveBlock: async (id, direction) => {
    const before = get().blocksById[id];
    const updated = await blocksApi.moveBlock(id, direction);
    set((s) => {
      const next = { ...s.blocksById };
      for (const block of updated) next[block.id] = block;
      return { blocksById: next };
    });

    // A move at the edge changes nothing, so there is nothing to undo.
    if (before && updated.some((block) => block.id === id && block.order !== before.order)) {
      const opposite = direction === "up" ? "down" : "up";
      editorHistory.record({
        label: "history.moveBlock",
        undo: () => get().moveBlock(id, opposite),
        redo: () => get().moveBlock(id, direction),
      });
    }
  },

  reorderBlock: async (id, newIndex) => {
    const target = get().blocksById[id];
    const oldIndex = target
      ? getOrderedBlocks(get().blocksById, target.pageId, target.parentBlockId).findIndex(
          (block) => block.id === id,
        )
      : -1;
    const updated = await blocksApi.reorderBlock(id, newIndex);
    set((s) => {
      const next = { ...s.blocksById };
      for (const block of updated) next[block.id] = block;
      return { blocksById: next };
    });

    if (updated.length > 0 && oldIndex !== -1) {
      editorHistory.record({
        label: "history.moveBlock",
        undo: () => get().reorderBlock(id, oldIndex),
        redo: () => get().reorderBlock(id, newIndex),
      });
    }
  },

  toggleExpanded: (blockId) =>
    set((s) => ({
      collapsedToggleIds: {
        ...s.collapsedToggleIds,
        [blockId]: !s.collapsedToggleIds[blockId],
      },
    })),
}));

editorHistory.subscribe(() => useEditorStore.setState(editorHistory.getState()));
