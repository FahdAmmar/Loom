import { useEffect } from "react";
import { useNavigate } from "react-router";

import { usePageStore } from "@/stores/usePageStore";
import { useSearchStore } from "@/stores/useSearchStore";

const WORKSPACE_ID = "default";

export function useGlobalShortcuts() {
  const toggleCommandPalette = useSearchStore((s) => s.toggleCommandPalette);
  const closeCommandPalette = useSearchStore((s) => s.closeCommandPalette);
  const createPage = usePageStore((s) => s.createPage);
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod) return;
      const key = event.key.toLowerCase();

      if (key === "k") {
        event.preventDefault();
        toggleCommandPalette();
      } else if (key === "n") {
        event.preventDefault();
        closeCommandPalette();
        createPage(WORKSPACE_ID, null).then((page) => {
          navigate(`/w/${WORKSPACE_ID}/p/${page.id}`, { viewTransition: true });
        });
      } else if (key === "s") {
        // Autosave already persists every change — just stop the browser's
        // native "Save Page As" dialog from popping up unexpectedly.
        event.preventDefault();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
