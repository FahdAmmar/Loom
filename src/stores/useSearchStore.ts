import { create } from "zustand";

interface SearchState {
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
}

/**
 * Only the cross-component piece lives here — the palette needs to open
 * from the Topbar button, a global keyboard shortcut, and its own trigger.
 * The query text and results are local to CommandPalette itself (same
 * lesson as GraphView's viewport state in Phase 4: single-consumer,
 * ephemeral UI state doesn't need to be global).
 */
export const useSearchStore = create<SearchState>((set) => ({
  isCommandPaletteOpen: false,
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  toggleCommandPalette: () => set((s) => ({ isCommandPaletteOpen: !s.isCommandPaletteOpen })),
}));
