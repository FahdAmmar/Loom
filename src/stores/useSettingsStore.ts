import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";
export type EditorWidth = "narrow" | "wide";
export type UiDirection = "ltr" | "rtl";
export type AccentColor = "gold" | "mint" | "violet" | "rose";

export const ACCENT_COLORS: AccentColor[] = ["gold", "mint", "violet", "rose"];

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
  direction: UiDirection;
  setDirection: (direction: UiDirection) => void;
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
  /** ISO time of the last JSON backup download, or null if never. */
  lastBackupAt: string | null;
  markBackupDone: () => void;
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

/** Mirrors the whole UI; `lang` follows so screen readers and font fallback pick the right script. */
export function applyDirection(direction: UiDirection) {
  document.documentElement.dir = direction;
  document.documentElement.lang = direction === "rtl" ? "ar" : "en";
}

/** Gold is the default palette, so it needs no attribute. Other accents override `--primary` in index.css. */
export function applyAccent(accent: AccentColor) {
  if (accent === "gold") delete document.documentElement.dataset.accent;
  else document.documentElement.dataset.accent = accent;
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
      direction: "ltr",
      setDirection: (direction) => {
        applyDirection(direction);
        set({ direction });
      },
      accent: "gold",
      setAccent: (accent) => {
        applyAccent(accent);
        set({ accent });
      },
      lastBackupAt: null,
      markBackupDone: () => set({ lastBackupAt: new Date().toISOString() }),
    }),
    {
      name: "loom-settings",
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        applyResolvedTheme(state.theme);
        applyDirection(state.direction ?? "ltr");
        applyAccent(ACCENT_COLORS.includes(state.accent) ? state.accent : "gold");
      },
    },
  ),
);
