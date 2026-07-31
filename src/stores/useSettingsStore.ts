import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";

interface SettingsState {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
}

function resolveSystemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
  );
}

/** Applies the resolved theme to <html class="dark"> so Tailwind's dark: variant reacts. */
export function applyResolvedTheme(theme: ThemePreference) {
  const isDark = theme === "dark" || (theme === "system" && resolveSystemPrefersDark());
  document.documentElement.classList.toggle("dark", isDark);
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => {
        applyResolvedTheme(theme);
        set({ theme });
      },
    }),
    {
      name: "loom-settings",
      onRehydrateStorage: () => (state) => {
        if (state) applyResolvedTheme(state.theme);
      },
    },
  ),
);
