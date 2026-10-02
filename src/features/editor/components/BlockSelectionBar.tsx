import { ArrowDown, ArrowUp, Copy, Replace, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TEXT_BLOCK_TYPES,
  convertSelected,
  deleteSelected,
  isTextBlockType,
  moveSelected,
  sharedParentId,
  type TextBlockType,
} from "@/features/editor/bulkActions";
import { useCopySelection } from "@/features/editor/useBlockSelectionShortcuts";
import { useToast } from "@/hooks/useToast";
import type { MessageKey } from "@/i18n";
import { useT } from "@/i18n/useT";
import { useBlockSelectionStore } from "@/stores/useBlockSelectionStore";
import { useEditorStore } from "@/stores/useEditorStore";

const TYPE_LABELS: Record<TextBlockType, MessageKey> = {
  paragraph: "blockType.paragraph",
  heading1: "blockType.heading1",
  heading2: "blockType.heading2",
  heading3: "blockType.heading3",
  quote: "blockType.quote",
  bulletList: "blockType.bulletList",
  numberedList: "blockType.numberedList",
  checklist: "blockType.checklist",
};

/** Floating actions for the selected blocks; renders nothing when none are selected. */
export function BlockSelectionBar() {
  const t = useT();
  const { toast } = useToast();
  const [isBusy, setBusy] = useState(false);
  const selectedIds = useBlockSelectionStore((s) => s.selectedIds);
  const clear = useBlockSelectionStore((s) => s.clear);
  const blocksById = useEditorStore((s) => s.blocksById);
  const copySelection = useCopySelection();

  if (selectedIds.length === 0) return null;

  const blocks = selectedIds.map((id) => blocksById[id]).filter(Boolean);
  const canConvert = blocks.some((block) => isTextBlockType(block.type));
  const canMove = sharedParentId(blocks) !== undefined;

  async function run(action: () => Promise<void>, doneMessage?: MessageKey) {
    setBusy(true);
    try {
      await action();
      if (doneMessage) toast(t(doneMessage), "default");
    } catch {
      toast(t("selection.failed"), "error");
    } finally {
      setBusy(false);
    }
  }

  const iconButton = "size-8";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 print:hidden">
      <div
        role="toolbar"
        aria-label={t("selection.toolbar")}
        className="border-border bg-popover text-popover-foreground pointer-events-auto flex max-w-full flex-wrap items-center gap-1 rounded-xl border p-1.5 shadow-lg"
      >
        <output className="text-muted-foreground px-2 text-sm tabular-nums">
          {t("selection.count", { count: selectedIds.length })}
        </output>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isBusy || !canConvert}
              className="gap-1.5"
            >
              <Replace className="size-3.5" />
              {t("selection.turnInto")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top">
            {TEXT_BLOCK_TYPES.map((type) => (
              <DropdownMenuItem
                key={type}
                onSelect={() => void run(() => convertSelected(type))}
              >
                {t(TYPE_LABELS[type])}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className={iconButton}
          disabled={isBusy || !canMove}
          aria-label={t("selection.moveUp")}
          title={canMove ? t("selection.moveUp") : t("selection.moveDisabled")}
          onClick={() => void run(() => moveSelected("up"))}
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={iconButton}
          disabled={isBusy || !canMove}
          aria-label={t("selection.moveDown")}
          title={canMove ? t("selection.moveDown") : t("selection.moveDisabled")}
          onClick={() => void run(() => moveSelected("down"))}
        >
          <ArrowDown className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={iconButton}
          disabled={isBusy}
          aria-label={t("selection.copy")}
          title={t("selection.copy")}
          onClick={() => void copySelection()}
        >
          <Copy className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`${iconButton} text-destructive`}
          disabled={isBusy}
          aria-label={t("selection.delete")}
          title={t("selection.delete")}
          onClick={() => void run(deleteSelected, "selection.deleted")}
        >
          <Trash2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={iconButton}
          aria-label={t("selection.clear")}
          title={t("selection.clear")}
          onClick={clear}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
