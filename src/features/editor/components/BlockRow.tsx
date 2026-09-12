import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { memo, type ReactNode } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BoardBlockView } from "@/features/editor/components/BoardBlockView";
import { CodeBlockView } from "@/features/editor/components/CodeBlockView";
import { DividerView } from "@/features/editor/components/DividerView";
import { EmbedBlockView } from "@/features/editor/components/EmbedBlockView";
import { ImageBlockView } from "@/features/editor/components/ImageBlockView";
import { DatabaseBlockView } from "@/features/database/components/DatabaseBlockView";
import { SlashMenu } from "@/features/editor/components/SlashMenu";
import { TableBlockView } from "@/features/editor/components/TableBlockView";
import { TextBlockView } from "@/features/editor/components/TextBlockView";
import { ToggleBlockView } from "@/features/editor/components/ToggleBlockView";
import { BlockList } from "@/features/editor/components/BlockList";
import { useBlockEditingHandlers } from "@/features/editor/useBlockEditingHandlers";
import { useEditorFocus } from "@/features/editor/useEditorFocus";
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
    case "embed":
      content = (
        <EmbedBlockView
          url={typeof block.content.url === "string" ? block.content.url : ""}
          onChange={(next) => updateBlockContent(block.id, next)}
          onBackspaceEmpty={handlers.onBackspaceEmpty}
        />
      );
      break;
    case "table":
      content = (
        <TableBlockView
          rows={
            Array.isArray(block.content.rows)
              ? (block.content.rows as string[][])
              : [
                  ["", ""],
                  ["", ""],
                ]
          }
          onChange={(next) => updateBlockContent(block.id, next)}
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
    case "database":
      // A database block reads its rows from live sub-pages, not from its
      // own content — pageId (the page this block lives in) is all it needs.
      content = <DatabaseBlockView pageId={pageId} />;
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
      style={sortableStyle}
      className={`group relative -ml-16 flex items-start gap-1 pl-16 ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="absolute left-0 flex items-center gap-0.5 pt-0.5 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="text-text-faint hover:bg-secondary hover:text-foreground flex size-6 cursor-grab touch-none items-center justify-center rounded active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={handlers.onEnter}
          aria-label="Add block below"
          className="text-text-faint hover:bg-secondary hover:text-foreground flex size-6 items-center justify-center rounded"
        >
          <Plus className="size-3.5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Block options"
              className="text-text-faint hover:bg-secondary hover:text-foreground flex size-6 items-center justify-center rounded data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => moveBlock(block.id, "up")}>
              <ArrowUp className="size-3.5" />
              Move up
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => moveBlock(block.id, "down")}>
              <ArrowDown className="size-3.5" />
              Move down
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => deleteBlock(block.id)}>
              <Trash2 className="size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="min-w-0 flex-1">{content}</div>

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
