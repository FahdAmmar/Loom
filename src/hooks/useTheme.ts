import { useEffect, useState } from "react";

import { applyResolvedTheme, useSettingsStore } from "@/stores/useSettingsStore";

export function useTheme() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  useEffect(() => {
    applyResolvedTheme(theme);
    setResolvedTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");

    if (theme !== "system") return;

    // Keep "system" live if the OS preference changes mid-session.
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      applyResolvedTheme("system");
      setResolvedTheme(mql.matches ? "dark" : "light");
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  return { theme, resolvedTheme, setTheme };
}
