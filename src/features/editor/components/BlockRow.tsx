import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  CheckSquare,
  GripVertical,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { memo, type ReactNode } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DatabaseBlockView } from "@/features/database/components/DatabaseBlockView";
import { BoardBlockView } from "@/features/editor/components/BoardBlockView";
import { CodeBlockView } from "@/features/editor/components/CodeBlockView";
import { DividerView } from "@/features/editor/components/DividerView";
import { EmbedBlockView } from "@/features/editor/components/EmbedBlockView";
import { FileBlockView } from "@/features/editor/components/FileBlockView";
import { ImageBlockView } from "@/features/editor/components/ImageBlockView";
import { MathBlockView } from "@/features/editor/components/MathBlockView";
import { SlashMenu } from "@/features/editor/components/SlashMenu";
import { TableBlockView } from "@/features/editor/components/TableBlockView";
import { TextBlockView } from "@/features/editor/components/TextBlockView";
import { ToggleBlockView } from "@/features/editor/components/ToggleBlockView";
import { BlockList } from "@/features/editor/components/BlockList";
import { useBlockEditingHandlers } from "@/features/editor/useBlockEditingHandlers";
import { SELECTED_BLOCK_CLASS, useBlockSelectable } from "@/features/editor/useBlockSelectable";
import { useEditorFocus } from "@/features/editor/useEditorFocus";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/useT";
import { readTableContent } from "@/lib/table";
import { useBlockSelectionStore } from "@/stores/useBlockSelectionStore";
import { useEditorStore } from "@/stores/useEditorStore";
import type { Block, BoardColumn } from "@/types/entities";

interface BlockRowProps {
  block: Block;
  pageId: string;
  previousBlockId: string | null;
  nextBlockId: string | null;
}

export const BlockRow = memo(function BlockRow({
  block,
  pageId,
  previousBlockId,
  nextBlockId,
}: BlockRowProps) {
  const createBlock = useEditorStore((s) => s.createBlock);
  const updateBlockContent = useEditorStore((s) => s.updateBlockContent);
  const deleteBlock = useEditorStore((s) => s.deleteBlock);
  const undoDeleteBlock = useEditorStore((s) => s.undoDeleteBlock);
  const moveBlock = useEditorStore((s) => s.moveBlock);
  // Scoped to a derived boolean rather than the whole blocksById map — Zustand
  // only re-renders this component when the *answer* changes (a child was
  // added/removed), not on every keystroke in some unrelated block on the page.
  const hasChildren = useEditorStore((s) =>
    block.type === "toggle"
      ? Object.values(s.blocksById).some((b) => b.parentBlockId === block.id)
      : false,
  );
  const collapsedToggleIds = useEditorStore((s) => s.collapsedToggleIds);
  const toggleExpanded = useEditorStore((s) => s.toggleExpanded);
  const { focus } = useEditorFocus();
  const { toast } = useToast();
  const t = useT();
  const { isSelected, captureProps } = useBlockSelectable(block.id);
  const selectBlock = useBlockSelectionStore((s) => s.select);

  async function handleDelete() {
    const snapshot = await deleteBlock(block.id);
    toast(t("block.deleted"), "default", {
      label: t("history.undo"),
      onClick: () => undoDeleteBlock(snapshot),
    });
  }

  const {
    handlers,
    slashState,
    filteredCommands,
    activeIndex,
    setActiveIndex,
    selectSlashCommand,
  } = useBlockEditingHandlers(block, pageId, previousBlockId, nextBlockId);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { type: "block" },
  });
  const sortableStyle = { transform: CSS.Transform.toString(transform), transition };

  async function handleAddChildToToggle() {
    const created = await createBlock({
      pageId,
      type: "paragraph",
      content: { html: "" },
      parentBlockId: block.id,
    });
    requestAnimationFrame(() => focus(created.id));
  }

  let content: ReactNode;
  switch (block.type) {
    case "paragraph":
    case "heading1":
    case "heading2":
    case "heading3":
    case "quote":
    case "callout":
      content = (
        <TextBlockView
          key={`${block.id}-${block.type}`}
          block={block as Block & { content: { html?: string } }}
          onChange={(nextHtml) => updateBlockContent(block.id, { html: nextHtml })}
          {...handlers}
        />
      );
      break;
    case "code":
      content = (
        <CodeBlockView
          code={typeof block.content.code === "string" ? block.content.code : ""}
          language={
            typeof block.content.language === "string" ? block.content.language : undefined
          }
          onChange={(next) => updateBlockContent(block.id, next)}
          onBackspaceEmpty={handlers.onBackspaceEmpty}
        />
      );
      break;
    case "divider":
      content = <DividerView />;
      break;
    case "image":
      content = (
        <ImageBlockView
          url={typeof block.content.url === "string" ? block.content.url : ""}
          alt={typeof block.content.alt === "string" ? block.content.alt : undefined}
          caption={
            typeof block.content.caption === "string" ? block.content.caption : undefined
          }
          onChange={(next) => updateBlockContent(block.id, next)}
          onBackspaceEmpty={handlers.onBackspaceEmpty}
        />
      );
      break;
    case "file":
      content = (
        <FileBlockView
          url={typeof block.content.url === "string" ? block.content.url : ""}
          name={typeof block.content.name === "string" ? block.content.name : undefined}
          size={typeof block.content.size === "number" ? block.content.size : undefined}
          onChange={(next) => updateBlockContent(block.id, next)}
          onBackspaceEmpty={handlers.onBackspaceEmpty}
        />
      );
      break;
    case "table":
      content = (
        <TableBlockView
          table={readTableContent(block.content)}
          onChange={(next) => updateBlockContent(block.id, { ...next })}
        />
      );
      break;
    case "board":
      content = (
        <BoardBlockView
          columns={
            Array.isArray(block.content.columns) ? (block.content.columns as BoardColumn[]) : []
          }
          onChange={(next) => updateBlockContent(block.id, next)}
        />
      );
      break;
    case "embed":
      content = (
        <EmbedBlockView
          url={typeof block.content.url === "string" ? block.content.url : ""}
          onChange={(next) => updateBlockContent(block.id, next)}
          onBackspaceEmpty={handlers.onBackspaceEmpty}
        />
      );
      break;
    case "math":
      content = (
        <MathBlockView
          latex={typeof block.content.latex === "string" ? block.content.latex : ""}
          onChange={(next) => updateBlockContent(block.id, next)}
          onBackspaceEmpty={handlers.onBackspaceEmpty}
        />
      );
      break;
    case "database":
      content = <DatabaseBlockView pageId={block.pageId} />;
      break;
    case "toggle": {
      const isExpanded = !collapsedToggleIds[block.id];
      content = (
        <ToggleBlockView
          key={`${block.id}-${block.type}`}
          block={block as Block & { content: { html?: string } }}
          isExpanded={isExpanded}
          onToggleExpand={() => toggleExpanded(block.id)}
          hasChildren={hasChildren}
          onAddChild={handleAddChildToToggle}
          childrenSlot={
            isExpanded ? <BlockList pageId={pageId} parentBlockId={block.id} /> : null
          }
          onChange={(nextHtml) => updateBlockContent(block.id, { html: nextHtml })}
          {...handlers}
        />
      );
      break;
    }
    default:
      content = null;
  }

  return (
    <div
      ref={setNodeRef}
      data-block-id={block.id}
      style={sortableStyle}
      className={`group relative -ms-16 flex scroll-mt-20 items-start gap-1 ps-16 print:break-inside-avoid ${isDragging ? "opacity-40" : ""} ${isSelected ? SELECTED_BLOCK_CLASS : ""}`}
    >
      <div className="absolute start-0 flex items-center gap-0.5 pt-0.5 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 print:hidden">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={t("block.dragHandle")}
          className="text-text-faint hover:bg-secondary hover:text-foreground flex size-6 cursor-grab touch-none items-center justify-center rounded active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={handlers.onEnter}
          aria-label={t("block.addBelow")}
          className="text-text-faint hover:bg-secondary hover:text-foreground flex size-6 items-center justify-center rounded"
        >
          <Plus className="size-3.5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t("block.options")}
              className="text-text-faint hover:bg-secondary hover:text-foreground flex size-6 items-center justify-center rounded data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => selectBlock(block.id)}>
              <CheckSquare className="size-3.5" />
              {t("selection.select")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => moveBlock(block.id, "up")}>
              <ArrowUp className="size-3.5" />
              {t("selection.moveUp")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => moveBlock(block.id, "down")}>
              <ArrowDown className="size-3.5" />
              {t("selection.moveDown")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={handleDelete}>
              <Trash2 className="size-3.5" />
              {t("selection.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="min-w-0 flex-1" {...captureProps}>
        {content}
      </div>

      {slashState.open && slashState.coords && (
        <SlashMenu
          commands={filteredCommands}
          activeIndex={activeIndex}
          coords={slashState.coords}
          onSelect={selectSlashCommand}
          onHoverIndex={setActiveIndex}
        />
      )}
    </div>
  );
});
