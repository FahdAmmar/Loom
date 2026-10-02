import { Redo2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRunHistory } from "@/features/editor/useHistoryShortcuts";
import { useT } from "@/i18n/useT";
import { useEditorStore } from "@/stores/useEditorStore";

/** Touch-friendly twin of ⌘Z / ⌘⇧Z; the label names the step it would reverse. */
export function UndoRedoButtons() {
  const undoLabel = useEditorStore((s) => s.undoLabel);
  const redoLabel = useEditorStore((s) => s.redoLabel);
  const runHistory = useRunHistory();
  const t = useT();
  const undoText = undoLabel ? t(undoLabel) : null;
  const redoText = redoLabel ? t(redoLabel) : null;

  return (
    <div className="flex shrink-0 items-center print:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rtl:-scale-x-100"
        disabled={!undoLabel}
        aria-label={undoText ? t("history.undoWith", { label: undoText }) : t("history.undo")}
        title={
          undoText ? t("history.undoTitle", { label: undoText }) : t("history.nothingUndo")
        }
        onClick={() => void runHistory("undo")}
      >
        <Undo2 className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rtl:-scale-x-100"
        disabled={!redoLabel}
        aria-label={redoText ? t("history.redoWith", { label: redoText }) : t("history.redo")}
        title={
          redoText ? t("history.redoTitle", { label: redoText }) : t("history.nothingRedo")
        }
        onClick={() => void runHistory("redo")}
      >
        <Redo2 className="size-4" />
      </Button>
    </div>
  );
}
