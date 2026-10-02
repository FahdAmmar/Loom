import { create } from "zustand";

interface FocusModeState {
  /** Hides the app chrome (top bar, sidebar) so only the page is left. Session-only on purpose. */
  isFocused: boolean;
  toggle: () => void;
  exit: () => void;
}

export const useFocusModeStore = create<FocusModeState>((set) => ({
  isFocused: false,
  toggle: () => set((s) => ({ isFocused: !s.isFocused })),
  exit: () => set({ isFocused: false }),
}));
