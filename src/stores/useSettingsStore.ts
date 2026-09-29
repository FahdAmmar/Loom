import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";
export type EditorWidth = "narrow" | "wide";

/** Shared with Editor.tsx, EditorSkeleton.tsx, and PageHeader.tsx so the header and body always agree on the content column's width. */
export const EDITOR_WIDTH_CLASSES: Record<EditorWidth, string> = {
  narrow: "max-w-3xl",
  wide: "max-w-5xl",
};

interface SettingsState {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  editorWidth: EditorWidth;
  setEditorWidth: (width: EditorWidth) => void;
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
      editorWidth: "narrow",
      setEditorWidth: (editorWidth) => set({ editorWidth }),
    }),
    {
      name: "loom-settings",
      onRehydrateStorage: () => (state) => {
        if (state) applyResolvedTheme(state.theme);
      },
    },
  ),
);
