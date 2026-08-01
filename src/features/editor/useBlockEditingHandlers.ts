import { useState } from "react";

import { SLASH_COMMANDS, type SlashCommandDef } from "@/features/editor/constants";
import { useEditorFocus } from "@/features/editor/useEditorFocus";
import type { SlashState } from "@/features/editor/components/BlockTextEditor";
import { useEditorStore } from "@/stores/useEditorStore";
import type { Block, BlockType } from "@/types/entities";

const LIST_TYPES: BlockType[] = ["bulletList", "numberedList", "checklist"];

export function useBlockEditingHandlers(
  block: Block,
  pageId: string,
  previousBlockId: string | null,
  nextBlockId: string | null,
) {
  const createBlock = useEditorStore((s) => s.createBlock);
  const deleteBlock = useEditorStore((s) => s.deleteBlock);
  const changeBlockType = useEditorStore((s) => s.changeBlockType);
  const { focus } = useEditorFocus();

  const [slashState, setSlashState] = useState<SlashState>({ open: false, query: "" });
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredCommands = slashState.open
    ? SLASH_COMMANDS.filter((cmd) => {
        const q = slashState.query.trim().toLowerCase();
        if (!q) return true;
        return cmd.label.toLowerCase().includes(q) || cmd.keywords.some((k) => k.includes(q));
      })
    : [];

  function onSlashStateChange(next: SlashState) {
    setSlashState(next);
    setActiveIndex(0);
  }

  async function selectSlashCommand(command: SlashCommandDef) {
    setSlashState({ open: false, query: "" });
    await changeBlockType(block.id, command.type, command.emptyContent());
  }

  function onSlashKeyDown(key: string): boolean {
    if (key === "ArrowDown") {
      setActiveIndex((i) => Math.min(i + 1, Math.max(filteredCommands.length - 1, 0)));
      return true;
    }
    if (key === "ArrowUp") {
      setActiveIndex((i) => Math.max(i - 1, 0));
      return true;
    }
    if (key === "Enter") {
      const command = filteredCommands[activeIndex];
      if (command) void selectSlashCommand(command);
      return true;
    }
    if (key === "Escape") {
      setSlashState({ open: false, query: "" });
      return true;
    }
    return false;
  }

  async function onEnter() {
    const isListType = LIST_TYPES.includes(block.type);
    const newType: BlockType = isListType ? block.type : "paragraph";
    const newContent: Block["content"] =
      block.type === "checklist" ? { html: "", checked: false } : { html: "" };

    const created = await createBlock({
      pageId,
      type: newType,
      content: newContent,
      parentBlockId: block.parentBlockId,
      afterBlockId: block.id,
    });
    requestAnimationFrame(() => focus(created.id));
  }

  async function onBackspaceEmpty() {
    if (!previousBlockId) return;
    await deleteBlock(block.id);
    requestAnimationFrame(() => focus(previousBlockId));
  }

  function onArrowUp() {
    focus(previousBlockId);
  }

  function onArrowDown() {
    focus(nextBlockId);
  }

  return {
    handlers: {
      onEnter,
      onBackspaceEmpty,
      onArrowUp,
      onArrowDown,
      onSlashStateChange,
      onSlashKeyDown,
    },
    slashState,
    filteredCommands,
    activeIndex,
    setActiveIndex,
    selectSlashCommand,
  };
}
