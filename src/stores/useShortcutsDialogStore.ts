import { create } from "zustand";

interface ShortcutsDialogState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/** Same shape as useSearchStore's command-palette state, for the same
 * reason — this needs to open from a global keyboard shortcut and from a
 * Command Palette action, so the open/closed flag can't be local state
 * owned by whichever component happens to render the dialog. */
export const useShortcutsDialogStore = create<ShortcutsDialogState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
