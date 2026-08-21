import type { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { BlockTextEditor } from "@/features/editor/components/BlockTextEditor";
import type { BlockEditingHandlers } from "@/features/editor/types";
import { cn } from "@/lib/utils";
import type { Block } from "@/types/entities";

interface ListItemViewProps extends BlockEditingHandlers {
  block: Block & { content: { html?: string; checked?: boolean } };
  numberInList?: number;
  onToggleChecked?: () => void;
  sortable: ReturnType<typeof useSortable>;
}

export function ListItemView({
  block,
  numberInList,
  onToggleChecked,
  sortable,
  ...handlers
}: ListItemViewProps) {
  const html = typeof block.content.html === "string" ? block.content.html : "";
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/item marker:text-text-faint -ml-6 flex items-start gap-1 py-0.5 pl-6",
        isDragging && "opacity-40",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="text-text-faint hover:text-foreground mt-1 flex size-4 shrink-0 cursor-grab touch-none items-center justify-center opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="size-3.5" />
      </button>
      <span className="flex items-start gap-2">
        {block.type === "checklist" ? (
          <input
            type="checkbox"
            checked={Boolean(block.content.checked)}
            onChange={onToggleChecked}
            aria-label={block.content.checked ? "Mark as not done" : "Mark as done"}
            className="mt-1.5 size-3.5 shrink-0 cursor-pointer accent-[var(--brand-mint)]"
          />
        ) : block.type === "numberedList" ? (
          <span className="text-text-faint mt-0.5 min-w-4 shrink-0 text-sm tabular-nums">
            {numberInList}.
          </span>
        ) : (
          <span className="bg-text-faint mt-2.5 size-1.5 shrink-0 rounded-full" />
        )}
      </span>
      <BlockTextEditor
        blockId={block.id}
        html={html}
        placeholder={block.type === "checklist" ? "To-do" : "List item"}
        className={cn(block.content.checked && "text-muted-foreground line-through")}
        {...handlers}
      />
    </li>
  );
}
