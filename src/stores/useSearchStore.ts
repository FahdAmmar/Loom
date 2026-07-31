import { create } from "zustand";

interface SearchState {
  query: string;
  isCommandPaletteOpen: boolean;
  setQuery: (query: string) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
}

/** TODO(Phase 5): recent searches, result cache, indexed search over pages/tags/links. */
export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  isCommandPaletteOpen: false,
  setQuery: (query) => set({ query }),
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
}));
