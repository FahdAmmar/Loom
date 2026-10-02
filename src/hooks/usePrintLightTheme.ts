import { useEffect } from "react";

import { applyResolvedTheme, useSettingsStore } from "@/stores/useSettingsStore";

/** Paper is white: printing in the dark theme would give pale text on a page with no background. */
export function usePrintLightTheme() {
  useEffect(() => {
    function beforePrint() {
      document.documentElement.classList.remove("dark");
    }
    function afterPrint() {
      applyResolvedTheme(useSettingsStore.getState().theme);
    }
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);
}
