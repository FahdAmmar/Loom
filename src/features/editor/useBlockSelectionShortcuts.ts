import { useEffect } from "react";

import { deleteSelected, selectedText } from "@/features/editor/bulkActions";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/useT";
import { orderedBlockIds } from "@/lib/blockSelection";
import { useBlockSelectionStore } from "@/stores/useBlockSelectionStore";
import { useEditorStore } from "@/stores/useEditorStore";

// Anything with its own keyboard handling keeps its keys.
const OWN_KEYS = "input, textarea, select, [contenteditable], dialog, [role='menu']";

/** Copies the selection's text; shared by the shortcut and the toolbar button. */
export function useCopySelection() {
  const { toast } = useToast();
  const t = useT();
  return async function copySelection() {
    try {
      await navigator.clipboard.writeText(selectedText());
      toast(t("selection.copied"), "success");
    } catch {
      toast(t("selection.copyFailed"), "error");
    }
  };
}

/**
 * Esc clears, Delete removes, ⌘C copies, Shift+↑/↓ grows the selection — only
 * while blocks are selected and focus isn't in a field that needs those keys.
 */
export function useBlockSelectionShortcuts(pageId: string) {
  const { toast } = useToast();
  const t = useT();
  const copySelection = useCopySelection();

  useEffect(() => {
    async function onKeyDown(event: KeyboardEvent) {
      const selection = useBlockSelectionStore.getState();
      if (selection.selectedIds.length === 0) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(OWN_KEYS)) return;

      if (event.key === "Escape") {
        selection.clear();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        try {
          await deleteSelected();
          toast(t("selection.deleted"), "default");
        } catch {
          toast(t("selection.failed"), "error");
        }
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c") {
        if (window.getSelection()?.toString()) return; // the user is copying highlighted text
        event.preventDefault();
        await copySelection();
      } else if (event.shiftKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        event.preventDefault();
        const { blocksById, collapsedToggleIds } = useEditorStore.getState();
        const ordered = orderedBlockIds(blocksById, pageId, collapsedToggleIds);
        const from = ordered.indexOf(selection.focusId ?? "");
        const next = ordered[from + (event.key === "ArrowDown" ? 1 : -1)];
        if (from !== -1 && next) selection.extendTo(next, ordered);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);
}
