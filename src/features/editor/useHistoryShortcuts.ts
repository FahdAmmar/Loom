import { useEffect } from "react";

import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/useT";
import { useEditorStore } from "@/stores/useEditorStore";

const EDITABLE = "input, textarea, select, [contenteditable]";

/** True for ⌘Z / Ctrl+Z (undo) and ⌘⇧Z / Ctrl+Y (redo); null for anything else. */
export function historyDirection(event: KeyboardEvent): "undo" | "redo" | null {
  if (!(event.metaKey || event.ctrlKey) || event.altKey) return null;
  const key = event.key.toLowerCase();
  if (key === "z") return event.shiftKey ? "redo" : "undo";
  if (key === "y") return "redo";
  return null;
}

/** Runs one structural undo/redo step and reports a failure instead of swallowing it. */
export function useRunHistory() {
  const { toast } = useToast();
  const t = useT();
  return async function runHistory(direction: "undo" | "redo") {
    try {
      const { undo, redo } = useEditorStore.getState();
      await (direction === "undo" ? undo() : redo());
    } catch {
      toast(t(direction === "undo" ? "history.undoFailed" : "history.redoFailed"), "error");
    }
  };
}

/**
 * ⌘Z / ⌘⇧Z for the page while focus is NOT in a text field — text fields keep
 * their own undo (block text falls through to this store from BlockTextEditor).
 */
export function useHistoryShortcuts() {
  const runHistory = useRunHistory();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const direction = historyDirection(event);
      if (!direction) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(EDITABLE)) return;
      event.preventDefault();
      void runHistory(direction);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
