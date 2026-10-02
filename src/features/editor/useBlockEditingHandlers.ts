import { useState } from "react";

import { SLASH_COMMANDS, type SlashCommandDef } from "@/features/editor/constants";
import { useEditorFocus } from "@/features/editor/useEditorFocus";
import type { SlashState } from "@/features/editor/components/BlockTextEditor";
import { draftsFromPaste, MAX_PASTED_BLOCKS } from "@/features/editor/pasteBlocks";
import { MAX_UPLOAD_BYTES, readFileAsDataUrl } from "@/features/editor/uploads";
import type { BlockDraft } from "@/features/markdown/importMarkdown";
import { useToast } from "@/hooks/useToast";
import { classifyPaste, type PasteData } from "@/lib/paste";
import { editorHistory, useEditorStore } from "@/stores/useEditorStore";
import { useBlockSelectionStore } from "@/stores/useBlockSelectionStore";
import { usePageStore } from "@/stores/usePageStore";
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
  const { toast } = useToast();

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

  /** Inserts drafts after this block, or in place of it when it is still empty. */
  async function insertDrafts(drafts: BlockDraft[], replaceCurrent: boolean) {
    const capped = drafts.slice(0, MAX_PASTED_BLOCKS);
    if (capped.length === 0) return;
    let lastId = block.id;
    let remaining = capped;

    if (replaceCurrent) {
      const [first, ...rest] = capped;
      await changeBlockType(block.id, first.type, first.content);
      remaining = rest;
    }
    for (const draft of remaining) {
      // Sequential on purpose: each block is inserted after the previous one.
      // oxlint-disable-next-line no-await-in-loop
      const created = await createBlock({
        pageId,
        type: draft.type,
        content: draft.content,
        parentBlockId: block.parentBlockId,
        afterBlockId: lastId,
      });
      lastId = created.id;
    }
    if (drafts.length > capped.length) {
      toast(`Pasted the first ${MAX_PASTED_BLOCKS} blocks.`, "default");
    }
    requestAnimationFrame(() => focus(lastId));
  }

  // Title -> id lookup for pasted [[links]]; unknown titles stay plain text
  // rather than creating pages as a side effect of a paste.
  function resolvePageTitle(title: string): string | null {
    const wanted = title.toLowerCase();
    const pages = Object.values(usePageStore.getState().pagesById);
    return pages.find((page) => page.title.toLowerCase() === wanted)?.id ?? null;
  }

  async function pasteImage(file: File, replaceCurrent: boolean) {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast(`Images must be under ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB.`, "error");
      return;
    }
    const url = await readFileAsDataUrl(file);
    const alt = file.name.replace(/\.[^.]+$/, "");
    await insertDrafts([{ type: "image", content: { url, alt } }], replaceCurrent);
  }

  /** Synchronous decision (the browser needs it now); the inserting itself runs in the background. */
  function onPaste(data: PasteData): boolean {
    const intent = classifyPaste(data);
    if (intent.kind === "default") return false;

    const work =
      intent.kind === "image"
        ? pasteImage(intent.file, data.isBlockEmpty)
        : editorHistory.group("history.paste", () =>
            insertDrafts(draftsFromPaste(intent, resolvePageTitle), data.isBlockEmpty),
          );
    work.catch(() => toast("Couldn't paste that content.", "error"));
    return true;
  }

  return {
    handlers: {
      onEnter,
      onBackspaceEmpty,
      onArrowUp,
      onArrowDown,
      onSlashStateChange,
      onSlashKeyDown,
      onPaste,
      onEscape: () => useBlockSelectionStore.getState().select(block.id),
    },
    slashState,
    filteredCommands,
    activeIndex,
    setActiveIndex,
    selectSlashCommand,
  };
}
