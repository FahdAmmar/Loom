import { BlockTextEditor } from "@/features/editor/components/BlockTextEditor";
import type { BlockEditingHandlers } from "@/features/editor/types";
import { cn } from "@/lib/utils";
import type { Block } from "@/types/entities";

interface ListItemViewProps extends BlockEditingHandlers {
  block: Block & { content: { html?: string; checked?: boolean } };
  numberInList?: number;
  onToggleChecked?: () => void;
}

export function ListItemView({
  block,
  numberInList,
  onToggleChecked,
  ...handlers
}: ListItemViewProps) {
  const html = typeof block.content.html === "string" ? block.content.html : "";

  return (
    <li className="marker:text-text-faint flex items-start gap-2 py-0.5">
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
