import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  /** Remembered across visits so the tour greets a new user once, not every time. */
  hasSeenTour: boolean;
  isOpen: boolean;
  open: () => void;
  /** Closing by any route (finish, skip, Esc) counts as seen. */
  close: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenTour: false,
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false, hasSeenTour: true }),
    }),
    {
      name: "loom-onboarding",
      partialize: (state) => ({ hasSeenTour: state.hasSeenTour }),
    },
  ),
);
